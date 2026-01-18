import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { sendLog } from '../logger.js';
import { v4 as uuidv4 } from 'uuid';

const generateToken = (user) => {
    return jwt.sign({
        sub: user._id,
        id: user._id,
        name: user.name,
        role: user.role
    }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ error: 'Ni avtorizacije, ni žetona.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Neveljaven žeton.' });
    }
};

/**
 * @route POST /authService/register
 */
export const registerUser = async (req, res) => {
    const { email, password, role } = req.body;
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    
    await sendLog({
        type: 'INFO',
        url: req.originalUrl,
        correlationId,
        message: `Klic storitve REGISTER za ${email}`
    });

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Uporabnik s tem e-poštnim naslovom že obstaja.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role });
        await user.save();

        user.name = user.email.split('@')[0];
        const token = generateToken(user);

        res.status(201).json({ message: 'Registracija uspešna.', user: { id: user._id, name: user.name, role: user.role }, token });

    } catch (error) {
        await sendLog({ type: 'ERROR', url: req.originalUrl, correlationId, message: `Napaka pri registraciji: ${error.message}` });
        console.error('Napaka pri registraciji:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
};

/**
 * @route POST /authService/login
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const correlationId = req.headers['x-correlation-id'] || uuidv4();

    await sendLog({
        type: 'INFO',
        url: req.originalUrl,
        correlationId,
        message: `Poskus prijave za uporabnika: ${email}`
    });

    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            user.name = user.email.split('@')[0];
            const token = generateToken(user);
            const userResponse = { id: user._id, name: user.name, role: user.role };

            return res.status(200).json({ message: 'Prijava uspešna.', user: userResponse, token });
        } else {
            await sendLog({ type: 'WARN', url: req.originalUrl, correlationId, message: `Neuspešna prijava za: ${email}` });
            return res.status(401).json({ error: 'Neveljavni e-poštni naslov ali geslo.' });
        }
    } catch (error) {
        await sendLog({ type: 'ERROR', url: req.originalUrl, correlationId, message: `Napaka pri prijavi: ${error.message}` });
        console.error('Napaka pri prijavi:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
};

/**
 * @route GET /authService/validateUser
 */
export const validateUser = [protect, async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    await sendLog({ type: 'INFO', url: req.originalUrl, correlationId, message: `Validacija žetona za uporabnika ID: ${req.user.id}` });
    
    res.status(200).json({
        message: 'Žeton veljaven.',
        user: { id: req.user.id, role: req.user.role }
    });
}];

/**
 * @route GET /authService/roles
 */
export const getAllRoles = async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    await sendLog({ type: 'INFO', url: req.originalUrl, correlationId, message: "Pridobivanje seznama vlog" });
    
    const roles = ['user', 'admin'];
    res.status(200).json({ roles });
};

/**
 * @route PUT /authService/updatePassword
 */
export const updatePassword = [protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const correlationId = req.headers['x-correlation-id'] || uuidv4();

    await sendLog({ type: 'INFO', url: req.originalUrl, correlationId, message: `Posodobitev gesla za uporabnika: ${userId}` });

    try {
        const user = await User.findById(userId);

        if (user && (await bcrypt.compare(currentPassword, user.password))) {
            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = newHashedPassword;
            await user.save();

            return res.status(200).json({ message: 'Geslo uspešno posodobljeno.' });
        } else {
            return res.status(401).json({ error: 'Trenutno geslo je napačno.' });
        }
    } catch (error) {
        await sendLog({ type: 'ERROR', url: req.originalUrl, correlationId, message: `Napaka pri posodobitvi gesla: ${error.message}` });
        console.error('Napaka pri posodobljanju gesla:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];

/**
 * @route PUT /authService/setRole/:userId
 */
export const setRole = [protect, async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Dostop zavrnjen. Zahtevana je admin vloga.' });
    }

    const { role } = req.body;
    const userId = req.params.userId;
    
    await sendLog({ type: 'INFO', url: req.originalUrl, correlationId, message: `Admin ${req.user.id} nastavlja vlogo ${role} za uporabnika ${userId}` });

    const validRoles = ['user', 'admin', 'guest'];

    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Neveljavna vloga.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Uporabnika ni mogoče najti.' });
        }
        user.role = role;
        await user.save();

        res.status(200).json({ message: `Vloga za uporabnika ${userId} nastavljena na ${user.role}.` });
    } catch (error) {
        await sendLog({ type: 'ERROR', url: req.originalUrl, correlationId, message: `Napaka pri nastavljanju vloge: ${error.message}` });
        console.error('Napaka pri nastavljanju vloge:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];

/**
 * @route GET /authService/getUserData
 */
export const getUserData = [protect, async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Uporabnika ni mogoče najti.' });
        }

        await sendLog({ type: 'INFO', url: req.originalUrl, correlationId, message: `Pridobljeni podatki za ${user.email}` });

        res.status(200).json({
            email: user.email,
            name: user.email.split('@')[0],
            role: user.role
        });
    } catch (error) {
        await sendLog({ type: 'ERROR', url: req.originalUrl, correlationId, message: `Napaka pri getUserData: ${error.message}` });
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];

/**
 * @route DELETE /authService/unregister/:userId
 */
export const unregisterUser = [protect, async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
        return res.status(403).json({ error: 'Dostop zavrnjen. Lahko izbrišete le svoj račun ali potrebujete admin vlogo.' });
    }

    await sendLog({ type: 'INFO', url: req.originalUrl, correlationId, message: `Brisanje uporabnika: ${req.params.userId}` });

    try {
        await User.findByIdAndDelete(req.params.userId);
        res.status(200).json({ message: 'Uporabnik uspešno izbrisan.' });
    } catch (error) {
        await sendLog({ type: 'ERROR', url: req.originalUrl, correlationId, message: `Napaka pri brisanju: ${error.message}` });
        console.error('Napaka pri brisanju uporabnika:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];

/**
 * @route GET /authService/users
 */
export const getAllUsers = [protect, async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Dostop zavrnjen. Zahtevana je admin vloga.' });
    }

    await sendLog({ type: 'INFO', url: req.originalUrl, correlationId, message: "Admin pridobiva seznam vseh uporabnikov" });

    try {
        const users = await User.find({}).select('_id email role');
        const formattedUsers = users.map(user => ({
            id: user._id,
            email: user.email,
            name: user.email.split('@')[0],
            role: user.role
        }));

        res.status(200).json(formattedUsers);
    } catch (error) {
        await sendLog({ type: 'ERROR', url: req.originalUrl, correlationId, message: `Napaka pri getAllUsers: ${error.message}` });
        console.error('Napaka pri pridobivanju uporabnikov:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];
