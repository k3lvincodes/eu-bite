const CENTRAL_SERVER_URL = process.env.CENTRAL_SERVER_URL || 'http://localhost:4000';
const BOT_SERVICE_TOKEN = process.env.BOT_SERVICE_TOKEN || 'eu_bite_internal_bot_api_token_shared_secret';

// Fallback seed data in case Central API is not running locally
const FALLBACK_RESTAURANTS = [
  {
    id: 'rest-campus-bites',
    name: 'Campus Bites & Grill',
    description: 'Smoky firewood jollof, crunchy chicken, beef shawarma & quick bites.',
    opening_time: '08:00',
    closing_time: '22:00',
    items: [
      { id: 'item-1', name: 'Party Jollof Rice & Crispy Chicken', price_kobo: 220000, price_ngn: 2200, description: 'Firewood smoky jollof rice served with golden spiced chicken and dodo.' },
      { id: 'item-2', name: 'Special Fried Rice & Peppered Turkey', price_kobo: 260000, price_ngn: 2600, description: 'Wok-tossed vegetable fried rice with sweet corn, carrots, and turkey.' },
      { id: 'item-3', name: 'Double Sausage Beef Shawarma', price_kobo: 180000, price_ngn: 1800, description: 'Warm tortilla wrapped around spiced beef, sausage, cabbage and creamy dressing.' },
      { id: 'item-4', name: 'Chilled Hibiscus Zobo (500ml)', price_kobo: 50000, price_ngn: 500, description: 'Fresh natural zobo infused with pineapple and ginger.' },
      { id: 'item-5', name: 'Crunchy Peppered Gizzard Stick', price_kobo: 120000, price_ngn: 1200, description: 'Tender chicken gizzard tossed in spicy habanero bell pepper sauce.' },
      { id: 'item-6', name: 'Sweet Fried Plantain (Dodo Portion)', price_kobo: 70000, price_ngn: 700, description: 'Caramelized sweet ripe fried plantain cuts.' },
      { id: 'item-7', name: 'Fresh Pineapple Ginger Juice (500ml)', price_kobo: 60000, price_ngn: 600, description: 'Cold-pressed fresh sweet pineapple juice with crushed ginger.' },
    ],
  },

  {
    id: 'rest-mama-t',
    name: 'Mama T’s Bukka Delight',
    description: 'Hot pounded yam, egusi, seafood okra, ofada rice with ayamase sauce.',
    opening_time: '09:00',
    closing_time: '21:30',
    items: [
      { id: 'item-5', name: 'Ofada Rice & Spicy Ayamase Sauce', price_kobo: 250000, price_ngn: 2500, description: 'Local short-grain unpolished rice with assorted meats and green pepper sauce.' },
      { id: 'item-6', name: 'Pounded Yam with Rich Egusi Soup', price_kobo: 230000, price_ngn: 2300, description: 'Silky smooth pounded yam with melon seed soup and goat meat.' },
      { id: 'item-7', name: 'Catfish Pepper Soup', price_kobo: 280000, price_ngn: 2800, description: 'Hot and spicy herbal broth with tender catfish steak.' },
    ],
  },
];


const fallbackOrders = new Map<string, any>();

export class CentralApiClient {
  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = process.env.CENTRAL_SERVER_URL || 'http://localhost:4000';
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-bot-service-token': BOT_SERVICE_TOKEN,
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Request failed with status ${res.status}`);
    }
    return data as T;
  }

  static async lookupOrRegisterStudent(details: {
    phone: string;
    fullName?: string;
    studentId?: string;
    department?: string;
    level?: string;
    hostel?: string;
    room?: string;
  }): Promise<any> {
    try {
      return await this.request('/api/bot-bridge/student-lookup', {
        method: 'POST',
        body: JSON.stringify(details),
      });
    } catch {
      return {
        success: true,
        data: {
          user: { phone: details.phone, full_name: details.fullName || 'Campus Student' },
          student: { hostel: details.hostel || 'Hostel Block C', room: details.room || 'Room 214' },
        },
      };
    }
  }

  static async getRestaurantsAndMenus(): Promise<any> {
    try {
      return await this.request('/api/bot-bridge/restaurants-and-menus');
    } catch {
      return {
        success: true,
        data: FALLBACK_RESTAURANTS,
      };
    }
  }

  static async createCheckout(payload: {
    phone: string;
    restaurant_id: string;
    items: Array<{ item_id: string; quantity: number }>;
    packaging_type: 'reusable' | 'school';
    hostel?: string;
    room?: string;
  }): Promise<any> {
    try {
      return await this.request('/api/bot-bridge/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      // Fallback checkout creation
      const orderNumber = `EUB-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
      const packagingUnit = payload.packaging_type === 'reusable' ? 250 : 500;
      const packCount = (payload as any).packaging_count || payload.items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1;
      const packagingFee = packagingUnit * packCount;
      const deliveryFee = 320;
      const serviceFee = 100;

      let subtotal = 0;
      const restaurantNames = new Set<string>();
      payload.items.forEach((ci: any) => {
        let found = false;
        for (const r of FALLBACK_RESTAURANTS) {
          const item = (r.items || []).find((m) => m.id === ci.item_id);
          if (item) {
            subtotal += (item.price_ngn || item.price_kobo / 100) * ci.quantity;
            restaurantNames.add(r.name);
            found = true;
            break;
          }
        }
        if (!found) subtotal += 2200 * (ci.quantity || 1);
      });
      if (subtotal === 0) subtotal = 2200;

      const restName = restaurantNames.size > 0 ? Array.from(restaurantNames).join(' & ') : 'Campus Dining';
      const total = subtotal + packagingFee + deliveryFee + serviceFee;
      const txRef = `EUB-TG-${orderNumber}-${Date.now()}`;
      const checkoutUrl = `http://localhost:3000/checkout/pay?tx_ref=${txRef}&amount=${total}&order=${orderNumber}`;

      const orderData = {
        order_number: orderNumber,
        status: 'awaiting_payment',
        restaurant_name: restName,
        delivery_location: `${payload.hostel || 'Hostel Block C'}, ${payload.room || 'Room 214'}`,
        subtotal_amount: subtotal,
        packaging_fee: packagingFee,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        total_amount: total,
        total_amount_ngn: total,
        delivery_pin: deliveryPin,
        checkout_url: checkoutUrl,
        payment_url: checkoutUrl,
      };

      fallbackOrders.set(payload.phone, orderData);


      return {
        success: true,
        data: orderData,
      };
    }
  }

  static async getActiveOrder(phoneNumber: string): Promise<any> {
    try {
      return await this.request(`/api/bot-bridge/orders/active/${encodeURIComponent(phoneNumber)}`);
    } catch {
      const order = fallbackOrders.get(phoneNumber);
      return {
        success: true,
        data: order || null,
      };
    }
  }
}
