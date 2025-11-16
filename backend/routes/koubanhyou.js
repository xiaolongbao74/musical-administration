const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get koubanhyou matrix for user view
router.get('/user', async (req, res) => {
  try {
    const members = await pool.query(
      'SELECT * FROM members WHERE show_in_koubanhyou = true ORDER BY number ASC'
    );
    const songs = await pool.query(
      'SELECT * FROM songs WHERE is_active = true ORDER BY CAST(song_number AS INTEGER), ba'
    );
    const assignments = await pool.query(
      `SELECT k.member_id, k.song_id, k.is_assigned 
       FROM koubanhyou k
       JOIN members m ON k.member_id = m.id
       JOIN songs s ON k.song_id = s.id
       WHERE m.show_in_koubanhyou = true AND s.is_active = true`
    );
    
    const matrix = {};
    assignments.rows.forEach(a => {
      const key = `${a.member_id}_${a.song_id}`;
      matrix[key] = a.is_assigned;
    });
    
    res.json({ members: members.rows, songs: songs.rows, matrix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get koubanhyou matrix for admin
router.get('/admin', async (req, res) => {
  try {
    const members = await pool.query(
      'SELECT * FROM members WHERE show_in_koubanhyou = true ORDER BY number ASC'
    );
    const songs = await pool.query(
      'SELECT * FROM songs WHERE is_active = true ORDER BY CAST(song_number AS INTEGER), ba'
    );
    const assignments = await pool.query(
      `SELECT k.member_id, k.song_id, k.is_assigned 
       FROM koubanhyou k
       JOIN members m ON k.member_id = m.id
       JOIN songs s ON k.song_id = s.id
       WHERE m.show_in_koubanhyou = true AND s.is_active = true`
    );
    
    const matrix = {};
    assignments.rows.forEach(a => {
      const key = `${a.member_id}_${a.song_id}`;
      matrix[key] = a.is_assigned;
    });
    
    res.json({ members: members.rows, songs: songs.rows, matrix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle assignment
router.post('/toggle', async (req, res) => {
  const { member_id, song_id } = req.body;
  try {
    const existing = await pool.query(
      'SELECT * FROM koubanhyou WHERE member_id = $1 AND song_id = $2',
      [member_id, song_id]
    );
    
    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE koubanhyou SET is_assigned = NOT is_assigned, updated_at = CURRENT_TIMESTAMP WHERE member_id = $1 AND song_id = $2 RETURNING *',
        [member_id, song_id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        'INSERT INTO koubanhyou (member_id, song_id, is_assigned) VALUES ($1, $2, true) RETURNING *',
        [member_id, song_id]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assignments for specific member
router.get('/member/:memberId', async (req, res) => {
  const { memberId } = req.params;
  try {
    const result = await pool.query(
      `SELECT s.*, k.is_assigned 
       FROM songs s
       LEFT JOIN koubanhyou k ON s.id = k.song_id AND k.member_id = $1
       WHERE s.is_active = true
       ORDER BY CAST(s.song_number AS INTEGER), s.ba`,
      [memberId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
