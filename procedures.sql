---------------------------- Inserts ----------------------------

DROP PROCEDURE IF EXISTS p_add_customer;
DROP PROCEDURE IF EXISTS p_add_order;
DROP PROCEDURE IF EXISTS p_add_product_to_order;
DROP PROCEDURE IF EXISTS p_add_product;
DROP PROCEDURE IF EXISTS p_add_supplier;
DROP PROCEDURE IF EXISTS p_add_type;

DELIMITER //

-- Add a new customer
CREATE PROCEDURE p_add_customer(
    IN p_first_name VARCHAR(45),
    IN p_last_name VARCHAR(45),
    IN p_phone_number VARCHAR(15),
    OUT p_customer_ID INT
)
BEGIN
    INSERT INTO Customers (first_name, last_name, phone_number)
    VALUES (p_first_name, p_last_name, p_phone_number);
    SET p_customer_ID = LAST_INSERT_ID();
END //

-- Add a new order
CREATE PROCEDURE p_add_order(
    IN p_customer_ID INT,
    OUT p_order_ID INT
)
BEGIN
    INSERT INTO Orders (date, customer_ID)
    VALUES (NOW(), p_customer_ID);
    SET p_order_ID = LAST_INSERT_ID();
END //

-- Add a new product to an order
CREATE PROCEDURE p_add_product_to_order(
    IN p_order_ID INT,
    IN p_product_ID INT,
    IN p_quantity INT
)
BEGIN
    DECLARE stock INT;

    START TRANSACTION;

    SELECT quantity INTO stock FROM Products
    WHERE product_ID = p_product_ID;

    IF stock < p_quantity THEN
        ROLLBACK;
        SELECT 'Not enough stock' AS `Error`;
    ELSE
        INSERT INTO Order_has_Products (order_ID, product_ID, quantity)
        VALUES (p_order_ID, p_product_ID, p_quantity);

        COMMIT;
    END IF;
END //

-- Add new product
CREATE PROCEDURE p_add_product(
    IN p_name VARCHAR(45),
    IN p_quantity INT,
    IN p_price DECIMAL(6,2),
    IN p_supplier_ID INT,
    IN p_category_ID INT,
    OUT p_product_ID INT
)
BEGIN
    INSERT INTO Products (name, quantity, price, supplier_ID, category_ID)
    VALUES (p_name, p_quantity, p_price, p_supplier_ID, p_category_ID);
    SET p_product_ID = LAST_INSERT_ID();
END //

-- Add new supplier
CREATE PROCEDURE p_add_supplier(
    IN p_name VARCHAR(45),
    IN p_email VARCHAR(45),
    OUT p_supplier_ID INT
)
BEGIN
    INSERT INTO Suppliers (name, email)
    VALUES (p_name, p_email);
    SET p_supplier_ID = LAST_INSERT_ID();
END //

-- Add new type
CREATE PROCEDURE p_add_type(
    IN p_name VARCHAR(45),
    OUT p_category_ID INT
)
BEGIN
    INSERT INTO Product_Types (name)
    VALUES (p_name);
    SET p_category_ID = LAST_INSERT_ID();
END //

DELIMITER ;

---------------------------- Updates ----------------------------

DROP PROCEDURE IF EXISTS p_update_customer;
DROP PROCEDURE IF EXISTS p_update_supplier;
DROP PROCEDURE IF EXISTS p_update_product_stock;

DELIMITER //

-- Update a customer's information
CREATE PROCEDURE p_update_customer (
    IN p_customer_ID INT,
    IN p_first_name VARCHAR(45),
    IN p_last_name VARCHAR(45),
    IN p_phone_number VARCHAR(15)
)
BEGIN
    UPDATE Customers
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        phone_number = p_phone_number
    WHERE customer_ID = p_customer_ID;
END //

-- Update a supplier's information
CREATE PROCEDURE p_update_supplier (
    IN p_supplier_ID INT,
    IN p_name VARCHAR(45),
    IN p_email VARCHAR(45)
)
BEGIN
    UPDATE Suppliers
    SET 
        name = p_name,
        email = p_email
    WHERE supplier_ID = p_supplier_ID;
END //

-- Update a product's quantity
CREATE PROCEDURE p_update_product_stock (
    IN p_product_ID INT,
    IN p_quantity INT
)
BEGIN
    UPDATE Products
    SET quantity = p_quantity
    WHERE product_ID = p_product_ID;
END //

DELIMITER ;

---------------------------- Deletes ----------------------------

DROP PROCEDURE IF EXISTS p_delete_customer;
DROP PROCEDURE IF EXISTS p_delete_order;

DELIMITER //

-- Delete a customer
CREATE PROCEDURE p_delete_customer(
    IN p_customer_ID INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error! Customer not deleted.' AS 'Result';
    END;

    START TRANSACTION;
    DELETE FROM Customers WHERE customer_ID = p_customer_ID;

    IF ROW_COUNT() = 0 THEN
        ROLLBACK;
        SELECT 'Customer does not exist' AS 'Result';
    ELSE
        COMMIT;
        SELECT 'Customer Deleted' AS 'Result';
    END IF;
END //

-- Delete an Order
CREATE PROCEDURE p_delete_order(
    IN p_order_ID INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error! Order not deleted.' AS 'Result';
    END;

    START TRANSACTION;
    DELETE FROM Orders WHERE order_ID = p_order_ID;

    IF ROW_COUNT() = 0 THEN
        ROLLBACK;
        SELECT 'Order does not exist' AS 'Result';
    ELSE
        COMMIT;
        SELECT 'Order Deleted' AS 'Result';
    END IF;
END //

DELIMITER ;

---------------------------- Reset Database ----------------------------

DROP PROCEDURE IF EXISTS ResetDatabase;

DELIMITER //

CREATE PROCEDURE ResetDatabase()
BEGIN
    -- disable foreign key checks, allowing us to drop tables in any order
    SET FOREIGN_KEY_CHECKS = 0;

    DROP TABLE IF EXISTS Order_has_Products;
    DROP TABLE IF EXISTS Orders;
    DROP TABLE IF EXISTS Products;
    DROP TABLE IF EXISTS Suppliers;
    DROP TABLE IF EXISTS Product_Types;
    DROP TABLE IF EXISTS Customers;

    -- Create Customers table
    CREATE TABLE Customers (
        customer_ID INT NOT NULL AUTO_INCREMENT,
        first_name VARCHAR(45) NOT NULL,
        last_name VARCHAR(45) NOT NULL,
        phone_number VARCHAR(15) NOT NULL,
        PRIMARY KEY (customer_ID)
    ) ENGINE = InnoDB;
    
    -- Create Suppliers table
    CREATE TABLE Suppliers (
        supplier_ID INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(45) NOT NULL,
        email VARCHAR(45) NOT NULL UNIQUE,
        PRIMARY KEY (supplier_ID)
    ) ENGINE = InnoDB;
    
    -- Create Product_Types table
    CREATE TABLE Product_Types (
        category_ID INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(45) NOT NULL,
        PRIMARY KEY (category_ID)
    ) ENGINE = InnoDB;

    -- Create Products table
    CREATE TABLE Products (
        product_ID INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(45) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(6,2) NOT NULL,
        supplier_ID INT NOT NULL,
        category_ID INT NOT NULL,
        PRIMARY KEY (product_ID),
        FOREIGN KEY (supplier_ID) REFERENCES Suppliers (supplier_ID) ON DELETE CASCADE,
        FOREIGN KEY (category_ID) REFERENCES Product_Types (category_ID) ON DELETE CASCADE
    ) ENGINE = InnoDB;
    
    -- Create Orders table
    CREATE TABLE Orders (
        order_ID INT NOT NULL AUTO_INCREMENT,
        date DATETIME NOT NULL,
        customer_ID INT NOT NULL,
        PRIMARY KEY (order_ID),
        FOREIGN KEY (customer_ID) REFERENCES Customers (customer_ID) ON DELETE CASCADE
    ) ENGINE = InnoDB;
    
    -- Create Order_has_Products table
    CREATE TABLE Order_has_Products (
        order_ID INT NOT NULL,
        product_ID INT NOT NULL,
        quantity INT NOT NULL,
        PRIMARY KEY (order_ID, product_ID),
        FOREIGN KEY (order_ID) REFERENCES Orders (order_ID) ON DELETE CASCADE,
        FOREIGN KEY (product_ID) REFERENCES Products (product_ID) ON DELETE CASCADE
    ) ENGINE = InnoDB;

    SET FOREIGN_KEY_CHECKS = 1;
    
    -- Insert sample data
    INSERT INTO Customers (first_name, last_name, phone_number) VALUES
    ('William', 'Hogarth', '555-123-1111'),
    ('John', 'Gilbert', '555-123-2222'),
    ('Peter', 'Lely', '555-123-3333'),
    ('Jamini', 'Roy', '555-123-4444'),
    ('Frida', 'Kahlo', '555-123-5555');
    
    INSERT INTO Suppliers (name, email) VALUES
    ('Fresh Foods Inc.', 'sales@freshfoods.com'),
    ('Great Beverage Inc.', 'contact@greatbeverage.com'),
    ('Double Dairy', 'orders@doubledairy.com'),
    ('Infinity Snacks', 'info@infinitysnacks.com');
    
    INSERT INTO Product_Types (name) VALUES
    ('Beverages'),
    ('Snacks'),
    ('Dairy'),
    ('Bakery');
    
    INSERT INTO Products (name, quantity, price, supplier_ID, category_ID) VALUES
    ('Apple Juice', 40, 3.99, 1, 1),
    ('Potato Chips', 50, 5.99, 4, 2),
    ('Milk', 25, 4.25, 3, 3),
    ('Bread', 40, 2.99, 1, 4),
    ('Soda', 50, 4.99, 2, 1);
    
    INSERT INTO Orders (date, customer_ID) VALUES
    ('2026-02-01 10:30:00', 1),
    ('2026-02-01 11:20:00', 2),
    ('2026-02-01 11:50:00', 3),
    ('2026-02-01 13:30:00', 4);
    
    INSERT INTO Order_has_Products (order_ID, product_ID, quantity) VALUES
    (1, 1, 2),
    (1, 2, 1),
    (2, 3, 1),
    (3, 4, 2),
    (3, 5, 3),
    (4, 2, 2);

    SELECT 'Database has been successfully reset!' AS 'Result';
END //

DELIMITER ;

---------------------------- Triggers ----------------------------

DROP TRIGGER IF EXISTS t_update_stock_after_insert;

DELIMITER //

-- Update Product stock after product is added to order
CREATE TRIGGER t_update_stock_after_insert
AFTER INSERT ON Order_has_Products
FOR EACH ROW
BEGIN
    UPDATE Products
    SET quantity = quantity - NEW.quantity
    WHERE product_ID = NEW.product_ID;
END //

DELIMITER ;