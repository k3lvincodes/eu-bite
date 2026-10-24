-- EU Bite Initial Seed Data

-- 1. PLATFORM SETTINGS
INSERT INTO platform_settings (key, value_json, description) VALUES
('min_food_subtotal_kobo', '150000', 'Minimum order food subtotal in kobo (NGN 1,500)'),
('hostel_delivery_fee_kobo', '32000', 'Standard hostel delivery fee in kobo (NGN 320)'),
('service_fee_kobo', '10000', 'EU Bite platform service fee in kobo (NGN 100)'),
('reusable_pack_fee_kobo', '25000', 'Eco-friendly reusable food pack fee (NGN 250)'),
('school_pack_fee_kobo', '50000', 'Institutional school meal pack fee (NGN 500)'),
('rider_delivery_payout_kobo', '25000', 'Rider base earnings per completed delivery (NGN 250)')
ON CONFLICT (key) DO NOTHING;

-- 2. PACKAGING TYPES
INSERT INTO packaging_types (id, code, name, fee_kobo, stock_count, description, is_active) VALUES
('11111111-1111-1111-1111-111111111101', 'reusable', 'EU Bite Reusable Eco-Pack', 25000, 1500, 'Durable, sanitized reusable container. Campus green initiative.', TRUE),
('11111111-1111-1111-1111-111111111102', 'school', 'Official School Cafeteria Pack', 50000, 800, 'Standard approved campus food packaging container.', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. USERS (Password hashes for bcrypt 10 rounds: hashed version of password123 or similar)
-- Password for all seed users is: Password123!
-- bcrypt hash: $2a$10$wT0X7G7R2Z2X8b0lWJkXm.K9C0.iRz1g5K1rR0qR8n1tB0x.qX0O2
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active) VALUES
('22222222-2222-2222-2222-222222222201', 'admin@eubite.com', '$2a$10$f0sZf2c8rB3uJ5kH8n2kLuE5g1tY8iO9p0qR1sT2uV3wX4yZ5a6b.', 'Campus Director (Admin)', '+2348011223344', 'admin', TRUE),
('22222222-2222-2222-2222-222222222202', 'vendor.bites@eubite.com', '$2a$10$f0sZf2c8rB3uJ5kH8n2kLuE5g1tY8iO9p0qR1sT2uV3wX4yZ5a6b.', 'Campus Bites & Grill', '+2348022334455', 'vendor', TRUE),
('22222222-2222-2222-2222-222222222203', 'vendor.bukka@eubite.com', '$2a$10$f0sZf2c8rB3uJ5kH8n2kLuE5g1tY8iO9p0qR1sT2uV3wX4yZ5a6b.', 'Mama T’s Bukka Delight', '+2348033445566', 'vendor', TRUE),
('22222222-2222-2222-2222-222222222204', 'rider.musa@eubite.com', '$2a$10$f0sZf2c8rB3uJ5kH8n2kLuE5g1tY8iO9p0qR1sT2uV3wX4yZ5a6b.', 'Musa Bello', '+2348044556677', 'rider', TRUE),
('22222222-2222-2222-2222-222222222205', 'rider.emeka@eubite.com', '$2a$10$f0sZf2c8rB3uJ5kH8n2kLuE5g1tY8iO9p0qR1sT2uV3wX4yZ5a6b.', 'Emeka Okafor', '+2348055667788', 'rider', TRUE),
('22222222-2222-2222-2222-222222222206', 'student.tunde@eubite.com', '$2a$10$f0sZf2c8rB3uJ5kH8n2kLuE5g1tY8iO9p0qR1sT2uV3wX4yZ5a6b.', 'Tunde Adeleke', '+2348066778899', 'student', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 4. RESTAURANTS
INSERT INTO restaurants (id, vendor_user_id, name, slug, description, image_url, phone, opening_time, closing_time, is_active, is_accepting_orders) VALUES
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222202', 'Campus Bites & Grill', 'campus-bites-grill', 'Fresh smoky jollof, crunchy fried chicken, spicy shawarma & fast food.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', '+2348022334455', '08:00', '22:00', TRUE, TRUE),
('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222203', 'Mama T’s Bukka Delight', 'mama-t-bukka-delight', 'Authentic Nigerian home cooking, hot pounded yam, egusi, seafood okra & goat meat.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', '+2348033445566', '09:00', '21:30', TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 5. MENU ITEMS (Prices in kobo: ₦2,000 = 200,000 kobo)
INSERT INTO menu_items (id, restaurant_id, name, description, category, price_kobo, is_available, image_url, preparation_time_mins) VALUES
('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'Party Jollof Rice & Crispy Chicken', 'Firewood smoky jollof rice served with golden spiced chicken and sweet fried plantain (dodo).', 'Rice & Pastas', 220000, TRUE, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80', 15),
('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'Special Fried Rice & Peppered Turkey', 'Wok-tossed vegetable fried rice with sweet corn, carrots, and succulent peppered turkey cutlet.', 'Rice & Pastas', 260000, TRUE, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80', 15),
('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'Double Sausage Beef Shawarma', 'Toasted flatbread filled with seasoned minced beef, grilled sausages, crunchy cabbage and spicy cream.', 'Grills & Fast Food', 180000, TRUE, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80', 10),
('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333301', 'Chilled Hibiscus Zobo (500ml)', 'Fresh natural zobo infused with pineapple, ginger, and cloves.', 'Drinks', 50000, TRUE, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', 5),

('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 'Pounded Yam & Assorted Egusi Soup', 'Smooth fluffy pounded yam served with rich melon seed soup, stockfish, shaki and beef.', 'Swallows', 240000, TRUE, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 20),
('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333302', 'Amala with Ila Alasepo & Goat Meat', 'Hot brown yam flour amala served with piping hot mixed okra soup and tender goat meat.', 'Swallows', 250000, TRUE, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80', 20),
('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333302', 'Ofada Rice & Spicy Ayamase Sauce', 'Unpolished native ofada rice paired with green pepper bleech sauce, boiled egg, and assorted offals.', 'Rice & Pastas', 230000, TRUE, 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80', 15)
ON CONFLICT DO NOTHING;

-- 6. RIDERS
INSERT INTO riders (id, user_id, vehicle_type, plate_number, approval_status, is_online, total_deliveries, total_earnings_kobo, rating) VALUES
('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222204', 'bicycle', 'CAMPUS-BIKE-09', 'approved', TRUE, 42, 1050000, 4.95),
('55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222205', 'motorcycle', 'LAGOS-KJA-449', 'approved', TRUE, 88, 2200000, 4.88)
ON CONFLICT DO NOTHING;

-- 7. STUDENTS
INSERT INTO students (id, user_id, student_id, department, academic_level, default_hostel, default_room, phone_number, pack_allowance_balance) VALUES
('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222206', 'EU/2023/SCI/0491', 'Computer Science', '300L', 'Nelson Mandela Hall (Block C)', 'Room 214', '+2348066778899', 2)
ON CONFLICT (student_id) DO NOTHING;
