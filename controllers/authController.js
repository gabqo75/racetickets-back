const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, password, role, profileData } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { first_name, last_name } = profileData || {};

        const sql = `INSERT INTO users (email, password, role, first_name, last_name) 
                     VALUES (?, ?, ?, ?, ?)`;
        
        db.query(sql, [email, hashedPassword, role || 'user', first_name, last_name], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Cet email existe déjà" });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Utilisateur créé avec succès" });
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ message: "Identifiants incorrects" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects" });

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profileData: {
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            }
        });
    });
};