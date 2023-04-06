const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const express = require('express');

const router = express.Router({ mergeParams: true }); // with merge params we can get params of previous routes

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.creaeteReview
  );

module.exports = router;
