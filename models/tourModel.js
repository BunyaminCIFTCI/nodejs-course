const mongoose = require('mongoose');
const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'a tour must have a name'],
      unique: true,
      maxLength: [20, 'a tour must have max 20 chars'],
      minLength: [2, 'a tour must have at least 2 chars'],
      // validate: [validator.isAlpha, 'tour name must only contain chars'], we are not using here because it does not accept blank spaces either
    },
    duration: {
      type: Number,
    },
    maxGroupSize: {
      type: Number,
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy medium or difficult',
      },
    },
    ratingsQuantity: {
      type: Number,

      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'a tour must have a price '],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating can not be more than 5'], // min and max work for dates , as well
    },
    priceDiscount: {
      type: Number,
      // validate either returns true or false
      // it runs only for create and save not for updating for example
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message:
          'discount which is ({VALUE}) can not be more than price itself', //here ({VALUE}) refers to current value of discount
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // located in db but not returned to user
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      // GeoJSON to work with geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
      address: String,
      description: String,
    },
    // for embedding we just define an array of objects

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // then to get the data according to that id we use populate method in query part
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// with the expression below we say that docs are gonna be read as price values are in ascending order and
// when we sort the query then our function is not gonna need to read all the docs which is really important
// for the performance. So if we have lots of docs and if some fields are being used and sorted a lot
// then we definetly have to know about the indexes
// Note:unique fields in the schema definiton are also counted as index fields so if we define a field as unique then we do not have to define it in the index tab as well
// Warning:We have to choose index fields carefully because they take a big amount of storage

// Warning : When we remove the code of the index then we have to delete it from the db as well otherwise
// it will still be located in db
tourSchema.index({ price: 1, ratingsAverage: -1 });
// we can not use virtual properties with query functions because they are not located in db
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
// virtual populate
// we are going to populate it only with get tour route btw
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
// Document Middleware and runs before save and create methods
// pre save hook or pre save middleware
tourSchema.pre('save', function (next) {
  next();
});

// Query Middleare

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -active',
  });

  next();
});
tourSchema.post(/^find/, function (docs, next) {
  next();
});

//Aggregation Middleware

tourSchema.pre('aggregate', function (next) {
  //console.log(this.pipeline()) this function returns the array of all the aggregation operators we have done

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
