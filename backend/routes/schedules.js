const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM schedules ORDER BY schedule_date, start_time'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get schedule with attendance for user view
router.get('/user', async (req, res) => {
  try {
    const members = await pool.query(
      'SELECT * FROM members WHERE show_in_schedule = true ORDER BY number ASC'
    );
    const schedules = await pool.query(
      'SELECT * FROM schedules ORDER BY schedule_date, start_time'
    );
    const attendance = await pool.query(
      `SELECT sa.schedule_id, sa.member_id, sa.attendance_status, sa.custom_text
       FROM schedule_attendance sa
       JOIN members m ON sa.member_id = m.id
       WHERE m.show_in_schedule = true`
    );
    
    // Get koubanhyou data to determine gray cells
    const koubanhyou = await pool.query(
      `SELECT k.member_id, k.song_id, k.is_assigned, m.role
       FROM koubanhyou k
       JOIN members m ON k.member_id = m.id
       WHERE k.is_assigned = true AND m.show_in_schedule = true`
    );
    
    const attendanceMap = {};
    attendance.rows.forEach(a => {
      const key = `${a.schedule_id}_${a.member_id}`;
      attendanceMap[key] = {
        status: a.attendance_status,
        text: a.custom_text
      };
    });
    
    res.json({
      members: members.rows,
      schedules: schedules.rows,
      attendance: attendanceMap,
      koubanhyou: koubanhyou.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get schedule with attendance for admin
router.get('/admin', async (req, res) => {
  try {
    const members = await pool.query(
      'SELECT * FROM members WHERE show_in_schedule = true ORDER BY number ASC'
    );
    const schedules = await pool.query(
      'SELECT * FROM schedules ORDER BY schedule_date, start_time'
    );
    const attendance = await pool.query(
      `SELECT sa.schedule_id, sa.member_id, sa.attendance_status, sa.custom_text
       FROM schedule_attendance sa
       JOIN members m ON sa.member_id = m.id
       WHERE m.show_in_schedule = true`
    );
    
    const koubanhyou = await pool.query(
      `SELECT k.member_id, k.song_id, k.is_assigned, m.role
       FROM koubanhyou k
       JOIN members m ON k.member_id = m.id
       WHERE k.is_assigned = true AND m.show_in_schedule = true`
    );
    
    const attendanceMap = {};
    attendance.rows.forEach(a => {
      const key = `${a.schedule_id}_${a.member_id}`;
      attendanceMap[key] = {
        status: a.attendance_status,
        text: a.custom_text
      };
    });
    
    res.json({
      members: members.rows,
      schedules: schedules.rows,
      attendance: attendanceMap,
      koubanhyou: koubanhyou.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create schedule
router.post('/', async (req, res) => {
  const {
    schedule_date,
    venue,
    start_time,
    end_time,
    rehearsal_type,
    rehearsal_content,
    target_songs,
    target_roles
  } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO schedules 
       (schedule_date, venue, start_time, end_time, rehearsal_type, rehearsal_content, target_songs, target_roles) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [schedule_date, venue, start_time, end_time, rehearsal_type, rehearsal_content, target_songs, target_roles]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update schedule
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    schedule_date,
    venue,
    start_time,
    end_time,
    rehearsal_type,
    rehearsal_content,
    target_songs,
    target_roles
  } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE schedules 
       SET schedule_date = $1, venue = $2, start_time = $3, end_time = $4, 
           rehearsal_type = $5, rehearsal_content = $6, target_songs = $7, 
           target_roles = $8, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [schedule_date, venue, start_time, end_time, rehearsal_type, rehearsal_content, target_songs, target_roles, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update attendance
router.post('/attendance', async (req, res) => {
  const { schedule_id, member_id, attendance_status, custom_text } = req.body;
  
  try {
    const existing = await pool.query(
      'SELECT * FROM schedule_attendance WHERE schedule_id = $1 AND member_id = $2',
      [schedule_id, member_id]
    );
    
    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE schedule_attendance 
         SET attendance_status = $1, custom_text = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE schedule_id = $3 AND member_id = $4 RETURNING *`,
        [attendance_status, custom_text, schedule_id, member_id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO schedule_attendance 
         (schedule_id, member_id, attendance_status, custom_text) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [schedule_id, member_id, attendance_status, custom_text]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get time schedule for a specific date
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM schedules 
       WHERE schedule_date = $1 
       ORDER BY venue, start_time`,
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
