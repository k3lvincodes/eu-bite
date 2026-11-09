import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from '../utils/hash.ts';
import pg from 'pg';
const { Pool } = pg;
type Pool = pg.Pool;
import type {
  User,
  Student,
  Restaurant,
  MenuItem,
  PackagingType,
  PackTransaction,
  Rider,
  Order,
  OrderItem,
  PlatformSetting,
  SupportTicket,
  AuditLog,
} from '../types/index.ts';

try {
  if (typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile();
  }
} catch {}

const connectionString = process.env.DATABASE_URL;
let pool: Pool | null = null;

if (connectionString && !connectionString.includes('your-supabase-project')) {
  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  } catch (err) {
    console.warn('[DB] Could not connect to PostgreSQL pool, falling back to memory store:', err);
  }
}

const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  process.execArgv.some((a) => a.includes('test')) ||
  process.argv.some((a) => a.includes('.test.'));

const SNAPSHOT_FILE = path.resolve(process.cwd(), '.data', 'eubite-db-snapshot.json');

class PersistentMap<K, V> extends Map<K, V> {
  private onMutate?: () => void;

  setOnMutate(fn: () => void) {
    this.onMutate = fn;
  }

  override set(key: K, value: V): this {
    super.set(key, value);
    this.onMutate?.();
    return this;
  }

  override delete(key: K): boolean {
    const res = super.delete(key);
    if (res) this.onMutate?.();
    return res;
  }

  override clear(): void {
    super.clear();
    this.onMutate?.();
  }
}

// Persistent Database Store (Disk + PostgreSQL Sync + High-Speed Memory Cache)
class MemoryStore {
  users: PersistentMap<string, User> = new PersistentMap();
  students: PersistentMap<string, Student> = new PersistentMap();
  restaurants: PersistentMap<string, Restaurant> = new PersistentMap();
  menuItems: PersistentMap<string, MenuItem> = new PersistentMap();
  packagingTypes: PersistentMap<string, PackagingType> = new PersistentMap();
  packTransactions: PersistentMap<string, PackTransaction> = new PersistentMap();
  riders: PersistentMap<string, Rider> = new PersistentMap();
  orders: PersistentMap<string, Order> = new PersistentMap();
  orderItems: PersistentMap<string, OrderItem> = new PersistentMap();
  platformSettings: PersistentMap<string, PlatformSetting> = new PersistentMap();
  supportTickets: PersistentMap<string, SupportTicket> = new PersistentMap();
  auditLogs: PersistentMap<string, AuditLog> = new PersistentMap();

  // Atomic claim lock map
  private claimLocks: Set<string> = new Set();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isHydrating = false;

  constructor() {
    this.seed();
    if (!isTestEnv) {
      this.loadSnapshotFromDisk();
      this.bindPersistenceHooks();
      this.syncFromPostgres().catch(() => {});
    }
  }

  private bindPersistenceHooks() {
    const triggerSave = () => {
      if (this.isHydrating || isTestEnv) return;
      if (this.flushTimer) clearTimeout(this.flushTimer);
      this.flushTimer = setTimeout(() => {
        this.saveSnapshotToDisk();
      }, 150);
    };

    const maps = [
      this.users,
      this.students,
      this.restaurants,
      this.menuItems,
      this.packagingTypes,
      this.packTransactions,
      this.riders,
      this.orders,
      this.orderItems,
      this.platformSettings,
      this.supportTickets,
      this.auditLogs,
    ];
    for (const m of maps) {
      m.setOnMutate(triggerSave);
    }
  }

  private serializeState() {
    return {
      users: Array.from(this.users.entries()),
      students: Array.from(this.students.entries()),
      restaurants: Array.from(this.restaurants.entries()),
      menuItems: Array.from(this.menuItems.entries()),
      packagingTypes: Array.from(this.packagingTypes.entries()),
      packTransactions: Array.from(this.packTransactions.entries()),
      riders: Array.from(this.riders.entries()),
      orders: Array.from(this.orders.entries()),
      orderItems: Array.from(this.orderItems.entries()),
      platformSettings: Array.from(this.platformSettings.entries()),
      supportTickets: Array.from(this.supportTickets.entries()),
      auditLogs: Array.from(this.auditLogs.entries()),
    };
  }

  private applyState(parsed: any) {
    if (!parsed || typeof parsed !== 'object') return;
    this.isHydrating = true;
    try {
      const restoreMap = <K, V>(map: PersistentMap<K, V>, entries?: [K, V][]) => {
        if (Array.isArray(entries)) {
          for (const [k, v] of entries) {
            map.set(k, v);
          }
        }
      };
      restoreMap(this.users, parsed.users);
      restoreMap(this.students, parsed.students);
      restoreMap(this.restaurants, parsed.restaurants);
      restoreMap(this.menuItems, parsed.menuItems);
      restoreMap(this.packagingTypes, parsed.packagingTypes);
      restoreMap(this.packTransactions, parsed.packTransactions);
      restoreMap(this.riders, parsed.riders);
      restoreMap(this.orders, parsed.orders);
      restoreMap(this.orderItems, parsed.orderItems);
      restoreMap(this.platformSettings, parsed.platformSettings);
      restoreMap(this.supportTickets, parsed.supportTickets);
      restoreMap(this.auditLogs, parsed.auditLogs);
    } finally {
      this.isHydrating = false;
    }
  }

  private loadSnapshotFromDisk() {
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.applyState(parsed);
      }
    } catch (err) {
      console.warn('[DB] Failed to load local state snapshot:', err);
    }
  }

  private saveSnapshotToDisk() {
    try {
      const dir = path.dirname(SNAPSHOT_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = JSON.stringify(this.serializeState());
      fs.writeFileSync(SNAPSHOT_FILE, payload, 'utf8');

      if (pool) {
        pool
          .query(
            `CREATE TABLE IF NOT EXISTS eubite_state_snapshots (
              id TEXT PRIMARY KEY,
              payload JSONB NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT NOW()
            )`
          )
          .then(() =>
            pool!.query(
              `INSERT INTO eubite_state_snapshots (id, payload, updated_at)
               VALUES ('primary', $1::jsonb, NOW())
               ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
              [payload]
            )
          )
          .catch(() => {});
      }
    } catch (err) {
      console.warn('[DB] Failed to save state snapshot:', err);
    }
  }

  private async syncFromPostgres() {
    if (!pool) return;
    try {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS eubite_state_snapshots (
          id TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
      );
      const res = await pool.query(`SELECT payload FROM eubite_state_snapshots WHERE id = 'primary' LIMIT 1`);
      if (res.rows.length > 0 && res.rows[0].payload) {
        this.applyState(res.rows[0].payload);
      }
    } catch {}
  }

  seed() {
    const passwordHash = hashPassword('Password123!');
    const now = new Date().toISOString();

    // 1. Settings
    this.platformSettings.set('min_food_subtotal_kobo', {
      id: 'set-1',
      key: 'min_food_subtotal_kobo',
      value_json: 150000,
      description: 'Minimum food subtotal in kobo (NGN 1,500)',
      updated_at: now,
    });
    this.platformSettings.set('hostel_delivery_fee_kobo', {
      id: 'set-2',
      key: 'hostel_delivery_fee_kobo',
      value_json: 32000,
      description: 'Hostel delivery fee in kobo (NGN 320)',
      updated_at: now,
    });
    this.platformSettings.set('service_fee_kobo', {
      id: 'set-3',
      key: 'service_fee_kobo',
      value_json: 10000,
      description: 'Service fee in kobo (NGN 100)',
      updated_at: now,
    });
    this.platformSettings.set('reusable_pack_fee_kobo', {
      id: 'set-4',
      key: 'reusable_pack_fee_kobo',
      value_json: 25000,
      description: 'EU Bite Reusable pack fee in kobo (NGN 250)',
      updated_at: now,
    });
    this.platformSettings.set('school_pack_fee_kobo', {
      id: 'set-5',
      key: 'school_pack_fee_kobo',
      value_json: 50000,
      description: 'School cafeteria pack fee in kobo (NGN 500)',
      updated_at: now,
    });
    this.platformSettings.set('rider_delivery_payout_kobo', {
      id: 'set-6',
      key: 'rider_delivery_payout_kobo',
      value_json: 25000,
      description: 'Rider earnings per completed drop (NGN 250)',
      updated_at: now,
    });

    // 2. Packaging Types
    this.packagingTypes.set('11111111-1111-1111-1111-111111111101', {
      id: '11111111-1111-1111-1111-111111111101',
      code: 'reusable',
      name: 'EU Bite Reusable Eco-Pack',
      fee_kobo: 25000,
      stock_count: 1500,
      description: 'Eco-friendly, microwave-safe sanitized container.',
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.packagingTypes.set('11111111-1111-1111-1111-111111111102', {
      id: '11111111-1111-1111-1111-111111111102',
      code: 'school',
      name: 'Official School Cafeteria Pack',
      fee_kobo: 50000,
      stock_count: 850,
      description: 'Standard institutional campus container.',
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // 3. Users
    const adminUser: User = {
      id: '22222222-2222-2222-2222-222222222201',
      email: 'admin@eubite.com',
      password_hash: passwordHash,
      full_name: 'Campus Director (Admin)',
      phone: '+2348011223344',
      role: 'admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    const vendor1User: User = {
      id: '22222222-2222-2222-2222-222222222202',
      email: 'vendor.bites@eubite.com',
      password_hash: passwordHash,
      full_name: 'Campus Bites & Grill',
      phone: '+2348022334455',
      role: 'vendor',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    const vendor2User: User = {
      id: '22222222-2222-2222-2222-222222222203',
      email: 'vendor.bukka@eubite.com',
      password_hash: passwordHash,
      full_name: 'Mama T’s Bukka Delight',
      phone: '+2348033445566',
      role: 'vendor',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    const rider1User: User = {
      id: '22222222-2222-2222-2222-222222222204',
      email: 'rider.musa@eubite.com',
      password_hash: passwordHash,
      full_name: 'Musa Bello',
      phone: '+2348044556677',
      role: 'rider',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    const studentUser: User = {
      id: '22222222-2222-2222-2222-222222222206',
      email: 'student.tunde@eubite.com',
      password_hash: passwordHash,
      full_name: 'Tunde Adeleke',
      phone: '+2348066778899',
      role: 'student',
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    [adminUser, vendor1User, vendor2User, rider1User, studentUser].forEach((u) => this.users.set(u.id, u));

    // 4. Student profile
    this.students.set('66666666-6666-6666-6666-666666666601', {
      id: '66666666-6666-6666-6666-666666666601',
      user_id: studentUser.id,
      student_id: 'EU/2023/SCI/0491',
      department: 'Computer Science',
      academic_level: '300L',
      default_hostel: 'Nelson Mandela Hall (Block C)',
      default_room: 'Room 214',
      phone_number: studentUser.phone,
      pack_allowance_balance: 2,
      created_at: now,
      updated_at: now,
    });

    // 5. Restaurants
    const r1: Restaurant = {
      id: '33333333-3333-3333-3333-333333333301',
      vendor_user_id: vendor1User.id,
      name: 'Campus Bites & Grill',
      slug: 'campus-bites-grill',
      description: 'Smoky firewood jollof, crunchy chicken, beef shawarma & quick bites.',
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      phone: '+2348022334455',
      opening_time: '08:00',
      closing_time: '22:00',
      is_active: true,
      is_accepting_orders: true,
      bank_account_name: 'Campus Bites Venture',
      bank_account_number: '0123456789',
      bank_code: '058',
      created_at: now,
      updated_at: now,
    };

    const r2: Restaurant = {
      id: '33333333-3333-3333-3333-333333333302',
      vendor_user_id: vendor2User.id,
      name: 'Mama T’s Bukka Delight',
      slug: 'mama-t-bukka-delight',
      description: 'Hot pounded yam, egusi, seafood okra, ofada rice with ayamase sauce.',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      phone: '+2348033445566',
      opening_time: '09:00',
      closing_time: '21:30',
      is_active: true,
      is_accepting_orders: true,
      bank_account_name: 'Mama T Bukka Enterprise',
      bank_account_number: '0987654321',
      bank_code: '011',
      created_at: now,
      updated_at: now,
    };
    this.restaurants.set(r1.id, r1);
    this.restaurants.set(r2.id, r2);

    // 6. Menu items
    const items: MenuItem[] = [
      {
        id: '44444444-4444-4444-4444-444444444401',
        restaurant_id: r1.id,
        name: 'Party Jollof Rice & Crispy Chicken',
        description: 'Firewood smoky jollof rice served with golden spiced chicken and dodo.',
        category: 'Rice & Pastas',
        price_kobo: 220000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'standard',
        preparation_time_mins: 15,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444402',
        restaurant_id: r1.id,
        name: 'Special Fried Rice & Peppered Turkey',
        description: 'Wok-tossed vegetable fried rice with sweet corn, carrots, and turkey.',
        category: 'Rice & Pastas',
        price_kobo: 260000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'standard',
        preparation_time_mins: 15,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444403',
        restaurant_id: r1.id,
        name: 'Double Sausage Beef Shawarma',
        description: 'Warm tortilla wrapped around spiced beef, sausage, cabbage and creamy dressing.',
        category: 'Grills & Fast Food',
        price_kobo: 180000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'wrapper',
        preparation_time_mins: 10,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444404',
        restaurant_id: r1.id,
        name: 'Chilled Hibiscus Zobo (500ml)',
        description: 'Fresh natural zobo infused with pineapple and ginger.',
        category: 'Drinks',
        price_kobo: 50000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'bottle',
        preparation_time_mins: 5,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444408',
        restaurant_id: r1.id,
        name: 'Crunchy Peppered Gizzard Stick',
        description: 'Tender chicken gizzard tossed in spicy habanero bell pepper sauce.',
        category: 'Grills & Fast Food',
        price_kobo: 120000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'wrapper',
        preparation_time_mins: 10,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444409',
        restaurant_id: r1.id,
        name: 'Sweet Fried Plantain (Dodo Portion)',
        description: 'Caramelized sweet ripe fried plantain cuts.',
        category: 'Sides',
        price_kobo: 70000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'standard',
        preparation_time_mins: 8,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444410',
        restaurant_id: r1.id,
        name: 'Fresh Pineapple Ginger Juice (500ml)',
        description: 'Cold-pressed fresh sweet pineapple juice with crushed ginger.',
        category: 'Drinks',
        price_kobo: 60000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'bottle',
        preparation_time_mins: 5,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444405',

        restaurant_id: r2.id,
        name: 'Pounded Yam & Assorted Egusi Soup',
        description: 'Smooth fluffy pounded yam served with rich melon seed soup and assorted beef.',
        category: 'Swallows',
        price_kobo: 240000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'standard',
        preparation_time_mins: 20,
        created_at: now,
        updated_at: now,
      },
      {
        id: '44444444-4444-4444-4444-444444444406',
        restaurant_id: r2.id,
        name: 'Ofada Rice & Spicy Ayamase Sauce',
        description: 'Native ofada rice paired with green pepper bleech sauce and boiled egg.',
        category: 'Rice & Pastas',
        price_kobo: 230000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80',
        packaging_requirement: 'standard',
        preparation_time_mins: 15,
        created_at: now,
        updated_at: now,
      },
    ];
    items.forEach((item) => this.menuItems.set(item.id, item));

    // 7. Riders
    this.riders.set('55555555-5555-5555-5555-555555555501', {
      id: '55555555-5555-5555-5555-555555555501',
      user_id: rider1User.id,
      vehicle_type: 'bicycle',
      plate_number: 'CAMPUS-BIKE-09',
      approval_status: 'approved',
      is_online: true,
      total_deliveries: 42,
      total_earnings_kobo: 1050000,
      rating: 4.95,
      created_at: now,
      updated_at: now,
    });
  }

  // Atomic Claim Lock for Rider Claiming
  async atomicClaimOrder(orderId: string, riderId: string): Promise<{ success: boolean; message: string; order?: Order }> {
    if (this.claimLocks.has(orderId)) {
      return { success: false, message: 'Another rider is currently claiming this order.' };
    }
    this.claimLocks.add(orderId);

    try {
      const order = this.orders.get(orderId);
      if (!order) {
        return { success: false, message: 'Order not found.' };
      }

      if (order.status !== 'ready_for_pickup') {
        return { success: false, message: `Order cannot be claimed because status is '${order.status}'. Must be 'ready_for_pickup'.` };
      }

      if (order.rider_id) {
        return { success: false, message: 'This order has already been claimed by another rider.' };
      }

      // Claim successfully
      order.rider_id = riderId;
      order.status = 'rider_assigned';
      order.updated_at = new Date().toISOString();
      this.orders.set(orderId, order);

      return { success: true, message: 'Order successfully claimed.', order };
    } finally {
      this.claimLocks.delete(orderId);
    }
  }
}

export const db = new MemoryStore();
export { pool };

export async function checkDbHealth(): Promise<{ status: string; latencyMs?: number; mode: 'postgres' | 'in-memory' }> {
  if (pool) {
    const start = Date.now();
    try {
      await pool.query('SELECT 1');
      return { status: 'connected', latencyMs: Date.now() - start, mode: 'postgres' };
    } catch {
      return { status: 'unhealthy', latencyMs: Date.now() - start, mode: 'postgres' };
    }
  }
  return { status: 'operational', mode: 'in-memory' };
}
