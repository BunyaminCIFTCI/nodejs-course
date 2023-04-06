const express = require('express');
const userController = require('../controllers/userControllers');
const router = express.Router();

const authController = require('../controllers/authController');

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);
router.route('/').get(userController.getAllUsers);
router.route('/forgotPassword').post(authController.forgotPassword);
router.patch(
  '/updateMe',
  authController.protect,

  userController.updateMe
);
router
  .route('/deleteMe')
  .delete(authController.protect, userController.deleteMe);

router.post('/');

router
  .route('/updatePassword')
  .patch(authController.protect, authController.updatePassword);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
