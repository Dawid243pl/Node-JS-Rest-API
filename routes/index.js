var express = require('express');
var router = express.Router();
var cors = require('cors')
const sqlite3 = require('sqlite3').verbose();

router.use(cors())

const db = new sqlite3.Database('./tasks.db', sqlite3.OPEN_READWRITE, (err)=> {
  if (err) return console.error(err.message);
  console.log('connection to task_db database successful');
})

/* Function to fromat date to easly stored the desired format in db */
const formatDate = () => {
  let d = new Date();
  let month = (d.getMonth() + 1).toString();
  let day = d.getDate().toString();
  let year = d.getFullYear();
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return day + month + year
}

 /* GET All tasks */
router.get('/tasks', (req, res) => {

  const query = req.query;

  // save conditions and values to use inside a loop later for sql query
  const conditions = [];
  const values = [];

  if (req.query.status) { 

    conditions.push('completed_at')

    if (query.status == 'pending') {
      values.push('is NULL')
    }  else if (query.status == 'complete') {
      values.push('is NOT NULL')
    }
  }
  if (req.query.date_min) { 
    conditions.push('created_at')
    values.push(">="+req.query.date_min)
  }

  if (req.query.date_max) { 
    conditions.push('created_at')
    values.push("<="+req.query.date_max)
  }

  let sql = "SELECT * FROM tasks "
  + (conditions.length ? ("WHERE ") : "")

  // build up sql query depending on values and conditions
  for (let index = 0; index < conditions.length; index++) {
    sql += conditions[index]
    sql += ' '
    sql += values[index]
    if (conditions[index + 1]) {
      sql += ' AND '
    }
  }
  db.all(sql, [], (err, rows) => {
    if (err) return console.error(err.message);
    const tasks = rows.map((row) => {
			return {
				unique_id: row.unique_id,
				title: row.title,
				created_at: row.created_at,
				completed_at: row.completed_at
			}
		})
		res.json(tasks);
  })
});

/* Get a single task by its ID */
router.get("/tasks/:id", (req, res) => {
  const query = req.query;

  const taskID = req.params.id

  db.get(`SELECT * FROM tasks where unique_id =?`, [taskID], (err, row) => {
      if (err) {
        res.status(400).json({"error":err.message});
        return;
      }
      res.json(row);
    });
});

/* Create a task */
router.post('/tasks', function(req,res){

  let today = formatDate()

  if (!req.body.completed_at) {
    req.body.completed_at = null
  } else {
    req.body.completed_at = today
  }

  db.serialize(()=>{
    db.run('INSERT INTO tasks(title,created_at,completed_at) VALUES(?,?,?)', [req.body.title,parseInt(today), req.body.completed_at], function(err) {
      if (err) {
        return console.log(err.message);
      }
      res.send("New Task has been added into the database with ID = "+ req.body.unique_id+ " and Name = "+req.body.title);
    });
  });
});

/* Update a task with given ID*/
router.put('/tasks/:id', function(req,res){
  const taskID = req.params.id

  let today = null
  if (req.body.completed_at) {
    today = formatDate()
  }

  db.serialize(()=>{
    db.run('UPDATE tasks SET title = ?, completed_at =? where unique_id = ?', [req.body.title,today,taskID], function(err){
      if(err){
        res.send("Error encountered while updating");
        return console.error(err.message);
      }
      res.send("Entry updated successfully");
    });
  });
});

/* Delete Task with the specified ID */
router.delete('/tasks/:id', function(req,res){
  const taskID = req.params.id
  db.serialize(()=>{
    db.run('DELETE FROM tasks WHERE unique_id = ?', [taskID], function(err) {
      if (err) {
        res.send("Error encountered while deleting");
        return console.error(err.message);
      }
      res.send("Entry deleted");
    });
  });
});

module.exports = router;
