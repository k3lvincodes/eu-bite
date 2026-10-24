-- EU Bite Database Schema (Supabase PostgreSQL)
-- All monetary amounts stored as integer kobo (100 kobo = 1 NGN)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'vendor', 'rider', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENTS PROFILE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    academic_level VARCHAR(20) NOT NULL, -- e.g. 100L, 200L, 300L, 400L, 500L, PG
    default_hostel VARCHAR(100) NOT NULL,
    default_room VARCHAR(50) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    pack_allowance_balance INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RESTAURANTS / VENDORS
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    phone VARCHAR(30) NOT NULL,
    opening_time VARCHAR(10) DEFAULT '08:00',
    closing_time VARCHAR(10) DEFAULT '22:00',
    is_active BOOLEAN DEFAULT TRUE,
    is_accepting_orders BOOLEAN DEFAULT TRUE,
    bank_account_name VARCHAR(150),
    bank_account_number VARCHAR(30),
    bank_code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- e.g. Rice & Pastas, Swallows, Grills & Fast Food, Drinks
    price_kobo BIGINT NOT NULL CHECK (price_kobo > 0),
    is_available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    packaging_requirement VARCHAR(50) DEFAULT 'standard',
    preparation_time_mins INT DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PACKAGING TYPES
CREATE TABLE IF NOT EXISTS packaging_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'reusable' or 'school'
    name VARCHAR(100) NOT NULL,
    fee_kobo BIGINT NOT NULL DEFAULT 25000,
    stock_count INT NOT NULL DEFAULT 500,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RIDERS
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL, -- 'bicycle', 'motorcycle', 'walking'
    plate_number VARCHAR(50),
    id_card_url TEXT,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'suspended', 'rejected')),
    is_online BOOLEAN DEFAULT FALSE,
    total_deliveries INT DEFAULT 0,
    total_earnings_kobo BIGINT DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    rider_id UUID REFERENCES riders(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN (
            'pending_payment',
            'paid',
            'vendor_accepted',
            'preparing',
            'ready_for_pickup',
            'rider_assigned',
            'in_transit',
            'delivered',
            'cancelled',
            'rejected'
        )
    ),
    food_subtotal_kobo BIGINT NOT NULL CHECK (food_subtotal_kobo >= 0),
    packaging_fee_kobo BIGINT NOT NULL DEFAULT 0,
    packaging_type_id UUID REFERENCES packaging_types(id),
    packaging_qty INT DEFAULT 1,
    delivery_fee_kobo BIGINT NOT NULL DEFAULT 32000,
    service_fee_kobo BIGINT NOT NULL DEFAULT 10000,
    total_amount_kobo BIGINT NOT NULL CHECK (total_amount_kobo > 0),
    hostel VARCHAR(100) NOT NULL,
    room VARCHAR(50) NOT NULL,
    delivery_notes TEXT,
    delivery_pin VARCHAR(4) NOT NULL,
    pin_attempts INT DEFAULT 0,
    flutterwave_tx_ref VARCHAR(100) UNIQUE,
    flutterwave_flw_ref VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'successful', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ,
    prepared_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    item_name VARCHAR(255) NOT NULL,
    unit_price_kobo BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price_kobo BIGINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PACK INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS pack_inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_type_id UUID NOT NULL REFERENCES packaging_types(id),
    order_id UUID REFERENCES orders(id),
    student_id UUID REFERENCES students(id),
    vendor_id UUID REFERENCES restaurants(id),
    rider_id UUID REFERENCES riders(id),
    transaction_type VARCHAR(30) NOT NULL CHECK (
        transaction_type IN ('issued', 'collected', 'returned', 'lost', 'damaged', 'restocked')
    ),
    quantity INT NOT NULL,
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RIDER PAYOUTS
CREATE TABLE IF NOT EXISTS rider_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES riders(id),
    amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    reference VARCHAR(100) UNIQUE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value_json JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details_json JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tx_ref ON orders(flutterwave_tx_ref);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_pack_trans_type ON pack_inventory_transactions(transaction_type);

-- ROW LEVEL SECURITY (RLS) POLICIES ENABLEMENT
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
