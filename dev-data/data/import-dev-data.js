const fs = require('fs');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE)
  .then((con) => console.log('connected to db'));

const tours = fs.readFileSync(`${__dirname}/tours.json`, 'utf-8');

// delete data from the collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('data is successfully deleted');
    process.exit();
  } catch (err) {}
};
// importing data to db

const importData = async () => {
  try {
    await Tour.create(JSON.parse(tours));
    console.log('data is successfully loaded');
    process.exit();
  } catch (err) {
    console.log('error during loading data');
  }
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
