const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const port = process.env.PORT || 3001;

// CORS (allow Authorization header)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/**
 * JWT middleware (Bearer token)
 * Sets req.user = { id, role }
 */
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Ni avtorizacije, ni žetona.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Neveljaven žeton.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Dostop zavrnjen. Zahtevana je admin vloga.' });
  }
  next();
};

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protect ALL /expenses routes
app.use('/expenses', protect);

//
// ========================= WORKER ENDPOINTI =========================
//

// POST /expenses – zaposleni doda expense zase (employeeId comes from token)
app.post('/expenses', async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { expenseDate, category, amount, description } = req.body;

    if (!expenseDate || !category || amount == null) {
      return res.status(400).json({
        message: 'expenseDate, category in amount so obvezni.',
      });
    }

    const result = await db.query(
      `INSERT INTO expenses (employee_id, expense_date, category, amount, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employeeId, expenseDate, category, amount, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /expenses/bulk – zaposleni doda več expensov naenkrat (employeeId from token)
app.post('/expenses/bulk', async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        message: 'Array expenses je obvezen.',
      });
    }

    const inserted = [];

    for (const exp of expenses) {
      const { expenseDate, category, amount, description } = exp;

      if (!expenseDate || !category || amount == null) {
        continue; // skip invalid rows
      }

      const result = await db.query(
        `INSERT INTO expenses (employee_id, expense_date, category, amount, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [employeeId, expenseDate, category, amount, description || null]
      );

      inserted.push(result.rows[0]);
    }

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Error inserting bulk expenses:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /expenses/my – moji expensi (employeeId from token)
app.get('/expenses/my', async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { from, to, category, minAmount, maxAmount } = req.query;

    const conditions = ['employee_id = $1'];
    const params = [employeeId];

    if (from) {
      params.push(from);
      conditions.push(`expense_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`expense_date <= $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (minAmount) {
      params.push(minAmount);
      conditions.push(`amount >= $${params.length}`);
    }
    if (maxAmount) {
      params.push(maxAmount);
      conditions.push(`amount <= $${params.length}`);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT * FROM expenses
       ${where}
       ORDER BY expense_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my expenses:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /expenses/:id – zaposleni posodobi svoj expense (must own it)
app.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;
    const { expenseDate, category, amount, description } = req.body;

    const result = await db.query(
      `UPDATE expenses
       SET expense_date = COALESCE($1, expense_date),
           category      = COALESCE($2, category),
           amount        = COALESCE($3, amount),
           description   = COALESCE($4, description),
           updated_at    = NOW()
       WHERE id = $5 AND employee_id = $6
       RETURNING *`,
      [expenseDate, category, amount, description, id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found (ali ni tvoj).' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /expenses/:id – zaposleni izbriše svoj expense (must own it)
app.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 AND employee_id = $2 RETURNING *',
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found (ali ni tvoj).' });
    }

    res.json({ message: 'Deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//
// ========================= ADMIN ENDPOINTI =========================
//

// GET /expenses/admin/all – admin pregled vseh expensov z filtri
app.get('/expenses/admin/all', requireAdmin, async (req, res) => {
  try {
    const { employeeId, from, to, category, minAmount, maxAmount } = req.query;

    const conditions = [];
    const params = [];

    if (employeeId) {
      params.push(employeeId);
      conditions.push(`employee_id = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`expense_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`expense_date <= $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (minAmount) {
      params.push(minAmount);
      conditions.push(`amount >= $${params.length}`);
    }
    if (maxAmount) {
      params.push(maxAmount);
      conditions.push(`amount <= $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(
      `SELECT * FROM expenses
       ${where}
       ORDER BY expense_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all expenses:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /expenses/admin/employee/:employeeId – admin view za enega zaposlenega
app.get('/expenses/admin/employee/:employeeId', requireAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { from, to } = req.query;

    const params = [employeeId];
    let where = 'WHERE employee_id = $1';

    if (from) {
      params.push(from);
      where += ` AND expense_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND expense_date <= $${params.length}`;
    }

    const result = await db.query(
      `SELECT * FROM expenses
       ${where}
       ORDER BY expense_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin employee expenses:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /expenses/admin/createForEmployee – admin doda expense za uporabnika
app.post('/expenses/admin/createForEmployee', requireAdmin, async (req, res) => {
  try {
    const { employeeId, expenseDate, category, amount, description } = req.body;

    if (!employeeId || !expenseDate || !category || amount == null) {
      return res.status(400).json({
        message: 'employeeId, expenseDate, category in amount so obvezni.',
      });
    }

    const result = await db.query(
      `INSERT INTO expenses (employee_id, expense_date, category, amount, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employeeId, expenseDate, category, amount, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting expense as admin:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /expenses/admin/update/:id – admin posodobi expense kogarkoli
app.put('/expenses/admin/update/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, expenseDate, category, amount, description } = req.body;

    const result = await db.query(
      `UPDATE expenses
       SET employee_id  = COALESCE($1, employee_id),
           expense_date = COALESCE($2, expense_date),
           category     = COALESCE($3, category),
           amount       = COALESCE($4, amount),
           description  = COALESCE($5, description),
           updated_at   = NOW()
       WHERE id = $6
       RETURNING *`,
      [employeeId, expenseDate, category, amount, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error admin updating expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /expenses/admin/delete/:id – admin izbriše expense kogarkoli
app.delete('/expenses/admin/delete/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Deleted by admin', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error admin deleting expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`ExpenseService running on port ${port}`);
});
