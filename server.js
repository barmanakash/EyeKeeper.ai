// ai-activity-tracker/server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'activity_tracker.db');

// GET: Fetch all logs
app.get('/api/logs', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  db.all('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 200', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
  db.close();
});

// GET: Fetch category stats for charts
app.get('/api/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const query = `
    SELECT category, SUM(duration_seconds) as total_duration, COUNT(*) as activity_count 
    FROM activity_logs 
    GROUP BY category
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
  db.close();
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Activity Tracker API running at http://localhost:${PORT}`);
});