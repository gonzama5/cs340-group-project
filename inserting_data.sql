-- Written by Mario

-- Populating Table Customers (no dependencies)
INSERT INTO Customers (first_name, last_name, phone_number)VALUES
('William','Hogarth','555-123-1111'),
('John','Gilbert','555-123-2222'),
('Peter','Lely','555-123-3333'),
('Jamini','Roy','555-123-4444'),
('Frida','Kahlo','555-123-5555');

-- Populating Table Suppliers (no dependencies)
INSERT INTO Suppliers(name, email)VALUES
('Fresh Foods Inc.','sales@freshfoods.com'),
('Great Beverage Inc.','contact@greatbeverage.com'),
('Double Dairy','orders@doubledairy.com'),
('Infinity Snacks','info@infinitysnacks.com');

-- Populating Table Product_Types (no dependencies)
INSERT INTO Product_Types (name) VALUES
('Beverages'),
('Snacks'),
('Dairy'),
('Bakery');

-- Populating Table Products (depends on Suppliers and Product_Types)
INSERT INTO Products (name, quantity, price, supplier_ID, category_ID)VALUES
('Apple Juice',40,3.99,1,1),
('Potato Chips',50,5.99,4,2),
('Milk',25, 4.25, 3, 3),
('Bread', 40, 2.99, 1, 4),
('Soda',50, 4.99, 2, 1);

-- Populating Table Orders (depends on Customers)
INSERT INTO Orders (date, customer_ID)VALUES
('2026-02-01 10:30:00',1),
('2026-02-01 11:20:00',2),
('2026-02-01 11:50:00',3),
('2026-02-01 13:30:00',4);

-- Populating Table Order_has_products (depends on Orders and Products)
INSERT INTO Order_has_Products (order_ID, product_ID, quantity)VALUES
(1, 1, 2), -- order 1 has product 1
(1, 2, 1), -- order 1 has product 2
(2, 3, 1), -- order 2 has product 3
(3, 4, 2), -- order 3 has product 4
(3, 5, 3), -- order 3 has product 4
(4, 2, 2); -- order 4 has product 2
