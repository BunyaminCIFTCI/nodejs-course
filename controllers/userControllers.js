const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

const multer = require('multer');

const multerStorage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(err);
  },
});
const upload = multer({ dest: 'public/imgs/users' });
exports.uploadUserPhoto = upload.single('photo');
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ status: 'success', length: users.length, users });
});

exports.getUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'fail', message: 'route is not implemented yet' });
};
exports.updateUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'fail', message: 'route is not implemented yet' });
};
exports.deleteUser = catchAsync(async (req, res, next) => {
  res
    .status(500)
    .json({ status: 'fail', message: 'route is not implemented yet' });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // create error is user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('this route is not for password update', 400));
  }
  // update user data
  const filteredBody = filterObj(req.body, 'name', 'email'); // to not update unwanted fields
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', updatedUser });
});

const filterObj = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: !req.user.active });

  res.status(204).json({ status: 'success' });
});
