import fs from 'node:fs';
import path from 'node:path';

export const CART_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export interface CartItem {
  itemId: string;
  name: string;
  priceKobo: number;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  note?: string;
  addedAt?: number;
}

export type ConversationStep =
  | 'IDLE'
  | 'ONBOARDING_NAME'
  | 'ONBOARDING_PHONE'
  | 'ONBOARDING_HOSTEL'
  | 'ONBOARDING_ROOM'
  | 'MAIN_MENU'
  | 'SELECTING_RESTAURANT'
  | 'BROWSING_ITEMS'
  | 'ITEM_ADDED_PROMPT'
  | 'VIEWING_CART'
  | 'CONFIRM_CLEAR_CART'
  | 'ADD_ITEM_NOTE'
  | 'SELECTING_PACKAGING'
  | 'CONFIRMING_DELIVERY_LOCATION'
  | 'SELECTING_DROP_PREFERENCE'
  | 'MANUAL_HOSTEL'
  | 'MANUAL_ROOM'
  | 'PROFILE_VIEW'
  | 'PROFILE_EDIT_NAME'
  | 'PROFILE_EDIT_PHONE'
  | 'PROFILE_EDIT_HOSTEL'
  | 'PROFILE_EDIT_ROOM'
  | 'VIEWING_MENU_HELP'
  | 'AWAITING_PAYMENT';

export interface PendingOrder {
  orderNumber: string;
  restaurantName: string;
  totalNgn: number;
  checkoutUrl: string;
  deliveryPin: string;
  items: CartItem[];
  hostel: string;
  room: string;
  dropPreference?: string;
  packagingCount: number;
  createdAt: number;
}

export interface UserSession {
  phone: string; // Identifier: phone or Telegram Chat ID
  realPhone?: string; // Verified Nigerian phone number for orders/Flutterwave
  channel: 'whatsapp' | 'telegram';
  step: ConversationStep;
  isRegistered?: boolean;
  studentName?: string;
  studentId?: string;
  hostel?: string;
  room?: string;
  dropPreference?: 'gate' | 'room';
  selectedRestaurantId?: string;
  selectedRestaurantName?: string;
  menuPage?: number;
  lastAddedItemId?: string;
  activeNoteItemId?: string;
  cart: CartItem[];
  selectedPackaging?: 'reusable' | 'school';
  pendingOrder?: PendingOrder;
  helpReturnStep?: ConversationStep;
  lastActivity: number;
}


class SessionManager {
  private sessions = new Map<string, UserSession>();
  private readonly SESSION_FILE = path.resolve(process.cwd(), 'src/data/sessions.json');

  constructor() {
    this.loadSessionsFromDisk();
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => {
        let changed = false;
        for (const s of this.sessions.values()) {
          if (this.purgeExpiredCartItems(s)) {
            changed = true;
          }
        }
        if (changed) {
          this.persistSessionsToDisk();
        }
      }, 5 * 60 * 1000);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
    }
  }

  /**
   * Purges cart items that have exceeded CART_EXPIRY_MS (1 hour)
   */
  purgeExpiredCartItems(session: UserSession): boolean {
    if (!session.cart || session.cart.length === 0) return false;
    const now = Date.now();
    const originalLen = session.cart.length;
    session.cart = session.cart.filter((item) => {
      const itemTime = item.addedAt || session.lastActivity || now;
      return now - itemTime < CART_EXPIRY_MS;
    });
    return session.cart.length !== originalLen;
  }

  private loadSessionsFromDisk(): void {
    try {
      if (fs.existsSync(this.SESSION_FILE)) {
        const raw = fs.readFileSync(this.SESSION_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.phone) {
              this.sessions.set(item.phone, item);
            }
          }
        }
      }
    } catch {
      // Safe fallback if file doesn't exist
    }
  }

  private persistSessionsToDisk(): void {
    try {
      const dir = path.dirname(this.SESSION_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.sessions.values());
      fs.writeFileSync(this.SESSION_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Non-fatal
    }
  }

  getSession(phone: string, channel?: 'whatsapp' | 'telegram'): UserSession {
    let existing = this.sessions.get(phone);
    const now = Date.now();

    if (existing) {
      this.purgeExpiredCartItems(existing);
      existing.lastActivity = now;
      if (channel) {
        existing.channel = channel;
      }
      return existing;
    }

    // Check if phone matches realPhone of an existing session
    for (const s of this.sessions.values()) {
      if (s.realPhone === phone) {
        existing = s;
        break;
      }
    }

    if (existing) {
      this.purgeExpiredCartItems(existing);
      existing.lastActivity = now;
      if (channel) existing.channel = channel;
      return existing;
    }

    const newSession: UserSession = {
      phone,
      channel: channel || 'whatsapp',
      step: 'IDLE',
      cart: [],
      selectedPackaging: 'reusable',
      lastActivity: now,
    };
    this.sessions.set(phone, newSession);
    this.persistSessionsToDisk();
    return newSession;
  }

  saveSession(session: UserSession): void {
    this.purgeExpiredCartItems(session);
    session.lastActivity = Date.now();
    this.sessions.set(session.phone, session);
    this.persistSessionsToDisk();
  }

  clearSession(phone: string): void {
    this.sessions.delete(phone);
    this.persistSessionsToDisk();
  }

  findSessionByPhone(phone: string): UserSession | undefined {
    for (const s of this.sessions.values()) {
      if (s.phone === phone || s.realPhone === phone) {
        this.purgeExpiredCartItems(s);
        return s;
      }
    }
    return undefined;
  }
}

export const sessionManager = new SessionManager();
