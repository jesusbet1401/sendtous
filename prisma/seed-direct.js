const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
    // Check if user exists
    const row = db.prepare('SELECT id FROM User LIMIT 1').get();

    if (row) {
        console.log('Existing user ID:', row.id);
    } else {
        const id = 'cm5v7x9x0000008l3f9x00000'; // Pre-generated CUID-like
        const now = new Date().toISOString();

        db.prepare(`
      INSERT INTO User (id, email, name, role, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, 'admin@hifi.cl', 'Admin User', 'ADMIN', 'password123', now, now);

        console.log('Created user ID:', id);
    }
} catch (error) {
    console.error('Error seeding user:', error);
} finally {
    db.close();
}
