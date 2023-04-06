const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params._id);
    if (!doc) {
      return next(new AppError('No document found with that id'));
    }
    res.status(200).json({ status: 'success' });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!doc) {
      return next(new AppError('No doc with that id', 404));
    }

    res.status(200).json({ status: 'success', doc });
  });
};

exports.getOne = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;

    if (!doc) {
      return next(new AppError('No doc with such an id', 404));
    }
    res.status(200).json({ status: 'success', doc });
  });
};
