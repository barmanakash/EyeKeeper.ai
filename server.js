const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database Connection
const dbPath = path.resolve(__dirname, 'activity_tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// GET: Real-time activity logs
app.get('/api/logs', (req, res) => {
  const sql = `SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET: Aggregated time metrics per category
app.get('/api/stats', (req, res) => {
  const sql = `
    SELECT category, SUM(duration_seconds) as total_duration 
    FROM activity_logs 
    GROUP BY category
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


// POST: RAG Query Handler
app.post('/api/ask', (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const queryLower = question.toLowerCase().trim();

  // Handle standard greetings cleanly
  if (['hi', 'hello', 'hye', 'hey'].includes(queryLower)) {
    return res.json({
      answer: "Hey! How can I help you analyze your screen activity today?"
    });
  }

  const sql = `
    SELECT category, SUM(duration_seconds) as total_duration, COUNT(*) as event_count 
    FROM activity_logs 
    GROUP BY category
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ answer: 'Failed to query activity logs database.' });
    }

    let reply = '';

    if (queryLower.includes('vs code') || queryLower.includes('vscode') || queryLower.includes('coding')) {
      const codingData = rows.find((r) => r.category && r.category.toLowerCase() === 'coding');
      if (codingData) {
        const mins = Math.floor(codingData.total_duration / 60);
        reply = `You have spent approximately ${mins} minutes (${codingData.total_duration} seconds) on VS Code / Coding today across ${codingData.event_count} sessions.`;
      } else {
        reply = "No active VS Code / Coding sessions recorded in today's database logs.";
      }
    } else if (queryLower.includes('browser') || queryLower.includes('chrome') || queryLower.includes('browsing')) {
      const browsingData = rows.find((r) => r.category && r.category.toLowerCase() === 'browsing');
      if (browsingData) {
        const mins = Math.floor(browsingData.total_duration / 60);
        reply = `You have spent ${mins} minutes browsing today across ${browsingData.event_count} recorded sessions.`;
      } else {
        reply = 'No browser activity logged yet today.';
      }
    } else {
      const totalSecs = rows.reduce((acc, curr) => acc + (curr.total_duration || 0), 0);
      const totalMins = Math.floor(totalSecs / 60);
      const breakdown = rows.map((r) => `${r.category}: ${Math.floor(r.total_duration / 60)}m`).join(', ');

      reply = `Based on your telemetry database, you have logged ${totalMins} total minutes today. Breakdown: ${breakdown || 'No activity'}.`;
    }

    res.json({ answer: reply });
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Activity Tracker API running at http://localhost:${PORT}`);
});