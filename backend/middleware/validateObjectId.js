const { isValidObjectId } =
  require('mongoose');

const validateObjectId =
  (req, res, next) => {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({
        message: 'Invalid ID format.'
      });
    next();
  };

module.exports = validateObjectId;