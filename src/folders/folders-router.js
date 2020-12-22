const express = require('express')
const logger = require('../logger')
const FoldersService = require('./folders-service')
const path = require('path')
const foldersRouter = express.Router()
const bodyParser = express.json()

const serializeFolder = folder => ({
  id: folder.id,
  name: folder.name
})

foldersRouter
  .route('/api/folders')
  .get((req, res, next) => {
    FoldersService.getAllFolders(req.app.get('db'))
      .then(folders => {
        res.json(folders.map(serializeFolder))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    for (const field of ['name']) {
      if(!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `Missing '${field}' in request body`}
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
          .json(serializeFolder(folder))
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
    res.json(serializeFolder(res.folder))
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
            message: `Request body must contain 'name'`
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
