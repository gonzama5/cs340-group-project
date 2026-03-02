-- View for all orders and their prices with who ordered them
DROP VIEW IF EXISTS v_all_orders; 

CREATE VIEW v_all_orders AS
SELECT
    o.order_ID AS `Order ID`,
    c.customer_ID AS `Customer ID`,
    CONCAT(c.last_name, ', ', c.first_name) AS `Customer Name`,
    o.date AS `Date`,
    f_order_total(o.order_ID) AS `Total Price`,
    f_order_item_count(o.order_ID) AS `Total Quantity`
FROM Orders o
JOIN Customers c ON c.customer_ID = o.customer_ID
ORDER BY o.order_ID ASC;


-- View for all customer order history, newest first
DROP VIEW IF EXISTS v_customer_orders;

CREATE VIEW v_customer_orders AS
SELECT
    c.customer_ID AS `Customer ID`,
    CONCAT(c.last_name, ', ', c.first_name) AS `Customer Name`,
    o.order_ID AS `Order ID`,
    o.date AS `Date`,
    f_order_total(o.order_ID) AS `Total Price`
FROM Customers c
JOIN Orders o ON c.customer_ID = o.customer_ID
ORDER BY o.date DESC;


-- View for products of orders

DROP VIEW IF EXISTS v_order_products;

CREATE VIEW v_order_products AS
SELECT
    o.order_id AS `Order ID`,
    p.product_id AS `Product ID`,
    p.name AS `Product Name`,
    ohp.quantity AS `Quantity`,
    p.price AS `Price Per Product`,
    f_product_total(o.order_ID, p.product_ID) AS `Product Price`
FROM Orders o
JOIN Order_has_Products ohp ON o.order_ID = ohp.order_ID
JOIN Products p ON ohp.product_ID = p.product_ID
ORDER BY o.order_ID, p.product_ID ASC;


-- View for Products by their categories
DROP VIEW IF EXISTS v_products_by_type;

CREATE VIEW v_products_by_type AS
SELECT
    pt.category_ID AS `Category ID`,
    pt.name AS `Category Name`,
    p.product_ID AS `Product ID`,
    p.name AS `Product Name`,
    p.quantity AS `Quantity`,
    p.price AS `Price`
FROM Product_Types pt
JOIN Products p ON p.category_ID = pt.category_ID
ORDER BY pt.category_ID, p.product_ID ASC;


-- View for suppliers` products
DROP VIEW IF EXISTS v_supplier_products;

CREATE VIEW v_supplier_products AS
SELECT
    s.supplier_ID AS `Supplier ID`,
    s.name AS `Supplier Name`,
    s.email AS `Supplier Email`,
    p.product_ID AS `Product ID`,
    p.name AS `Product Name`,
    p.quantity AS `Quantity`,
    p.price AS `Price`
FROM Suppliers s
JOIN Products p ON p.supplier_ID = s.supplier_ID
ORDER BY s.supplier_ID, p.product_ID ASC;


-- View for a list of customers
DROP VIEW IF EXISTS v_all_customers;

CREATE VIEW v_all_customers AS
SELECT
    customer_ID AS `Customer ID`,
    CONCAT(last_name, ', ', first_name) AS `Full Name`,
    phone_number AS `Phone Number`
FROM Customers
ORDER BY customer_ID;


-- View for the list of product types
DROP VIEW IF EXISTS v_product_types;

CREATE VIEW v_product_types AS
SELECT 
    category_ID AS `Category ID`,
    name AS `Name`
FROM Product_Types
ORDER BY category_ID;


-- View for the list of suppliers
DROP VIEW IF EXISTS v_all_suppliers;

CREATE VIEW v_all_suppliers AS
SELECT 
    supplier_ID AS `Supplier ID`,
    name AS `Name`,
    email AS `Email`
FROM Suppliers
ORDER BY supplier_ID;


-- View for the list of Products
DROP VIEW IF EXISTS v_all_products;

CREATE VIEW v_all_products AS
SELECT
    p.product_ID AS `Product ID`,
    p.name AS `Name`,
    p.quantity AS `Quantity`,
    p.price AS `Price`,
    pt.name AS `Type`,
    s.name AS `Supplier`
FROM Products p
JOIN Product_Types pt ON pt.category_ID = p.category_ID
JOIN Suppliers s ON p.supplier_ID = s.supplier_ID
ORDER BY  p.product_ID;