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

// Handlebars setup - DO THIS ONCE
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

// Database auto-initialization on server start
(async () => {
    try {
        console.log("Checking database state...");
        
        // Check if tables exist AND if they have the correct IDs
        const [tables] = await db.query("SHOW TABLES LIKE 'Customers'");
        let needsRefresh = false;
        
        if (tables.length > 0) {
            // Check the first customer ID - if it's not 1, we need to refresh
            const [firstCustomer] = await db.query('SELECT customer_ID FROM Customers ORDER BY customer_ID LIMIT 1');
            if (firstCustomer.length > 0 && firstCustomer[0].customer_ID !== 1) {
                console.log(`Detected incorrect IDs (starts at ${firstCustomer[0].customer_ID}). Forcing database refresh...`);
                needsRefresh = true;
            }
        }
        
        if (tables.length === 0 || needsRefresh) {
            console.log("Setting up fresh database...");
            const fs = require('fs');
            
            // disable foreign key checks to allow dropping tables in any order
            // this fixed error such as 'foreing key constain fails'
            console.log("Disabling foreign key checks...");
            await db.query('SET FOREIGN_KEY_CHECKS = 0');
            
            // Drop all tables if they exist (clean slate)
            console.log("Dropping existing tables...");
            await db.query('DROP TABLE IF EXISTS Order_has_Products');
            await db.query('DROP TABLE IF EXISTS Orders');
            await db.query('DROP TABLE IF EXISTS Products');
            await db.query('DROP TABLE IF EXISTS Suppliers');
            await db.query('DROP TABLE IF EXISTS Product_Types');
            await db.query('DROP TABLE IF EXISTS Customers');
            
            // Re-enable foreign key checks
            console.log("Re-enabling foreign key checks...");
            await db.query('SET FOREIGN_KEY_CHECKS = 1');
            
            // Now run DDL.sql to create tables fresh
            console.log("Creating tables from DDL.sql...");
            const ddl = fs.readFileSync('./DDL.sql', 'utf8');
            const ddlQueries = ddl.split(';').filter(q => q.trim());
            
            for (let query of ddlQueries) {
                if (query.trim()) {
                    try {
                        await db.query(query);
                        console.log('Executed DDL query');
                    } catch (err) {
                        console.error('Error executing DDL query:', err.message);
                    }
                }
            }
            
            // Now insert data - IDs will start at 1 because tables are fresh
            console.log("Loading sample data from inserting_data.sql...");
            const data = fs.readFileSync('./inserting_data.sql', 'utf8');
            const dataQueries = data.split(';').filter(q => q.trim());
            
            for (let query of dataQueries) {
                if (query.trim()) {
                    try {
                        await db.query(query);
                        console.log('Executed INSERT query');
                    } catch (err) {
                        console.error('Error executing INSERT query:', err.message);
                    }
                }
            }
            
            console.log("Database initialized successfully!");
            
            // Verify data was loaded
            const [customerCount] = await db.query('SELECT COUNT(*) as count FROM Customers');
            const [firstCustomer] = await db.query('SELECT customer_ID FROM Customers ORDER BY customer_ID LIMIT 1');
            console.log(`Verified: ${customerCount[0].count} customers in database, starting at ID ${firstCustomer[0].customer_ID}`);
            
        } else {
            console.log("Database ready with correct IDs");
        }
    } catch (error) {
        console.error("Error during database initialization:", error);
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
        const [rows] = await db.query('SELECT * FROM Customers ORDER BY customer_ID');
        res.render('customers', {
            title: 'Browse Customers',
            customers: rows
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).send("Error loading customers");
    }
});

// Browse Orders
app.get('/orders', async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT o.*, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM Orders o
            JOIN Customers c ON o.customer_ID = c.customer_ID
            ORDER BY o.order_ID
        `);
        res.render('orders', {
            title: 'Browse Orders',
            orders: rows
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Error loading orders");
    }
});

// Browse Products
app.get('/products', async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT p.*, s.name AS supplier_name, pt.name AS category_name
            FROM Products p
            JOIN Suppliers s ON p.supplier_ID = s.supplier_ID
            JOIN Product_Types pt ON p.category_ID = pt.category_ID
            ORDER BY p.product_ID
        `);
        res.render('products', {
            title: 'Browse Products',
            products: rows
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Error loading products");
    }
});

// Browse Product Types
app.get('/product-types', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM Product_Types ORDER BY category_ID');
        res.render('product-types', {
            title: 'Browse Product Types',
            productTypes: rows
        });
    } catch (error) {
        console.error("Error fetching product types:", error);
        res.status(500).send("Error loading product types");
    }
});

// Browse Suppliers
app.get('/suppliers', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM Suppliers ORDER BY supplier_ID');
        res.render('suppliers', {
            title: 'Browse Suppliers',
            suppliers: rows
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).send("Error loading suppliers");
    }
});

// Browse Order Products
app.get('/order-products', async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT ohp.*, 
                   CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                   p.name AS product_name,
                   o.date AS order_date
            FROM Order_has_Products ohp
            JOIN Orders o ON ohp.order_ID = o.order_ID
            JOIN Customers c ON o.customer_ID = c.customer_ID
            JOIN Products p ON ohp.product_ID = p.product_ID
            ORDER BY ohp.order_ID, ohp.product_ID
        `);
        res.render('order-products', {
            title: 'Browse Order Products',
            orderProducts: rows
        });
    } catch (error) {
        console.error("Error fetching order products:", error);
        res.status(500).send("Error loading order products");
    }
});

// Order Details
app.get('/order-details/:id', async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT ohp.*, p.name as product_name, p.price 
            FROM Order_has_Products ohp
            JOIN Products p ON ohp.product_ID = p.product_ID
            WHERE ohp.order_ID = ?
        `, [req.params.id]);
        
        // Calculate total
        let total = 0;
        rows.forEach(item => {
            total += item.quantity * item.price;
        });
        
        res.render('order-details', {
            title: `Order #${req.params.id} Details`,
            orderId: req.params.id,
            products: rows,
            total: total.toFixed(2)
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
            'INSERT INTO Customers (first_name, last_name, phone_number) VALUES (?, ?, ?)',
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
            'INSERT INTO Orders (date, customer_ID) VALUES (NOW(), ?)',
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
            'INSERT INTO Products (name, quantity, price, supplier_ID, category_ID) VALUES (?, ?, ?, ?, ?)',
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
            'INSERT INTO Product_Types (name) VALUES (?)',
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
            'INSERT INTO Suppliers (name, email) VALUES (?, ?)',
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
        
        // Check if enough stock
        const [product] = await db.query('SELECT quantity FROM Products WHERE product_ID = ?', [product_ID]);
        
        if (product[0].quantity < quantity) {
            return res.status(400).send("Not enough stock available");
        }
        
        // Start transaction
        await db.query('START TRANSACTION');
        
        // Add to order
        await db.query(
            'INSERT INTO Order_has_Products (order_ID, product_ID, quantity) VALUES (?, ?, ?)',
            [order_ID, product_ID, quantity]
        );
        
        // Update stock
        await db.query(
            'UPDATE Products SET quantity = quantity - ? WHERE product_ID = ?',
            [quantity, product_ID]
        );
        
        // Commit transaction
        await db.query('COMMIT');
        
        res.redirect('/order-products');
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error adding product to order:", error);
        res.status(500).send("Error adding product to order");
    }
});

// ============ DELETE FORM ROUTES (GET) ============

app.get('/delete-customer', async function(req, res) {
    try {
        const [customers] = await db.query('SELECT customer_ID, first_name, last_name FROM Customers');
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
        const [products] = await db.query('SELECT product_ID, name FROM Products');
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
        const [suppliers] = await db.query('SELECT supplier_ID, name FROM Suppliers');
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
        await db.query('DELETE FROM Customers WHERE customer_ID = ?', [customer_ID]);
        res.redirect('/customers');
    } catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).send("Error deleting customer");
    }
});

app.post('/delete-order', async function(req, res) {
    try {
        const { order_ID } = req.body;
        await db.query('DELETE FROM Orders WHERE order_ID = ?', [order_ID]);
        res.redirect('/orders');
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).send("Error deleting order");
    }
});

app.post('/delete-product', async function(req, res) {
    try {
        const { product_ID } = req.body;
        await db.query('DELETE FROM Products WHERE product_ID = ?', [product_ID]);
        res.redirect('/products');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Error deleting product");
    }
});

app.post('/delete-product-type', async function(req, res) {
    try {
        const { category_ID } = req.body;
        await db.query('DELETE FROM Product_Types WHERE category_ID = ?', [category_ID]);
        res.redirect('/product-types');
    } catch (error) {
        console.error("Error deleting product type:", error);
        res.status(500).send("Error deleting product type");
    }
});

app.post('/delete-supplier', async function(req, res) {
    try {
        const { supplier_ID } = req.body;
        await db.query('DELETE FROM Suppliers WHERE supplier_ID = ?', [supplier_ID]);
        res.redirect('/suppliers');
    } catch (error) {
        console.error("Error deleting supplier:", error);
        res.status(500).send("Error deleting supplier");
    }
});

app.post('/delete-order-product', async function(req, res) {
    try {
        const { order_ID, product_ID } = req.body;
        await db.query(
            'DELETE FROM Order_has_Products WHERE order_ID = ? AND product_ID = ?',
            [order_ID, product_ID]
        );
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
            'UPDATE Customers SET first_name = ?, last_name = ?, phone_number = ? WHERE customer_ID = ?',
            [first_name, last_name, phone_number, req.params.id]
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
            'UPDATE Suppliers SET name = ?, email = ? WHERE supplier_ID = ?',
            [name, email, req.params.id]
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
            'UPDATE Products SET quantity = ? WHERE product_ID = ?',
            [quantity, req.params.id]
        );
        res.redirect('/products');
    } catch (error) {
        console.error("Error updating product stock:", error);
        res.status(500).send("Error updating product stock");
    }
});

app.post('/update-order-product/:orderId/:productId', async function(req, res) {
    try {
        const { quantity } = req.body;
        await db.query(
            'UPDATE Order_has_Products SET quantity = ? WHERE order_ID = ? AND product_ID = ?',
            [quantity, req.params.orderId, req.params.productId]
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
            <p>Result: ${JSON.stringify(result[0])}</p>
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