import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pos.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS perfumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price INTEGER NOT NULL,
    icon TEXT,
    gradient TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    store_id INTEGER,
    perfume_id INTEGER,
    stock_ml INTEGER DEFAULT 0,
    PRIMARY KEY (store_id, perfume_id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    user_id INTEGER,
    total_amount INTEGER,
    discount_amount INTEGER,
    payment_amount INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    perfume_id INTEGER,
    qty_ml INTEGER,
    price_per_ml INTEGER,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'staff',
    password TEXT,
    store_id INTEGER,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS stock_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_store_id INTEGER,
    to_store_id INTEGER,
    perfume_id INTEGER,
    qty_ml INTEGER,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_store_id) REFERENCES stores(id),
    FOREIGN KEY (to_store_id) REFERENCES stores(id),
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id)
  );
`);

// Check if store_id column exists in users table (migration)
const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
if (!userColumns.some(col => col.name === 'store_id')) {
  db.exec("ALTER TABLE users ADD COLUMN store_id INTEGER REFERENCES stores(id)");
}

// Check if user_id column exists in transactions table (migration)
const transactionColumns = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
if (!transactionColumns.some(col => col.name === 'user_id')) {
  db.exec("ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id)");
}

// Seed initial data if empty
const storeCount = db.prepare("SELECT COUNT(*) as count FROM stores").get() as { count: number };
if (storeCount.count === 0) {
  db.prepare("INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)").run("Cabang Pusat - Jakarta", "Jl. Kemang Raya No. 45, Jakarta Selatan", "021-7654-3210");
  db.prepare("INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)").run("Cabang Bandung", "Jl. Braga No. 78, Bandung", "022-8765-4321");
  db.prepare("INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)").run("Cabang Surabaya", "Jl. Tunjungan No. 56, Surabaya", "031-9876-5432");

  db.prepare("INSERT INTO users (name, email, role, password, store_id) VALUES (?, ?, ?, ?, ?)").run("Admin Utama", "admin@aroma.com", "admin", "admin123", null);
  db.prepare("INSERT INTO users (name, email, role, password, store_id) VALUES (?, ?, ?, ?, ?)").run("Staff Jakarta", "staff.jkt@aroma.com", "staff", "staff123", 1);

  const perfumes = [
    { name: "Chanel N°5 Inspired", category: "Floral", price: 5000, icon: "🌸", gradient: "from-pink-100 to-pink-200" },
    { name: "Dior Sauvage Inspired", category: "Fresh", price: 4500, icon: "🍊", gradient: "from-amber-100 to-amber-200" },
    { name: "Tom Ford Oud Inspired", category: "Woody", price: 7500, icon: "💜", gradient: "from-purple-100 to-purple-200" },
    { name: "Acqua di Gio Inspired", category: "Aquatic", price: 4000, icon: "🌊", gradient: "from-blue-100 to-blue-200" },
    { name: "Miss Dior Inspired", category: "Floral", price: 4500, icon: "🌹", gradient: "from-rose-100 to-rose-200" },
  ];

  const insertPerfume = db.prepare("INSERT INTO perfumes (name, category, price, icon, gradient) VALUES (?, ?, ?, ?, ?)");
  const insertInventory = db.prepare("INSERT INTO inventory (store_id, perfume_id, stock_ml) VALUES (?, ?, ?)");

  perfumes.forEach(p => {
    const result = insertPerfume.run(p.name, p.category, p.price, p.icon, p.gradient);
    const perfumeId = result.lastInsertRowid;
    // Add stock to all stores
    [1, 2, 3].forEach(storeId => {
      insertInventory.run(storeId, perfumeId, 1000 + Math.floor(Math.random() * 2000));
    });
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/stores", (req, res) => {
    const stores = db.prepare("SELECT * FROM stores").all();
    res.json({ stores });
  });

  app.post("/api/stores", (req, res) => {
    const { name, address, phone } = req.body;
    try {
      const result = db.prepare("INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)").run(name, address, phone);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/stores/:id", (req, res) => {
    const { name, address, phone } = req.body;
    try {
      db.prepare("UPDATE stores SET name = ?, address = ?, phone = ? WHERE id = ?").run(name, address, phone, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/stores/:id", (req, res) => {
    db.prepare("DELETE FROM stores WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/perfumes", (req, res) => {
    const storeId = req.query.store_id;
    let perfumes;
    if (storeId) {
      perfumes = db.prepare(`
        SELECT p.*, i.stock_ml as stock 
        FROM perfumes p 
        JOIN inventory i ON p.id = i.perfume_id 
        WHERE i.store_id = ?
      `).all(storeId);
    } else {
      perfumes = db.prepare("SELECT * FROM perfumes").all();
    }
    res.json({ perfumes });
  });

  app.post("/api/perfumes", (req, res) => {
    const { name, category, price, icon, gradient } = req.body;
    try {
      const result = db.prepare("INSERT INTO perfumes (name, category, price, icon, gradient) VALUES (?, ?, ?, ?, ?)").run(name, category, price, icon, gradient);
      const perfumeId = result.lastInsertRowid;
      
      // Initialize inventory for all stores
      const stores = db.prepare("SELECT id FROM stores").all() as { id: number }[];
      const insertInv = db.prepare("INSERT INTO inventory (store_id, perfume_id, stock_ml) VALUES (?, ?, ?)");
      stores.forEach(s => insertInv.run(s.id, perfumeId, 0));
      
      res.json({ success: true, id: perfumeId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/perfumes/:id", (req, res) => {
    const { name, category, price, icon, gradient } = req.body;
    try {
      db.prepare("UPDATE perfumes SET name = ?, category = ?, price = ?, icon = ?, gradient = ? WHERE id = ?")
        .run(name, category, price, icon, gradient, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/perfumes/:id", (req, res) => {
    db.prepare("DELETE FROM perfumes WHERE id = ?").run(req.params.id);
    db.prepare("DELETE FROM inventory WHERE perfume_id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/checkout", (req, res) => {
    const { store_id, user_id, total_amount, discount_amount, payment_amount, items } = req.body;
    
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO transactions (store_id, user_id, total_amount, discount_amount, payment_amount)
        VALUES (?, ?, ?, ?, ?)
      `).run(store_id, user_id, total_amount, discount_amount, payment_amount);
      
      const transactionId = result.lastInsertRowid;
      
      const insertItem = db.prepare(`
        INSERT INTO transaction_items (transaction_id, perfume_id, qty_ml, price_per_ml)
        VALUES (?, ?, ?, ?)
      `);
      
      const updateStock = db.prepare(`
        UPDATE inventory SET stock_ml = stock_ml - ? 
        WHERE store_id = ? AND perfume_id = ?
      `);
      
      for (const item of items) {
        insertItem.run(transactionId, item.perfume_id, item.qty_ml, item.price_per_ml);
        updateStock.run(item.qty_ml, store_id, item.perfume_id);
      }
      
      return transactionId;
    });

    try {
      const transactionId = transaction();
      res.json({ success: true, transaction_id: transactionId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/reports/sales", (req, res) => {
    const { store_id } = req.query;
    let query = "SELECT t.*, s.name as store_name, u.name as user_name FROM transactions t JOIN stores s ON t.store_id = s.id LEFT JOIN users u ON t.user_id = u.id";
    let params: any[] = [];
    if (store_id) {
      query += " WHERE t.store_id = ?";
      params.push(store_id);
    }
    query += " ORDER BY t.created_at DESC";
    const transactions = db.prepare(query).all(...params);
    res.json({ transactions });
  });

  app.get("/api/stock-matrix", (req, res) => {
    const stores = db.prepare("SELECT id, name FROM stores").all();
    const perfumes = db.prepare("SELECT id, name, category, icon FROM perfumes").all();
    const inventory = db.prepare("SELECT * FROM inventory").all();

    const matrix = perfumes.map((p: any) => {
      const stocks: any = {};
      let totalStock = 0;
      inventory.filter((i: any) => i.perfume_id === p.id).forEach((i: any) => {
        stocks[i.store_id] = i.stock_ml;
        totalStock += i.stock_ml;
      });
      return { ...p, stocks, total_stock: totalStock };
    });

    res.json({ stores, perfumes: matrix });
  });

  app.post("/api/stock-transfer", (req, res) => {
    const { from_store_id, to_store_id, perfume_id, qty_ml } = req.body;
    
    const transfer = db.transaction(() => {
      // Deduct from source
      db.prepare("UPDATE inventory SET stock_ml = stock_ml - ? WHERE store_id = ? AND perfume_id = ?")
        .run(qty_ml, from_store_id, perfume_id);
      
      // Add to destination
      db.prepare("UPDATE inventory SET stock_ml = stock_ml + ? WHERE store_id = ? AND perfume_id = ?")
        .run(qty_ml, to_store_id, perfume_id);
      
      // Log transfer
      const result = db.prepare("INSERT INTO stock_transfers (from_store_id, to_store_id, perfume_id, qty_ml) VALUES (?, ?, ?, ?)")
        .run(from_store_id, to_store_id, perfume_id, qty_ml);
      
      return result.lastInsertRowid;
    });

    try {
      const transferId = transfer();
      res.json({ success: true, id: transferId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/stock-transfers", (req, res) => {
    const transfers = db.prepare(`
      SELECT st.*, 
             s1.name as from_store_name, 
             s2.name as to_store_name, 
             p.name as perfume_name 
      FROM stock_transfers st
      JOIN stores s1 ON st.from_store_id = s1.id
      JOIN stores s2 ON st.to_store_id = s2.id
      JOIN perfumes p ON st.perfume_id = p.id
      ORDER BY st.created_at DESC
    `).all();
    res.json({ transfers });
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role FROM users").all();
    res.json({ users });
  });

  app.post("/api/users", (req, res) => {
    const { name, email, role, password } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)").run(name, email, role, password);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Email sudah terdaftar. Gunakan email lain." });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { name, email, role } = req.body;
    try {
      db.prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?").run(name, email, role, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Email sudah terdaftar. Gunakan email lain." });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
