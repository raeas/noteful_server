const express = require('express')
const logger = require('../logger')
const NotesService = require('./notes-service')
const path = require('path')

const notesRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
  id: note.id,
  name: note.name,
  content: note.content,
  modified: note.modified,
  folder_id: note.folder_id
})

notesRouter
  .route('/api/notes')
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then(notes => {
        res.json(notes.map(serializeNote))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    for (const field of ['name', 'content']) {
      if(!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `Missing '${field}' in request body`}
        })
      }
    }
    const { name, content, folder_id } = req.body

    const newNote = { name, content, folder_id }

    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        logger.info(`Note with id ${note.id} created.`)
        res
          .status(201)
          .location(path.posix.join(req.originalUrl) + `/${note.id}`)
          .json(serializeNote(note))
      })
      .catch(next)
  })

notesRouter
  .route('/api/notes/:note_id')
  .all((req, res, next) => {
    const { note_id } = req.params
    NotesService.getById(req.app.get('db'), note_id)
      .then(note => {
        if (!note) {
          logger.error(`Note with id ${note_id} not found.`)
          return res.status(400).json({
            error: { message: 'Note not found' }
          })
        }
        res.note = note
        next()
      }) 
      .catch(next)
  })
  .get((req, res) => {
    res.json(serializeNote(res.note))
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
    .then(numRowsAffected => {
      res.status(204).end()
    })
    .catch(next)
  })
  .patch(bodyParser, (req, res, next) => {
    const { name, content, modified, folder_id } = req.body
    const noteToUpdate = { name, content, modified, folder_id }
    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
      if (numberOfValues === 0) {
        return res.status(400).json({
          error: {
            message: `Request body must contain either 'name' or 'content'`
          }
        })
      }

      NotesService.updateNote(
        req.app.get('db'),
        req.params.note_id,
        noteToUpdate
      )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })


module.exports = notesRouter
