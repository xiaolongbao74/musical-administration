const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const multer = require('multer');
const csv = require('csv-parser');
const { parse } = require('json2csv');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

// Get all songs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM songs ORDER BY ba, song_number');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active songs
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM songs WHERE is_active = true ORDER BY ba, song_number'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create song
router.post('/', async (req, res) => {
  const { ba, song_number, song_name, score_link, audio_link, is_active } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO songs (ba, song_number, song_name, score_link, audio_link, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [ba, song_number, song_name, score_link, audio_link, is_active ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update song
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ba, song_number, song_name, score_link, audio_link, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE songs SET ba = $1, song_number = $2, song_name = $3, score_link = $4, audio_link = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [ba, song_number, song_name, score_link, audio_link, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete song
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM songs WHERE id = $1', [id]);
    res.json({ message: 'Song deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export songs to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM songs ORDER BY ba, song_number');
    const fields = ['ba', 'song_number', 'song_name', 'score_link', 'audio_link', 'is_active'];
    const csvData = parse(result.rows, { fields });
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=songs.csv');
    res.send('\uFEFF' + csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import songs from CSV
router.post('/import/csv', upload.single('file'), async (req, res) => {
  try {
    const results = [];
    // Remove BOM if present and ensure UTF-8 encoding
    let csvContent = req.file.buffer.toString('utf-8');
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }
    const stream = Readable.from(csvContent);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const row of results) {
            await client.query(
              'INSERT INTO songs (ba, song_number, song_name, score_link, audio_link, is_active) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
              [
                row.ba,
                row.song_number,
                row.song_name,
                row.score_link || null,
                row.audio_link || null,
                row.is_active === 'true'
              ]
            );
          }
          await client.query('COMMIT');
          res.json({ message: 'Import successful', count: results.length });
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
