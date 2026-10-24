import { sessionManager } from './conversationState.ts';
import type { UserSession, CartItem } from './conversationState.ts';
import { CentralApiClient } from './apiClient.ts';
import { ChannelService } from './channelService.ts';
import type { InteractiveOption } from './channelService.ts';

const CAMPUS_HOSTELS = [
  'Hostel Block A',
  'Hostel Block B',
  'Hostel Block C',
  'Hostel Block D',
  'Postgraduate Hall',
];

// Debounce map for rapid clicks (key: identifier, value: timestamp)
const recentActions = new Map<string, number>();

export class BotEngine {
  /**
   * Main entrypoint for processing incoming messages from WhatsApp or Telegram
   */
  static async handleIncomingMessage(
    identifier: string,
    text: string,
    channel: 'whatsapp' | 'telegram' = 'whatsapp',
    metadata?: { firstName?: string; username?: string }
  ): Promise<string> {
    const cleanText = text.trim();
    const session = sessionManager.getSession(identifier, channel);

    // Debounce rapid duplicate button taps (< 250ms)
    const now = Date.now();
    const lastAction = recentActions.get(identifier) || 0;
    if (now - lastAction < 250 && cleanText === session.lastActivity?.toString()) {
      return 'Debounced';
    }
    recentActions.set(identifier, now);

    // Auto-populate name from Telegram if available and not yet set
    if (!session.studentName && metadata?.firstName) {
      session.studentName = metadata.firstName;
    }

    // 1. Universal Global Navigation Commands
    const lower = cleanText.toLowerCase();

    if (lower === '/start' || lower === 'start') {
      return this.handleStart(session);
    }

    if (lower === '/menu' || lower === 'menu' || lower === 'hello' || lower === 'hi') {
      return this.sendMainMenu(session);
    }

    if (lower === '/cart' || lower === 'cart' || lower === 'view cart' || lower === 'tray') {
      return this.displayCart(session);
    }

    if (lower === '/track' || lower === 'track') {
      return this.handleTrackOrder(session);
    }

    if (lower === '/pin' || lower === 'pin' || lower === 'my pin' || lower === 'delivery pin') {
      return this.handleQuickPinLookup(session);
    }

    if (lower === '/profile' || lower === 'profile' || lower === 'my profile') {
      return this.displayProfile(session);
    }

    if (lower === '/help' || lower === 'help' || lower === 'support') {
      return this.handleSupport(session);
    }

    if (lower === 'clear cart' || lower === 'clear') {
      return this.promptClearCartConfirmation(session);
    }

    if (lower === 'cancel' || lower === 'exit') {
      return this.sendMainMenu(session);
    }

    if (lower === 'back' || lower === '0') {
      return this.handleBackNavigation(session);
    }

    // 2. Step-by-Step Finite State Machine
    switch (session.step) {
      case 'ONBOARDING_NAME':
        return this.handleOnboardingName(session, cleanText);

      case 'ONBOARDING_PHONE':
        return this.handleOnboardingPhone(session, cleanText);

      case 'ONBOARDING_HOSTEL':
        return this.handleOnboardingHostel(session, cleanText);

      case 'ONBOARDING_ROOM':
        return this.handleOnboardingRoom(session, cleanText);

      case 'IDLE':
      case 'MAIN_MENU':
        return this.handleMainMenuSelection(session, cleanText);

      case 'SELECTING_RESTAURANT':
        return this.handleRestaurantSelection(session, cleanText);

      case 'BROWSING_ITEMS':
      case 'ITEM_ADDED_PROMPT':
        return this.handleItemSelection(session, cleanText);

      case 'VIEWING_MENU_HELP':
        return this.handleMenuHelpInput(session, cleanText);

      case 'VIEWING_CART':
        return this.handleViewingCartInput(session, cleanText);

      case 'CONFIRM_CLEAR_CART':
        return this.handleConfirmClearCart(session, cleanText);

      case 'ADD_ITEM_NOTE':
        return this.handleSaveItemNote(session, cleanText);

      case 'SELECTING_PACKAGING':
        return this.handlePackagingSelection(session, cleanText);

      case 'CONFIRMING_DELIVERY_LOCATION':
        return this.handleDeliveryLocationSelection(session, cleanText);

      case 'SELECTING_DROP_PREFERENCE':
        return this.handleDropPreferenceSelection(session, cleanText);

      case 'MANUAL_HOSTEL':
        return this.handleManualHostel(session, cleanText);

      case 'MANUAL_ROOM':
        return this.handleManualRoom(session, cleanText);

      case 'PROFILE_VIEW':
        return this.handleProfileOption(session, cleanText);

      case 'PROFILE_EDIT_NAME':
        session.studentName = cleanText;
        sessionManager.saveSession(session);
        await ChannelService.sendMessage(session, `Name updated to *${session.studentName}*.`);
        return this.displayProfile(session);

      case 'PROFILE_EDIT_PHONE':
        return this.handleUpdatePhone(session, cleanText);

      case 'PROFILE_EDIT_HOSTEL':
        return this.handleUpdateHostel(session, cleanText);

      case 'PROFILE_EDIT_ROOM':
        session.room = cleanText.startsWith('Room') ? cleanText : `Room ${cleanText.replace(/room/i, '').trim()}`;
        sessionManager.saveSession(session);
        await ChannelService.sendMessage(session, `Room updated to *${session.room}*.`);
        return this.displayProfile(session);

      case 'AWAITING_PAYMENT':
        if (lower === 'modify' || lower === 'modify tray' || lower === 'edit') {
          return this.restoreCartForModification(session);
        }
        return this.handleTrackOrder(session);

      default:
        session.step = 'MAIN_MENU';
        sessionManager.saveSession(session);
        return this.sendMainMenu(session);
    }
  }

  // ==========================================
  // NAVIGATION & START
  // ==========================================

  private static async handleStart(session: UserSession): Promise<string> {
    if (!session.isRegistered && !session.hostel) {
      session.step = 'ONBOARDING_NAME';
      sessionManager.saveSession(session);
      const greeting = session.studentName ? `Hi ${session.studentName}. ` : '';
      await ChannelService.sendMessage(
        session,
        `*EU Bite*\nCampus Food Delivery\n\n` +
          `${greeting}Set up your delivery details to get started.\n\n` +
          `What is your Full Name? (or reply "skip" to proceed)`
      );
      return 'Awaiting Onboarding Name';
    }

    session.step = 'MAIN_MENU';
    sessionManager.saveSession(session);
    return this.sendMainMenu(session, true);
  }

  private static async handleBackNavigation(session: UserSession): Promise<string> {
    switch (session.step) {
      case 'SELECTING_RESTAURANT':
        session.step = 'MAIN_MENU';
        sessionManager.saveSession(session);
        return this.sendMainMenu(session, false);

      case 'BROWSING_ITEMS':
      case 'ITEM_ADDED_PROMPT':
        return this.displayRestaurantList(session);

      case 'VIEWING_MENU_HELP':
        if (session.selectedRestaurantId) {
          const response = await CentralApiClient.getRestaurantsAndMenus();
          const r = (response.data || []).find((x: any) => x.id === session.selectedRestaurantId);
          if (r) return this.displayRestaurantMenu(session, r, session.menuPage || 1);
        }
        return this.displayRestaurantList(session);

      case 'VIEWING_CART':
        if (session.selectedRestaurantId) {
          const response = await CentralApiClient.getRestaurantsAndMenus();
          const r = (response.data || []).find((x: any) => x.id === session.selectedRestaurantId);
          if (r) return this.displayRestaurantMenu(session, r);
        }
        return this.displayRestaurantList(session);

      case 'SELECTING_PACKAGING':
        return this.displayCart(session);

      case 'CONFIRMING_DELIVERY_LOCATION':
        return this.promptPackaging(session);

      case 'SELECTING_DROP_PREFERENCE':
        return this.promptDeliveryLocation(session);

      case 'MANUAL_HOSTEL':
      case 'MANUAL_ROOM':
        return this.promptDeliveryLocation(session);

      case 'PROFILE_VIEW':
        return this.sendMainMenu(session, false);

      default:
        session.step = 'MAIN_MENU';
        sessionManager.saveSession(session);
        return this.sendMainMenu(session, false);
    }
  }


  // ==========================================
  // ONBOARDING FLOW
  // ==========================================

  private static async handleOnboardingName(session: UserSession, text: string): Promise<string> {
    if (text.toLowerCase() !== 'skip') {
      session.studentName = text.trim();
    } else {
      session.studentName = session.studentName || 'Student';
    }

    if (session.channel === 'telegram' && !session.realPhone) {
      session.step = 'ONBOARDING_PHONE';
      sessionManager.saveSession(session);
      await ChannelService.sendMessage(
        session,
        `Nice to meet you, *${session.studentName}*.\n\n` +
          `What is your Nigerian phone number?\n` +
          `_(e.g. 08012345678, used for rider calls upon arrival)_`
      );
      return 'Awaiting Phone Number';
    }

    return this.promptHostelSelection(session);
  }

  private static async handleOnboardingPhone(session: UserSession, text: string): Promise<string> {
    const cleaned = text.replace(/[^0-9+]/g, '');
    if (cleaned.length < 10) {
      await ChannelService.sendMessage(
        session,
        'Please provide a valid Nigerian phone number (e.g. *08012345678* or *+2348012345678*).'
      );
      return 'Invalid Phone Number';
    }

    session.realPhone = cleaned.startsWith('0') ? `+234${cleaned.slice(1)}` : cleaned;
    sessionManager.saveSession(session);
    return this.promptHostelSelection(session);
  }

  private static async promptHostelSelection(session: UserSession): Promise<string> {
    session.step = 'ONBOARDING_HOSTEL';
    sessionManager.saveSession(session);

    let msg = `*Select Your Campus Hostel:*\n\n`;
    CAMPUS_HOSTELS.forEach((h, i) => {
      msg += `${i + 1}. ${h}\n`;
    });
    msg += `\nReply with the number (1-5) or choose below:`;

    const buttons: InteractiveOption[] = CAMPUS_HOSTELS.map((h, i) => ({
      id: String(i + 1),
      title: `${i + 1}. ${h}`,
      description: 'Hostel delivery block',
    }));
    await ChannelService.sendQuickReplyButtons(session, msg, buttons);
    return 'Prompted Hostel Selection';
  }

  private static async handleOnboardingHostel(session: UserSession, text: string): Promise<string> {
    const idx = parseInt(text, 10) - 1;
    if (idx >= 0 && idx < CAMPUS_HOSTELS.length) {
      session.hostel = CAMPUS_HOSTELS[idx];
    } else {
      const match = CAMPUS_HOSTELS.find((h) => h.toLowerCase().includes(text.toLowerCase()));
      session.hostel = match || text;
    }

    session.step = 'ONBOARDING_ROOM';
    sessionManager.saveSession(session);

    await ChannelService.sendMessage(
      session,
      `Selected: *${session.hostel}*\n\nWhat is your Room number? (e.g. *Room 214*, *Room B12*)`
    );
    return 'Awaiting Room Number';
  }

  private static async handleOnboardingRoom(session: UserSession, text: string): Promise<string> {
    session.room = text.startsWith('Room') ? text : `Room ${text.replace(/room/i, '').trim()}`;
    session.isRegistered = true;
    session.step = 'MAIN_MENU';
    sessionManager.saveSession(session);

    try {
      await CentralApiClient.lookupOrRegisterStudent({
        phone: session.realPhone || session.phone,
        fullName: session.studentName,
        hostel: session.hostel,
        room: session.room,
      });
    } catch (err) {
      console.warn('[Profile Sync Warning]:', err);
    }

    await ChannelService.sendMessage(
      session,
      `*Profile Setup Complete*\n\n` +
        `• Name: ${session.studentName}\n` +
        `• Location: ${session.hostel}, ${session.room}\n\n` +
        `You can now order from any campus kitchen.`
    );

    return this.sendMainMenu(session);
  }

  // ==========================================
  // PROFILE MANAGEMENT (/profile)
  // ==========================================

  private static async displayProfile(session: UserSession): Promise<string> {
    session.step = 'PROFILE_VIEW';
    sessionManager.saveSession(session);

    const name = session.studentName || 'Student';
    const phone = session.realPhone || session.phone;
    const hostel = session.hostel || 'Hostel Block C';
    const room = session.room || 'Room 214';

    const msg =
      `*Student Profile*\n\n` +
      `• Name: ${name}\n` +
      `• Phone: ${phone}\n` +
      `• Delivery: ${hostel}, ${room}\n\n` +
      `Select an option below to update your details or return to menu:`;

    const buttons: InteractiveOption[] = [
      { id: 'edit_room', title: 'Change Room/Hostel', description: 'Update delivery room' },
      { id: 'edit_phone', title: 'Update Phone', description: 'Update contact number' },
      { id: 'edit_name', title: 'Change Name', description: 'Update profile name' },
      { id: 'menu', title: 'Main Menu', description: 'Return home' },
    ];

    await ChannelService.sendQuickReplyButtons(session, msg, buttons);
    return 'Profile displayed';
  }

  private static async handleProfileOption(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (lower === 'edit_room' || lower.includes('room') || lower.includes('hostel')) {
      session.step = 'PROFILE_EDIT_HOSTEL';
      sessionManager.saveSession(session);
      return this.promptHostelSelection(session);
    }
    if (lower === 'edit_phone' || lower.includes('phone')) {
      session.step = 'PROFILE_EDIT_PHONE';
      sessionManager.saveSession(session);
      await ChannelService.sendMessage(session, 'Please type your updated Nigerian phone number:');
      return 'Awaiting Phone Update';
    }
    if (lower === 'edit_name' || lower.includes('name')) {
      session.step = 'PROFILE_EDIT_NAME';
      sessionManager.saveSession(session);
      await ChannelService.sendMessage(session, 'Please type your updated Full Name:');
      return 'Awaiting Name Update';
    }
    return this.sendMainMenu(session);
  }

  private static async handleUpdatePhone(session: UserSession, text: string): Promise<string> {
    const cleaned = text.replace(/[^0-9+]/g, '');
    if (cleaned.length < 10) {
      await ChannelService.sendMessage(session, 'Please provide a valid Nigerian phone number.');
      return 'Invalid Phone Number';
    }
    session.realPhone = cleaned.startsWith('0') ? `+234${cleaned.slice(1)}` : cleaned;
    sessionManager.saveSession(session);
    await ChannelService.sendMessage(session, `Phone updated to *${session.realPhone}*.`);
    return this.displayProfile(session);
  }

  private static async handleUpdateHostel(session: UserSession, text: string): Promise<string> {
    const idx = parseInt(text, 10) - 1;
    if (idx >= 0 && idx < CAMPUS_HOSTELS.length) {
      session.hostel = CAMPUS_HOSTELS[idx];
    } else {
      const match = CAMPUS_HOSTELS.find((h) => h.toLowerCase().includes(text.toLowerCase()));
      session.hostel = match || text;
    }
    session.step = 'PROFILE_EDIT_ROOM';
    sessionManager.saveSession(session);
    await ChannelService.sendMessage(session, `Selected: *${session.hostel}*\n\nWhat is your room number?`);
    return 'Awaiting Room Update';
  }

  // ==========================================
  // MAIN MENU
  // ==========================================

  private static async sendMainMenu(session: UserSession, isWelcome = false): Promise<string> {
    session.step = 'MAIN_MENU';
    sessionManager.saveSession(session);

    const cartCount = session.cart.reduce((a, b) => a + b.quantity, 0);

    let header = '';
    if (isWelcome) {
      const greeting = session.studentName ? `Hi ${session.studentName}. ` : '';
      header = `*EU Bite*\nCampus Food Delivery\n\n${greeting}Order meals directly to your hostel room.\n\n`;
    } else {
      header = `*Main Menu*\n\n`;
    }

    const menuMessage =
      `${header}` +
      `1. Browse Campus Restaurants\n` +
      `2. View Tray (${cartCount} item${cartCount === 1 ? '' : 's'})\n` +
      `3. Track Active Order\n` +
      `4. My Profile\n` +
      `5. Student Support & Help\n\n` +
      `Reply 1-5 or choose below:`;

    const buttons: InteractiveOption[] = [
      { id: '1', title: '1. Restaurants', description: 'Browse open kitchens & menus' },
      { id: '2', title: `2. Tray (${cartCount})`, description: 'Review your selected items' },
      { id: '3', title: '3. Track Order', description: 'Live status of your delivery' },
      { id: 'profile', title: '4. My Profile', description: 'Room and contact information' },
      { id: '5', title: '5. Support', description: 'Help and campus assistance' },
    ];

    await ChannelService.sendQuickReplyButtons(session, menuMessage, buttons);
    return 'Main menu sent';
  }


  private static async handleMainMenuSelection(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (text === '1' || lower.includes('browse') || lower.includes('restaurant')) {
      return this.displayRestaurantList(session);
    } else if (text === '2' || lower.includes('cart') || lower.includes('tray')) {
      return this.displayCart(session);
    } else if (text === '3' || lower.includes('track')) {
      return this.handleTrackOrder(session);
    } else if (text === '4' || lower.includes('profile')) {
      return this.displayProfile(session);
    } else if (text === '5' || lower.includes('support') || lower.includes('help')) {
      return this.handleSupport(session);
    } else {
      await ChannelService.sendMessage(
        session,
        'Please reply with *1* for Restaurants, *2* for Cart, *3* to Track, *4* for Profile, or *5* for Support.'
      );
      return 'Invalid option';
    }
  }

  // ==========================================
  // RESTAURANT BROWSING (MULTI-VENDOR FRIENDLY)
  // ==========================================

  private static async displayRestaurantList(session: UserSession): Promise<string> {
    try {
      const response = await CentralApiClient.getRestaurantsAndMenus();
      const restaurants = response.data || [];

      if (restaurants.length === 0) {
        await ChannelService.sendMessage(
          session,
          'No campus restaurants are currently accepting orders. Please check back shortly.'
        );
        return 'No restaurants';
      }

      let msg = `*Campus Restaurants Open Now:*\n\n`;
      restaurants.forEach((r: any, idx: number) => {
        msg += `*${idx + 1}. ${r.name}*\n_${r.description}_\nHours: ${r.opening_time} - ${r.closing_time}\n\n`;
      });
      msg += `Tip: You can mix items from different restaurants in your tray.\nReply with the restaurant number (e.g. 1) to view items:`;

      session.step = 'SELECTING_RESTAURANT';
      sessionManager.saveSession(session);

      const buttons: InteractiveOption[] = restaurants.map((r: any, idx: number) => ({
        id: String(idx + 1),
        title: `${idx + 1}. ${r.name}`,
        description: `Open ${r.opening_time} - ${r.closing_time}`,
      }));
      if (session.cart.length > 0) {
        buttons.push({ id: 'cart', title: `View Tray (${session.cart.reduce((a, b) => a + b.quantity, 0)})`, description: 'Proceed to checkout' });
      }
      buttons.push({ id: 'back', title: 'Back to Menu' });

      await ChannelService.sendQuickReplyButtons(session, msg, buttons);
      return 'Restaurant list sent';
    } catch (err: any) {
      await ChannelService.sendMessage(session, `Failed to load restaurants: ${err.message}`);
      return 'Error loading restaurants';
    }
  }

  private static async handleRestaurantSelection(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (lower === 'back') {
      return this.sendMainMenu(session);
    }
    if (lower === 'cart' || lower.includes('tray')) {
      return this.displayCart(session);
    }

    try {
      const response = await CentralApiClient.getRestaurantsAndMenus();
      const restaurants = response.data || [];
      const choiceIndex = parseInt(text, 10) - 1;

      const selected =
        restaurants[choiceIndex] ||
        restaurants.find((r: any) => r.name.toLowerCase().includes(text.toLowerCase()));

      if (!selected) {
        await ChannelService.sendMessage(
          session,
          '⚠️ Invalid selection. Please reply with the number corresponding to the restaurant (or reply *back*).'
        );
        return 'Invalid restaurant index';
      }

      return this.displayRestaurantMenu(session, selected);
    } catch (err: any) {
      await ChannelService.sendMessage(session, `Could not retrieve restaurant: ${err.message}`);
      return 'Error retrieving restaurant';
    }
  }

  private static async displayRestaurantMenu(session: UserSession, selected: any, page = 1): Promise<string> {
    const ITEMS_PER_PAGE = 5;
    session.selectedRestaurantId = selected.id;
    session.selectedRestaurantName = selected.name;
    session.step = 'BROWSING_ITEMS';

    const items: any[] = selected.items || selected.menu || [];
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    session.menuPage = currentPage;
    sessionManager.saveSession(session);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const pageBadge = totalPages > 1 ? ` (${currentPage}/${totalPages})` : '';
    let msg = `*${selected.name}*${pageBadge}\n\n`;

    pageItems.forEach((item: any, localIdx: number) => {
      const globalIdx = startIndex + localIdx + 1;
      const priceNgn = item.price_ngn ?? (item.price_kobo ? item.price_kobo / 100 : item.price ?? 0);
      msg += `*${globalIdx}. ${item.name}* — ₦${Number(priceNgn).toLocaleString()}\n`;
      if (item.description) {
        msg += `_${item.description}_\n`;
      }
      msg += '\n';
    });

    msg += `Reply with dish number (e.g. *${startIndex + 1}* or *${startIndex + 1} x2*) or select below:`;

    const buttons: InteractiveOption[] = pageItems.map((item: any, localIdx: number) => {
      const globalIdx = startIndex + localIdx + 1;
      const priceNgn = item.price_ngn ?? (item.price_kobo ? item.price_kobo / 100 : item.price ?? 0);
      return {
        id: String(globalIdx),
        title: `${globalIdx}. ${item.name}`.slice(0, 24),
        description: `₦${Number(priceNgn).toLocaleString()}`,
      };
    });

    if (currentPage > 1) {
      buttons.push({ id: `page_${currentPage - 1}`, title: `Page ${currentPage - 1}`, description: 'Previous dishes' });
    }
    if (currentPage < totalPages) {
      buttons.push({ id: `page_${currentPage + 1}`, title: `Page ${currentPage + 1}`, description: 'Next dishes' });
    }

    buttons.push({ id: 'menu_help', title: 'How to Order', description: 'Ordering instructions' });
    const cartCount = session.cart.reduce((a, b) => a + b.quantity, 0);
    buttons.push({ id: 'cart', title: `Tray (${cartCount})`, description: 'View current tray' });
    buttons.push({ id: 'back', title: 'Other Restaurants', description: 'Campus vendor list' });

    await ChannelService.sendInteractiveList(session, msg, 'Select Dish', buttons, selected.name);
    return 'Menu displayed';
  }

  // ==========================================
  // MENU ORDERING INSTRUCTIONS (SEPARATE INFO PAGE)
  // ==========================================

  private static async displayMenuInstructions(session: UserSession): Promise<string> {
    session.step = 'VIEWING_MENU_HELP';
    sessionManager.saveSession(session);

    const msg =
      `*How to Order on EU Bite*\n\n` +
      `1. Selecting Dishes:\n` +
      `• Tap any dish or reply with the item number (e.g. *1*).\n` +
      `• For multiple portions, add *x [quantity]* (e.g. *1 x2* or *2 portions of 1*).\n` +
      `• You can also type dish names directly.\n\n` +
      `2. Multi-Vendor Freedom:\n` +
      `• Mix items from different campus spots into one tray.\n\n` +
      `3. Tray Management:\n` +
      `• Type *cart* anytime to view your tray, adjust portions, add cooking notes, or checkout.\n\n` +
      `4. Quick PIN:\n` +
      `• Type */pin* anytime to view your secret 4-digit Delivery PIN.\n\n` +
      `Choose an option below:`;

    const cartCount = session.cart.reduce((a, b) => a + b.quantity, 0);
    const buttons: InteractiveOption[] = [
      { id: 'back_to_menu', title: 'Back to Dishes', description: 'Return to current restaurant menu' },
      { id: 'cart', title: `Tray (${cartCount})`, description: 'Review your selected items' },
      { id: 'back_to_vendors', title: 'Other Restaurants', description: 'Browse all open kitchens' },
    ];

    await ChannelService.sendQuickReplyButtons(session, msg, buttons);
    return 'Menu instructions displayed';
  }

  private static async handleMenuHelpInput(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();

    if (lower === 'cart' || lower.includes('tray')) {
      return this.displayCart(session);
    }

    if (lower === 'back_to_vendors' || lower === 'other restaurants') {
      return this.displayRestaurantList(session);
    }

    const response = await CentralApiClient.getRestaurantsAndMenus();
    const r = (response.data || []).find((x: any) => x.id === session.selectedRestaurantId) || (response.data || [])[0];

    if (r) {
      if (
        lower === 'back_to_menu' ||
        lower === 'back' ||
        lower === '0' ||
        lower === 'dishes' ||
        lower === 'menu' ||
        lower === 'return'
      ) {
        return this.displayRestaurantMenu(session, r, session.menuPage || 1);
      }

      session.step = 'BROWSING_ITEMS';
      sessionManager.saveSession(session);
      return this.handleItemSelection(session, text);
    }

    return this.displayRestaurantList(session);
  }

  // ==========================================
  // ITEM SELECTION & POST-ADD ACTION CARD
  // ==========================================

  private static async handleItemSelection(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();

    if (lower === 'cart' || lower === 'view cart') {
      return this.displayCart(session);
    }
    if (lower === 'checkout') {
      return this.promptPackaging(session);
    }
    if (lower === 'back' || lower === '0' || lower === 'other restaurants') {
      return this.displayRestaurantList(session);
    }

    // Direct inline button triggers from post-add card
    if (lower === 'plus_1' || lower === 'add_another') {
      if (session.lastAddedItemId) {
        return this.modifyItemQuantityById(session, session.lastAddedItemId, 1);
      }
    }
    if (lower === 'minus_1' || lower === 'remove_one') {
      if (session.lastAddedItemId) {
        return this.modifyItemQuantityById(session, session.lastAddedItemId, -1);
      }
    }
    if (lower === 'add_more_food' || lower === 'browse_more') {
      const response = await CentralApiClient.getRestaurantsAndMenus();
      const r = (response.data || []).find((x: any) => x.id === session.selectedRestaurantId);
      if (r) return this.displayRestaurantMenu(session, r, session.menuPage || 1);
      return this.displayRestaurantList(session);
    }

    // Instructions Page Trigger
    if (
      lower === 'menu_help' ||
      lower === 'info' ||
      lower === 'instructions' ||
      lower === 'how to order' ||
      lower.includes('ℹ') ||
      lower === 'order guide' ||
      lower === 'guide' ||
      lower === 'menu help'
    ) {
      return this.displayMenuInstructions(session);
    }

    // Pagination navigation triggers
    if (
      lower.startsWith('page_') ||
      lower.startsWith('page ') ||
      /^p\d+$/.test(lower) ||
      lower === 'next' ||
      lower === 'next_page' ||
      lower === 'next page' ||
      lower === 'prev' ||
      lower === 'prev_page' ||
      lower === 'previous' ||
      lower === 'previous page'
    ) {
      const response = await CentralApiClient.getRestaurantsAndMenus();
      const r = (response.data || []).find((x: any) => x.id === session.selectedRestaurantId) || (response.data || [])[0];
      if (r) {
        let targetPage = session.menuPage || 1;
        if (lower.startsWith('page_') || lower.startsWith('page ')) {
          targetPage = parseInt(lower.replace(/page[_ ]/, ''), 10) || 1;
        } else if (/^p\d+$/.test(lower)) {
          targetPage = parseInt(lower.replace('p', ''), 10) || 1;
        } else if (lower === 'next' || lower === 'next_page' || lower === 'next page') {
          targetPage += 1;
        } else if (lower === 'prev' || lower === 'prev_page' || lower === 'previous' || lower === 'previous page') {
          targetPage = Math.max(1, targetPage - 1);
        }
        return this.displayRestaurantMenu(session, r, targetPage);
      }
    }

    // Check for item removal: e.g. "remove 1", "-1"
    if (lower.startsWith('remove') || lower.startsWith('delete') || lower.startsWith('rm') || lower.startsWith('minus') || lower.startsWith('-')) {
      return this.handleRemoveItem(session, lower);
    }

    try {
      const response = await CentralApiClient.getRestaurantsAndMenus();
      const restaurant = (response.data || []).find((r: any) => r.id === session.selectedRestaurantId) || (response.data || [])[0];
      if (!restaurant) {
        return this.sendMainMenu(session);
      }

      const items: any[] = restaurant.items || restaurant.menu || [];

      // 1. Parse index & quantity strictly
      let itemIdx = -1;
      let qty = 1;

      if (/^\s*\d+\s*[x*]\s*\d+\s*$/i.test(lower)) {
        const parts = lower.split(/x|\*/i);
        itemIdx = parseInt(parts[0].trim(), 10) - 1;
        qty = parseInt(parts[1].trim(), 10) || 1;
      } else if (/^\s*(\d+)\s*(?:portions?|plates?|packs?)\s*(?:of)?\s*(\d+)\s*$/i.test(lower)) {
        const m = lower.match(/^\s*(\d+)\s*(?:portions?|plates?|packs?)\s*(?:of)?\s*(\d+)\s*$/i);
        if (m) {
          qty = parseInt(m[1], 10) || 1;
          itemIdx = parseInt(m[2], 10) - 1;
        }
      } else if (/^\s*(\d+)\s*$/.test(lower)) {
        itemIdx = parseInt(lower, 10) - 1;
      } else if (/^\s*(\d+)\s*(?:portions?|plates?|packs?)\s*$/i.test(lower)) {
        const m = lower.match(/^\s*(\d+)\s*(?:portions?|plates?|packs?)\s*$/i);
        if (m) {
          itemIdx = parseInt(m[1], 10) - 1;
        }
      }

      // 2. If no numeric index found, try matching dish name
      let item: any = null;
      if (itemIdx >= 0 && itemIdx < items.length) {
        item = items[itemIdx];
      } else {
        item = items.find((i: any) => lower === i.name.toLowerCase() || lower.includes(i.name.toLowerCase()));
      }

      if (!item) {
        await ChannelService.sendMessage(
          session,
          `Item "${text}" not recognized. Reply with dish number (1-${items.length}) or the dish name (or reply *cart* / *back*).`
        );
        return 'Item not found';
      }

      const priceKobo = item.price_kobo ?? (item.price_ngn ? item.price_ngn * 100 : (item.price ? item.price * 100 : 0));

      const existing = session.cart.find((c) => c.itemId === item.id);
      if (existing) {
        existing.quantity += qty;
      } else {
        session.cart.push({
          itemId: item.id,
          name: item.name,
          priceKobo: priceKobo,
          quantity: qty,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        });
      }

      session.lastAddedItemId = item.id;
      session.step = 'ITEM_ADDED_PROMPT';
      sessionManager.saveSession(session);

      return this.sendItemAddedPrompt(session, item, qty);
    } catch (err: any) {
      await ChannelService.sendMessage(session, `Error adding item: ${err.message}`);
      return 'Error adding item';
    }
  }

  /**
   * Post-Add Action Card with 1-tap "Add Another", "Remove", "Browse More", "Tray", "Checkout"
   */
  private static async sendItemAddedPrompt(session: UserSession, item: any, addedQty: number): Promise<string> {
    const cartCount = session.cart.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalNgn = session.cart.reduce((sum, i) => sum + i.priceKobo * i.quantity, 0) / 100;

    const feedback =
      `Added *${item.name}* (x${addedQty}) to your tray.\n\n` +
      `• Vendor: ${session.selectedRestaurantName || 'Campus Spot'}\n` +
      `• Tray Subtotal: ₦${subtotalNgn.toLocaleString()} (${cartCount} item${cartCount === 1 ? '' : 's'})\n\n` +
      `Choose next action:`;

    const buttons: InteractiveOption[] = [
      { id: 'plus_1', title: '+ Add Another', description: `Add 1 more ${item.name}`.slice(0, 72) },
      { id: 'minus_1', title: '- Remove One', description: `Reduce ${item.name}`.slice(0, 72) },
      { id: 'add_more_food', title: 'Add Dishes', description: 'Browse more menu items' },
      { id: 'cart', title: `Tray (₦${subtotalNgn.toLocaleString()})`, description: 'Review your order' },
      { id: 'checkout', title: 'Checkout', description: 'Proceed to payment' },
    ];

    await ChannelService.sendQuickReplyButtons(session, feedback, buttons);
    return 'Item added to cart';
  }

  private static async modifyItemQuantityById(session: UserSession, itemId: string, delta: number): Promise<string> {
    const item = session.cart.find((c) => c.itemId === itemId);
    if (!item) {
      return this.displayCart(session);
    }

    item.quantity += delta;
    if (item.quantity <= 0) {
      session.cart = session.cart.filter((c) => c.itemId !== itemId);
      await ChannelService.sendMessage(session, `Removed *${item.name}* from your tray.`);
    } else {
      await ChannelService.sendMessage(
        session,
        `Updated *${item.name}* quantity to *${item.quantity}*.`
      );
    }

    sessionManager.saveSession(session);
    if (session.cart.length === 0) {
      return this.displayCart(session);
    }
    return this.sendItemAddedPrompt(session, item, 0);
  }

  // ==========================================
  // DEDICATED CART DISPLAY & ACTIONS (VIEWING_CART)
  // ==========================================

  private static async displayCart(session: UserSession): Promise<string> {
    if (session.cart.length === 0) {
      const emptyMsg =
        '*Your tray is currently empty.*\n\n' +
        'Browse campus spots to mix food from any restaurant.';
      const buttons: InteractiveOption[] = [
        { id: '1', title: 'Browse Restaurants', description: 'Open campus vendors' },
        { id: 'menu', title: 'Main Menu', description: 'Return home' },
      ];
      await ChannelService.sendQuickReplyButtons(session, emptyMsg, buttons);
      session.step = 'MAIN_MENU';
      sessionManager.saveSession(session);
      return 'Cart is empty';
    }

    session.step = 'VIEWING_CART';
    sessionManager.saveSession(session);

    const foodSubtotal = session.cart.reduce((sum, i) => sum + i.priceKobo * i.quantity, 0) / 100;

    // Group items by restaurant
    const grouped = new Map<string, CartItem[]>();
    for (const item of session.cart) {
      const restName = item.restaurantName || 'Campus Food';
      if (!grouped.has(restName)) grouped.set(restName, []);
      grouped.get(restName)!.push(item);
    }

    let msg = `*Your Tray* (${grouped.size} vendor${grouped.size === 1 ? '' : 's'}):\n\n`;

    let globalIdx = 1;
    for (const [restName, items] of grouped.entries()) {
      msg += `*${restName}*\n`;
      for (const i of items) {
        const lineTotal = (i.priceKobo * i.quantity) / 100;
        const noteStr = i.note ? `\n   ↳ Note: _"${i.note}"_` : '';
        msg += `${globalIdx}. ${i.name} x${i.quantity} — ₦${lineTotal.toLocaleString()}${noteStr}\n`;
        globalIdx++;
      }
      msg += '\n';
    }

    msg += `Food Subtotal: *₦${foodSubtotal.toLocaleString()}*\n`;

    const buttons: InteractiveOption[] = [];

    if (foodSubtotal < 1500) {
      const needed = 1500 - foodSubtotal;
      msg +=
        `\nNotice: Minimum food order is *₦1,500* before fees.\n` +
        `Add items worth at least *₦${needed.toLocaleString()}* more.\n`;

      buttons.push({ id: 'add_more', title: 'Add More Food', description: 'Browse open menus' });
      buttons.push({ id: 'clear_cart', title: 'Clear Tray', description: 'Empty your tray' });
      buttons.push({ id: 'menu', title: 'Main Menu', description: 'Return home' });
    } else {
      msg +=
        `\n• Tap options below or reply *remove #* to delete\n` +
        `• Type *note #* to add cooking notes\n` +
        `• Tap Checkout when ready`;

      // Quick actions for items in cart
      session.cart.forEach((i, idx) => {
        buttons.push({ id: `plus_${idx + 1}`, title: `+1 ${i.name}`.slice(0, 24), description: `Increase ${i.name}`.slice(0, 72) });
        buttons.push({ id: `minus_${idx + 1}`, title: `-1 ${i.name}`.slice(0, 24), description: `Decrease ${i.name}`.slice(0, 72) });
      });

      buttons.push({ id: 'checkout', title: 'Proceed to Checkout', description: 'Packaging and delivery details' });
      buttons.push({ id: 'add_more', title: 'Add More Food', description: 'Continue shopping' });
      buttons.push({ id: 'add_note', title: 'Add Meal Note', description: 'Special instructions' });
      buttons.push({ id: 'clear_cart', title: 'Clear Tray', description: 'Empty your tray' });
    }

    await ChannelService.sendQuickReplyButtons(session, msg, buttons);
    return 'Cart displayed';
  }

  private static async handleViewingCartInput(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();

    if (lower === 'checkout') {
      return this.promptPackaging(session);
    }
    if (lower === 'add_more' || lower.includes('add more') || lower === 'back') {
      return this.displayRestaurantList(session);
    }
    if (lower === 'clear_cart' || lower === 'clear cart') {
      return this.promptClearCartConfirmation(session);
    }
    if (lower === 'add_note' || lower.startsWith('note')) {
      return this.promptItemNoteSelection(session, lower);
    }

    // Handle button clicks like plus_1, minus_1
    if (lower.startsWith('plus_')) {
      const idx = parseInt(lower.replace('plus_', ''), 10) - 1;
      if (idx >= 0 && idx < session.cart.length) {
        session.cart[idx].quantity += 1;
        sessionManager.saveSession(session);
        return this.displayCart(session);
      }
    }
    if (lower.startsWith('minus_')) {
      const idx = parseInt(lower.replace('minus_', ''), 10) - 1;
      if (idx >= 0 && idx < session.cart.length) {
        if (session.cart[idx].quantity > 1) {
          session.cart[idx].quantity -= 1;
        } else {
          session.cart.splice(idx, 1);
        }
        sessionManager.saveSession(session);
        return this.displayCart(session);
      }
    }

    // Handle text removal
    if (lower.startsWith('remove') || lower.startsWith('delete') || lower.startsWith('rm') || lower.startsWith('-')) {
      return this.handleRemoveItem(session, lower);
    }

    // Direct number entry while in cart: toggle or ask
    const num = parseInt(lower, 10);
    if (!isNaN(num) && num >= 1 && num <= session.cart.length) {
      const item = session.cart[num - 1];
      const prompt =
        `Editing *${item.name}* (currently x${item.quantity}):\n` +
        `• Reply *+* to add 1\n` +
        `• Reply *-* to remove 1\n` +
        `• Reply *delete* to remove from tray`;
      const buttons: InteractiveOption[] = [
        { id: `plus_${num}`, title: `Add 1 (+1)` },
        { id: `minus_${num}`, title: `Less 1 (-1)` },
        { id: `rm_${num}`, title: `Delete Item` },
        { id: 'cart', title: `Back to Tray` },
      ];
      await ChannelService.sendQuickReplyButtons(session, prompt, buttons);
      return 'Editing cart item';
    }

    return this.displayCart(session);
  }

  // ==========================================
  // MEAL NOTES & SPECIAL INSTRUCTIONS
  // ==========================================

  private static async promptItemNoteSelection(session: UserSession, text: string): Promise<string> {
    if (session.cart.length === 0) return this.displayCart(session);

    session.step = 'ADD_ITEM_NOTE';
    sessionManager.saveSession(session);

    const match = text.match(/\d+/);
    if (match) {
      const idx = parseInt(match[0], 10) - 1;
      if (idx >= 0 && idx < session.cart.length) {
        session.activeNoteItemId = session.cart[idx].itemId;
        sessionManager.saveSession(session);
        await ChannelService.sendMessage(
          session,
          `What special instruction would you like to add for *${session.cart[idx].name}*?\n` +
            `_(e.g. "No pepper", "Pack soup separately", "Extra sauce")_`
        );
        return 'Awaiting item note text';
      }
    }

    // Default to first item
    session.activeNoteItemId = session.cart[0].itemId;
    sessionManager.saveSession(session);
    await ChannelService.sendMessage(
      session,
      `What special instruction would you like to add for *${session.cart[0].name}*?\n` +
        `_(e.g. "No pepper", "Extra sauce", "Pack soup separately")_`
    );
    return 'Awaiting item note text';
  }

  private static async handleSaveItemNote(session: UserSession, text: string): Promise<string> {
    if (text.toLowerCase() === 'cancel' || text.toLowerCase() === 'skip') {
      session.activeNoteItemId = undefined;
      return this.displayCart(session);
    }

    const item = session.cart.find((c) => c.itemId === session.activeNoteItemId) || session.cart[0];
    if (item) {
      item.note = text.trim();
      sessionManager.saveSession(session);
      await ChannelService.sendMessage(session, `Added note to *${item.name}*: "${item.note}"`);
    }

    session.activeNoteItemId = undefined;
    return this.displayCart(session);
  }

  // ==========================================
  // CONFIRM CLEAR CART MODAL
  // ==========================================

  private static async promptClearCartConfirmation(session: UserSession): Promise<string> {
    if (session.cart.length === 0) {
      await ChannelService.sendMessage(session, 'Your tray is already empty.');
      return 'Cart empty';
    }

    session.step = 'CONFIRM_CLEAR_CART';
    sessionManager.saveSession(session);

    const prompt =
      `*Empty Entire Tray?*\n\n` +
      `This will remove all ${session.cart.length} item(s) from your tray.\n\n` +
      `Are you sure you want to proceed?`;

    const buttons: InteractiveOption[] = [
      { id: 'yes_clear', title: 'Yes, Clear Tray' },
      { id: 'no_keep', title: 'No, Keep Tray' },
    ];

    await ChannelService.sendQuickReplyButtons(session, prompt, buttons);
    return 'Prompted clear cart confirmation';
  }

  private static async handleConfirmClearCart(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (lower === 'yes_clear' || lower === 'yes' || lower.includes('clear')) {
      session.cart = [];
      session.selectedRestaurantId = undefined;
      session.selectedRestaurantName = undefined;
      sessionManager.saveSession(session);
      await ChannelService.sendMessage(session, 'Your tray has been cleared.');
      return this.sendMainMenu(session);
    } else {
      await ChannelService.sendMessage(session, 'Tray kept intact.');
      return this.displayCart(session);
    }
  }

  private static async handleRemoveItem(session: UserSession, text: string): Promise<string> {
    if (session.cart.length === 0) {
      await ChannelService.sendMessage(session, 'Your tray is already empty.');
      return 'Cart empty';
    }

    const numMatch = text.match(/\d+/);
    if (!numMatch) {
      await ChannelService.sendMessage(
        session,
        'Please specify which item to remove (e.g. *remove 1* or *remove 2*).'
      );
      return 'Remove syntax error';
    }

    const idx = parseInt(numMatch[0], 10) - 1;
    if (idx < 0 || idx >= session.cart.length) {
      await ChannelService.sendMessage(
        session,
        `Item #${numMatch[0]} not in tray. Reply *cart* to view current items.`
      );
      return 'Invalid remove index';
    }

    const removed = session.cart[idx];
    if (removed.quantity > 1) {
      removed.quantity -= 1;
      await ChannelService.sendMessage(session, `Reduced *${removed.name}* quantity to ${removed.quantity}.`);
    } else {
      session.cart.splice(idx, 1);
      await ChannelService.sendMessage(session, `Removed *${removed.name}* from your tray.`);
    }

    sessionManager.saveSession(session);
    return this.displayCart(session);
  }

  // ==========================================
  // PACKAGING SELECTION (QUANTITY-AWARE)
  // ==========================================

  private static async promptPackaging(session: UserSession): Promise<string> {
    const foodSubtotal = session.cart.reduce((sum, i) => sum + i.priceKobo * i.quantity, 0) / 100;
    if (foodSubtotal < 1500) {
      const needed = 1500 - foodSubtotal;
      await ChannelService.sendMessage(
        session,
        `Your food subtotal is ₦${foodSubtotal.toLocaleString()}.\nMinimum order is *₦1,500*.\nPlease add items worth *₦${needed.toLocaleString()}* more.`
      );
      return this.displayRestaurantList(session);
    }

    session.step = 'SELECTING_PACKAGING';
    sessionManager.saveSession(session);

    const totalContainers = session.cart.reduce((sum, i) => sum + i.quantity, 0);
    const ecoFee = 250 * totalContainers;
    const stdFee = 500 * totalContainers;

    const packagingMsg =
      `*Food Packaging* (${totalContainers} container${totalContainers === 1 ? '' : 's'}):\n\n` +
      `1. *Reusable Eco-Pack* (+₦${ecoFee.toLocaleString()})\n` +
      `Sanitized, microwave-safe container with ₦${ecoFee.toLocaleString()} refundable deposit upon return at hostel drop boxes.\n\n` +
      `2. *Standard Pack* (+₦${stdFee.toLocaleString()})\n` +
      `Single-use takeaway container.\n\n` +
      `Reply 1 or 2, or choose below:`;

    const buttons: InteractiveOption[] = [
      { id: '1', title: `1. Reusable Eco-Pack (+₦${ecoFee.toLocaleString()})`, description: 'Eco-friendly refundable pack' },
      { id: '2', title: `2. Standard Pack (+₦${stdFee.toLocaleString()})`, description: 'Single-use takeaway' },
      { id: 'back', title: 'Back to Tray', description: 'Edit your items' },
    ];

    await ChannelService.sendQuickReplyButtons(session, packagingMsg, buttons);
    return 'Packaging prompt sent';
  }

  private static async handlePackagingSelection(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (lower === 'back') {
      return this.displayCart(session);
    }

    if (text === '1' || lower.includes('reusable') || lower.includes('eco')) {
      session.selectedPackaging = 'reusable';
    } else if (text === '2' || lower.includes('standard') || lower.includes('cafeteria') || lower.includes('school')) {
      session.selectedPackaging = 'school';
    } else {
      await ChannelService.sendMessage(
        session,
        'Please reply *1* for Reusable Eco-Pack or *2* for Standard Pack.'
      );
      return 'Invalid packaging selection';
    }

    return this.promptDeliveryLocation(session);
  }

  // ==========================================
  // DELIVERY LOCATION & DROP-OFF PREFERENCE
  // ==========================================

  private static async promptDeliveryLocation(session: UserSession): Promise<string> {
    session.step = 'CONFIRMING_DELIVERY_LOCATION';
    sessionManager.saveSession(session);

    const defaultAddress = session.hostel ? `${session.hostel}, ${session.room}` : 'Hostel Block C, Room 214';

    const promptMsg =
      `*Confirm Delivery Location:*\n\n` +
      `Drop-off: *${defaultAddress}*\n\n` +
      `• Reply *YES* to deliver here\n` +
      `• Reply *CHANGE* to update hostel block or room\n` +
      `• Reply *BACK* to return to packaging`;

    const buttons: InteractiveOption[] = [
      { id: 'yes', title: 'Confirm Location', description: defaultAddress },
      { id: 'change', title: 'Change Address', description: 'Update block or room' },
      { id: 'back', title: 'Back', description: 'Return to packaging' },
    ];

    await ChannelService.sendQuickReplyButtons(session, promptMsg, buttons);
    return 'Location prompt sent';
  }

  private static async handleDeliveryLocationSelection(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (lower === 'back') {
      return this.promptPackaging(session);
    }

    if (lower === 'yes' || lower === 'y' || lower.includes('confirm')) {
      return this.promptDropPreference(session);
    }

    if (lower === 'change' || lower.includes('edit')) {
      session.step = 'MANUAL_HOSTEL';
      sessionManager.saveSession(session);

      let msg = `*Select Your Delivery Hostel:*\n\n`;
      CAMPUS_HOSTELS.forEach((h, i) => {
        msg += `${i + 1}. ${h}\n`;
      });
      msg += `\nReply with the number (1-5) or type your hostel name:`;

      const buttons: InteractiveOption[] = CAMPUS_HOSTELS.map((h, i) => ({
        id: String(i + 1),
        title: `${i + 1}. ${h}`,
        description: 'Hostel delivery block',
      }));
      buttons.push({ id: 'back', title: 'Back', description: 'Cancel change' });

      await ChannelService.sendQuickReplyButtons(session, msg, buttons);
      return 'Prompted Manual Hostel';
    }

    if (text.includes('Room') || text.includes('Block') || text.includes(',')) {
      const parts = text.split(',');
      session.hostel = parts[0]?.trim() || text;
      session.room = parts[1]?.trim() || 'Room 101';
      return this.promptDropPreference(session);
    }

    await ChannelService.sendMessage(
      session,
      'Please reply *YES* to confirm your saved address, or reply *CHANGE* to update it.'
    );
    return 'Invalid location response';
  }

  private static async promptDropPreference(session: UserSession): Promise<string> {
    session.step = 'SELECTING_DROP_PREFERENCE';
    sessionManager.saveSession(session);

    const msg =
      `*Hostel Drop-Off Instruction:*\n\n` +
      `Where would you like to receive your meal?\n\n` +
      `1. *Hostel Porter's Lodge / Gate* (Fastest)\n` +
      `2. *Deliver to Room Door* (${session.room || 'Room'})\n\n` +
      `Reply 1 or 2, or choose below:`;

    const buttons: InteractiveOption[] = [
      { id: 'gate', title: "Porter's Lodge / Gate", description: 'Meet rider at gate' },
      { id: 'room', title: 'Room Door', description: 'Delivered directly to room' },
      { id: 'back', title: 'Back', description: 'Change location' },
    ];

    await ChannelService.sendQuickReplyButtons(session, msg, buttons);
    return 'Prompted drop preference';
  }

  private static async handleDropPreferenceSelection(session: UserSession, text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (lower === 'back') return this.promptDeliveryLocation(session);

    if (lower === 'gate' || text === '1' || lower.includes('porter')) {
      session.dropPreference = 'gate';
    } else {
      session.dropPreference = 'room';
    }

    sessionManager.saveSession(session);
    return this.executeCheckout(session);
  }

  private static async handleManualHostel(session: UserSession, text: string): Promise<string> {
    if (text.toLowerCase() === 'back') {
      return this.promptDeliveryLocation(session);
    }

    const idx = parseInt(text, 10) - 1;
    if (idx >= 0 && idx < CAMPUS_HOSTELS.length) {
      session.hostel = CAMPUS_HOSTELS[idx];
    } else {
      session.hostel = text;
    }

    session.step = 'MANUAL_ROOM';
    sessionManager.saveSession(session);

    await ChannelService.sendMessage(
      session,
      `Selected: *${session.hostel}*\n\nWhat is your room number? (e.g. *Room 214*)`
    );
    return 'Awaiting Manual Room';
  }

  private static async handleManualRoom(session: UserSession, text: string): Promise<string> {
    if (text.toLowerCase() === 'back') {
      return this.promptDeliveryLocation(session);
    }

    session.room = text.startsWith('Room') ? text : `Room ${text.replace(/room/i, '').trim()}`;
    return this.promptDropPreference(session);
  }

  // ==========================================
  // CHECKOUT & MODIFIABLE ORDERS
  // ==========================================

  private static async executeCheckout(session: UserSession): Promise<string> {
    try {
      const totalContainers = session.cart.reduce((sum, i) => sum + i.quantity, 0);

      const checkoutPayload = {
        phone: session.realPhone || session.phone,
        restaurant_id: session.selectedRestaurantId || session.cart[0]?.restaurantId || 'rest-campus-bites',
        items: session.cart.map((c) => ({ item_id: c.itemId, quantity: c.quantity })),
        packaging_type: session.selectedPackaging || 'reusable',
        packaging_count: totalContainers,
        hostel: session.hostel || 'Hostel Block C',
        room: session.room || 'Room 214',
      };

      const result = await CentralApiClient.createCheckout(checkoutPayload);
      const data = result.data;

      // Group vendor names
      const vendorNames = Array.from(new Set(session.cart.map((c) => c.restaurantName || data.restaurant_name))).join(' & ');

      // Store pending order in session (cart is archived into pendingOrder for modifications)
      session.pendingOrder = {
        orderNumber: data.order_number,
        restaurantName: vendorNames,
        totalNgn: data.total_amount_ngn || data.total_amount || 0,
        checkoutUrl: data.payment_url || data.checkout_url,
        deliveryPin: data.delivery_pin,
        items: [...session.cart],
        hostel: session.hostel || 'Hostel Block C',
        room: session.room || 'Room 214',
        dropPreference: session.dropPreference === 'gate' ? "Porter's Lodge / Gate" : 'Room Door',
        packagingCount: totalContainers,
        createdAt: Date.now(),
      };

      session.cart = [];
      session.step = 'AWAITING_PAYMENT';
      sessionManager.saveSession(session);

      const foodSubtotal = data.food_subtotal_ngn || data.subtotal_amount || 0;
      const packagingFee = data.packaging_fee_ngn || data.packaging_fee || 0;
      const deliveryFee = data.delivery_fee_ngn || data.delivery_fee || 320;
      const serviceFee = data.service_fee_ngn || data.service_fee || 100;
      const totalAmount = data.total_amount_ngn || data.total_amount || 0;

      const summary =
        `*Order Created (#${data.order_number})*\n\n` +
        `• Kitchen: ${vendorNames}\n` +
        `• Drop-off: ${session.hostel || 'Hostel Block C'}, ${session.room || 'Room 214'}\n` +
        `• Handoff: ${session.pendingOrder.dropPreference}\n\n` +
        `Food Subtotal: ₦${foodSubtotal.toLocaleString()}\n` +
        `Packaging (${totalContainers} packs): ₦${packagingFee.toLocaleString()}\n` +
        `Delivery: ₦${deliveryFee.toLocaleString()}\n` +
        `Service Fee: ₦${serviceFee.toLocaleString()}\n` +
        `--------------------\n` +
        `Total: *₦${totalAmount.toLocaleString()}*\n\n` +
        `Accepted: Bank Transfer, USSD, Debit Card\n` +
        `Payment Link:\n${data.payment_url || data.checkout_url}\n\n` +
        `Note: Your 4-digit Delivery PIN will be unlocked and sent to you automatically once payment is confirmed. Type */pin* anytime to view it.`;

      const buttons: InteractiveOption[] = [
        { id: 'modify', title: 'Modify Tray', description: 'Adjust items before paying' },
        { id: 'track', title: 'Track Payment', description: 'Check payment status' },
        { id: 'menu', title: 'Main Menu', description: 'Return home' },
      ];

      await ChannelService.sendQuickReplyButtons(session, summary, buttons);
      return 'Checkout created';
    } catch (err: any) {
      await ChannelService.sendMessage(session, `Checkout error: ${err.message}`);
      return 'Checkout error';
    }
  }

  /**
   * Restores items from pendingOrder back into active cart so student can edit
   */
  private static async restoreCartForModification(session: UserSession): Promise<string> {
    if (session.pendingOrder && session.pendingOrder.items.length > 0) {
      session.cart = [...session.pendingOrder.items];
      session.pendingOrder = undefined;
      session.step = 'VIEWING_CART';
      sessionManager.saveSession(session);
      await ChannelService.sendMessage(session, 'Order reopened. You can now adjust portions, remove items, or add more dishes.');
      return this.displayCart(session);
    }
    return this.displayCart(session);
  }

  // ==========================================
  // PROACTIVE PAYMENT NOTIFICATION HOOK
  // ==========================================

  static async notifyPaymentConfirmed(details: {
    orderNumber: string;
    phone: string;
    deliveryPin: string;
    restaurantName: string;
    totalNgn: number;
  }): Promise<boolean> {
    const session = sessionManager.findSessionByPhone(details.phone) || sessionManager.getSession(details.phone);

    session.cart = [];
    session.pendingOrder = undefined;
    session.step = 'MAIN_MENU';
    sessionManager.saveSession(session);

    const notification =
      `*Payment Confirmed (Order #${details.orderNumber})*\n\n` +
      `Kitchen: *${details.restaurantName}* has begun preparing your meal.\n\n` +
      `*Delivery PIN:* *${details.deliveryPin}*\n` +
      `Give this 4-digit PIN to your rider upon arrival.\n\n` +
      `Estimated delivery: 15 minutes.\n` +
      `Reply */track* for live updates.`;

    const buttons: InteractiveOption[] = [
      { id: 'track', title: 'Track Rider', description: 'Live delivery status' },
      { id: 'help', title: 'Support', description: 'Help with this order' },
    ];

    return ChannelService.sendQuickReplyButtons(session, notification, buttons);
  }

  // ==========================================
  // QUICK PIN LOOKUP (/pin)
  // ==========================================

  private static async handleQuickPinLookup(session: UserSession): Promise<string> {
    try {
      const searchPhone = session.realPhone || session.phone;
      const res = await CentralApiClient.getActiveOrder(searchPhone);
      const order = res.data;

      if (order && order.delivery_pin) {
        if (order.status === 'awaiting_payment' || order.status === 'pending_payment') {
          await ChannelService.sendMessage(
            session,
            `*Delivery PIN:* Locked\n\nYour 4-digit PIN will be unlocked immediately once payment is confirmed.`
          );
          return 'PIN locked';
        }

        await ChannelService.sendMessage(
          session,
          `*Delivery PIN:* *${order.delivery_pin}*\n\nProvide this 4-digit PIN to your rider when receiving order #${order.order_number}.`
        );
        return 'PIN retrieved';
      }

      if (session.pendingOrder?.deliveryPin) {
        await ChannelService.sendMessage(
          session,
          `*Delivery PIN:* Locked\n\nYour order #${session.pendingOrder.orderNumber} is awaiting payment. Once paid, your PIN is unlocked.`
        );
        return 'PIN locked';
      }

      await ChannelService.sendMessage(
        session,
        `No active orders found. Your 4-digit Delivery PIN appears automatically when you place an order.`
      );
      return 'No active PIN';
    } catch {
      await ChannelService.sendMessage(
        session,
        `No active orders found. Your 4-digit Delivery PIN appears automatically when you place an order.`
      );
      return 'No active PIN';
    }
  }

  // ==========================================
  // TRACKING & POST-DELIVERY ACTIONS
  // ==========================================

  private static async handleTrackOrder(session: UserSession): Promise<string> {
    try {
      const searchPhone = session.realPhone || session.phone;
      const res = await CentralApiClient.getActiveOrder(searchPhone);
      const order = res.data;

      if (!order) {
        if (session.pendingOrder) {
          const po = session.pendingOrder;
          const msg =
            `*Order Tracking (#${po.orderNumber})*\n\n` +
            `Status: *Awaiting Payment*\n` +
            `Kitchen: *${po.restaurantName}*\n` +
            `Total: *₦${po.totalNgn.toLocaleString()}*\n\n` +
            `Payment link:\n${po.checkoutUrl}\n\n` +
            `Your delivery PIN will unlock automatically once paid.`;

          const buttons: InteractiveOption[] = [
            { id: 'modify', title: 'Modify Tray', description: 'Adjust order items' },
            { id: 'track', title: 'Refresh Status', description: 'Check payment update' },
            { id: 'menu', title: 'Main Menu', description: 'Return home' },
          ];
          await ChannelService.sendQuickReplyButtons(session, msg, buttons);
          return 'Pending payment tracked';
        }

        await ChannelService.sendMessage(
          session,
          `No active delivery found for this account.\nReply *1* to browse campus restaurants and start a new order.`
        );
        return 'No active order';
      }

      const statusMap: Record<string, { label: string; step: string; eta: string }> = {
        awaiting_payment: { label: 'Awaiting Payment', step: '[Pay] -> [Prep] -> [Transit] -> [Delivered]', eta: 'Pending confirmation' },
        pending_payment: { label: 'Awaiting Payment', step: '[Pay] -> [Prep] -> [Transit] -> [Delivered]', eta: 'Pending confirmation' },
        paid: { label: 'Payment Confirmed — Sent to Kitchen', step: '[Done: Pay] -> [Cooking] -> [Transit] -> [Delivered]', eta: '~12-15 mins' },
        vendor_accepted: { label: 'Kitchen Accepted & Preparing', step: '[Done: Pay] -> [Cooking] -> [Transit] -> [Delivered]', eta: '~10-14 mins' },
        preparing: { label: 'Meal is being Prepared', step: '[Done: Pay] -> [Cooking] -> [Transit] -> [Delivered]', eta: '~8-12 mins' },
        ready_for_pickup: { label: 'Packaged & Ready for Rider Pickup', step: '[Done: Cooked] -> [Pickup] -> [Delivered]', eta: '~7-10 mins' },
        rider_assigned: { label: 'Rider Assigned to Pickup', step: '[Done: Cooked] -> [Dispatched] -> [Delivered]', eta: '~5-8 mins' },
        in_transit: { label: 'Rider in Transit to Hostel', step: '[Done: Cooked] -> [On the Way] -> [Delivered]', eta: '~3-6 mins' },
        delivered: { label: 'Delivered', step: '[Completed]', eta: 'Completed' },
      };

      const info = statusMap[order.status] || {
        label: order.status,
        step: '[Active Delivery]',
        eta: '~10 mins',
      };

      let pinText = `Delivery PIN: Hidden until payment is completed`;
      if (order.status !== 'awaiting_payment' && order.status !== 'pending_payment') {
        pinText = `Delivery PIN: *${order.delivery_pin}*\n(Give this PIN to your rider upon arrival)`;
      }

      const isDelivered = order.status === 'delivered';

      const trackerMsg =
        `*Order Tracking (#${order.order_number})*\n\n` +
        `• Status: *${info.label}*\n` +
        `• Progress: ${info.step}\n` +
        `• Estimated Arrival: ${info.eta}\n\n` +
        `• Kitchen: ${order.restaurant_name}\n` +
        `• Drop-off: ${order.delivery_location || order.hostel + ', ' + order.room}\n` +
        `• Total: ₦${(order.total_amount_ngn || order.total_amount || 0).toLocaleString()}\n\n` +
        `${pinText}`;

      const buttons: InteractiveOption[] = [];
      if (isDelivered) {
        buttons.push({ id: 'reorder', title: 'Reorder Meal', description: 'Order again from kitchen' });
        buttons.push({ id: 'help', title: 'Report Issue', description: 'Get support assistance' });
        buttons.push({ id: 'menu', title: 'Main Menu', description: 'Return home' });
      } else {
        buttons.push({ id: 'track', title: 'Refresh Status', description: 'Get latest update' });
        buttons.push({ id: 'help', title: 'Support', description: 'Need help with delivery' });
        buttons.push({ id: 'menu', title: 'Main Menu', description: 'Return home' });
      }

      await ChannelService.sendQuickReplyButtons(session, trackerMsg, buttons);
      return 'Order tracked';
    } catch {
      await ChannelService.sendMessage(
        session,
        `No active delivery found for this account.\nReply *1* to start a new order.`
      );
      return 'No active order';
    }
  }

  private static async handleSupport(session: UserSession): Promise<string> {
    const supportMsg =
      `*EU Bite Support*\n\n` +
      `Need help with a meal, payment verification, or eco-pack deposit return?\n\n` +
      `• Hotline / WhatsApp: +234 800 382 4837\n` +
      `• Telegram: @eubite_support\n` +
      `• Operating Hours: 8:00 AM – 10:30 PM Daily\n\n` +
      `Reply *menu* to return to the main menu.`;

    const buttons: InteractiveOption[] = [
      { id: '1', title: 'Restaurants', description: 'Browse open kitchens' },
      { id: 'track', title: 'Track Order', description: 'Live delivery status' },
      { id: 'menu', title: 'Main Menu', description: 'Return home' },
    ];

    await ChannelService.sendQuickReplyButtons(session, supportMsg, buttons);
    return 'Support sent';
  }
}
