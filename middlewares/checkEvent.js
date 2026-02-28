const validateEvent = (req, res, next) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: "Le titre est obligatoire" });
    }
    next();
};
module.exports = { validateEvent };