process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { BotEngine } from '../services/botEngine.ts';
import { sessionManager } from '../services/conversationState.ts';
import { CentralApiClient } from '../services/apiClient.ts';
import { TelegramBotApi } from '../services/telegramBotApi.ts';

describe('EU Bite Omnichannel Bot Conversational Flow Tests (WhatsApp & Telegram)', () => {
  const testPhone = '+2348099887711';
  const testTelegramChatId = 'tg_9821441';
  let serverInstance: any;

  before(async () => {
    await new Promise<void>(async (resolve) => {
      try {
        const serverPath = '../../../server/src/index.ts';
        const serverModule = await import(serverPath);
        const serverApp = serverModule.default || serverModule;
        serverInstance = serverApp.listen(4000, () => resolve());
        serverInstance.on('error', () => resolve());
      } catch {
        resolve();
      }
    });

    await CentralApiClient.lookupOrRegisterStudent({
      phone: testPhone,
      fullName: 'Amina Danjuma',
      studentId: 'EU/2024/SCI/0188',
      hostel: 'Hostel Block C',
      room: 'Room 214',
    });

    await CentralApiClient.lookupOrRegisterStudent({
      phone: testTelegramChatId,
      fullName: 'Emeka Obi',
      studentId: 'EU/2024/ENG/0312',
      hostel: 'Hostel Block A',
      room: 'Room 102',
    });

    const s1 = sessionManager.getSession(testPhone, 'whatsapp');
    s1.isRegistered = true;
    s1.studentName = 'Amina Danjuma';
    s1.hostel = 'Hostel Block C';
    s1.room = 'Room 214';
    sessionManager.saveSession(s1);

    const s2 = sessionManager.getSession(testTelegramChatId, 'telegram');
    s2.isRegistered = true;
    s2.studentName = 'Emeka Obi';
    s2.hostel = 'Hostel Block A';
    s2.room = 'Room 102';
    sessionManager.saveSession(s2);
  });

  after(() => {
    if (serverInstance && typeof serverInstance.close === 'function') {
      try {
        serverInstance.close();
      } catch {}
    }
  });

  // --- Telegram Default Commands Menu ---
  describe('Telegram Native Menu Registration', () => {
    test('1. setMyCommands registers default bot menu successfully', async () => {
      const ok = await TelegramBotApi.setMyCommands();
      assert.strictEqual(ok, true);
    });
  });

  // --- WhatsApp Channel Tests ---
  describe('WhatsApp Channel Flow', () => {
    test('1. Greeting triggers Main Menu', async () => {
      const response = await BotEngine.handleIncomingMessage(testPhone, 'Hello', 'whatsapp');
      assert.strictEqual(response, 'Main menu sent');
      const session = sessionManager.getSession(testPhone);
      assert.strictEqual(session.step, 'MAIN_MENU');
      assert.strictEqual(session.channel, 'whatsapp');
    });

    test('2. Option 1 displays campus restaurants list', async () => {
      const response = await BotEngine.handleIncomingMessage(testPhone, '1', 'whatsapp');
      assert.strictEqual(response, 'Restaurant list sent');
      const session = sessionManager.getSession(testPhone);
      assert.strictEqual(session.step, 'SELECTING_RESTAURANT');
    });

    test('3. Selecting Restaurant 1 displays its menu', async () => {
      const response = await BotEngine.handleIncomingMessage(testPhone, '1', 'whatsapp');
      assert.strictEqual(response, 'Menu displayed');
      const session = sessionManager.getSession(testPhone);
      assert.strictEqual(session.step, 'BROWSING_ITEMS');
      assert.ok(session.selectedRestaurantId);
    });

    test('4. Adding item to cart triggers Post-Add Action Prompt', async () => {
      const response = await BotEngine.handleIncomingMessage(testPhone, '1', 'whatsapp');
      assert.strictEqual(response, 'Item added to cart');
      const session = sessionManager.getSession(testPhone);
      assert.strictEqual(session.cart.length, 1);
      assert.strictEqual(session.step, 'ITEM_ADDED_PROMPT');
    });

    test('5. Checking cart displays dedicated VIEWING_CART breakdown', async () => {
      const response = await BotEngine.handleIncomingMessage(testPhone, 'cart', 'whatsapp');
      assert.strictEqual(response, 'Cart displayed');
      const session = sessionManager.getSession(testPhone);
      assert.strictEqual(session.step, 'VIEWING_CART');
    });

    test('6. Checkout packaging prompt and selection', async () => {
      const packPrompt = await BotEngine.handleIncomingMessage(testPhone, 'checkout', 'whatsapp');
      assert.strictEqual(packPrompt, 'Packaging prompt sent');

      const packSelected = await BotEngine.handleIncomingMessage(testPhone, '1', 'whatsapp');
      assert.strictEqual(packSelected, 'Location prompt sent');
      const session = sessionManager.getSession(testPhone);
      assert.strictEqual(session.selectedPackaging, 'reusable');
      assert.strictEqual(session.step, 'CONFIRMING_DELIVERY_LOCATION');
    });

    test('7. Confirming location and drop-off creates checkout order', async () => {
      const locRes = await BotEngine.handleIncomingMessage(testPhone, 'yes', 'whatsapp');
      assert.strictEqual(locRes, 'Prompted drop preference');

      const checkoutResult = await BotEngine.handleIncomingMessage(testPhone, 'gate', 'whatsapp');
      assert.strictEqual(checkoutResult, 'Checkout created');
      const session = sessionManager.getSession(testPhone);
      assert.strictEqual(session.cart.length, 0);
      assert.ok(session.pendingOrder);
    });

    test('8. Tracking active order by WhatsApp command', async () => {
      const trackResult = await BotEngine.handleIncomingMessage(testPhone, 'track', 'whatsapp');
      assert.strictEqual(trackResult, 'Order tracked');
    });
  });

  // --- Telegram Channel Tests ---
  describe('Telegram Channel Flow', () => {
    test('1. /start command triggers Main Menu for Telegram user', async () => {
      const response = await BotEngine.handleIncomingMessage(testTelegramChatId, '/start', 'telegram');
      assert.strictEqual(response, 'Main menu sent');
      const session = sessionManager.getSession(testTelegramChatId);
      assert.strictEqual(session.step, 'MAIN_MENU');
      assert.strictEqual(session.channel, 'telegram');
    });

    test('2. Option 1 displays campus restaurants on Telegram', async () => {
      const response = await BotEngine.handleIncomingMessage(testTelegramChatId, '1', 'telegram');
      assert.strictEqual(response, 'Restaurant list sent');
      const session = sessionManager.getSession(testTelegramChatId);
      assert.strictEqual(session.step, 'SELECTING_RESTAURANT');
    });

    test('3. Selecting restaurant displays menu on Telegram', async () => {
      const response = await BotEngine.handleIncomingMessage(testTelegramChatId, '1', 'telegram');
      assert.strictEqual(response, 'Menu displayed');
      const session = sessionManager.getSession(testTelegramChatId);
      assert.strictEqual(session.step, 'BROWSING_ITEMS');
    });

    test('4. Adding item triggers post-add prompt on Telegram', async () => {
      const response = await BotEngine.handleIncomingMessage(testTelegramChatId, '1', 'telegram');
      assert.strictEqual(response, 'Item added to cart');
      const session = sessionManager.getSession(testTelegramChatId);
      assert.strictEqual(session.cart.length, 1);
      assert.strictEqual(session.step, 'ITEM_ADDED_PROMPT');
    });

    test('5. Checking cart with /cart command on Telegram', async () => {
      const response = await BotEngine.handleIncomingMessage(testTelegramChatId, '/cart', 'telegram');
      assert.strictEqual(response, 'Cart displayed');
    });

    test('6. Checkout packaging and location confirmation on Telegram', async () => {
      const packPrompt = await BotEngine.handleIncomingMessage(testTelegramChatId, 'checkout', 'telegram');
      assert.strictEqual(packPrompt, 'Packaging prompt sent');

      const packSelected = await BotEngine.handleIncomingMessage(testTelegramChatId, '1', 'telegram');
      assert.strictEqual(packSelected, 'Location prompt sent');

      const locRes = await BotEngine.handleIncomingMessage(testTelegramChatId, 'yes', 'telegram');
      assert.strictEqual(locRes, 'Prompted drop preference');

      const checkoutResult = await BotEngine.handleIncomingMessage(testTelegramChatId, 'room', 'telegram');
      assert.strictEqual(checkoutResult, 'Checkout created');
      const session = sessionManager.getSession(testTelegramChatId);
      assert.strictEqual(session.cart.length, 0);
    });

    test('7. Tracking active order with /track on Telegram', async () => {
      const trackResult = await BotEngine.handleIncomingMessage(testTelegramChatId, '/track', 'telegram');
      assert.strictEqual(trackResult, 'Order tracked');
    });
  });

  // --- Multi-Restaurant & Advanced UX Flow Tests ---
  describe('Multi-Restaurant Tray & Advanced UX Tests', () => {
    const multiUser = 'tg_multi_vendor_99';

    test('1. Onboarding new student step-by-step', async () => {
      sessionManager.clearSession(multiUser);
      const r1 = await BotEngine.handleIncomingMessage(multiUser, '/start', 'telegram', { firstName: 'Zainab' });
      assert.strictEqual(r1, 'Awaiting Onboarding Name');

      const r2 = await BotEngine.handleIncomingMessage(multiUser, 'Zainab Ahmed', 'telegram');
      assert.strictEqual(r2, 'Awaiting Phone Number');

      const r3 = await BotEngine.handleIncomingMessage(multiUser, '08099887766', 'telegram');
      assert.strictEqual(r3, 'Prompted Hostel Selection');

      const r4 = await BotEngine.handleIncomingMessage(multiUser, '2', 'telegram');
      assert.strictEqual(r4, 'Awaiting Room Number');

      const r5 = await BotEngine.handleIncomingMessage(multiUser, 'Room 114', 'telegram');
      assert.strictEqual(r5, 'Main menu sent');

      const session = sessionManager.getSession(multiUser);
      assert.strictEqual(session.isRegistered, true);
      assert.strictEqual(session.hostel, 'Hostel Block B');
      assert.strictEqual(session.room, 'Room 114');
    });

    test('2. Multi-Restaurant Cart: adding food from Vendor 1 and Vendor 2 into same tray', async () => {
      const s = sessionManager.getSession(multiUser);
      s.cart = [];
      sessionManager.saveSession(s);

      // 1: Open restaurants
      await BotEngine.handleIncomingMessage(multiUser, '1', 'telegram');
      // 1: Select Vendor 1 (Campus Bites)
      await BotEngine.handleIncomingMessage(multiUser, '1', 'telegram');
      // 1: Add Item 1 (Jollof Rice)
      await BotEngine.handleIncomingMessage(multiUser, '1', 'telegram');
      assert.strictEqual(sessionManager.getSession(multiUser).cart.length, 1);


      // Back to restaurant list
      await BotEngine.handleIncomingMessage(multiUser, 'back', 'telegram');
      // 2: Select Vendor 2 (Mama T's Bukka)
      await BotEngine.handleIncomingMessage(multiUser, '2', 'telegram');
      // 1: Add Item 1 from Vendor 2 (Ofada Rice)
      await BotEngine.handleIncomingMessage(multiUser, '1', 'telegram');

      // Verify BOTH items exist in the tray from different vendors!
      const cart = sessionManager.getSession(multiUser).cart;
      assert.strictEqual(cart.length, 2);
      assert.strictEqual(cart[0].restaurantName, 'Campus Bites & Grill');
      assert.strictEqual(cart[1].restaurantName, 'Mama T’s Bukka Delight');
    });

    test('3. Post-Add 1-tap Quantity Increment (+1)', async () => {
      // Click plus_1 to increment last added item
      const prompt = await BotEngine.handleIncomingMessage(multiUser, 'plus_1', 'telegram');
      assert.strictEqual(prompt, 'Item added to cart');
      const cart = sessionManager.getSession(multiUser).cart;
      assert.strictEqual(cart[1].quantity, 2);
    });

    test('4. Adding Meal Note to item', async () => {
      await BotEngine.handleIncomingMessage(multiUser, 'cart', 'telegram');
      const notePrompt = await BotEngine.handleIncomingMessage(multiUser, 'add_note', 'telegram');
      assert.strictEqual(notePrompt, 'Awaiting item note text');

      const saved = await BotEngine.handleIncomingMessage(multiUser, 'No pepper and extra sauce', 'telegram');
      assert.strictEqual(saved, 'Cart displayed');
      assert.strictEqual(sessionManager.getSession(multiUser).cart[0].note, 'No pepper and extra sauce');
    });

    test('5. Modifying order from Awaiting Payment screen', async () => {
      // Proceed to checkout
      await BotEngine.handleIncomingMessage(multiUser, 'checkout', 'telegram');
      await BotEngine.handleIncomingMessage(multiUser, '1', 'telegram'); // Eco pack
      await BotEngine.handleIncomingMessage(multiUser, 'yes', 'telegram'); // Yes address
      await BotEngine.handleIncomingMessage(multiUser, 'gate', 'telegram'); // Gate

      const s = sessionManager.getSession(multiUser);
      assert.strictEqual(s.step, 'AWAITING_PAYMENT');
      assert.ok(s.pendingOrder);

      // Click "modify" to reopen tray
      const reopened = await BotEngine.handleIncomingMessage(multiUser, 'modify', 'telegram');
      assert.strictEqual(reopened, 'Cart displayed');
      assert.strictEqual(sessionManager.getSession(multiUser).step, 'VIEWING_CART');
      assert.strictEqual(sessionManager.getSession(multiUser).cart.length, 2);
    });

    test('6. Profile Management via /profile', async () => {
      const profResult = await BotEngine.handleIncomingMessage(multiUser, '/profile', 'telegram');
      assert.strictEqual(profResult, 'Profile displayed');
      assert.strictEqual(sessionManager.getSession(multiUser).step, 'PROFILE_VIEW');
    });

    test('7. 5-Dish Menu Pagination: Next and Previous page controls', async () => {
      // Return to main menu
      await BotEngine.handleIncomingMessage(multiUser, '/menu', 'telegram');
      // 1: Open restaurants directory
      await BotEngine.handleIncomingMessage(multiUser, '1', 'telegram');
      // 1: Select Vendor 1 (Campus Bites, which has 7 items)
      const menuRes = await BotEngine.handleIncomingMessage(multiUser, '1', 'telegram');
      assert.strictEqual(menuRes, 'Menu displayed');
      const s = sessionManager.getSession(multiUser);
      assert.strictEqual(s.menuPage, 1);


      // Navigate to Next page (Dishes 6 to 7)
      const nextRes = await BotEngine.handleIncomingMessage(multiUser, 'next', 'telegram');
      assert.strictEqual(nextRes, 'Menu displayed');
      assert.strictEqual(sessionManager.getSession(multiUser).menuPage, 2);

      // Add item 6 from Page 2 (Sweet Fried Plantain)
      const addRes = await BotEngine.handleIncomingMessage(multiUser, '6', 'telegram');
      assert.strictEqual(addRes, 'Item added to cart');
      const lastItem = sessionManager.getSession(multiUser).cart.slice(-1)[0];
      assert.strictEqual(lastItem.name, 'Sweet Fried Plantain (Dodo Portion)');

      // Navigate back to Previous page (Page 1)
      const prevRes = await BotEngine.handleIncomingMessage(multiUser, 'prev', 'telegram');
      assert.strictEqual(prevRes, 'Menu displayed');
      assert.strictEqual(sessionManager.getSession(multiUser).menuPage, 1);
    });

    test('8. ℹ️ Instructions page and back navigation to dishes', async () => {
      // Tap ℹ️ How to Order button
      const helpRes = await BotEngine.handleIncomingMessage(multiUser, 'menu_help', 'telegram');
      assert.strictEqual(helpRes, 'Menu instructions displayed');
      assert.strictEqual(sessionManager.getSession(multiUser).step, 'VIEWING_MENU_HELP');

      // Tap Back to Dishes button
      const backRes = await BotEngine.handleIncomingMessage(multiUser, 'back_to_menu', 'telegram');
      assert.strictEqual(backRes, 'Menu displayed');
      assert.strictEqual(sessionManager.getSession(multiUser).step, 'BROWSING_ITEMS');
      assert.strictEqual(sessionManager.getSession(multiUser).menuPage, 1);
    });
  });
});

