const path = require('path');
const express = require('express');
const xss = require('xss');
const jsonParser = express.json();

const FoldersService = require('./folders-service');
const foldersRouter = express.Router();

serializeFolder = (folder) => {
  return (
    {
      ...folder,
      name: xss(folder.name)
    }
  );
};

foldersRouter
  .route('/')
    .get( (req, res, next) => {
      const knexInst = req.app.get('db');
      FoldersService
        .getFolders(knexInst)
        .then(folders => {
          res.json(
            folders.map(serializeFolder)
          )
        })
        .catch(next);
    })
    .post( jsonParser, (req, res, next) => {
      const {
        name
      } = req.body;
      const newFolder = {
        name
      };
      for ( const [key, value] of Object.entries(newFolder) ) {
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
      const knexInst = req.app.get('db');
      FoldersService
        .addFolder(
          knexInst,
          newFolder
        )
        .then(folder => {
          return (
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `/${folder.id}`))
              .json(serializeFolder(folder))
          );
        })
        .catch(next);
    });

foldersRouter
  .route('/:id')
    .all( (req, res, next) => {
      const knexInst = req.app.get('db');
      FoldersService
        .getFolder(
          knexInst,
          req.params.id
        )
        .then(folder => {
          if ( !folder ) {
            return (
              res
                .status(404)
                .json({
                  error: {
                    message: `Folder doesn't exist`
                  }
                })
            );
          };
          res.folder = folder;
          next();
        })
        .catch(next);
    })
    .delete( (req, res, next) => {
      const knexInst = req.app.get('db');
      FoldersService
        .deleteFolder(
          knexInst,
          req.params.id
        )
        .then(() => {
          return (
            res
              .status(204)
              .end()
          );
        })
        .catch(next);      
    })
    .patch(jsonParser, (req, res, next) => {
      const knexInst = req.app.get('db');
      const { 
        name
      } = req.body;
      const folderToUpdate = { 
        name
      };
      if ( !name ) {
        return (
          res
            .status(400)
            .json({
              error: {
                message: `Request body must contain 'name'`
              }
            })
        );
      };
      FoldersService.updateFolder(
        knexInst,
        req.params.id,
        folderToUpdate
      )
      .then((rowsAffected) => {
        FoldersService
          .getFolder(
            knexInst,
            req.params.id
          )
          .then(folder => {
            if ( !folder ) {
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
                .json(folder)
            );
          });
      })
      .catch(next);
    });

module.exports = foldersRouter;