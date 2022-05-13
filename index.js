const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./tasks.db', sqlite3.OPEN_READWRITE, (err)=> {
  if (err) return console.error(err.message);
  console.log('connection successful');
})

/* Create DB with auto increment on primary key to ensure that it is always unique*/
db.run(
  'CREATE TABLE tasks(unique_id INTEGER PRIMARY KEY AUTOINCREMENT,title,created_at,completed_at)'
  );

db.close((err) => {
  if (err) return console.error(err.message);
});
