import { createRouter as Router } from '../utils/expressCompat.ts';
import crypto from 'node:crypto';
import { z } from '../utils/zodCompat.ts';
import { db } from '../db/index.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { logAudit } from '../utils/logger.ts';
import type { MenuItem, Restaurant } from '../types/index.ts';

const router = Router();

// Public: Get all active restaurants
router.get('/', (req: any, res: any): void => {
  const restaurants: any[] = [];
  for (const r of db.restaurants.values()) {
    if (r.is_active) {
      let itemCount = 0;
      for (const item of db.menuItems.values()) {
        if (item.restaurant_id === r.id && item.is_available) itemCount++;
      }
      restaurants.push({
        ...r,
        availableItemsCount: itemCount,
      });
    }
  }
  res.json({ success: true, count: restaurants.length, data: restaurants });
});

// Public: Get restaurant by ID or slug with menu items
router.get('/:idOrSlug', (req: any, res: any): void => {
  const { idOrSlug } = req.params;
  let restaurant: Restaurant | undefined;

  for (const r of db.restaurants.values()) {
    if (r.id === idOrSlug || r.slug === idOrSlug) {
      restaurant = r;
      break;
    }
  }

  if (!restaurant) {
    res.status(404).json({ success: false, error: 'Restaurant not found' });
    return;
  }

  const items: MenuItem[] = [];
  for (const item of db.menuItems.values()) {
    if (item.restaurant_id === restaurant.id) {
      items.push(item);
    }
  }

  res.json({
    success: true,
    data: {
      ...restaurant,
      menuItems: items,
    },
  });
});

// Vendor: Update restaurant profile / availability
router.patch('/:id', authenticate, requireRole('vendor', 'admin'), (req: any, res: any): void => {
  const { id } = req.params;
  const restaurant = db.restaurants.get(id);

  if (!restaurant) {
    res.status(404).json({ success: false, error: 'Restaurant not found' });
    return;
  }

  if (req.user!.role !== 'admin' && restaurant.vendor_user_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Forbidden: You do not own this restaurant' });
    return;
  }

  const { name, description, phone, opening_time, closing_time, is_active, is_accepting_orders, bank_account_name, bank_account_number, bank_code } = req.body;

  if (name !== undefined) restaurant.name = name;
  if (description !== undefined) restaurant.description = description;
  if (phone !== undefined) restaurant.phone = phone;
  if (opening_time !== undefined) restaurant.opening_time = opening_time;
  if (closing_time !== undefined) restaurant.closing_time = closing_time;
  if (is_active !== undefined) restaurant.is_active = is_active;
  if (is_accepting_orders !== undefined) restaurant.is_accepting_orders = is_accepting_orders;
  if (bank_account_name !== undefined) restaurant.bank_account_name = bank_account_name;
  if (bank_account_number !== undefined) restaurant.bank_account_number = bank_account_number;
  if (bank_code !== undefined) restaurant.bank_code = bank_code;
  restaurant.updated_at = new Date().toISOString();

  db.restaurants.set(restaurant.id, restaurant);
  logAudit('RESTAURANT_UPDATED', 'restaurants', restaurant.id, req.user!.userId, req.user!.role, req.body);

  res.json({ success: true, message: 'Restaurant updated successfully', data: restaurant });
});

const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(2),
  price_kobo: z.number().int().positive(),
  is_available: z.boolean().default(true),
  image_url: z.string().optional(),
  packaging_requirement: z.string().default('standard'),
  preparation_time_mins: z.number().int().default(15),
});

// Vendor: Add menu item
router.post('/:id/menu', authenticate, requireRole('vendor', 'admin'), (req: any, res: any): void => {
  const { id } = req.params;
  const restaurant = db.restaurants.get(id);

  if (!restaurant) {
    res.status(404).json({ success: false, error: 'Restaurant not found' });
    return;
  }

  if (req.user!.role !== 'admin' && restaurant.vendor_user_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Forbidden: You do not own this restaurant' });
    return;
  }

  try {
    const data = menuItemSchema.parse(req.body);
    const itemId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newItem: MenuItem = {
      id: itemId,
      restaurant_id: restaurant.id,
      name: data.name,
      description: data.description || '',
      category: data.category,
      price_kobo: data.price_kobo,
      is_available: data.is_available,
      image_url: data.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      packaging_requirement: data.packaging_requirement,
      preparation_time_mins: data.preparation_time_mins,
      created_at: now,
      updated_at: now,
    };

    db.menuItems.set(itemId, newItem);
    logAudit('MENU_ITEM_CREATED', 'menu_items', itemId, req.user!.userId, req.user!.role, { name: newItem.name, price_kobo: newItem.price_kobo });

    res.status(201).json({ success: true, message: 'Menu item created successfully', data: newItem });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Validation error' });
  }
});

// Vendor: Update menu item
router.patch('/:id/menu/:itemId', authenticate, requireRole('vendor', 'admin'), (req: any, res: any): void => {
  const { id, itemId } = req.params;
  const restaurant = db.restaurants.get(id);

  if (!restaurant) {
    res.status(404).json({ success: false, error: 'Restaurant not found' });
    return;
  }

  if (req.user!.role !== 'admin' && restaurant.vendor_user_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Forbidden: You do not own this restaurant' });
    return;
  }

  const item = db.menuItems.get(itemId);
  if (!item || item.restaurant_id !== restaurant.id) {
    res.status(404).json({ success: false, error: 'Menu item not found in this restaurant' });
    return;
  }

  const { name, description, category, price_kobo, is_available, image_url, preparation_time_mins } = req.body;
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  if (category !== undefined) item.category = category;
  if (price_kobo !== undefined) item.price_kobo = price_kobo;
  if (is_available !== undefined) item.is_available = is_available;
  if (image_url !== undefined) item.image_url = image_url;
  if (preparation_time_mins !== undefined) item.preparation_time_mins = preparation_time_mins;
  item.updated_at = new Date().toISOString();

  db.menuItems.set(itemId, item);
  logAudit('MENU_ITEM_UPDATED', 'menu_items', itemId, req.user!.userId, req.user!.role, req.body);

  res.json({ success: true, message: 'Menu item updated successfully', data: item });
});

// Vendor: Delete menu item
router.delete('/:id/menu/:itemId', authenticate, requireRole('vendor', 'admin'), (req: any, res: any): void => {
  const { id, itemId } = req.params;
  const restaurant = db.restaurants.get(id);

  if (!restaurant || (req.user!.role !== 'admin' && restaurant.vendor_user_id !== req.user!.userId)) {
    res.status(403).json({ success: false, error: 'Unauthorized to delete this item' });
    return;
  }

  db.menuItems.delete(itemId);
  logAudit('MENU_ITEM_DELETED', 'menu_items', itemId, req.user!.userId, req.user!.role);
  res.json({ success: true, message: 'Menu item deleted' });
});

export default router;
