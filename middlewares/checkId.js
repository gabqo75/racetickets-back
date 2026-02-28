const checkId = (req, res, next) => {
    const id = req.params.id;
    if (isNaN(id)) {
        return res.status(400).json({ error: "L'ID fourni n'est pas valide" });
    }
    next();
};

module.exports = { checkId };