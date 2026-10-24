import { createRouter as Router } from '../utils/expressCompat.ts';
import { hashPassword, comparePassword } from '../utils/hash.ts';
import crypto from 'node:crypto';
import { z } from '../utils/zodCompat.ts';
import { db } from '../db/index.ts';
import { signToken } from '../utils/jwt.ts';
import { authenticate } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { logAudit } from '../utils/logger.ts';
import type { User, Student, Rider, Restaurant } from '../types/index.ts';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  role: z.enum(['student', 'vendor', 'rider']),
  studentId: z.string().optional(),
  department: z.string().optional(),
  academicLevel: z.string().optional(),
  defaultHostel: z.string().optional(),
  defaultRoom: z.string().optional(),
  restaurantName: z.string().optional(),
  restaurantDescription: z.string().optional(),
  vehicleType: z.string().optional(),
  plateNumber: z.string().optional(),
});

// Register
router.post('/register', async (req: any, res: any): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    for (const user of db.users.values()) {
      if (user.email.toLowerCase() === data.email.toLowerCase()) {
        res.status(400).json({ success: false, error: 'Email address is already registered.' });
        return;
      }
      if (user.phone === data.phone) {
        res.status(400).json({ success: false, error: 'Phone number is already registered.' });
        return;
      }
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(data.password);

    const newUser: User = {
      id: userId,
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      full_name: data.fullName,
      phone: data.phone,
      role: data.role,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.users.set(userId, newUser);

    let profile: any = null;

    if (data.role === 'student') {
      const studentId = crypto.randomUUID();
      const studentProfile: Student = {
        id: studentId,
        user_id: userId,
        student_id: data.studentId || `EU/${new Date().getFullYear()}/STU/${Math.floor(1000 + Math.random() * 9000)}`,
        department: data.department || 'General Studies',
        academic_level: data.academicLevel || '100L',
        default_hostel: data.defaultHostel || 'Hostel A',
        default_room: data.defaultRoom || 'Room 101',
        phone_number: data.phone,
        pack_allowance_balance: 0,
        created_at: now,
        updated_at: now,
      };
      db.students.set(studentId, studentProfile);
      profile = studentProfile;
    } else if (data.role === 'rider') {
      const riderId = crypto.randomUUID();
      const riderProfile: Rider = {
        id: riderId,
        user_id: userId,
        vehicle_type: data.vehicleType || 'bicycle',
        plate_number: data.plateNumber || 'CAMPUS-BIKE',
        approval_status: 'pending',
        is_online: false,
        total_deliveries: 0,
        total_earnings_kobo: 0,
        rating: 5.0,
        created_at: now,
        updated_at: now,
      };
      db.riders.set(riderId, riderProfile);
      profile = riderProfile;
    } else if (data.role === 'vendor') {
      const restaurantId = crypto.randomUUID();
      const restaurantProfile: Restaurant = {
        id: restaurantId,
        vendor_user_id: userId,
        name: data.restaurantName || `${data.fullName}'s Kitchen`,
        slug: (data.restaurantName || data.fullName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: data.restaurantDescription || 'Campus cafeteria vendor',
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
        phone: data.phone,
        opening_time: '08:00',
        closing_time: '22:00',
        is_active: true,
        is_accepting_orders: true,
        created_at: now,
        updated_at: now,
      };
      db.restaurants.set(restaurantId, restaurantProfile);
      profile = restaurantProfile;
    }

    logAudit('USER_REGISTERED', 'users', userId, userId, data.role, { email: data.email });

    const token = signToken({
      userId,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.full_name,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role,
      },
      profile,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: any, res: any): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    let foundUser: User | undefined;
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    if (!foundUser.is_active) {
      res.status(403).json({ success: false, error: 'This account has been deactivated. Please contact campus admin.' });
      return;
    }

    const isMatch = comparePassword(password, foundUser.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    let profile: any = null;
    if (foundUser.role === 'student') {
      for (const s of db.students.values()) {
        if (s.user_id === foundUser.id) {
          profile = s;
          break;
        }
      }
    } else if (foundUser.role === 'rider') {
      for (const r of db.riders.values()) {
        if (r.user_id === foundUser.id) {
          profile = r;
          break;
        }
      }
    } else if (foundUser.role === 'vendor') {
      for (const rest of db.restaurants.values()) {
        if (rest.vendor_user_id === foundUser.id) {
          profile = rest;
          break;
        }
      }
    }

    const token = signToken({
      userId: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
      fullName: foundUser.full_name,
    });

    logAudit('USER_LOGIN', 'users', foundUser.id, foundUser.id, foundUser.role);

    res.json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        fullName: foundUser.full_name,
        phone: foundUser.phone,
        role: foundUser.role,
      },
      profile,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Login server error' });
  }
});

// Current User Profile
router.get('/me', authenticate, (req: any, res: any): void => {
  const user = db.users.get(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  let profile: any = null;
  if (user.role === 'student') {
    for (const s of db.students.values()) {
      if (s.user_id === user.id) profile = s;
    }
  } else if (user.role === 'rider') {
    for (const r of db.riders.values()) {
      if (r.user_id === user.id) profile = r;
    }
  } else if (user.role === 'vendor') {
    for (const rest of db.restaurants.values()) {
      if (rest.vendor_user_id === user.id) profile = rest;
    }
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
    },
    profile,
  });
});

export default router;
