import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cloudinary Configuration
const cloudName = 'djeca9ngr';
const apiKey = '327899453725446';
const apiSecret = 'Yd_W7W4eORYMqx6ucJiczSg_2FU';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

console.log(`Cloudinary configurado para: ${cloudName}`);

const dbPath = path.join(__dirname, 'database.db');
console.log(`Using database at: ${dbPath}`);

let db: any;
try {
  db = new Database(dbPath);
  console.log('Database connected successfully');
} catch (err) {
  console.error('Failed to connect to database:', err);
  process.exit(1);
}

// Initialize SQLite database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      role TEXT CHECK(role IN ('admin', 'common'))
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      razaoSocial TEXT NOT NULL,
      cnpj TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS colaboradores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT,
      cargo TEXT,
      cnh TEXT,
      validadeCnh TEXT
    );

    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marcaModelo TEXT NOT NULL,
      placa TEXT NOT NULL,
      renavam TEXT,
      cor TEXT,
      anoModelo TEXT
    );
  `);
  console.log('Database schema initialized');
} catch (err) {
  console.error('Failed to initialize database schema:', err);
  process.exit(1);
}

// Seed initial data for empresas if empty
const empresasCount = db.prepare('SELECT COUNT(*) as count FROM empresas').get() as { count: number };
if (empresasCount.count === 0) {
  const stmt = db.prepare('INSERT INTO empresas (razaoSocial, cnpj) VALUES (?, ?)');
  stmt.run('AJM CONDOMINIOS', '05.457.890/0001-89');
  stmt.run('PORTARE SERVICOS DE PORTARIA LTDA', '31.369.594/0001-36');
  stmt.run('VILLA HUB CLEAN', '27.936.075/0001-35');
  stmt.run('UNIQ SERVICOS DE LIMPEZA CONSERVACAO E PORTARIA LTDA', '34.172.214/0001-67');
}

// Seed initial data for veiculos if empty
const veiculosCount = db.prepare('SELECT COUNT(*) as count FROM veiculos').get() as { count: number };
if (veiculosCount.count === 0) {
  const stmt = db.prepare('INSERT INTO veiculos (marcaModelo, placa, renavam, cor, anoModelo) VALUES (?, ?, ?, ?, ?)');
  stmt.run('FIAT STRADA ENDURAN CS13', 'TAH 3G05', '01409350433', 'PRETA', '2024');
  stmt.run('FIAT MOBI LIKE', 'TAD 8E69', '01412558546', 'PRETA', '2024');
}

export const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Specific error handler for body-parser (to catch 'Payload Too Large' and return JSON)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: 'JSON Inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'A imagem é muito grande. O limite é 50MB.' });
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cloudinary Upload Endpoint
app.post('/api/upload', async (req, res) => {
  const { image } = req.body;
  try {
    if (!image) {
      return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada' });
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'checklists',
      resource_type: 'auto',
    });

    res.json({ 
      success: true, 
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id 
    });
  } catch (error: any) {
    console.error('Erro detalhado Cloudinary:', error);
    // Retorna o erro específico do Cloudinary para facilitar o diagnóstico
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Falha no upload para nuvem',
      details: error
    });
  }
});

// --- Registrations API (Empresas, Colaboradores, Veículos) ---

// Empresas
app.get('/api/empresas', async (req, res) => {
  res.json(db.prepare('SELECT * FROM empresas').all());
});

app.post('/api/empresas', async (req, res) => {
  const { razaoSocial, cnpj } = req.body;
  try {
    const result = db.prepare('INSERT INTO empresas (razaoSocial, cnpj) VALUES (?, ?)').run(razaoSocial, cnpj);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao salvar empresa' });
  }
});

app.put('/api/empresas/:id', async (req, res) => {
  const { razaoSocial, cnpj } = req.body;
  try {
    db.prepare('UPDATE empresas SET razaoSocial = ?, cnpj = ? WHERE id = ?').run(razaoSocial, cnpj, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar empresa' });
  }
});

app.delete('/api/empresas/:id', async (req, res) => {
  try {
    db.prepare('DELETE FROM empresas WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao excluir empresa' });
  }
});

// Colaboradores
app.get('/api/colaboradores', async (req, res) => {
  res.json(db.prepare('SELECT * FROM colaboradores').all());
});

app.post('/api/colaboradores', async (req, res) => {
  const { nome, cpf, cargo, cnh, validadeCnh } = req.body;
  try {
    const result = db.prepare('INSERT INTO colaboradores (nome, cpf, cargo, cnh, validadeCnh) VALUES (?, ?, ?, ?, ?)').run(nome, cpf, cargo, cnh, validadeCnh);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao salvar colaborador' });
  }
});

app.put('/api/colaboradores/:id', async (req, res) => {
  const { nome, cpf, cargo, cnh, validadeCnh } = req.body;
  try {
    db.prepare('UPDATE colaboradores SET nome = ?, cpf = ?, cargo = ?, cnh = ?, validadeCnh = ? WHERE id = ?').run(nome, cpf, cargo, cnh, validadeCnh, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar colaborador' });
  }
});

app.delete('/api/colaboradores/:id', async (req, res) => {
  try {
    db.prepare('DELETE FROM colaboradores WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao excluir colaborador' });
  }
});

// Veículos
app.get('/api/veiculos', async (req, res) => {
  res.json(db.prepare('SELECT * FROM veiculos').all());
});

app.post('/api/veiculos', async (req, res) => {
  const { marcaModelo, placa, renavam, cor, anoModelo } = req.body;
  try {
    const result = db.prepare('INSERT INTO veiculos (marcaModelo, placa, renavam, cor, anoModelo) VALUES (?, ?, ?, ?, ?)').run(marcaModelo, placa, renavam, cor, anoModelo);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao salvar veículo' });
  }
});

app.put('/api/veiculos/:id', async (req, res) => {
  const { marcaModelo, placa, renavam, cor, anoModelo } = req.body;
  try {
    db.prepare('UPDATE veiculos SET marcaModelo = ?, placa = ?, renavam = ?, cor = ?, anoModelo = ? WHERE id = ?').run(marcaModelo, placa, renavam, cor, anoModelo, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar veículo' });
  }
});

app.delete('/api/veiculos/:id', async (req, res) => {
  try {
    db.prepare('DELETE FROM veiculos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao excluir veículo' });
  }
});

// --- End Registrations API ---

// Checklists API
app.post('/api/checklists', async (req, res) => {
  const { userId, ...checklistData } = req.body;
  try {
    const data = JSON.stringify(checklistData);
    const result = db.prepare('INSERT INTO checklists (user_id, data) VALUES (?, ?)').run(userId, data);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao salvar checklist' });
  }
});

app.get('/api/checklists', async (req, res) => {
  const { userId, role } = req.query;
  try {
    const checklists = db.prepare(`
      SELECT c.*, u.username as creator_name 
      FROM checklists c 
      LEFT JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC
    `).all();

    res.json(checklists.map((c: any) => ({
      id: c.id,
      created_at: c.created_at,
      creator_name: c.creator_name,
      data: JSON.parse(c.data)
    })));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao buscar checklists' });
  }
});

app.get('/api/checklists/:id', async (req, res) => {
  const { id } = req.params;
  try {
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

app.put('/api/checklists/:id', async (req, res) => {
  const { id } = req.params;
  const checklistData = req.body;
  try {
    const data = JSON.stringify(checklistData);
    db.prepare('UPDATE checklists SET data = ? WHERE id = ?').run(data, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar checklist' });
  }
});

app.delete('/api/checklists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM checklists WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao excluir checklist' });
  }
});

// Sync user from Firebase to SQLite
app.post('/api/sync-user', async (req, res) => {
  const { id, username, role } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      // Check if it's the first user or if it's a known admin email
      const isFirstUser = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count === 0;
      const finalRole = isFirstUser || username === 'admin@exemplo.com' ? 'admin' : (role || 'common');
      
      db.prepare('INSERT INTO users (id, username, role) VALUES (?, ?, ?)').run(id, username, finalRole);
      res.json({ success: true, user: { id, username, role: finalRole } });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao sincronizar usuário' });
  }
});

// User Management API (Admin only)
app.get('/api/users', async (req, res) => {
  const users = db.prepare('SELECT id, username, role FROM users').all();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const { id, username, role } = req.body;
  try {
    db.prepare('INSERT INTO users (id, username, role) VALUES (?, ?, ?)').run(id, username, role);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Erro ao criar usuário' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;
  try {
    db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Erro ao atualizar usuário' });
  }
});

async function startServer() {
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

