const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./models/tourModel');

dotenv.config({ path: './config.env' });
const app = require('./app');

mongoose
  .connect(process.env.DATABASE)
  .then((con) => {
    console.log('connected to database');
  })
  .catch((err) => {
    console.log(err);
  });

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
///////////
console.log('something is here');
