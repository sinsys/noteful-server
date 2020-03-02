require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');

const foldersRouter = require('./folders/folders-router');
const notesRouter = require('./notes/notes-router');

const app = express();

const morganOpt =
  ( NODE_ENV === 'production' )
    ? 'tiny'
    : 'common';

app.use(
  morgan(morganOpt),
  helmet(),
  cors()
);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use(
  '/api/notes',
  notesRouter
);

app.use(
  '/api/folders',
  foldersRouter
);

errorHandler = (err, req, res, next) => {
  let response;
  if (NODE_ENV === 'production') {
    response = { 
      error: { 
        message: 'server error' 
      }
    };
  } else {
    console.error(err);
    response = {
      message: err.message, err
    };
  }
  res.status(500).json(response)
};

app.use(errorHandler);

module.exports = app;