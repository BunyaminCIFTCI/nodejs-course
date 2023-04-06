const fs = require('fs');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');
// exports.checkID = (req, res, next, value) => {

//   if (value * 1 > tours.length - 1) {
//     return res.status(404).json({ message: 'invalid id' });
//   }
//   next();
// };
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price ';
  req.query.fields = 'name,difficulty,price,ratingsAverage';

  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  //const tours=await Tour.find().where("duration").lte(5).where("difficulty").equals("easy")-> sometimes that method can be more useful
  //filtering

  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((e) => {
    delete queryObj[e];
  });

  //Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(lt|lte|gt|gte)\b/g, (word) => `$${word}`);

  queryStr = JSON.parse(queryStr);

  let query = Tour.find(queryStr);

  //Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');

    query = query.sort(sortBy);
  } else {
    query = query.sort('createdAt');
  }

  //Field Limiting
  if (req.query.fields) {
    const selectBy = req.query.fields.split(',').join(' ');
    query = query.select(selectBy);
    console.log(selectBy);
  } else {
    query = query.select('-__v');
  }

  //Pagination

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  if (req.query.page) {
    if (skip > numDocs) throw new Error('No such a page');
  }
  query = query.skip(skip).limit(limit);
  // const tours = await query.explain() gives us the lots of info related that query;
  const tours = await query;
  res.status(200).json({ status: 'success', length: tours.length, tours });
});
// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews'); // populates creates anohter query so we have to know that it effects the performance

//   if (!tour) {
//     return next(new AppError('No tour found', 404));
//   }

//   res.status(200).json({ status: 'succes', tour });
// });
exports.getTour = handlerFactory.getOne(Tour, { path: 'reviews' });

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  if (!newTour) {
    return next(new AppError('No tour found', 404));
  }

  res.status(201).json({ status: 'success', newTour });
});

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const updateTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!updateTour) {
//     return next(new AppError('No tour found', 404));
//   }
//   // returns the  former tour not the updatedOne so we use new:true option to return updated one
//   res.status(200).json({ status: 'successs', updateTour });
// });

// also below we are using our factory function but we will to them only for Tour model currently if you want we can also do them for all the other models
exports.updateTour = handlerFactory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   await Tour.findByIdAndDelete(req.params.id);
//   res.status(204).json({ status: 'success' });
// });
exports.deleteTour = handlerFactory.deleteOne(Tour);

// so instead of writing delete function everytime we can just define a factory function for all the delete actions of all the other models

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.7 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numOfTours: { $sum: 1 }, // in each document it just adds 1
          numOfRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 }, // now it continues for the end result of previous aggregation and 1 is for ascending
      },
      {
        $match: { _id: { $ne: 'EASY' } },
      },
    ]);

    res.status(200).json({ status: 'success', stats });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      messsage: 'invalid data is sent',
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTours: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      { $sort: { numTours: 1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({ status: 'success', length: plan.length, plan });
  } catch (err) {
    res.status(404).json({ status: 'succes', message: err });
  }
};
