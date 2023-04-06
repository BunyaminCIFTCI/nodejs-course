const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '90d' });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    // secure: true,this part is used if we are in production because it uses https instead of http
    httpOnly: true,
  };
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({ status: 'success', token, user });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    password: req.body.password,
    role: req.body.role,
    email: req.body.email,
  });

  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //check if email and password exist
  if (!email || !password) {
    return next(new AppError('please provide both email and password', 404));
  }

  //check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401)); // to not show the hacker either mail or password wrong
  }
  //if everything is okay send token to the client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // get the token and check if it exists
  let token; //because if we define inside the if block then it is not gonna be available at outside
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('you are not logged in please log in', 401));
  }
  // verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // if successfull then check if user still exists
  // we do this because token may have been stolen and user is deleted at some time
  // then which means the person that stole that token can login even if there is no user anymore
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('user belongs to this token does not exist longer', 401)
    );
  }
  // if user changed the password after token is issued
  if (!currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('recently changed the password please log in', 401)
    );
  }
  // Grant access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to do that action', 401)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user with this email address', 404));
  }
  // generate a random reset token

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false }); // because we modified the user document and now we are saving it
  //send it to the user's email

  res.status(200).json({ status: 'success' });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from the collection
  const user = await User.findById(req.user._id).select('+password');
  // check if password correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Incorrect password', 401));
  }
  // update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save(); // to make the validators run
  // login with new password and send jwt

  createSendToken(user, 200, res);
});
