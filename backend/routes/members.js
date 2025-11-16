const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const multer = require('multer');
const csv = require('csv-parser');
const { parse } = require('json2csv');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

// Get all members
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM members ORDER BY number ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get members for koubanhyou
router.get('/koubanhyou', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM members WHERE show_in_koubanhyou = true ORDER BY number ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get members for schedule
router.get('/schedule', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM members WHERE show_in_schedule = true ORDER BY number ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create member
router.post('/', async (req, res) => {
  const { number, role, name, show_in_koubanhyou, show_in_schedule } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO members (number, role, name, show_in_koubanhyou, show_in_schedule) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [number, role, name, show_in_koubanhyou ?? true, show_in_schedule ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { number, role, name, show_in_koubanhyou, show_in_schedule } = req.body;
  try {
    const result = await pool.query(
      'UPDATE members SET number = $1, role = $2, name = $3, show_in_koubanhyou = $4, show_in_schedule = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [number, role, name, show_in_koubanhyou, show_in_schedule, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM members WHERE id = $1', [id]);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export members to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY number ASC');
    const fields = ['number', 'role', 'name', 'show_in_koubanhyou', 'show_in_schedule'];
    const csvData = parse(result.rows, { fields });
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=members.csv');
    res.send('\uFEFF' + csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import members from CSV
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
              'INSERT INTO members (number, role, name, show_in_koubanhyou, show_in_schedule) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
              [
                parseInt(row.number),
                row.role,
                row.name,
                row.show_in_koubanhyou === 'true',
                row.show_in_schedule === 'true'
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
