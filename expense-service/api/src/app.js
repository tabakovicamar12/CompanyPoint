const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();
const db = require('./db');

const correlationIdMiddleware = require('./middleware/correlationId.middleware');
const loggingMiddleware = require('./middleware/logging.middleware');

const app = express();
const port = process.env.PORT || 3001;

// CORS (allow Authorization header)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(correlationIdMiddleware);
app.use(loggingMiddleware);

/**
 * -------------------------
 * Helpers
 * -------------------------
 */
const normalizeUserId = (decoded) => decoded?.id ?? decoded?.sub;

/**
 * -------------------------
 * Auth middleware
 * -------------------------
 * JWT middleware (Bearer token)
 * Sets req.user = { id, role, name? }
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

    const id = normalizeUserId(decoded);
    if (!id) {
      return res.status(401).json({ error: 'Neveljaven žeton (manjka id/sub).' });
    }

    req.user = {
      ...decoded,
      id, // normalized
    };

    next();
  } catch (error) {
    console.log('Invalid token error:', error.message);
    return res.status(401).json({ error: 'Neveljaven žeton.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Dostop zavrnjen. Zahtevana je admin vloga.' });
  }
  next();
};

/**
 * -------------------------
 * Swagger (OpenAPI)
 * -------------------------
 */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ExpenseService API',
      version: '1.0.0',
      description:
        'Expense mikroservis za beleženje stroškov. Zahteva JWT Bearer token. Worker endpointi so vezani na uporabnika iz JWT.',
    },
    servers: [{ url: 'http://localhost:3001' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  // Najbolj robustno: swagger-jsdoc pars-a komentarje iz trenutne datoteke
  apis: [__filename],
});

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * -------------------------
 * Routes
 * -------------------------
 */

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protect ALL /expenses routes
app.use('/expenses', protect);

//
// ========================= WORKER ENDPOINTI =========================
//

/**
 * @openapi
 * /expenses:
 *   post:
 *     summary: Zaposleni doda expense zase (employeeId iz JWT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expenseDate, category, amount]
 *             properties:
 *               expenseDate: { type: string, format: date }
 *               category: { type: string }
 *               amount: { type: number }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/bulk:
 *   post:
 *     summary: Zaposleni doda več expensov naenkrat (employeeId iz JWT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expenses]
 *             properties:
 *               expenses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [expenseDate, category, amount]
 *                   properties:
 *                     expenseDate: { type: string, format: date }
 *                     category: { type: string }
 *                     amount: { type: number }
 *                     description: { type: string, nullable: true }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/my:
 *   get:
 *     summary: Moji expensi (employeeId iz JWT)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minAmount
 *         schema: { type: number }
 *       - in: query
 *         name: maxAmount
 *         schema: { type: number }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/{id}:
 *   put:
 *     summary: Zaposleni posodobi svoj expense (mora biti lastnik)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expenseDate: { type: string, format: date, nullable: true }
 *               category: { type: string, nullable: true }
 *               amount: { type: number, nullable: true }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/{id}:
 *   delete:
 *     summary: Zaposleni izbriše svoj expense (mora biti lastnik)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 *       500: { description: Internal server error }
 */
app.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const result = await db.query('DELETE FROM expenses WHERE id = $1 AND employee_id = $2 RETURNING *', [
      id,
      employeeId,
    ]);

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

/**
 * @openapi
 * /expenses/admin/all:
 *   get:
 *     summary: Admin pregled vseh expensov (filtri)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minAmount
 *         schema: { type: number }
 *       - in: query
 *         name: maxAmount
 *         schema: { type: number }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/admin/employee/{employeeId}:
 *   get:
 *     summary: Admin view za enega zaposlenega
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/admin/createForEmployee:
 *   post:
 *     summary: Admin doda expense za poljubnega uporabnika
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, expenseDate, category, amount]
 *             properties:
 *               employeeId: { type: string }
 *               expenseDate: { type: string, format: date }
 *               category: { type: string }
 *               amount: { type: number }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/admin/update/{id}:
 *   put:
 *     summary: Admin posodobi expense kogarkoli
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId: { type: string, nullable: true }
 *               expenseDate: { type: string, format: date, nullable: true }
 *               category: { type: string, nullable: true }
 *               amount: { type: number, nullable: true }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *       500: { description: Internal server error }
 */
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

/**
 * @openapi
 * /expenses/admin/delete/{id}:
 *   delete:
 *     summary: Admin izbriše expense kogarkoli
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *       500: { description: Internal server error }
 */
app.delete('/expenses/admin/delete/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Deleted by admin', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error admin deleting expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * -------------------------
 * Global error handler
 * -------------------------
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // publish error log
  const { publishLog } = require('./rabbitmq');
  publishLog({
    timestamp: new Date().toISOString(),
    logType: 'ERROR',
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    method: req.method,
    status: 500,
    correlationId: req.correlationId,
    app: process.env.SERVICE_NAME || 'expense-service',
    message: err.message || 'Unhandled error',
    meta: {
      stack: err.stack,
      userId: req.user?.id || null,
      role: req.user?.role || null,
    },
  });

  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`ExpenseService running on port ${port}`);
  console.log(`Swagger: http://localhost:${port}/swagger`);
});
