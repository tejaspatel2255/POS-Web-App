-- Clear any duplicates first
TRUNCATE products, categories CASCADE;

-- Add UNIQUE constraints to prevent duplicate categories and products by name
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);

-- Re-seed Categories
INSERT INTO categories (name, sort_order) VALUES 
('a ICECREAM', 1),
('b HALF_REAL', 2),
('c PACKING IT', 3),
('CADBURY', 4),
('Cold Drinks', 5),
('Flavour MILK', 6),
('MILK-SHAKE', 7),
('PARTY-PACK', 8),
('SHIKHAND', 9),
('zTOPING ICE', 10),
('GINGER', 11)
ON CONFLICT (name) DO NOTHING;

-- Re-seed Products with Realistic Prices
WITH ice_cream_cat AS (SELECT id FROM categories WHERE name = 'a ICECREAM' LIMIT 1)
INSERT INTO products (category_id, name, price, sort_order) VALUES 
((SELECT id FROM ice_cream_cat), 'Savaliya Special', 120.00, 1),
((SELECT id FROM ice_cream_cat), 'American Dry Fruit', 90.00, 2),
((SELECT id FROM ice_cream_cat), 'Anjeer', 80.00, 3),
((SELECT id FROM ice_cream_cat), 'Belgian Chocolate', 100.00, 4),
((SELECT id FROM ice_cream_cat), 'Blue Diamond', 90.00, 5),
((SELECT id FROM ice_cream_cat), 'Butter Scotch', 70.00, 6),
((SELECT id FROM ice_cream_cat), 'Caramel Chocolate', 85.00, 7),
((SELECT id FROM ice_cream_cat), 'Choco Chips', 80.00, 8),
((SELECT id FROM ice_cream_cat), 'Chocolate Oriyo', 85.00, 9),
((SELECT id FROM ice_cream_cat), 'Cookies Cream', 90.00, 10),
((SELECT id FROM ice_cream_cat), 'Crunchy Munchy', 80.00, 11),
((SELECT id FROM ice_cream_cat), 'Desert Topping', 50.00, 12),
((SELECT id FROM ice_cream_cat), 'Dryfruit Khajana', 110.00, 13),
((SELECT id FROM ice_cream_cat), 'Golden Pearl', 95.00, 14),
((SELECT id FROM ice_cream_cat), 'Hira-Moti', 90.00, 15),
((SELECT id FROM ice_cream_cat), 'Hot Brownie With Vanilla', 130.00, 16),
((SELECT id FROM ice_cream_cat), 'Jambu', 70.00, 17),
((SELECT id FROM ice_cream_cat), 'Jamfal', 70.00, 18),
((SELECT id FROM ice_cream_cat), 'Japani Hungama', 100.00, 19),
((SELECT id FROM ice_cream_cat), 'Kaju Draksh', 80.00, 20),
((SELECT id FROM ice_cream_cat), 'Kesar Pista', 90.00, 21),
((SELECT id FROM ice_cream_cat), 'Lotus Biscoff', 120.00, 22),
((SELECT id FROM ice_cream_cat), 'Mango', 60.00, 23),
((SELECT id FROM ice_cream_cat), 'Mava Malai', 70.00, 24),
((SELECT id FROM ice_cream_cat), 'Mexican Khajana', 100.00, 25),
((SELECT id FROM ice_cream_cat), 'Musk Melon', 70.00, 26),
((SELECT id FROM ice_cream_cat), 'Pan Masala', 75.00, 27),
((SELECT id FROM ice_cream_cat), 'Payna Orange', 70.00, 28),
((SELECT id FROM ice_cream_cat), 'Raj Bhog', 100.00, 29),
((SELECT id FROM ice_cream_cat), 'Rajdhani', 110.00, 30),
((SELECT id FROM ice_cream_cat), 'Red Velvet', 95.00, 31),
((SELECT id FROM ice_cream_cat), 'Sitaphal', 80.00, 32),
((SELECT id FROM ice_cream_cat), 'Strawberry', 60.00, 33),
((SELECT id FROM ice_cream_cat), 'Tender Coconut', 80.00, 34),
((SELECT id FROM ice_cream_cat), 'Thandai', 75.00, 35),
((SELECT id FROM ice_cream_cat), 'Tiramisu', 95.00, 36),
((SELECT id FROM ice_cream_cat), 'Vanilla', 50.00, 37),
((SELECT id FROM ice_cream_cat), 'White House', 90.00, 38),
((SELECT id FROM ice_cream_cat), 'Wild Berry', 80.00, 39),
((SELECT id FROM ice_cream_cat), 'Winter Cream', 85.00, 40),
((SELECT id FROM ice_cream_cat), 'Baki Na', 50.00, 41),
((SELECT id FROM ice_cream_cat), 'Pop Corn', 60.00, 42)
ON CONFLICT (name) DO NOTHING;
