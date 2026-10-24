import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../index.ts';
import { db } from '../db/index.ts';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 4000;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  if (server && typeof server.close === 'function') {
    server.close();
  }
});

describe('EU Bite Central API Acceptance Tests', () => {
  let studentToken: string;
  let vendorToken: string;
  let riderToken: string;
  let adminToken: string;

  test('1. System Health Check', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = (await res.json()) as any;
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'healthy');
  });

  test('2. Authentication & Roles', async () => {
    // Login as Admin
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eubite.com', password: 'Password123!' }),
    });
    const adminData = (await adminRes.json()) as any;
    assert.strictEqual(adminRes.status, 200);
    assert.strictEqual(adminData.user.role, 'admin');
    adminToken = adminData.token;

    // Login as Vendor
    const vendorRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vendor.bites@eubite.com', password: 'Password123!' }),
    });
    const vendorData = (await vendorRes.json()) as any;
    assert.strictEqual(vendorRes.status, 200);
    assert.strictEqual(vendorData.user.role, 'vendor');
    vendorToken = vendorData.token;

    // Login as Rider
    const riderRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rider.musa@eubite.com', password: 'Password123!' }),
    });
    const riderData = (await riderRes.json()) as any;
    assert.strictEqual(riderRes.status, 200);
    assert.strictEqual(riderData.user.role, 'rider');
    riderToken = riderData.token;

    // Login as Student
    const studentRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student.tunde@eubite.com', password: 'Password123!' }),
    });
    const studentData = (await studentRes.json()) as any;
    assert.strictEqual(studentRes.status, 200);
    assert.strictEqual(studentData.user.role, 'student');
    studentToken = studentData.token;
  });

  test('3. Enforce Minimum Food Subtotal Rule (₦1,500)', async () => {
    // Attempt order below ₦1,500 (e.g. Zobo at ₦500 = 50,000 kobo)
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        restaurant_id: '33333333-3333-3333-3333-333333333301',
        items: [{ menu_item_id: '44444444-4444-4444-4444-444444444404', quantity: 1 }], // ₦500
        hostel: 'Hostel Block C',
        room: '214',
      }),
    });
    const data = (await res.json()) as any;
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('minimum food subtotal'));
  });

  let createdOrder: any;

  test('4. Server-Calculated Order Totals & Order Creation', async () => {
    // Valid order: Party Jollof (₦2,200 = 220,000 kobo) + Reusable Pack (₦250 = 25,000 kobo) + Delivery (₦320 = 32,000 kobo) + Service Fee (₦100 = 10,000 kobo)
    // Expected grand total: ₦2,870 = 287,000 kobo
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        restaurant_id: '33333333-3333-3333-3333-333333333301',
        items: [{ menu_item_id: '44444444-4444-4444-4444-444444444401', quantity: 1 }],
        packaging_type_id: '11111111-1111-1111-1111-111111111101', // Reusable ₦250
        hostel: 'Nelson Mandela Hall Block C',
        room: 'Room 214',
      }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(res.status, 201);
    assert.ok(body.success);
    assert.strictEqual(body.data.status, 'pending_payment');
    assert.strictEqual(body.data.food_subtotal_kobo, 220000);
    assert.strictEqual(body.data.packaging_fee_kobo, 25000);
    assert.strictEqual(body.data.delivery_fee_kobo, 32000);
    assert.strictEqual(body.data.service_fee_kobo, 10000);
    assert.strictEqual(body.data.total_amount_kobo, 287000);
    assert.strictEqual(body.data.delivery_pin.length, 4);

    createdOrder = body.data;
  });

  test('5. Prevent Processing Unpaid Orders', async () => {
    // Vendor tries to mark unpaid order ready
    const res = await fetch(`${baseUrl}/api/orders/${createdOrder.id}/vendor-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({ status: 'ready_for_pickup' }),
    });
    const data = (await res.json()) as any;
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('unpaid'));
  });

  test('6. Payment Verification & Idempotency', async () => {
    const initialPack = db.packagingTypes.get('11111111-1111-1111-1111-111111111101')!;
    const initialStock = initialPack.stock_count;

    // Verify payment first time
    const res1 = await fetch(`${baseUrl}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_ref: createdOrder.flutterwave_tx_ref, status: 'successful' }),
    });
    const data1 = (await res1.json()) as any;
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(data1.order.payment_status, 'successful');
    assert.strictEqual(data1.order.status, 'paid');

    // Packaging stock should decrement by 1
    const updatedPack = db.packagingTypes.get('11111111-1111-1111-1111-111111111101')!;
    assert.strictEqual(updatedPack.stock_count, initialStock - 1);

    // Duplicate verification attempt (Idempotent replay)
    const res2 = await fetch(`${baseUrl}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_ref: createdOrder.flutterwave_tx_ref, status: 'successful' }),
    });
    const data2 = (await res2.json()) as any;
    assert.strictEqual(res2.status, 200);
    // Stock must NOT be deducted again
    assert.strictEqual(db.packagingTypes.get('11111111-1111-1111-1111-111111111101')!.stock_count, initialStock - 1);
  });

  test('7. Vendor Transitions Order to Ready For Pickup', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrder.id}/vendor-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({ status: 'ready_for_pickup' }),
    });
    const data = (await res.json()) as any;
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.data.status, 'ready_for_pickup');
  });

  test('8. Atomic Rider Order Claiming', async () => {
    // First rider claims the order
    const claimRes1 = await fetch(`${baseUrl}/api/dispatch/${createdOrder.id}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`,
      },
    });
    const claimData1 = (await claimRes1.json()) as any;
    assert.strictEqual(claimRes1.status, 200);
    assert.strictEqual(claimData1.data.status, 'rider_assigned');

    // Attempt second claim by another rider (or same rider) -> Must be rejected atomically!
    const claimRes2 = await fetch(`${baseUrl}/api/dispatch/${createdOrder.id}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`,
      },
    });
    const claimData2 = (await claimRes2.json()) as any;
    assert.notStrictEqual(claimRes2.status, 200);
  });

  test('9. Rider Pickup and Delivery PIN Verification', async () => {
    // Rider marks order in transit
    const pickupRes = await fetch(`${baseUrl}/api/dispatch/${createdOrder.id}/pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`,
      },
    });
    assert.strictEqual(pickupRes.status, 200);

    // Try invalid PIN '0000'
    const wrongPinRes = await fetch(`${baseUrl}/api/dispatch/${createdOrder.id}/deliver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`,
      },
      body: JSON.stringify({ pin: '0000' }),
    });
    const wrongPinData = (await wrongPinRes.json()) as any;
    assert.strictEqual(wrongPinRes.status, 400);
    assert.ok(wrongPinData.error.includes('Invalid delivery PIN'));

    // Provide correct PIN
    const correctPin = createdOrder.delivery_pin;
    const deliverRes = await fetch(`${baseUrl}/api/dispatch/${createdOrder.id}/deliver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`,
      },
      body: JSON.stringify({ pin: correctPin }),
    });
    const deliverData = (await deliverRes.json()) as any;
    assert.strictEqual(deliverRes.status, 200);
    assert.strictEqual(deliverData.data.status, 'delivered');
    assert.strictEqual(deliverData.data.earned_ngn, 250);
  });

  test('10. WhatsApp Bot Bridge Endpoint', async () => {
    // Test WhatsApp student lookup
    const bridgeRes = await fetch(`${baseUrl}/api/bot-bridge/student-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-service-token': 'eu_bite_internal_bot_api_token_shared_secret',
      },
      body: JSON.stringify({
        phone: '+2348099887766',
        fullName: 'Chioma Okoli',
        studentId: 'EU/2024/LAW/0122',
        hostel: 'Queen Amina Hall',
        room: 'B-10',
      }),
    });
    const bridgeData = (await bridgeRes.json()) as any;
    assert.strictEqual(bridgeRes.status, 200);
    assert.strictEqual(bridgeData.data.fullName, 'Chioma Okoli');
  });
});
