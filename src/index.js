const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const apiRoutes = require('./routes/v1/index');
const appErrorHandler = require('./middleware/app-error-handler');
const errorHandler = require('./middleware/error-handler');
const responseHandler = require('./middleware/response-handler');
dotenv.config();
// cors :- allowing other origins
app.use(cors());
// req body json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// response Handler
app.use(responseHandler); // have kept above routes, because it will enable route controller to access sendSuccess or sendError Function
app.use('/api/v1/', apiRoutes);
app.use(appErrorHandler);
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`);
});
