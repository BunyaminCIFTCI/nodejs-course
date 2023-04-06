const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto'); // built in node module
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'please tell us your name'] },
  email: {
    type: String,
    required: [true, 'please provider your mail'],
    lowercase: true,
    validate: [validator.isEmail, 'plese enter a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'leadguide'],
    default: 'user',
  },
  password: {
    type: String,
    minLength: 4,
    select: false,
    required: [true, 'please provide a password'],
  },
  passwordConfirm: {
    type: String,

    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: 'passwords are not matching',
    },
  },
  photo: {
    type: String,
  },
  passwordChangedAt: {
    // btw if we are creating a user with that property and we pass the date value to json in req.body then is has to be in the form of "year-month-day"
    type: Date,
  },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },

  active: {
    type: Boolean,
    default: true,
    // select: false,
  },
});

userSchema.pre('save', async function (user, next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12); // higher the number ,higher the cpu intensive process and higher the password encrypted good
  this.passwordConfirm = undefined; // so passwordConfirm only works during the first creation of user which is the validation part then it vanishes
});
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangetAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimeStamp;
  }
  // false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // if we store that plain resettoken in the database then when the hacker reaches the db then he takes the token and changes the password which is not something that we want that is why below we make a little bit cryptography

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; // of course send unencrpyted one otherwise there is no meaning for encryption
};

const User = mongoose.model('User', userSchema);

module.exports = User;
