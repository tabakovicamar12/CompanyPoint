const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();
const db = require('./db');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/**
 * -------------------------
 * Helpers
 * -------------------------
 */
const getBearerToken = (req) => {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
};

const normalizeUserId = (decoded) => decoded?.id ?? decoded?.sub;

const toIntOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) ? n : null;
};

/**
 * TODOCHART service URL (internal docker DNS)
 * In root docker-compose we will set:
 * TODOCHART_SERVICE_URL=http://todochart-service:8080
 */
const TODOCHART_SERVICE_URL =
  process.env.TODOCHART_SERVICE_URL || 'http://todochart-service:8080';

/**
 * Fallback validate: task exists (ker employeeId iz JWT je lahko Mongo string)
 * Ker pri tebi NI endpointa GET /toDoChartService/Tasks/{taskId} (zato 405),
 * uporabimo GET /toDoChartService/Tasks in preverimo če id obstaja.
 *
 * GET /toDoChartService/Tasks
 */
const validateTaskExists = async ({ taskId, token }) => {
  const url = `${TODOCHART_SERVICE_URL}/toDoChartService/Tasks`;
  const resp = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 5000,
  });

  const tasks = resp.data || [];
  return tasks.some((t) => Number(t.id) === Number(taskId));
};

/**
 * Preferred validate: task belongs to employee (ONLY if employeeId is numeric)
 * GET /toDoChartService/Tasks/byEmployee/{employeeId}
 *
 * Če employeeId NI numeric (Mongo id iz auth-service), naredimo fallback na validateTaskExists().
 */
const validateTaskForEmployee = async ({ taskId, employeeId, token }) => {
  if (!taskId) return true; // taskId optional

  const empNum = toIntOrNull(employeeId);
  if (!empNum) {
    // JWT ima Mongo id => ToDoChart expects numeric -> fallback na obstoj taska
    return validateTaskExists({ taskId, token });
  }

  const url = `${TODOCHART_SERVICE_URL}/toDoChartService/Tasks/byEmployee/${empNum}`;
  const resp = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 5000,
  });

  const tasks = resp.data || [];
  return tasks.some((t) => Number(t.id) === Number(taskId));
};

const mapToDoChartError = (e) => {
  const status = e?.response?.status;

  if (status === 401) {
    return {
      http: 401,
      body: { message: 'ToDoChart: Unauthorized (JWT ni sprejet).' },
    };
  }
  if (status === 403) {
    return { http: 403, body: { message: 'ToDoChart: Forbidden.' } };
  }
  if (status === 404) {
    return {
      http: 400,
      body: { message: 'ToDoChart: Task/employee ni najden (404).' },
    };
  }

  // Network / timeout / 5xx / ostalo
  return { http: 503, body: { message: 'ToDoChartService ni dosegljiv.' } };
};

/**
 * -------------------------
 * Auth middleware
 * -------------------------
 * JWT middleware (Bearer token)
 * Sets req.user = { id, role, name }
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

    req.user = { ...decoded, id };
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

/**
 * -------------------------
 * Swagger
 * -------------------------
 * Pomembno: apis kaže direktno na ta file (v containerju),
 * da Swagger vedno najde @openapi komentarje.
 */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WorkHoursService API',
      version: '1.0.0',
      description:
        'WorkHours mikroservis za beleženje delovnih ur. Zahteva JWT Bearer token. Integracija s ToDoChartService prek taskId.',
    },
    servers: [{ url: 'http://localhost:3002' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: [path.join(__dirname, 'app.js')],
});

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * -------------------------
 * Routes
 * -------------------------
 */

// Health check (public)
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

// Protect ALL /workHours routes
app.use('/workHours', protect);

//
// ========================= WORKER ENDPOINTI =========================
//

/**
 * @openapi
 * /workHours/log:
 *   post:
 *     summary: Zaposleni zabeleži ure zase (employeeId iz JWT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workDate, hours]
 *             properties:
 *               taskId: { type: integer, nullable: true }
 *               workDate: { type: string, format: date }
 *               hours: { type: number }
 *               workType: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       503: { description: ToDoChartService unavailable }
 */
app.post('/workHours/log', async (req, res) => {
  try {
    const employeeId = req.user.id; // lahko Mongo id
    const { taskId, workDate, hours, workType, description } = req.body;

    // hours=0 mora biti dovoljeno -> zato preverjamo null/undefined
    if (!workDate || hours === undefined || hours === null) {
      return res.status(400).json({ message: 'workDate in hours so obvezni.' });
    }

    // Validate task (če je podan)
    const token = getBearerToken(req);
    if (taskId) {
      try {
        const ok = await validateTaskForEmployee({ taskId, employeeId, token });
        if (!ok) {
          return res.status(400).json({
            message: `Task ${taskId} ne obstaja (ali ne pripada employeeId=${employeeId}).`,
          });
        }
      } catch (e) {
        console.error('ToDoChart validation error:', e.message);
        const mapped = mapToDoChartError(e);
        return res.status(mapped.http).json(mapped.body);
      }
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

/**
 * @openapi
 * /workHours/my:
 *   get:
 *     summary: Pregled mojih ur (employeeId iz JWT)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
app.get('/workHours/my', async (req, res) => {
  try {
    const employeeId = req.user.id;
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
    console.error('Error fetching my work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @openapi
 * /workHours/update/{id}:
 *   put:
 *     summary: Zaposleni posodobi svoj vnos (mora biti lastnik)
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
 *               workDate: { type: string, format: date, nullable: true }
 *               hours: { type: number, nullable: true }
 *               workType: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               taskId: { type: integer, nullable: true }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 *       503: { description: ToDoChartService unavailable }
 */
app.put('/workHours/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;
    const { workDate, hours, workType, description, taskId } = req.body;

    // Validate task (če je podan)
    const token = getBearerToken(req);
    if (taskId) {
      try {
        const ok = await validateTaskForEmployee({ taskId, employeeId, token });
        if (!ok) {
          return res.status(400).json({
            message: `Task ${taskId} ne obstaja (ali ne pripada employeeId=${employeeId}).`,
          });
        }
      } catch (e) {
        console.error('ToDoChart validation error:', e.message);
        const mapped = mapToDoChartError(e);
        return res.status(mapped.http).json(mapped.body);
      }
    }

    const result = await db.query(
      `UPDATE work_hours
       SET work_date   = COALESCE($1, work_date),
           hours       = COALESCE($2, hours),
           work_type   = COALESCE($3, work_type),
           description = COALESCE($4, description),
           task_id     = COALESCE($5, task_id),
           updated_at  = NOW()
       WHERE id = $6 AND employee_id = $7
       RETURNING *`,
      [workDate, hours, workType, description, taskId, id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found (ali ni tvoj).' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating work_hours:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @openapi
 * /workHours/delete/{id}:
 *   delete:
 *     summary: Zaposleni izbriše svoj vnos (mora biti lastnik)
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
 */
app.delete('/workHours/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const result = await db.query(
      'DELETE FROM work_hours WHERE id = $1 AND employee_id = $2 RETURNING *',
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found (ali ni tvoj).' });
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

/**
 * @openapi
 * /workHours/all:
 *   get:
 *     summary: Admin pregled vseh ur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema: { type: string }
 *       - in: query
 *         name: taskId
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
 */
app.get('/workHours/all', requireAdmin, async (req, res) => {
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

/**
 * @openapi
 * /workHours/admin/employee/{employeeId}:
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
 */
app.get('/workHours/admin/employee/:employeeId', requireAdmin, async (req, res) => {
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

/**
 * @openapi
 * /workHours/admin/logForEmployee:
 *   post:
 *     summary: Admin doda ure za poljubnega zaposlenega
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, workDate, hours]
 *             properties:
 *               employeeId: { type: string }
 *               taskId: { type: integer, nullable: true }
 *               workDate: { type: string, format: date }
 *               hours: { type: number }
 *               workType: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       503: { description: ToDoChartService unavailable }
 */
app.post('/workHours/admin/logForEmployee', requireAdmin, async (req, res) => {
  try {
    const { employeeId, taskId, workDate, hours, workType, description } = req.body;

    if (!employeeId || !workDate || hours === undefined || hours === null) {
      return res.status(400).json({ message: 'employeeId, workDate in hours so obvezni.' });
    }

    // Validate task belongs to PROVIDED employeeId (če je numeric -> byEmployee, sicer fallback na obstoj taska)
    const token = getBearerToken(req);
    if (taskId) {
      try {
        const ok = await validateTaskForEmployee({ taskId, employeeId, token });
        if (!ok) {
          return res.status(400).json({
            message: `Task ${taskId} ne obstaja (ali ne pripada employeeId=${employeeId}).`,
          });
        }
      } catch (e) {
        console.error('ToDoChart validation error:', e.message);
        const mapped = mapToDoChartError(e);
        return res.status(mapped.http).json(mapped.body);
      }
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

/**
 * @openapi
 * /workHours/admin/update/{id}:
 *   put:
 *     summary: Admin posodobi vnos kogarkoli
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
 *               workDate: { type: string, format: date, nullable: true }
 *               hours: { type: number, nullable: true }
 *               workType: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               taskId: { type: integer, nullable: true }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *       503: { description: ToDoChartService unavailable }
 */
app.put('/workHours/admin/update/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { workDate, hours, workType, description, taskId } = req.body;

    // Če spreminjamo taskId, validiramo proti employeeId od tega entry-ja
    if (taskId) {
      const existing = await db.query('SELECT employee_id FROM work_hours WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      const employeeIdForEntry = existing.rows[0].employee_id;
      const token = getBearerToken(req);

      try {
        const ok = await validateTaskForEmployee({
          taskId,
          employeeId: employeeIdForEntry,
          token,
        });
        if (!ok) {
          return res.status(400).json({
            message: `Task ${taskId} ne obstaja (ali ne pripada employeeId=${employeeIdForEntry}).`,
          });
        }
      } catch (e) {
        console.error('ToDoChart validation error:', e.message);
        const mapped = mapToDoChartError(e);
        return res.status(mapped.http).json(mapped.body);
      }
    }

    const result = await db.query(
      `UPDATE work_hours
       SET work_date   = COALESCE($1, work_date),
           hours       = COALESCE($2, hours),
           work_type   = COALESCE($3, work_type),
           description = COALESCE($4, description),
           task_id     = COALESCE($5, task_id),
           updated_at  = NOW()
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

/**
 * @openapi
 * /workHours/admin/delete/{id}:
 *   delete:
 *     summary: Admin izbriše vnos kogarkoli
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
 */
app.delete('/workHours/admin/delete/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM work_hours WHERE id = $1 RETURNING *', [id]);

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
  console.log(`Swagger: http://localhost:${port}/swagger`);
});
