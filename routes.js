const express = require('express');
const router = express.Router();

const eventController = require('./controllers/EventController'); 
const authController = require('./controllers/authController');
const bookingController = require('./controllers/BookingController');
const stripeController = require('./controllers/StripeController');
const ticketController = require('./controllers/TicketController');

const { validateEvent } = require('./middlewares/checkEvent');
const { checkId } = require('./middlewares/checkId');
const { verifyToken, isAdmin } = require('./middlewares/checkAuth'); 

router.post('/bookings', verifyToken, bookingController.bookSeat);
router.post('/create-payment-intent', verifyToken, stripeController.createPaymentIntent);
router.get('/tickets', verifyToken, ticketController.getUserTickets);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/events', eventController.getAllEvents);
router.get('/cities', eventController.getAllCities);
router.get('/events/:id', eventController.getEventDetails);
router.get('/sessions/:sessionId/zones/:zoneId/seats', eventController.getAvailableSeats);

router.post('/events', verifyToken, isAdmin, validateEvent, eventController.createEvent);
router.put('/events/:id', verifyToken, isAdmin, checkId, validateEvent, eventController.updateEvent);
router.delete('/events/:id', verifyToken, isAdmin, checkId, eventController.deleteEvent);

module.exports = router;