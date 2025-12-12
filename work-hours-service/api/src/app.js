const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

//
// ========================= WORKER ENDPOINTI =========================
//

// POST workHoursService/log – zaposleni zabeleži ure zase
app.post('/workHours/log', async (req, res) => {
  try {
    const { employeeId, taskId, workDate, hours, workType, description } = req.body;

    if (!employeeId || !workDate || !hours) {
      return res.status(400).json({ message: 'employeeId, workDate in hours so obvezni.' });
    }

    const result = await db.query(
      `INSERT INTO work_hours (employee_id, task_id, work_date, hours, work_type, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employeeId, taskId || null, workDate, hours, workType || null, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET workHoursService/my – pregled mojih ur
app.get('/workHours/my', async (req, res) => {
  try {
    const { employeeId, from, to } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId je obvezen query param.' });
    }

    const params = [employeeId];
    let where = 'WHERE employee_id = $1';

    if (from) {
      params.push(from);
      where += ` AND work_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND work_date <= $${params.length}`;
    }

    const result = await db.query(
      `SELECT * FROM work_hours
       ${where}
       ORDER BY work_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT workHoursService/update/:id – zaposleni posodobi svoj vnos
app.put('/workHours/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { workDate, hours, workType, description, taskId } = req.body;

    const result = await db.query(
      `UPDATE work_hours
       SET work_date = COALESCE($1, work_date),
           hours = COALESCE($2, hours),
           work_type = COALESCE($3, work_type),
           description = COALESCE($4, description),
           task_id = COALESCE($5, task_id),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [workDate, hours, workType, description, taskId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE workHoursService/delete/:id – zaposleni izbriše svoj vnos
app.delete('/workHours/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM work_hours WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//
// ========================= ADMIN ENDPOINTI =========================
//

// GET workHoursService/all – admin pregled vseh ur (že imaš)
app.get('/workHours/all', async (req, res) => {
  try {
    const { employeeId, taskId, from, to } = req.query;

    const conditions = [];
    const params = [];

    if (employeeId) {
      params.push(employeeId);
      conditions.push(`employee_id = $${params.length}`);
    }
    if (taskId) {
      params.push(taskId);
      conditions.push(`task_id = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`work_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`work_date <= $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(
      `SELECT * FROM work_hours
       ${where}
       ORDER BY work_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET workHoursService/admin/employee/:employeeId – admin view za enega zaposlenega
app.get('/workHours/admin/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { from, to } = req.query;

    const params = [employeeId];
    let where = 'WHERE employee_id = $1';

    if (from) {
      params.push(from);
      where += ` AND work_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND work_date <= $${params.length}`;
    }

    const result = await db.query(
      `SELECT * FROM work_hours
       ${where}
       ORDER BY work_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin employee work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST workHoursService/admin/logForEmployee – admin doda ure za poljubnega zaposlenega
app.post('/workHours/admin/logForEmployee', async (req, res) => {
  try {
    const { employeeId, taskId, workDate, hours, workType, description } = req.body;

    if (!employeeId || !workDate || !hours) {
      return res.status(400).json({ message: 'employeeId, workDate in hours so obvezni.' });
    }

    const result = await db.query(
      `INSERT INTO work_hours (employee_id, task_id, work_date, hours, work_type, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employeeId, taskId || null, workDate, hours, workType || null, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting work_hours as admin:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT workHoursService/admin/update/:id – admin posodobi vnos kogarkoli
app.put('/workHours/admin/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { workDate, hours, workType, description, taskId } = req.body;

    const result = await db.query(
      `UPDATE work_hours
       SET work_date = COALESCE($1, work_date),
           hours = COALESCE($2, hours),
           work_type = COALESCE($3, work_type),
           description = COALESCE($4, description),
           task_id = COALESCE($5, task_id),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [workDate, hours, workType, description, taskId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error admin updating work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE workHoursService/admin/delete/:id – admin izbriše vnos kogarkoli
app.delete('/workHours/admin/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM work_hours WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Deleted by admin', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error admin deleting work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`WorkHoursService running on port ${port}`);
});
