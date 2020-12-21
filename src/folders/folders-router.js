const express = require('express')
const logger = require('../logger')
//const data or store? (NotesService!!!)
const FoldersService = require('./folders-service')
const path = require('path')
// const { post } = require('../notes/notes-router')
const foldersRouter = express.Router()
const bodyParser = express.json()


//add GET endpoints
//add POST endpoints - use experss.json() to parse response body
///1. get data from the body
///   a. const { a, b, c } = req.body  
///2. validate "a", "b", "c"
///   b.   if (!a) {
///         logger.error('text of error')
///           return res
///           .status(400)
///         .send('invalid data')         
///         }
///3. if data is valid, to this....
//add DELETE endpoints
//module.exports = abcRouter

foldersRouter
  .route('/api/folders')
  .get((req, res, next) => {
    FoldersService.getAllFolders(req.app.get('db'))
      .then(folders => {
        res.json(folders)
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    for (const field of ['name']) {
      if(!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `'${field}' is required`}
        })
      }
    }
    const { name } = req.body

    const newFolder = { name }

    FoldersService.insertFolder(
      req.app.get('db'),
      newFolder
    )
      .then(folder => {
        logger.info(`Folder with id ${folder.id} created.`)
        res
          .status(201)
          .location(path.posix.join(req.originalUrl) + `/${folder.id}`)
          .json(folder)
      })
      .catch(next)
  })

foldersRouter
  .route('/api/folders/:folder_id')
  .all((req, res, next) => {
    const { folder_id } = req.params
    FoldersService.getById(req.app.get('db'), folder_id)
      .then(folder => {
        if (!folder) {
          logger.error(`Folder with id ${folder_id} not found.`)
          return res.status(400).json({
            error: { message: 'Folder not found' }
          })
        }
        res.folder = folder
        next()
      }) 
      .catch(next)
  })
  .get((req, res) => {
    res.json(res.folder)
  })
  .delete((req, res, next) => {
    FoldersService.deleteFolder(
      req.app.get('db'),
      req.params.folder_id
    )
    .then(numRowsAffected => {
      res.status(204).end()
    })
    .catch(next)
  })
  .patch(bodyParser, (req, res, next) => {
    const { name } = req.body
    const folderToUpdate = { name }

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
      if (numberOfValues === 0) {
        return res.status(400).json({
          error: {
            message: `Request body must contain 'name'.`
          }
        })
      }

      FoldersService.updateFolder(
        req.app.get('db'),
        req.params.folder_id,
        folderToUpdate
      )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = foldersRouter
