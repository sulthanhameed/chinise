// Offline / preview menu. Mirrors supabase/seed.sql. Used only when Supabase env vars are not set.
// PLACEHOLDER DATA: replace with the real menu from the PDF via the Admin dashboard or seed.sql.
import type { Category, Product, Review } from "../lib/types";

export const LOCAL_CATEGORIES: Category[] = [
  { id: "dim-sum", slug: "dim-sum", name: "Dim Sum", emoji: "🥟", image_url: "/images/food/har-gow.jpg", sort_order: 1 },
  { id: "noodles-soups", slug: "noodles-soups", name: "Noodles & Soups", emoji: "🍜", image_url: "/images/food/wonton-noodles.jpg", sort_order: 2 },
  { id: "rice-curry", slug: "rice-curry", name: "Rice & Curry", emoji: "🍛", image_url: "/images/food/kung-pao-rice.jpg", sort_order: 3 },
  { id: "snacks", slug: "snacks", name: "Snacks", emoji: "🍟", image_url: "/images/food/spring-rolls.jpg", sort_order: 4 },
  { id: "drinks", slug: "drinks", name: "Drinks", emoji: "🥤", image_url: "/images/food/jasmine-tea.jpg", sort_order: 5 },
];

type P = Omit<Product, "id" | "category_id"> & { cat: string };
const raw: P[] = [
  { slug: "har-gow", cat: "dim-sum", name: "Crystal Prawn Dumplings (Har Gow)", description: "Translucent steamed wheat-starch wrappers packed with fresh whole prawns and bamboo shoot.", ingredients: ["Fresh prawn", "Wheat starch", "Bamboo shoot", "Sesame oil"], price: 220, image_url: "/images/food/har-gow.jpg", rating: 4.8, review_count: 212, is_available: true, is_featured: true, is_top: true },
  { slug: "siu-mai", cat: "dim-sum", name: "Pork & Prawn Siu Mai", description: "Open-top dumplings of minced pork and prawn, topped with crab roe.", ingredients: ["Minced pork", "Prawn", "Shiitake", "Crab roe"], price: 240, image_url: "/images/food/siu-mai.jpg", rating: 4.7, review_count: 188, is_available: true, is_featured: true, is_top: true },
  { slug: "char-siu-bao", cat: "dim-sum", name: "Char Siu Bao", description: "Soft steamed bun filled with honey-glazed barbecue pork.", ingredients: ["Char siu pork", "Flour bun", "Honey", "Soy"], price: 180, image_url: null, rating: 4.5, review_count: 97, is_available: true, is_featured: false, is_top: false },
  { slug: "loan-phung-hoa-minh", cat: "dim-sum", name: "Loan Phung Hoa Minh", description: "Signature two-tone dumpling: white and brown rice wrappers, crisp tofu skin and a sweet prawn-pork filling.", ingredients: ["Prawn", "Pork", "Tofu skin", "Brown rice wrapper"], price: 320, image_url: null, rating: 4.9, review_count: 264, is_available: true, is_featured: false, is_top: true },
  { slug: "crispy-taro-dumplings", cat: "dim-sum", name: "Crispy Taro Dumplings", description: "Golden fried taro dumplings with a soft mashed-taro centre.", ingredients: ["Taro", "Vegetables", "Rice flour"], price: 200, image_url: null, rating: 4.4, review_count: 61, is_available: true, is_featured: false, is_top: false },
  { slug: "wonton-noodles", cat: "noodles-soups", name: "Wonton Noodle Soup", description: "Plump shrimp wontons, egg noodles, bok choy and char siu in a clear golden broth.", ingredients: ["Shrimp wonton", "Egg noodles", "Bok choy", "Char siu"], price: 280, image_url: "/images/food/wonton-noodles.jpg", rating: 4.6, review_count: 143, is_available: true, is_featured: true, is_top: true },
  { slug: "szechuan-noodles", cat: "noodles-soups", name: "Szechuan Spicy Noodles", description: "Wheat noodles tossed in chili oil, Sichuan pepper and minced pork.", ingredients: ["Wheat noodles", "Minced pork", "Chili oil", "Sichuan pepper"], price: 300, image_url: null, rating: 4.5, review_count: 116, is_available: true, is_featured: false, is_top: false },
  { slug: "hot-sour-soup", cat: "noodles-soups", name: "Hot & Sour Soup", description: "Classic Chinese soup with tofu, wood-ear mushroom and egg ribbons.", ingredients: ["Tofu", "Wood-ear mushroom", "Egg", "Vinegar"], price: 190, image_url: null, rating: 4.3, review_count: 78, is_available: true, is_featured: false, is_top: false },
  { slug: "kung-pao-rice", cat: "rice-curry", name: "Kung Pao Chicken Rice", description: "Wok-tossed chicken with roasted peanuts and dried chilies over jasmine rice.", ingredients: ["Chicken", "Peanuts", "Dried chili", "Jasmine rice"], price: 280, image_url: "/images/food/kung-pao-rice.jpg", rating: 4.6, review_count: 205, is_available: true, is_featured: true, is_top: false },
  { slug: "egg-fried-rice", cat: "rice-curry", name: "Yangzhou Egg Fried Rice", description: "Wok-fried rice with egg, prawn, char siu and spring onion.", ingredients: ["Rice", "Egg", "Prawn", "Char siu"], price: 220, image_url: null, rating: 4.4, review_count: 131, is_available: true, is_featured: false, is_top: false },
  { slug: "mapo-tofu-rice", cat: "rice-curry", name: "Mapo Tofu with Rice", description: "Silken tofu and minced pork in a fiery Sichuan bean sauce.", ingredients: ["Silken tofu", "Minced pork", "Doubanjiang", "Steamed rice"], price: 260, image_url: null, rating: 4.5, review_count: 89, is_available: true, is_featured: false, is_top: false },
  { slug: "spring-rolls", cat: "snacks", name: "Vegetable Spring Rolls", description: "Crispy golden rolls with shredded vegetables, served with sweet chili sauce.", ingredients: ["Cabbage", "Carrot", "Glass noodle", "Sweet chili"], price: 150, image_url: "/images/food/spring-rolls.jpg", rating: 4.4, review_count: 154, is_available: true, is_featured: true, is_top: false },
  { slug: "sesame-prawn-toast", cat: "snacks", name: "Sesame Prawn Toast", description: "Bread slices topped with prawn mousse and sesame, deep-fried until golden.", ingredients: ["Prawn", "Sesame", "Bread"], price: 210, image_url: null, rating: 4.3, review_count: 67, is_available: true, is_featured: false, is_top: false },
  { slug: "jasmine-tea", cat: "drinks", name: "Jasmine Green Tea (Pot)", description: "Fragrant jasmine green tea served in a glass pot.", ingredients: ["Green tea", "Jasmine flower"], price: 80, image_url: "/images/food/jasmine-tea.jpg", rating: 4.7, review_count: 240, is_available: true, is_featured: false, is_top: false },
  { slug: "lychee-iced-tea", cat: "drinks", name: "Lychee Iced Tea", description: "Chilled black tea with fresh lychee and a hint of rose.", ingredients: ["Black tea", "Lychee", "Rose syrup"], price: 120, image_url: null, rating: 4.5, review_count: 109, is_available: true, is_featured: false, is_top: false },
  { slug: "plum-soda", cat: "drinks", name: "Chinese Plum Soda", description: "Sparkling soda with sweet-sour preserved plum.", ingredients: ["Sparkling water", "Preserved plum", "Honey"], price: 110, image_url: null, rating: 4.2, review_count: 53, is_available: true, is_featured: false, is_top: false },
];

export const LOCAL_PRODUCTS: Product[] = raw.map(({ cat, ...p }) => ({ ...p, id: p.slug, category_id: cat }));

export const LOCAL_REVIEWS: Review[] = [
  { id: "r1", product_id: null, author_name: "Priya S.", rating: 5, comment: "The har gow are the best I have had outside Hong Kong. Wrappers are delicate and the prawns are fresh.", created_at: "2026-09-01" },
  { id: "r2", product_id: null, author_name: "Rahul M.", rating: 5, comment: "Loan Phung Hoa Minh is a must-order. The ambience feels like a real Chinese teahouse.", created_at: "2026-09-02" },
  { id: "r3", product_id: null, author_name: "Ananya K.", rating: 4, comment: "Wonton noodle soup was comforting and generous. Delivery arrived hot and on time.", created_at: "2026-09-03" },
  { id: "r4", product_id: null, author_name: "Daniel W.", rating: 5, comment: "Easy ordering, live tracking was handy, and the Kung Pao rice had proper wok flavour.", created_at: "2026-09-04" },
  { id: "r5", product_id: null, author_name: "Meera T.", rating: 4, comment: "Great drinks menu. Jasmine tea pot is a perfect pairing with dim sum.", created_at: "2026-09-05" },
];
