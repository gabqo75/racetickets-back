const db = require('../db');
const { sendBookingEmail } = require('../utils/mailer');
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

exports.bookSeat = (req, res) => {
    const { session_id, event_id, seat_id } = req.body;
    const user_id = req.user.id;
    const user_email = req.user.email;

    const checkSql = `
        SELECT s.status, e.title, u.phone_number
        FROM sessions s 
        JOIN events e ON s.event_id = e.id 
        JOIN users u ON u.id = ?
        WHERE s.id = ?`;

    db.query(checkSql, [user_id, session_id], (err, results) => {
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

            const ticketSql = "INSERT INTO tickets (booking_id, event_id, session_id, seat_id, ticket_code) VALUES (?, ?, ?, ?, ?)";

            db.query(ticketSql, [bookingId, event_id, session_id, seat_id, ticketCode], (err) => {
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

                if (process.env.TWILIO_PHONE && process.env.TWILIO_SID) {
                    const userPhone = results[0].phone_number;
                    if (userPhone) {
                        let formattedPhone = userPhone.trim().replace(/\s+/g, '');
                        if (formattedPhone.startsWith('0')) {
                            formattedPhone = '+33' + formattedPhone.substring(1);
                        } else if (!formattedPhone.startsWith('+')) {
                            formattedPhone = '+33' + formattedPhone;
                        }

                        console.log(`📱 Tentative d'envoi SMS vers ${formattedPhone} via Twilio (${process.env.TWILIO_PHONE})...`);
                        twilio.messages.create({
                            body: `Confirmation RaceTickets : Votre billet pour ${eventTitle} est validé ! Code : ${ticketCode}`,
                            from: process.env.TWILIO_PHONE,
                            to: formattedPhone
                        })
                        .then(msg => console.log("SMS envoyé avec succès à " + formattedPhone + ", SID:", msg.sid))
                        .catch(err => {
                            console.error("Erreur SMS Twilio pour " + formattedPhone + ":", err.message);
                            if (err.code === 20003) {
                                console.error("   Note: Les credentials Twilio SID ou Token sont invalides. Vérifiez votre fichier .env");
                            } else if (err.code === 21211) {
                                console.error("   Note: Le numéro de téléphone de destination est invalide.");
                            }
                        });
                    } else {
                        console.log("Aucun numéro de téléphone pour cet utilisateur, saut de l'envoi SMS.");
                    }
                } else {
                    console.log("Twilio non configuré, saut de l'envoi SMS.");
                }

                res.status(201).json({
                    bookingId: bookingId,
                    confirmation: `Réservation réussie ! Ticket : ${ticketCode}. Confirmation envoyée par Email et SMS.`
                });
            });
        });
    });
};