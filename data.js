/* Sample catalogue. Images are emoji on gradient tiles so the site needs no image files. */
(function (root) {
  const CATEGORIES = [
    { id: 'mobiles', name: 'Mobiles', icon: '📱' },
    { id: 'laptops', name: 'Laptops', icon: '💻' },
    { id: 'audio', name: 'Audio', icon: '🎧' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'home', name: 'Home', icon: '🛋️' },
    { id: 'grocery', name: 'Grocery', icon: '🛒' },
  ];

  // [id, category, name, brand, emoji, hue, price, mrp, rating, ratings count, highlights]
  const RAW = [
    [1, 'mobiles', 'Nova X5 (128 GB, Midnight Blue)', 'Nova', '📱', 215, 14999, 19999, 4.4, 18230, ['6 GB RAM | 128 GB ROM', '6.5 inch AMOLED display', '50 MP dual camera', '5000 mAh battery']],
    [2, 'mobiles', 'Pixelo 9 Lite (256 GB, Mint)', 'Pixelo', '📱', 160, 24999, 31999, 4.5, 9410, ['8 GB RAM | 256 GB ROM', '6.7 inch 120 Hz display', '64 MP camera', '33W fast charging']],
    [3, 'mobiles', 'Orbit S2 5G (64 GB, Graphite)', 'Orbit', '📱', 260, 9999, 13999, 4.1, 30511, ['4 GB RAM | 64 GB ROM', '5G ready', '13 MP camera', '5000 mAh battery']],
    [4, 'mobiles', 'Zenith Pro Max (512 GB, Titanium)', 'Zenith', '📱', 30, 79999, 89999, 4.7, 5120, ['12 GB RAM | 512 GB ROM', '6.9 inch LTPO display', '200 MP triple camera', '5G | wireless charging']],
    [5, 'laptops', 'AeroBook 14 (Ryzen 5, 8 GB, 512 GB SSD)', 'AeroBook', '💻', 200, 42990, 58990, 4.3, 7421, ['AMD Ryzen 5 | 8 GB RAM', '512 GB SSD', '14 inch FHD display', 'Windows 11']],
    [6, 'laptops', 'StudyMate 15 (Core i3, 8 GB, 256 GB SSD)', 'StudyMate', '💻', 180, 28990, 38990, 4.0, 12984, ['Intel Core i3 | 8 GB RAM', '256 GB SSD', '15.6 inch HD display', '1 year warranty']],
    [7, 'laptops', 'ProSlate 16 (Core i7, 16 GB, 1 TB SSD)', 'ProSlate', '💻', 280, 84990, 109990, 4.6, 2308, ['Intel Core i7 | 16 GB RAM', '1 TB SSD', '16 inch 2.5K display', 'Backlit keyboard']],
    [8, 'audio', 'BassBuds Neo True Wireless Earbuds', 'BassBuds', '🎧', 340, 1299, 3999, 4.2, 88542, ['40 hours playback', 'Bluetooth 5.3', 'Dual mic noise cancelling', 'IPX5 water resistant']],
    [9, 'audio', 'Studio One Over-Ear Headphones', 'Studio', '🎧', 20, 2499, 5999, 4.4, 26710, ['Active noise cancellation', '60 hours battery', 'Foldable design', 'Type-C fast charge']],
    [10, 'audio', 'Pulse Mini Bluetooth Speaker 10 W', 'Pulse', '🔊', 50, 1099, 2499, 4.1, 41230, ['12 hours playtime', 'IP67 dust and water proof', 'Pairs with a second speaker']],
    [11, 'fashion', "Men's Cotton Regular Fit Polo T-Shirt", 'Urbane', '👕', 190, 349, 999, 4.0, 52310, ['100% cotton', 'Regular fit', 'Machine washable', 'Sizes S to XXL']],
    [12, 'fashion', "Women's Printed Anarkali Kurta", 'Rangoli', '👗', 330, 799, 2199, 4.3, 17640, ['Rayon fabric', 'Calf length', 'Three-quarter sleeves', 'Sizes S to XL']],
    [13, 'fashion', 'Running Shoes for Men (Lightweight)', 'Stride', '👟', 10, 1199, 2999, 4.2, 38120, ['Mesh upper', 'Cushioned EVA sole', 'Lace-up', 'Sizes 6 to 11']],
    [14, 'fashion', 'Classic Analog Watch with Leather Strap', 'Tempo', '⌚', 40, 899, 2499, 4.1, 14980, ['Quartz movement', '3 ATM water resistant', '1 year warranty']],
    [15, 'home', 'Ergonomic Mesh Office Chair', 'SitWell', '🪑', 205, 5499, 10999, 4.3, 6812, ['Lumbar support', 'Height adjustable', 'Breathable mesh back', '3 year warranty']],
    [16, 'home', 'LED Study Lamp with Wireless Charger', 'Lumo', '💡', 55, 1299, 2999, 4.2, 9871, ['3 colour modes', 'Touch dimmer', '10 W wireless charging pad']],
    [17, 'home', 'Non-Stick Cookware Set (5 pieces)', 'ChefPlus', '🍳', 12, 1599, 3499, 4.1, 21093, ['Induction base', 'PFOA free coating', 'Cool-touch handles']],
    [18, 'home', 'Cotton Double Bedsheet with 2 Pillow Covers', 'DreamNest', '🛏️', 300, 499, 1499, 4.0, 63250, ['144 TC cotton', 'Fade resistant', 'Machine washable']],
    [19, 'grocery', 'Basmati Rice Premium Aged (5 kg)', 'Annapurna', '🍚', 45, 599, 799, 4.4, 34500, ['Extra long grain', 'Aged 24 months', 'Non-sticky when cooked']],
    [20, 'grocery', 'Cold Pressed Groundnut Oil (1 L)', 'Gaon', '🫙', 38, 229, 299, 4.3, 12980, ['No chemicals', 'Rich aroma', 'Glass bottle']],
    [21, 'grocery', 'Assorted Dry Fruits Gift Box (500 g)', 'NutriNest', '🥜', 25, 649, 1099, 4.2, 8420, ['Almonds, cashews, raisins', 'Vacuum packed', 'Festive gift box']],
    [22, 'grocery', 'Masala Chai Blend (500 g)', 'Chaiwala', '🍵', 22, 249, 399, 4.5, 19760, ['Assam CTC leaf', 'Cardamom and ginger', 'Resealable pouch']],
  ];

  const PRODUCTS = RAW.map(([id, category, name, brand, emoji, hue, price, mrp, rating, count, highlights]) => (
    { id, category, name, brand, emoji, hue, price, mrp, rating, count, highlights }
  ));

  const CONFIG = { freeDeliveryAbove: 499, deliveryFee: 40, coupons: { WELCOME10: 0.1 } };

  const DATA = { CATEGORIES, PRODUCTS, CONFIG };
  root.SK_DATA = DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
