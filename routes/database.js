const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

db.run(`
  CREATE TABLE IF NOT EXISTS payment (
    id INTEGER PRIMARY KEY,
    paymentLinkId TEXT NOT NULL UNIQUE,
    time TEXT NOT NULL
  )`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Table "payment" created successfully.');
  }
})

process.on('exit', function() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Database connection closed.');
  });
});

module.exports = db