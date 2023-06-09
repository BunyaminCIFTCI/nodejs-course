const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter;
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const reviews = await Review.find(filter);

  res.status(200).json({ status: 'success', length: reviews.length, reviews });
});

exports.creaeteReview = catchAsync(async (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  const review = await Review.create(req.body);
  res.status(201).json({ status: 'success', review });
});
