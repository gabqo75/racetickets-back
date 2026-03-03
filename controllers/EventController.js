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
    const { q, location, date } = req.query;
    let sql = `
        SELECT e.id, e.title, e.description, MIN(s.start_time) as start_time, 
               MAX(a.name) as arena_name, MAX(c.name) as city_name
        FROM events e
        LEFT JOIN sessions s ON e.id = s.event_id
        LEFT JOIN arenas a ON s.arena_id = a.id
        LEFT JOIN cities c ON a.city_id = c.id
        WHERE 1=1`;
    
    const params = [];

    if (q) {
        sql += ` AND (e.title LIKE ? OR e.description LIKE ? OR a.name LIKE ?)`;
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (location) {
        sql += ` AND (c.name LIKE ? OR a.name LIKE ?)`;
        const locationTerm = `%${location}%`;
        params.push(locationTerm, locationTerm);
    }

    if (date) {
        sql += ` AND DATE(s.start_time) = ?`;
        params.push(date);
    }

    sql += ` GROUP BY e.id, e.title, e.description ORDER BY start_time ASC`;

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getEventDetails = (req, res) => {
    const { id } = req.params;
    
    const eventSql = `
        SELECT e.*, s.id as session_id, s.start_time, s.status as session_status, a.name as arena_name, a.id as arena_id
        FROM events e
        LEFT JOIN sessions s ON e.id = s.event_id
        LEFT JOIN arenas a ON s.arena_id = a.id
        WHERE e.id = ?`;

    db.query(eventSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "Événement non trouvé" });

        const sessionsMap = new Map();
        
        results.forEach(r => {
            if (r.session_id && !sessionsMap.has(r.session_id)) {
                sessionsMap.set(r.session_id, {
                    id: r.session_id,
                    start_time: r.start_time,
                    status: r.session_status,
                    arena_name: r.arena_name,
                    arena_id: r.arena_id,
                    zones: []
                });
            }
        });

        const event = {
            id: results[0].id,
            title: results[0].title,
            description: results[0].description,
            sessions: Array.from(sessionsMap.values())
        };

        if (event.sessions.length > 0) {
            const sessionIds = event.sessions.map(s => s.id);
            const zonesSql = `
                SELECT pc.*, z.name as zone_name, z.id as zone_id
                FROM price_categories pc
                JOIN zones z ON pc.zone_id = z.id
                WHERE pc.session_id IN (?)`;
            
            db.query(zonesSql, [sessionIds], (err, zoneResults) => {
                if (err) return res.status(500).json({ error: err.message });
                
                zoneResults.forEach(z => {
                    const session = sessionsMap.get(z.session_id);
                    if (session) {
                        if (!session.zones.find(existingZone => existingZone.zone_id === z.zone_id)) {
                            session.zones.push(z);
                        }
                    }
                });

                res.json(event);
            });
        } else {
            res.json(event);
        }
    });
};

exports.getAvailableSeats = (req, res) => {

    const { sessionId, zoneId } = req.params;
    
    const sql = `
        SELECT s.*, r.row_label
        FROM seats s
        JOIN seat_rows r ON s.row_id = r.id
        WHERE r.zone_id = ?
        AND s.id NOT IN (
            SELECT seat_id FROM tickets t 
            JOIN sessions sess ON t.event_id = sess.event_id
            WHERE sess.id = ?
        )`;

    db.query(sql, [zoneId, sessionId], (err, results) => {
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

exports.getAllCities = (req, res) => {

    const sql = `SELECT * FROM cities ORDER BY name ASC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};