const db = require('../db');

exports.createEvent = (req, res) => {
    const { title, description } = req.body;
    const sql = `INSERT INTO events (title, description) VALUES (?, ?)`;

    db.query(sql, [title, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Événement créé", eventId: result.insertId });
    });
};

exports.getAllEvents = (req, res) => {
    const sql = `
        SELECT e.id, e.title, e.description, s.start_time, a.name as arena_name 
        FROM events e
        LEFT JOIN sessions s ON e.id = s.event_id
        LEFT JOIN arenas a ON s.arena_id = a.id
        ORDER BY s.start_time ASC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.updateEvent = (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const sql = "UPDATE events SET title = ?, description = ? WHERE id = ?";

    db.query(sql, [title, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Événement non trouvé" });
        res.json({ message: "Événement mis à jour " });
    });
};

exports.deleteEvent = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM events WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Événement supprimé " });
    });
};