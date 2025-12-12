import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AuthService
 *   description: Avtentikacija in upravljanje uporabnikov
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registracija novega uporabnika
 *     description: Ustvari novega uporabnika in vrne JWT žeton.
 *     tags: [AuthService]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Uporabnik uspešno registriran
 */
router.post('/register', authController.registerUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Prijava uporabnika
 *     description: Omogoča prijavo uporabnikov in vrne JWT žeton.
 *     tags: [AuthService]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prijava uspešna
 */
router.post('/login', authController.loginUser);

/**
 * @swagger
 * /validateUser:
 *   get:
 *     summary: Preveri veljavnost JWT žetona
 *     tags: [AuthService]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Veljaven uporabnik
 */
router.get('/validateUser', authController.validateUser);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Vrne seznam vseh uporabniških vlog
 *     tags: [AuthService]
 *     responses:
 *       200:
 *         description: Seznam vlog
 */
router.get('/roles', authController.getAllRoles);
/**
 * @swagger
 * /updatePassword:
 *   put:
 *     summary: Posodobi geslo uporabnika
 *     tags: [AuthService]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Posodobljeno geslo
 */
router.put('/updatePassword', authController.updatePassword);

/**
 * @swagger
 * /setRole/{userId}:
 *   put:
 *     summary: Nastavi vlogo uporabnika
 *     tags: [AuthService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID uporabnika
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nastavljena vloga
 */
router.put('/setRole/:userId', authController.setRole);

/**
 * @swagger
 * /logout:
 *   delete:
 *     summary: Odjava uporabnika
 *     tags: [AuthService]
 *     responses:
 *       200:
 *         description: Uporabnik odjavljen
 */
router.delete('/logout', authController.logoutUser);

/**
 * @swagger
 * /unregister/{userId}:
 *   delete:
 *     summary: Odstrani uporabnika
 *     tags: [AuthService]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID uporabnika
 *     responses:
 *       200:
 *         description: Uporabnik odstranjen
 */
router.delete('/unregister/:userId', authController.unregisterUser);

export default router;

