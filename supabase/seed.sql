-- =============================================================================
-- Khang Dimsum — seed data
-- PLACEHOLDER menu: the PDF menu / Instagram menu could not be read during
-- build. Replace names, prices and descriptions from the real menu via the
-- Admin dashboard (/admin) or by editing this file and re-running `supabase db reset`.
-- Prices are in INR (₹).
-- =============================================================================

insert into public.categories (slug, name, emoji, image_url, sort_order) values
  ('dim-sum',        'Dim Sum',         '🥟', '/images/food/har-gow.jpg',       1),
  ('noodles-soups',  'Noodles & Soups', '🍜', '/images/food/wonton-noodles.jpg', 2),
  ('rice-curry',     'Rice & Curry',    '🍛', '/images/food/kung-pao-rice.jpg',  3),
  ('snacks',         'Snacks',          '🍟', '/images/food/spring-rolls.jpg',   4),
  ('drinks',         'Drinks',          '🥤', '/images/food/jasmine-tea.jpg',    5)
on conflict (slug) do nothing;

insert into public.products
  (slug, category_id, name, description, ingredients, price, image_url, rating, review_count, is_featured, is_top)
values
  ('har-gow', (select id from public.categories where slug='dim-sum'),
   'Crystal Prawn Dumplings (Har Gow)',
   'Translucent steamed wheat-starch wrappers packed with fresh whole prawns and bamboo shoot.',
   array['Fresh prawn','Wheat starch','Bamboo shoot','Sesame oil'], 220.00, '/images/food/har-gow.jpg', 4.8, 212, true, true),
  ('siu-mai', (select id from public.categories where slug='dim-sum'),
   'Pork & Prawn Siu Mai',
   'Open-top dumplings of minced pork and prawn, topped with crab roe.',
   array['Minced pork','Prawn','Shiitake','Crab roe'], 240.00, '/images/food/siu-mai.jpg', 4.7, 188, true, true),
  ('char-siu-bao', (select id from public.categories where slug='dim-sum'),
   'Char Siu Bao',
   'Soft steamed bun filled with honey-glazed barbecue pork.',
   array['Char siu pork','Flour bun','Honey','Soy'], 180.00, null, 4.5, 97, false, false),
  ('loan-phung-hoa-minh', (select id from public.categories where slug='dim-sum'),
   'Loan Phung Hoa Minh',
   'Signature two-tone dumpling: white and brown rice wrappers, crisp tofu skin and a sweet prawn-pork filling.',
   array['Prawn','Pork','Tofu skin','Brown rice wrapper'], 320.00, null, 4.9, 264, false, true),
  ('crispy-taro-dumplings', (select id from public.categories where slug='dim-sum'),
   'Crispy Taro Dumplings',
   'Golden fried taro dumplings with a soft mashed-taro centre.',
   array['Taro','Vegetables','Rice flour'], 200.00, null, 4.4, 61, false, false),
  ('wonton-noodles', (select id from public.categories where slug='noodles-soups'),
   'Wonton Noodle Soup',
   'Plump shrimp wontons, egg noodles, bok choy and char siu in a clear golden broth.',
   array['Shrimp wonton','Egg noodles','Bok choy','Char siu'], 280.00, '/images/food/wonton-noodles.jpg', 4.6, 143, true, true),
  ('szechuan-noodles', (select id from public.categories where slug='noodles-soups'),
   'Szechuan Spicy Noodles',
   'Wheat noodles tossed in chili oil, Sichuan pepper and minced pork.',
   array['Wheat noodles','Minced pork','Chili oil','Sichuan pepper'], 300.00, null, 4.5, 116, false, false),
  ('hot-sour-soup', (select id from public.categories where slug='noodles-soups'),
   'Hot & Sour Soup',
   'Classic Chinese soup with tofu, wood-ear mushroom and egg ribbons.',
   array['Tofu','Wood-ear mushroom','Egg','Vinegar'], 190.00, null, 4.3, 78, false, false),
  ('kung-pao-rice', (select id from public.categories where slug='rice-curry'),
   'Kung Pao Chicken Rice',
   'Wok-tossed chicken with roasted peanuts and dried chilies over jasmine rice.',
   array['Chicken','Peanuts','Dried chili','Jasmine rice'], 280.00, '/images/food/kung-pao-rice.jpg', 4.6, 205, true, false),
  ('egg-fried-rice', (select id from public.categories where slug='rice-curry'),
   'Yangzhou Egg Fried Rice',
   'Wok-fried rice with egg, prawn, char siu and spring onion.',
   array['Rice','Egg','Prawn','Char siu'], 220.00, null, 4.4, 131, false, false),
  ('mapo-tofu-rice', (select id from public.categories where slug='rice-curry'),
   'Mapo Tofu with Rice',
   'Silken tofu and minced pork in a fiery Sichuan bean sauce.',
   array['Silken tofu','Minced pork','Doubanjiang','Steamed rice'], 260.00, null, 4.5, 89, false, false),
  ('spring-rolls', (select id from public.categories where slug='snacks'),
   'Vegetable Spring Rolls',
   'Crispy golden rolls with shredded vegetables, served with sweet chili sauce.',
   array['Cabbage','Carrot','Glass noodle','Sweet chili'], 150.00, '/images/food/spring-rolls.jpg', 4.4, 154, true, false),
  ('sesame-prawn-toast', (select id from public.categories where slug='snacks'),
   'Sesame Prawn Toast',
   'Bread slices topped with prawn mousse and sesame, deep-fried until golden.',
   array['Prawn','Sesame','Bread'], 210.00, null, 4.3, 67, false, false),
  ('jasmine-tea', (select id from public.categories where slug='drinks'),
   'Jasmine Green Tea (Pot)',
   'Fragrant jasmine green tea served in a glass pot.',
   array['Green tea','Jasmine flower'], 80.00, '/images/food/jasmine-tea.jpg', 4.7, 240, false, false),
  ('lychee-iced-tea', (select id from public.categories where slug='drinks'),
   'Lychee Iced Tea',
   'Chilled black tea with fresh lychee and a hint of rose.',
   array['Black tea','Lychee','Rose syrup'], 120.00, null, 4.5, 109, false, false),
  ('plum-soda', (select id from public.categories where slug='drinks'),
   'Chinese Plum Soda',
   'Sparkling soda with sweet-sour preserved plum.',
   array['Sparkling water','Preserved plum','Honey'], 110.00, null, 4.2, 53, false, false)
on conflict (slug) do nothing;

-- Site-wide testimonials (product_id null, so they do not affect product ratings)
insert into public.reviews (product_id, author_name, rating, comment) values
  (null, 'Priya S.',   5, 'The har gow are the best I have had outside Hong Kong. Wrappers are delicate and the prawns are fresh.'),
  (null, 'Rahul M.',   5, 'Loan Phung Hoa Minh is a must-order. The ambience feels like a real Chinese teahouse.'),
  (null, 'Ananya K.',  4, 'Wonton noodle soup was comforting and generous. Delivery arrived hot and on time.'),
  (null, 'Daniel W.',  5, 'Easy ordering, live tracking was handy, and the Kung Pao rice had proper wok flavour.'),
  (null, 'Meera T.',   4, 'Great drinks menu. Jasmine tea pot is a perfect pairing with dim sum.');
