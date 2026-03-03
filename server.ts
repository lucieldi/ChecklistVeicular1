import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = 'database.db';
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'common'))
  );

  CREATE TABLE IF NOT EXISTS checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create default admin if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin@exemplo.com');
if (!adminExists) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin@exemplo.com', 'admin123', 'admin');
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('user@exemplo.com', 'user123', 'common');
}

// Remove old 'admin' and 'user' accounts if they exist
db.prepare("DELETE FROM users WHERE username IN ('admin', 'user')").run();

export const app = express();
app.use(express.json());

// Checklists API
app.post('/api/checklists', (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    const result = db.prepare('INSERT INTO checklists (data) VALUES (?)').run(data);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao salvar checklist' });
  }
});

app.get('/api/checklists', (req, res) => {
  try {
    const checklists = db.prepare('SELECT * FROM checklists ORDER BY created_at DESC').all();
    res.json(checklists.map((c: any) => ({
      id: c.id,
      created_at: c.created_at,
      data: JSON.parse(c.data)
    })));
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao buscar checklists' });
  }
});

app.get('/api/checklists/:id', (req, res) => {
  try {
    const { id } = req.params;
    const checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(id) as any;
    if (checklist) {
      res.json({
        id: checklist.id,
        created_at: checklist.created_at,
        data: JSON.parse(checklist.data)
      });
    } else {
      res.status(404).json({ success: false, message: 'Checklist não encontrado' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao buscar checklist' });
  }
});

app.put('/api/checklists/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = JSON.stringify(req.body);
    db.prepare('UPDATE checklists SET data = ? WHERE id = ?').run(data, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar checklist' });
  }
});

app.delete('/api/checklists/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM checklists WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao excluir checklist' });
  }
});

// Auth API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;
  
  if (user) {
    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role } 
    });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
});

app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  try {
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role || 'common');
    res.json({ 
      success: true, 
      user: { id: result.lastInsertRowid, username, role: role || 'common' } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Usuário já existe' });
  }
});

// User Management API (Admin only)
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, role FROM users').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { username, password, role } = req.body;
  try {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Usuário já existe' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  try {
    if (password) {
      db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?').run(username, password, role, id);
    } else {
      db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Erro ao atualizar usuário' });
  }
});

async function startServer() {
  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
