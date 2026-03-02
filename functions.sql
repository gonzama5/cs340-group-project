DROP FUNCTION IF EXISTS f_product_total;
DROP FUNCTION IF EXISTS f_order_total;
DROP FUNCTION IF EXISTS f_order_item_count;


DELIMITER //


-- Function for getting price of one product of an order
CREATE FUNCTION f_product_total(order_ID INT, product_ID INT)
RETURNS DECIMAL(8,2)
DETERMINISTIC

BEGIN
    DECLARE product_total DECIMAL (8,2);
    SELECT SUM(ohp.quantity * price) INTO product_total
    FROM Order_has_Products ohp
    JOIN Products p ON ohp.product_ID = p.product_ID
    WHERE ohp.order_ID = order_ID AND ohp.product_ID = product_ID;

    RETURN product_total;
END //


-- Function for getting order total
CREATE FUNCTION f_order_total(order_ID_input INT)
RETURNS DECIMAL(8,2)
DETERMINISTIC

BEGIN
    DECLARE total_price DECIMAL (8,2);
    SELECT SUM(f_product_total(order_ID_input, product_ID)) INTO total_price
    FROM Order_has_Products
    WHERE order_ID = order_ID_input;

    RETURN total_price;
END //


-- Function for getting total quantity of items
CREATE FUNCTION f_order_item_count(order_ID_input INT)
RETURNS INT
DETERMINISTIC

BEGIN
    DECLARE total_quantity INT;
    SELECT SUM(quantity) INTO total_quantity
    FROM Order_has_Products
    WHERE order_ID = order_ID_input;

    RETURN total_quantity;
END //


DELIMITER ;

