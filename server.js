const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize the Express server
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Define the path to the SQLite database
const dbPath = 'alerts_data.db';

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Endpoint to get all weather alerts with pagination
app.get('/weatherGovAlerts', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  db.all('SELECT * FROM weatherGovAlerts ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      db.get('SELECT COUNT(*) as count FROM weatherGovAlerts', (err, result) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json({
            data: rows,
            total: result.count
          });
        }
      });
    }
  });
});


// Endpoint to get all NASA fire alerts with pagination
app.get('/nasaFireAlerts', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  db.all('SELECT * FROM nasaFireAlerts ORDER BY date DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      db.get('SELECT COUNT(*) as count FROM nasaFireAlerts', (err, result) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json({
            data: rows,
            total: result.count
          });
        }
      });
    }
  });
});


// Endpoint to get analytics data
app.get('/analytics', (req, res) => {
  db.all('SELECT * FROM analytics', [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      const analytics = {};
      rows.forEach(row => {
        analytics[row.key] = JSON.parse(row.value);
      });
      res.json(analytics);
    }
  });
});

// Endpoint to add a new weather alert
app.post('/weatherGovAlerts', (req, res) => {
  const { tweet_id, tweet_text, created_at, author_id, author_name, event_details, tags, tweet_url, media_urls, conversational_message } = req.body;
  const query = `INSERT INTO weatherGovAlerts (tweet_id, tweet_text, created_at, author_id, author_name, event_details, tags, tweet_url, media_urls, conversational_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [tweet_id, tweet_text, created_at, author_id, author_name, event_details, tags, tweet_url, media_urls, conversational_message];
  
  db.run(query, params, function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
});

// Endpoint to add a new NASA fire alert
app.post('/nasaFireAlerts', (req, res) => {
  const { title, description, category, latitude, longitude, date, conversational_message, tags } = req.body;
  const tagsString = Array.isArray(tags) ? tags.join(', ') : tags ? tags.toString() : null;
  const query = `UPDATE nasaFireAlerts SET title = ?, description = ?, category = ?, latitude = ?, longitude = ?, date = ?, conversational_message = ?, tags = ? WHERE id = ?`;
  const params = [title || null, description, category, latitude, longitude, date, conversational_message, tagsString, id];


  
  db.run(query, params, function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
});

// Endpoint to update a weather alert
app.put('/weatherGovAlerts/:id', (req, res) => {
  const { id } = req.params;
  const { tweet_id, tweet_text, created_at, author_id, author_name, event_details, tags, tweet_url, media_urls, conversational_message } = req.body;
  const tagsString = Array.isArray(tags) ? tags.join(', ') : tags ? tags.toString() : null;
  const query = `UPDATE weatherGovAlerts SET tweet_id = ?, tweet_text = ?, created_at = ?, author_id = ?, author_name = ?, event_details = ?, tags = ?, tweet_url = ?, media_urls = ?, conversational_message = ? WHERE id = ?`;
  const params = [tweet_id, tweet_text, created_at, author_id, author_name, event_details || null, tagsString, tweet_url, media_urls, conversational_message, id];


  db.run(query, params, function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else if (this.changes === 0) {
      res.status(404).send('Not Found');
    } else {
      res.status(200).json({ updatedID: id });
    }
  });
});

// Endpoint to update a NASA fire alert
app.put('/nasaFireAlerts/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, category, latitude, longitude, date, conversational_message, tags } = req.body;
  const query = `UPDATE nasaFireAlerts SET title = ?, description = ?, category = ?, latitude = ?, longitude = ?, date = ?, conversational_message = ?, tags = ? WHERE id = ?`;
  const params = [title, description, category, latitude, longitude, date, conversational_message, tags, id];
  
  db.run(query, params, function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else if (this.changes === 0) {
      res.status(404).send('Not Found');
    } else {
      res.status(200).json({ updatedID: id });
    }
  });
});

// Endpoint to clear the database
app.post('/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM weatherGovAlerts');
    db.run('DELETE FROM nasaFireAlerts');
    db.run('DELETE FROM analytics');
  });
  res.sendStatus(200);
});

// Start the server
const PORT = process.env.PORT || 3337;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
