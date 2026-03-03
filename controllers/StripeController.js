const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY.trim());

exports.createPaymentIntent = async (req, res) => {
    const { amount, currency, sessionId, seatId, eventId } = req.body;

    if (!amount || !sessionId || !seatId || !eventId) {
        console.error('Paramètres manquants :', { amount, sessionId, seatId, eventId });
        return res.status(400).json({ error: "Paramètres manquants pour la création de l'intention de paiement." });
    }

    try {
        const userId = (req.user && req.user.id) ? req.user.id.toString() : 'unknown';
        console.log('Creating payment intent for userId:', userId, 'with:', { amount, currency, sessionId, seatId, eventId });
        
        const stripeAmount = Math.round(parseFloat(amount) * 100);
        if (isNaN(stripeAmount) || stripeAmount <= 0) {
            throw new Error(`Montant invalide: ${amount}`);
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: stripeAmount,
            currency: (currency || 'eur').toLowerCase(),
            metadata: {
                userId: userId,
                sessionId: sessionId.toString(),
                seatId: seatId.toString(),
                eventId: eventId.toString()
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Erreur Stripe détaillée :', error);
        res.status(500).json({ error: error.message });
    }
};
