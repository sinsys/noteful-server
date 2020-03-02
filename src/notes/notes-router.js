const path = require('path');
const express = require('express');
const xss = require('xss');

const NotesService = require('./notes-service');
const notesRouter = express.Router();
const jsonParser = express.json();

serializeNote = (note) => {
  return (
    {
      ...note,
      name: xss(note.name),
      content: xss(note.content)
    }
  );
};

notesRouter
  .route('/')
    .get( (req, res, next) => {
      const knexInst = req.app.get('db');
      NotesService
        .getNotes(knexInst)
        .then(notes => {
          res.json(
            notes.map(serializeNote)
          )
        })
        .catch(next);
    })
    .post( jsonParser, (req, res, next) => {
      const {
        name,
        content,
        folder,
        modified
      } = req.body;
      const newNote = {
        name,
        content,
        folder,
        modified
      };
      for ( const [key, value] of Object.entries(newNote) ) {
        if ( value == null ) {
          return (
            res
              .status(400)
              .json({
                error: {
                  message: `Missing '${key}' in request body`
                }
              })
          )
        }
      };
      newNote.modified = new Date();
      const knexInst = req.app.get('db');
      NotesService
        .addNote(
          knexInst,
          newNote
        )
        .then(note => {
          return (
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `/${note.id}`))
              .json(serializeNote(note))
          );
        })
        .catch(next);
    });

notesRouter
  .route('/:id')
    .all( (req, res, next) => {
      const knexInst = req.app.get('db');
      NotesService
        .getNote(
          knexInst,
          req.params.id
        )
        .then(note => {
          if ( !note ) {
            return (
              res
                .status(404)
                .json({
                  error: {
                    message: `Note doesn't exist`
                  }
                })
            );
          };
          res.note = note;
          next();
        })
        .catch(next);
    })
    .delete( (req, res, next) => {
      const knexInst = req.app.get('db');
      NotesService
        .deleteNote(
          knexInst,
          req.params.id
        )
        .then(() => {
          return (
            res
              .status(204)
              .end()
          )
        })
        .catch(next);      
    })
    .patch(jsonParser, (req, res, next) => {
      const knexInst = req.app.get('db');
      const { 
        name, 
        content, 
        folder 
      } = req.body;
      const noteToUpdate = { 
        name, 
        content, 
        folder
      };
      noteToUpdate.modified = new Date();
      const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
      if (numberOfValues === 0) {
        return res.status(400).json({
          error: {
            message: `Request body must contain either 'name', 'content' or 'folder'`
          }
        })
      };
      NotesService.updateNote(
        req.app.get('db'),
        req.params.id,
        noteToUpdate
      )
      .then((rowsAffected) => {
        NotesService
          .getNote(
            knexInst,
            req.params.id
          )
          .then(note => {
            if ( !note ) {
              return (
                res
                  .status(404)
                  .json({
                    error: {
                      message: `Note doesn't exist`
                    }
                  })
              );
            };
            return (
              res
                .status(200)
                .json(note)
            )
          })
      })
      .catch(next)
    });

module.exports = notesRouter;