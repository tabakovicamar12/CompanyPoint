import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const generateToken = (user) => {
    return jwt.sign({
        sub: user._id,
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
 * @desc 1. POST: Registracija uporabnika
 */
export const registerUser = async (req, res) => {
    console.log(">>> DEBUG - REGISTER CALLED");
    console.log(">>> REQ BODY:", req.body);
    const { email, password, role } = req.body;

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
        console.error('Napaka pri registraciji:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
};

/**
 * @route POST /authService/login
 * @desc 2. POST: Prijava uporabnika
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            user.name = user.email.split('@')[0];
            const token = generateToken(user);
            const userResponse = { id: user._id, name: user.name, role: user.role };

            return res.status(200).json({ message: 'Prijava uspešna.', user: userResponse, token });
        } else {
            return res.status(401).json({ error: 'Neveljavni e-poštni naslov ali geslo.' });
        }
    } catch (error) {
        console.error('Napaka pri prijavi:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
};

/**
 * @route GET /authService/validateUser
 * @desc 1. GET: Preveri vlogo uporabnika (zaščitena pot)
 */
export const validateUser = [protect, async (req, res) => {
    res.status(200).json({
        message: 'Žeton veljaven.',
        user: { id: req.user.id, role: req.user.role }
    });
}];

/**
 * @route GET /authService/roles
 * @desc 2. GET: Pridobi seznam vseh možnih vlog
 */
export const getAllRoles = (req, res) => {
    const roles = ['user', 'admin'];
    res.status(200).json({ roles });
};

/**
 * @route PUT /authService/updatePassword
 * @desc 1. PUT: Posodobi geslo (zaščitena pot)
 */
export const updatePassword = [protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

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
        console.error('Napaka pri posodabljanju gesla:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];

/**
 * @route PUT /authService/setRole/:userId
 * @desc 2. PUT: Nastavi vlogo uporabniku (zaščitena in potrebna admin vloga)
 */
export const setRole = [protect, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Dostop zavrnjen. Zahtevana je admin vloga.' });
    }

    const { role } = req.body;
    const userId = req.params.userId;
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
        console.error('Napaka pri nastavljanju vloge:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];

/**
 * @route DELETE /authService/logout
 * @desc 1. DELETE: Odjava (Ni fizičnega brisanja, le informativna pot)
 */
export const logoutUser = (req, res) => {
    token = req.headers.authorization.split(' ')[1];
    if (token) {
        token = null;
        res.status(200).json({ message: 'Uspešno odjavljen. Žeton invalidiran na odjemalčevi strani.' });
    }
    else {
        res.status(400).json({ error: 'Ni žetona za odjavo.' });
    }
};

/**
 * @route DELETE /authService/unregister/:userId
 * @desc 2. DELETE: Izbriše račun uporabnika (potrebna admin vloga)
 */
export const unregisterUser = [protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
        return res.status(403).json({ error: 'Dostop zavrnjen. Lahko izbrišete le svoj račun ali potrebujete admin vlogo.' });
    }

    try {
        await User.findByIdAndDelete(req.params.userId);
        res.status(200).json({ message: 'Uporabnik uspešno izbrisan.' });
    } catch (error) {
        console.error('Napaka pri brisanju uporabnika:', error);
        res.status(500).json({ error: 'Napaka strežnika.' });
    }
}];
