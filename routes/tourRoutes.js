const express = require('express');
const reviewRouter = require('./reviewRoutes');
const tourController = require('../controllers/tourControllers');
const authController = require('../controllers/authController');
const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

// router.param('id', tourController.checkID);
// while writing the code below be careful for order of the routes otherwise we can send request to param containing route everytime
router.route('/get-monthly-plan/:year').get(tourController.getMonthlyPlan);
router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
// Also like the code below we can create nested routes but it is not that much correct to define a review route in tour route that is why we use merged params of express
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.creaeteReview
//   );

module.exports = router;
