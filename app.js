const express = require('express');
const fs = require('fs');
const AppError = require('./utils/appError');
const app = express();
const errorController = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const helmet = require('helmet');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const limiter = rateLimit({
  max: 100,
  windowMs: 1 * 60 * 60 * 1000,
  message: 'too many requests try in hour later',
});
//set security http headers
app.use(helmet());
// limiting the request numbers
app.use('/api', limiter);
//  to reach the data in json
app.use(
  express
    .json
    // {limit:"10kb"}=>json content can not be more than 10kb
    ()
);
// data sanitization against nosql query injection
app.use(mongoSanitize()); // here it removes dollar signs

// data sanitization against xss atack
app.use(xss()); // to prevent js injection with html code

// preventing parameter pollution
app.use(
  hpp({
    whiteList: ['duration', 'price'],
  })
); // if we do not use it and if we use two same parameters in query then we get an error but with using hpp
//it takes only the last parameter but when we want to work with more than one parameter then we define a white list

// tour routes
app.use('/api/v1/tours', tourRouter);
//user routes

app.use('/api/v1/users/', userRouter);
// review routes
app.use('/api/v1/reviews/', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can not find ${req.url} route`, 404)); // whatever is passed into the next function is viewed as error in express and directly jumps to the error handling middlware with passing all the other middlewares
});

app.use(errorController);

//server
module.exports = app;
