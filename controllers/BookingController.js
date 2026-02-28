const db = require('../db');
const { sendBookingEmail } = require('../utils/mailer'); 
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

exports.bookSeat = (req, res) => {
    const { session_id, event_id, seat_id } = req.body;
    const user_id = req.user.id; 
    const user_email = req.user.email; 

    const checkSql = `
        SELECT s.status, e.title 
        FROM sessions s 
        JOIN events e ON s.event_id = e.id 
        WHERE s.id = ?`;
    
    db.query(checkSql, [session_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "Session non trouvée" });

        if (results[0].status === 'sold_out') {
            return res.status(409).json({ message: "Cet événement est complet !" });
        }

        const eventTitle = results[0].title;

        const bookingSql = "INSERT INTO bookings (user_id, status) VALUES (?, 'confirmed')";
        
        db.query(bookingSql, [user_id], (err, bookingResult) => {
            if (err) return res.status(500).json({ error: err.message });

            const bookingId = bookingResult.insertId;
            const ticketCode = `TIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            const ticketSql = "INSERT INTO tickets (booking_id, event_id, seat_id, ticket_code) VALUES (?, ?, ?, ?)";
            
            db.query(ticketSql, [bookingId, event_id, seat_id, ticketCode], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const io = req.app.get('socketio');

                io.emit('event:seat-update', { event_id, session_id, seat_id, status: 'booked' });
                io.emit('event:booking-confirmed', { 
                    bookingId, email: user_email, ticketCode, event_id, timestamp: new Date() 
                });

                const bookingDetails = { ticketCode, session_id, event_id };
                sendBookingEmail(user_email, bookingDetails)
                    .then(() => console.log("Mail envoyé à " + user_email))
                    .catch(err => console.error("Erreur mail:", err));

                twilio.messages.create({
                    body: `Confirmation RaceTickets : Votre billet pour ${eventTitle} est validé ! Code : ${ticketCode}`,
                    from: process.env.TWILIO_PHONE,
                    to: '+330615101921'
                })
                .then(msg => console.log("📱 SMS envoyé, SID:", msg.sid))
                .catch(err => console.error("Erreur SMS Twilio:", err));

                console.log(`📅 Info : L'événement "${eventTitle}" est prêt pour l'API Google Calendar.`);

                res.status(201).json({ 
                    bookingId: bookingId, 
                    confirmation: `Réservation réussie ! Ticket : ${ticketCode}. Confirmation envoyée par Email et SMS.` 
                });
            });
        });
    });
};