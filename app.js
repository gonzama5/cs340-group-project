/*
    Citation for the following app.js:
    Date: 2/15/2026
    Adapted from CS340 Node.js Starter App provided by Dr. Michael Curry
    Original source: Class materials and starter code from Oregon State University CS340
    Adapted to implement Samina's Corner Store inventory management system
*/

/*
    Citation for the following code:
    Date: 3/1/2026
    Adapted from the queuing with the command pattern section
    Original source: Mohamed-Ali. (2025, April 27). Handling Asynchronously Initialized Components in Software Systems. Medium. 
    URL: https://medium.com/@moali314/handling-asynchronously-initialized-components-in-software-systems-1a576351b7d9
    Adapted to implement asynchronous database connection handling in Samina's Corner Store inventory management system
*/

/*
    SETUP
*/

// Express
const express = require('express');
const app = express();
const PORT = 3040;

// Handlebars setup
const exphbs = require('express-handlebars');
const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        multiply: function(a, b) {
            return (a * b).toFixed(2);
        },
        eq: function(a,b){
            return a==b;
        }
    }
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database 
const db = require('./db-connector');
const fs = require('fs');

// Database auto-initialization on server start
(async () => {
    try {
        console.log("Checking database state...");
        
        const [tables] = await db.query("SHOW TABLES LIKE 'Customers'");
        
        if (tables.length === 0) {
            console.log("Resetting database via stored procedure...");
            await db.query('CALL ResetDatabase()');
            console.log("Database initialized!");
        } else {
            console.log("Database ready");
        }
    } catch (error) {
        console.error("Error:", error);
    }
})();

/*
    ROUTES - These will serve your Handlebars pages
*/

// Home page
app.get('/', async function (req, res) {
    res.render('index', {
        title: 'Home - Inventory Management System',
        message: 'Samina\'s Corner Store Inventory Management System'
    });
});

// ============ BROWSE ROUTES (GET with database) ============

// Browse Customers
app.get('/customers', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM v_all_customers');
        const customers = rows.map(row => {
            const nameParts = row['Full Name'].split(', ');
            return {
                customer_ID: row['Customer ID'],
                first_name: nameParts[1] || '',
                last_name: nameParts[0] || '',
                phone_number: row['Phone Number']
            };
        });
        res.render('customers', {
            title: 'Browse Customers',
            customers: customers
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).send("Error loading customers");
    }
});

// Browse Orders
app.get('/orders', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM v_all_orders');
        const orders = rows.map(row => ({
            order_ID: row['Order ID'],
            customer_name: row['Customer Name'],
            date: row['Date'],
            total_price: row['Total Price']
        }));
        res.render('orders', {
            title: 'Browse Orders',
            orders: orders
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Error loading orders");
    }
});

// Browse Products
app.get('/products', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM v_all_products');
        const products = rows.map(row => ({
            product_ID: row['Product ID'],
            name: row['Name'],
            quantity: row['Quantity'],
            price: row['Price'],
            supplier_name: row['Supplier'],
            category_name: row['Type']
        }));
        res.render('products', {
            title: 'Browse Products',
            products: products
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Error loading products");
    }
});

// Browse Product Types
app.get('/product-types', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM v_product_types');
        const productTypes = rows.map(row => ({
            category_ID: row['Category ID'],
            name: row['Name']
        }));
        res.render('product-types', {
            title: 'Browse Product Types',
            productTypes: productTypes
        });
    } catch (error) {
        console.error("Error fetching product types:", error);
        res.status(500).send("Error loading product types");
    }
});

// Browse Suppliers
app.get('/suppliers', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM v_all_suppliers');
        const suppliers = rows.map(row => ({
            supplier_ID: row['Supplier ID'],
            name: row['Name'],
            email: row['Email']
        }));
        res.render('suppliers', {
            title: 'Browse Suppliers',
            suppliers: suppliers
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).send("Error loading suppliers");
    }
});

// Browse Order Products
app.get('/order-products', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM v_order_products');
        const orderProducts = [];
        for (const row of rows) {
            const [orderInfo] = await db.query(
                'SELECT `Customer Name`, `Date` FROM v_all_orders WHERE `Order ID` = ?',
                [row['Order ID']]
            );
            
            orderProducts.push({
                order_ID: row['Order ID'],
                product_ID: row['Product ID'],
                product_name: row['Product Name'],
                quantity: row['Quantity'],
                customer_name: orderInfo[0]?.['Customer Name'] || 'Unknown',
                order_date: orderInfo[0]?.['Date'] || 'Unknown'
            });
        }
        
        res.render('order-products', {
            title: 'Browse Order Products',
            orderProducts: orderProducts,
            message: req.query.message,
            error: req.query.error
        });
    } catch (error) {
        console.error("Error fetching order products:", error);
        res.status(500).send("Error loading order products");
    }
});

// Order Details
app.get('/order-details/:id', async function (req, res) {
    try {
        const [products] = await db.query(
            'SELECT * FROM v_order_products WHERE `Order ID` = ?',
            [req.params.id]
        );
        const [totalResult] = await db.query(
            'SELECT f_order_total(?) as total',
            [req.params.id]
        );
        res.render('order-details', {
            title: `Order #${req.params.id} Details`,
            orderId: req.params.id,
            products: products.map(p => ({
                product_ID: p['Product ID'],
                product_name: p['Product Name'],
                quantity: p['Quantity'],
                price: p['Price Per Product']
            })),
            total: totalResult[0].total ? parseFloat(totalResult[0].total).toFixed(2) : '0.00'
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Error loading order details");
    }
});

// ============ ADD FORM ROUTES (GET) ============

app.get('/add-customer', function(req, res) {
    res.render('add-customer', {
        title: 'Add New Customer'
    });
});

app.get('/add-order', async function(req, res) {
    try {
        const [customers] = await db.query('SELECT customer_ID, first_name, last_name FROM Customers');
        res.render('add-order', {
            title: 'Add New Order',
            customers: customers
        });
    } catch (error) {
        console.error("Error loading customers:", error);
        res.status(500).send("Error loading form");
    }
});

app.get('/add-product', async function(req, res) {
    try {
        const [suppliers] = await db.query('SELECT supplier_ID, name FROM Suppliers');
        const [categories] = await db.query('SELECT category_ID, name FROM Product_Types');
        res.render('add-product', {
            title: 'Add New Product',
            suppliers: suppliers,
            categories: categories
        });
    } catch (error) {
        console.error("Error loading form data:", error);
        res.status(500).send("Error loading form");
    }
});

app.get('/add-product-type', function(req, res) {
    res.render('add-product-type', {
        title: 'Add New Product Type'
    });
});

app.get('/add-supplier', function(req, res) {
    res.render('add-supplier', {
        title: 'Add New Supplier'
    });
});

app.get('/add-order-product', async function(req, res) {
    try {
        const [orders] = await db.query('SELECT order_ID, date FROM Orders');
        const [products] = await db.query('SELECT product_ID, name, price FROM Products');
        res.render('add-order-product', {
            title: 'Add Product to Order',
            orders: orders,
            products: products
        });
    } catch (error) {
        console.error("Error loading form data:", error);
        res.status(500).send("Error loading form");
    }
});

// ============ ADD FORM HANDLERS (POST) ============

app.post('/add-customer', async function(req, res) {
    try {
        const { first_name, last_name, phone_number } = req.body;
        await db.query(
            'CALL p_add_customer(?, ?, ?, @cust_id)',
            [first_name, last_name, phone_number]
        );
        res.redirect('/customers');
    } catch (error) {
        console.error("Error adding customer:", error);
        res.status(500).send("Error adding customer");
    }
});

app.post('/add-order', async function(req, res) {
    try {
        const { customer_ID } = req.body;
        await db.query(
            'CALL p_add_order(?, @order_id)',
            [customer_ID]
        );
        res.redirect('/orders');
     } catch (error) {
        console.error("Error adding order:", error);
        res.status(500).send("Error adding order");
    }
});

app.post('/add-product', async function(req, res) {
    try {
        const { name, quantity, price, supplier_ID, category_ID } = req.body;
        await db.query(
            'CALL p_add_product(?, ?, ?, ?, ?, @prod_id)',
            [name, quantity, price, supplier_ID, category_ID]
        );
        res.redirect('/products');
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Error adding product");
    }
});

app.post('/add-product-type', async function(req, res) {
    try {
        const { name } = req.body;
        await db.query(
            'CALL p_add_type(?, @type_id)',
            [name]
        );
        res.redirect('/product-types');
    } catch (error) {
        console.error("Error adding product type:", error);
        res.status(500).send("Error adding product type");
    }
});

app.post('/add-supplier', async function(req, res) {
    try {
        const { name, email } = req.body;
        await db.query(
            'CALL p_add_supplier(?, ?, @supp_id)',
            [name, email]
        );
        res.redirect('/suppliers');
    } catch (error) {
        console.error("Error adding supplier:", error);
        res.status(500).send("Error adding supplier");
    }
});

app.post('/add-order-product', async function(req, res) {
    try {
        const { order_ID, product_ID, quantity } = req.body;
        
        console.log("=== ADDING PRODUCT TO ORDER ===");
        console.log("Order ID:", order_ID);
        console.log("Product ID:", product_ID);
        console.log("Quantity:", quantity);
        
        // Check current stock before
        const [beforeStock] = await db.query('SELECT quantity FROM Products WHERE product_ID = ?', [product_ID]);
        console.log("Stock BEFORE:", beforeStock[0].quantity);
        
        // Call the procedure
        const [result] = await db.query('CALL p_add_product_to_order(?, ?, ?)', 
                      [order_ID, product_ID, quantity]);
        
        console.log("Procedure result:", JSON.stringify(result));
        
        // Check stock after
        const [afterStock] = await db.query('SELECT quantity FROM Products WHERE product_ID = ?', [product_ID]);
        console.log("Stock AFTER:", afterStock[0].quantity);
        
        res.redirect('/order-products?message=Product added/updated successfully');
        
    } catch (error) {
        console.error("ERROR in add-order-product:", error);
        res.status(500).send("Error: " + error.message);
    }
});

// ============ DELETE FORM ROUTES (GET) ============

app.get('/delete-customer', async function(req, res) {
    try {
        const [customers] = await db.query('SELECT customer_ID, first_name, last_name, phone_number FROM Customers');
        res.render('delete-customer', {
            title: 'Delete Customer',
            customers: customers
        });
    } catch (error) {
        console.error("Error loading customers:", error);
        res.status(500).send("Error loading form");
    }
});

app.get('/delete-order', async function(req, res) {
    try {
        const [orders] = await db.query(`
            SELECT o.order_ID, o.date, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM Orders o
            JOIN Customers c ON o.customer_ID = c.customer_ID
            ORDER BY o.order_ID
        `);
        res.render('delete-order', {
            title: 'Delete Order',
            orders: orders
        });
    } catch (error) {
        console.error("Error loading orders:", error);
        res.status(500).send("Error loading form");
    }
});

app.get('/delete-product', async function(req, res) {
    try {
        const [products] = await db.query('SELECT product_ID, name, quantity, price FROM Products');
        res.render('delete-product', {
            title: 'Delete Product',
            products: products
        });
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).send("Error loading form");
    }
});

app.get('/delete-product-type', async function(req, res) {
    try {
        const [types] = await db.query('SELECT category_ID, name FROM Product_Types');
        res.render('delete-product-type', {
            title: 'Delete Product Type',
            productTypes: types
        });
    } catch (error) {
        console.error("Error loading product types:", error);
        res.status(500).send("Error loading form");
    }
});

app.get('/delete-supplier', async function(req, res) {
    try {
        const [suppliers] = await db.query('SELECT supplier_ID, name, email FROM Suppliers');
        res.render('delete-supplier', {
            title: 'Delete Supplier',
            suppliers: suppliers
        });
    } catch (error) {
        console.error("Error loading suppliers:", error);
        res.status(500).send("Error loading form");
    }
});

app.get('/delete-order-product', async function(req, res) {
    try {
        const [orders] = await db.query(`
            SELECT o.order_ID, o.date, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM Orders o
            JOIN Customers c ON o.customer_ID = c.customer_ID
            ORDER BY o.order_ID
        `);
        const [products] = await db.query('SELECT product_ID, name FROM Products');
        res.render('delete-order-product', {
            title: 'Remove Product from Order',
            orders: orders,
            products: products
        });
    } catch (error) {
        console.error("Error loading form data:", error);
        res.status(500).send("Error loading form");
    }
});

// ============ DELETE FORM HANDLERS (POST) ============

app.post('/delete-customer', async function(req, res) {
    try {
        const { customer_ID } = req.body;
        await db.query('CALL p_delete_customer(?)', [customer_ID]);
        res.redirect('/customers');
    } catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).send("Error deleting customer");
    }
});

app.post('/delete-order', async function(req, res) {
    try {
        const { order_ID } = req.body;
        await db.query('CALL p_delete_order(?)', [order_ID]);
        res.redirect('/orders');
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).send("Error deleting order");
    }
});

app.post('/delete-product', async function(req, res) {
    try {
        const { product_ID } = req.body;
        await db.query('CALL p_delete_product(?)', [product_ID]);
        res.redirect('/products');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Error deleting product");
    }
});

app.post('/delete-product-type', async function(req, res) {
    try {
        const { category_ID } = req.body;
        await db.query('CALL p_delete_type(?)', [category_ID]);
        res.redirect('/product-types');
    } catch (error) {
        console.error("Error deleting product type:", error);
        res.status(500).send("Error deleting product type");
    }
});

app.post('/delete-supplier', async function(req, res) {
    try {
        const { supplier_ID } = req.body;
        await db.query('CALL p_delete_supplier(?)', [supplier_ID]);
        res.redirect('/suppliers');
    } catch (error) {
        console.error("Error deleting supplier:", error);
        res.status(500).send("Error deleting supplier");
    }
});

app.post('/delete-order-product', async function(req, res) {
    try {
        const { order_ID, product_ID } = req.body;
        await db.query('CALL p_delete_order_product(?, ?)', [order_ID, product_ID]);
        res.redirect('/order-products');
    } catch (error) {
        console.error("Error removing product from order:", error);
        res.status(500).send("Error removing product from order");
    }
});

// ============ UPDATE FORM ROUTES (GET) ============

// Update Customer - GET form
app.get('/update-customer/:id', async function(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM Customers WHERE customer_ID = ?', [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).send("Customer not found");
        }
        
        res.render('update-customer', {
            title: 'Update Customer',
            customer: rows[0]
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error loading customer");
    }
});

// Update Supplier - GET form
app.get('/update-supplier/:id', async function(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM Suppliers WHERE supplier_ID = ?', [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).send("Supplier not found");
        }
        
        res.render('update-supplier', {
            title: 'Update Supplier',
            supplier: rows[0]
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error loading supplier");
    }
});

// Update Product Stock - GET form
app.get('/update-product-stock/:id', async function(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT p.*, s.name AS supplier_name, pt.name AS category_name
            FROM Products p
            JOIN Suppliers s ON p.supplier_ID = s.supplier_ID
            JOIN Product_Types pt ON p.category_ID = pt.category_ID
            WHERE p.product_ID = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).send("Product not found");
        }
        
        res.render('update-product-stock', {
            title: 'Update Product Stock',
            product: rows[0]
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error loading product");
    }
});

// Update Order Product - GET form
app.get('/update-order-product/:orderId/:productId', async function(req, res) {
    try {
        const [orderProductRows] = await db.query(`
            SELECT ohp.*, 
                   CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                   p.name AS product_name
            FROM Order_has_Products ohp
            JOIN Orders o ON ohp.order_ID = o.order_ID
            JOIN Customers c ON o.customer_ID = c.customer_ID
            JOIN Products p ON ohp.product_ID = p.product_ID
            WHERE ohp.order_ID = ? AND ohp.product_ID = ?
        `, [req.params.orderId, req.params.productId]);
        
        const [products] = await db.query('SELECT product_ID, name FROM Products');
        const [orders] = await db.query(`
            SELECT o.order_ID, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM Orders o
            JOIN Customers c ON o.customer_ID = c.customer_ID
        `);
        
        if (orderProductRows.length === 0) {
            return res.status(404).send("Order product not found");
        }
        
        res.render('update-order-product', {
            title: 'Update Order Product',
            orderProduct: orderProductRows[0],
            products: products,
            orders: orders
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error loading order product");
    }
});


// ============ UPDATE FORM HANDLERS (POST) ============

app.post('/update-customer/:id', async function(req, res) {
    try {
        const { first_name, last_name, phone_number } = req.body;
        await db.query(
            'CALL p_update_customer(?, ?, ?, ?)',
            [req.params.id, first_name, last_name, phone_number]
        );
        res.redirect('/customers');
    } catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).send("Error updating customer");
    }
});

app.post('/update-supplier/:id', async function(req, res) {
    try {
        const { name, email } = req.body;
        await db.query(
            'CALL p_update_supplier(?, ?, ?)',
            [req.params.id, name, email]
        );
        res.redirect('/suppliers');
    } catch (error) {
        console.error("Error updating supplier:", error);
        res.status(500).send("Error updating supplier");
    }
});

app.post('/update-product-stock/:id', async function(req, res) {
    try {
        const { quantity } = req.body;
        await db.query(
            'CALL p_update_product_stock(?, ?)',
            [req.params.id, quantity]
        );
        res.redirect('/products?message=Stock updated successfully');
    } catch (error) {
        console.error("Error updating product stock:", error);
        res.status(500).send("Error updating product stock");
    }
});

app.post('/update-order-product/:orderId/:productId', async function(req, res) {
    try {
        const { quantity } = req.body;
        await db.query(
            'CALL p_update_order_product(?, ?, ?)',
            [req.params.orderId, req.params.productId, quantity]
        );
        res.redirect('/order-products');
    } catch (error) {
        console.error("Error updating order product:", error);
        res.status(500).send("Error updating order product");
    }
});

// ============ RESET DATABASE ROUTE =========

app.get ('/reset-database', async function (req, res){
    try {
        const [result] = await db.query('CALL ResetDatabase()');
        res.send(`
            <h1>Database Reset Complete!</h1>
            <p>The database has been reset to its original state with all sample data.</p>
            <a href="/">Return to Home</a>
        `);
    } catch(error){
        console.error("Error resetting database:",error);
        res.status(500).send(`
            <h1>Error Resetting Database</h1>
            <p>${error.message}</p>
            <a href="/"> Return to Home</a>
        `);
    }
});

// ============ TEST DELETE ROUTE =========
app.get('/delete-test-customer', async function (req, res){
    try{
        const [result] = await db.query('CALL p_delete_customer(?)', [1]);
        res.redirect('/customers?message=Customer #1 deleted - click RESET to restore');
    } catch(error){
        console.error("Error deleting test customer", error);
        res.status(500).send("Error deleting test customer:" + error.message);
    }
});

// ============ DIAGNOSTIC ROUTE ============

app.get('/diagnostic', async function (req, res) {
    try {
        const query1 = 'DROP TABLE IF EXISTS diagnostic;';
        const query2 = 'CREATE TABLE diagnostic(id INT PRIMARY KEY AUTO_INCREMENT, text VARCHAR(255) NOT NULL);';
        const query3 = 'INSERT INTO diagnostic (text) VALUES ("MySQL and Node is working for gonzama5!");';
        const query4 = 'SELECT * FROM diagnostic;';
        
        await db.query(query1);
        await db.query(query2);
        await db.query(query3);
        const [rows] = await db.query(query4);
        
        const base = "<h1>MySQL Results:</h1>";
        res.send(base + JSON.stringify(rows));
    } catch (error) {
        console.error("Error executing queries:", error);
        res.status(500).send("An error occurred while executing the database queries.");
    }
});

/*
    LISTENER
*/

app.listen(PORT, function(){
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});