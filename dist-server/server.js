import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Detect if running in Firebase Functions
const isFirebase = process.env.FIREBASE_CONFIG || process.env.FUNCTIONS_EMULATOR;
// In Firebase Functions, the root directory is read-only except for /tmp
const dbPath = isFirebase ? '/tmp/database.db' : 'database.db';
const db = new Database(dbPath);
// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'common'))
  )
`);
// Create default admin if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!adminExists) {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('user', 'user123', 'common');
}
export const app = express();
app.use(express.json());
// Auth API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
        res.json({
            success: true,
            user: { id: user.id, username: user.username, role: user.role }
        });
    }
    else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas' });
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
    }
    catch (error) {
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
        }
        else {
            db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, id);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: 'Erro ao atualizar usuário' });
    }
});
// Only start Vite and the server if NOT running in Firebase
if (!isFirebase) {
    async function startServer() {
        // Vite middleware
        if (process.env.NODE_ENV !== 'production') {
            const { createServer: createViteServer } = await import('vite');
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: 'spa',
            });
            app.use(vite.middlewares);
        }
        else {
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
}
