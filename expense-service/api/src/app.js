const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const port = process.env.PORT || 3001; // 3001, da se ne tepe z WorkHoursService

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

//
// ========================= WORKER ENDPOINTI =========================
//

// POST /expenses – zaposleni doda expense zase
app.post('/expenses', async (req, res) => {
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
    console.error('Error inserting expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /expenses/bulk – zaposleni doda več expensov naenkrat
app.post('/expenses/bulk', async (req, res) => {
  try {
    const { employeeId, expenses } = req.body;

    if (!employeeId || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        message: 'employeeId in array expenses sta obvezna.',
      });
    }

    const inserted = [];

    for (const exp of expenses) {
      const { expenseDate, category, amount, description } = exp;

      if (!expenseDate || !category || amount == null) {
        continue; // lahko bi tudi vrgel error; tukaj samo skip
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

// GET /expenses/my – moji expensi (filter po datumu, kategoriji, znesku)
app.get('/expenses/my', async (req, res) => {
  try {
    const { employeeId, from, to, category, minAmount, maxAmount } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId je obvezen query param.' });
    }

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

// PUT /expenses/:id – zaposleni posodobi svoj expense
app.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseDate, category, amount, description } = req.body;

    const result = await db.query(
      `UPDATE expenses
       SET expense_date = COALESCE($1, expense_date),
           category      = COALESCE($2, category),
           amount        = COALESCE($3, amount),
           description   = COALESCE($4, description),
           updated_at    = NOW()
       WHERE id = $5
       RETURNING *`,
      [expenseDate, category, amount, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /expenses/:id – zaposleni izbriše svoj expense
app.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
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
app.get('/expenses/admin/all', async (req, res) => {
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
app.get('/expenses/admin/employee/:employeeId', async (req, res) => {
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
app.post('/expenses/admin/createForEmployee', async (req, res) => {
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
app.put('/expenses/admin/update/:id', async (req, res) => {
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
app.delete('/expenses/admin/delete/:id', async (req, res) => {
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
