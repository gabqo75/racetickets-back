const db = require('../db');

exports.getUserTickets = (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT t.id, t.ticket_code, e.title as event_title, s.start_time, a.name as arena_name, 
               se.seat_number, r.row_label, b.created_at, z.name as zone_name
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        JOIN events e ON t.event_id = e.id
        JOIN sessions s ON t.session_id = s.id
        JOIN seats se ON t.seat_id = se.id
        JOIN seat_rows r ON se.row_id = r.id
        JOIN zones z ON r.zone_id = z.id
        JOIN arenas a ON z.arena_id = a.id
        WHERE b.user_id = ?
        GROUP BY t.id
        ORDER BY b.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};
