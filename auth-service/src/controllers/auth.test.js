import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import request from 'supertest';
import app from '../app.js';

beforeAll(async () => {
    jest.setTimeout(20000);
    await mongoose.connect(process.env.DATABASE_URL);
    await User.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Auth API', () => {
    let token;
    let userId;

    it('1. should register a new user', async () => {
        const res = await request(app)
            .post('/authService/register')
            .send({ email: 'test@example.com', password: '123456', role: 'user' });

        expect(res.statusCode).toBe(201);
        token = res.body.token;
        userId = res.body.user.id;
    }, 15000);

    it('2. should not register an existing user', async () => {
        const res = await request(app)
            .post('/authService/register')
            .send({ email: 'test@example.com', password: '123456', role: 'user' });

        expect(res.statusCode).toBe(409);
    }, 15000);

    it('3. should login with correct credentials', async () => {
        const res = await request(app)
            .post('/authService/login')
            .send({ email: 'test@example.com', password: '123456' });

        expect(res.statusCode).toBe(200);
    }, 15000);

    it('4. should not login with wrong password', async () => {
        const res = await request(app)
            .post('/authService/login')
            .send({ email: 'test@example.com', password: 'wrongpass' });

        expect(res.statusCode).toBe(401);
    }, 15000);

    it('5. should validate a user token', async () => {
        const res = await request(app)
            .get('/authService/validateUser')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    }, 15000);

    it('6. should get all roles', async () => {
        const res = await request(app).get('/authService/roles');
        expect(res.statusCode).toBe(200);
        expect(res.body.roles).toContain('user');
    }, 15000);

    it('7. should update password', async () => {
        const res = await request(app)
            .put('/authService/updatePassword')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: '123456', newPassword: 'newpass123' });

        expect(res.statusCode).toBe(200);
    }, 15000);

    it('8. should not allow setting role without admin', async () => {
        const res = await request(app)
            .put(`/authService/setRole/${userId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'admin' });

        expect(res.statusCode).toBe(403);
    }, 15000);

    it('9. should logout user', async () => {
        const res = await request(app)
            .delete('/authService/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    }, 15000);

    it('10. should not unregister another user without admin', async () => {
        const otherUserRes = await request(app)
            .post('/authService/register')
            .send({ email: 'other@example.com', password: 'pass123', role: 'user' });
        const otherUserId = otherUserRes.body.user.id;

        const res = await request(app)
            .delete(`/authService/unregister/${otherUserId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
    }, 15000);

    it('9.2. should return 200 on logout', async () => {
        const res = await request(app)
            .delete('/authService/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Uspešno odjavljen. Žeton invalidiran na odjemalčevi strani.');
    }, 15000);
});
