const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const multer = require('multer');
const csv = require('csv-parser');
const { parse } = require('json2csv');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

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

// Export schedules to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM schedules ORDER BY schedule_date, start_time');
    
    // Convert arrays to JSON strings for CSV compatibility
    const csvData = result.rows.map(row => ({
      ...row,
      schedule_date: row.schedule_date ? new Date(row.schedule_date).toISOString().split('T')[0] : '',
      target_songs: row.target_songs ? JSON.stringify(row.target_songs) : '',
      target_roles: row.target_roles ? JSON.stringify(row.target_roles) : ''
    }));
    
    const fields = ['schedule_date', 'venue', 'start_time', 'end_time', 'rehearsal_type', 'rehearsal_content', 'target_songs', 'target_roles'];
    const csv = parse(csvData, { fields });
    
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=schedules.csv');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import schedules from CSV
router.post('/import/csv', upload.single('file'), async (req, res) => {
  try {
    const results = [];
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
          
          let inserted = 0;
          let updated = 0;
          
          for (const row of results) {
            // Parse date - support both YYYY/MM/DD and YYYY-MM-DD formats
            let scheduleDate = null;
            if (row.schedule_date) {
              const dateStr = row.schedule_date.trim();
              // Convert YYYY/MM/DD to YYYY-MM-DD
              if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  scheduleDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
              } else {
                scheduleDate = dateStr;
              }
            }
            
            // Parse JSON arrays
            let targetSongs = null;
            let targetRoles = null;
            
            try {
              if (row.target_songs && row.target_songs.trim()) {
                // Remove any extra quotes and whitespace
                const songsStr = row.target_songs.trim().replace(/^["']|["']$/g, '');
                targetSongs = JSON.parse(songsStr);
                console.log('Parsed target_songs:', targetSongs);
              }
            } catch (e) {
              console.error('Error parsing target_songs:', row.target_songs, e);
            }
            
            try {
              if (row.target_roles && row.target_roles.trim()) {
                // Remove any extra quotes and whitespace
                const rolesStr = row.target_roles.trim().replace(/^["']|["']$/g, '');
                targetRoles = JSON.parse(rolesStr);
                console.log('Parsed target_roles:', targetRoles);
              }
            } catch (e) {
              console.error('Error parsing target_roles:', row.target_roles, e);
            }
            
            // Check if schedule already exists (same date, venue, and start time)
            const existing = await client.query(
              'SELECT id FROM schedules WHERE schedule_date = $1 AND venue = $2 AND start_time = $3',
              [scheduleDate, row.venue, row.start_time]
            );
            
            if (existing.rows.length > 0) {
              // Update existing schedule
              await client.query(
                `UPDATE schedules 
                 SET end_time = $1, rehearsal_type = $2, rehearsal_content = $3, 
                     target_songs = $4, target_roles = $5, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $6`,
                [
                  row.end_time || null,
                  row.rehearsal_type || null,
                  row.rehearsal_content || null,
                  targetSongs,
                  targetRoles,
                  existing.rows[0].id
                ]
              );
              updated++;
            } else {
              // Insert new schedule
              await client.query(
                `INSERT INTO schedules 
                 (schedule_date, venue, start_time, end_time, rehearsal_type, rehearsal_content, target_songs, target_roles) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  scheduleDate,
                  row.venue || null,
                  row.start_time || null,
                  row.end_time || null,
                  row.rehearsal_type || null,
                  row.rehearsal_content || null,
                  targetSongs,
                  targetRoles
                ]
              );
              inserted++;
            }
          }
          
          await client.query('COMMIT');
          res.json({ 
            message: 'Import successful', 
            inserted,
            updated,
            total: results.length 
          });
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('Import error:', err);
          throw err;
        } finally {
          client.release();
        }
      });
  } catch (err) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
