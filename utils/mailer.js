const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendBookingEmail = async (userEmail, bookingDetails) => {
    try {
        const data = await resend.emails.send({
            from: 'RaceTickets <onboarding@resend.dev>', 
            to: userEmail,
            subject: 'Confirmation de votre réservation !',
            html: `<h1>Réservation confirmée !</h1><p>Code ticket : ${bookingDetails.ticketCode}</p>`
        });
        console.log("email envoyé via API :", data.id);
        return data;
    } catch (error) {
        console.error("erreur API mail :", error);
    }
};

module.exports = { sendBookingEmail };