const express = require('express')
const logger = require('../logger')
//const data or store? (NotesService!!!)
const NotesService = require('./notes-service')

const notesRouter = express.Router()
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

notesRouter
  .route('/notes')
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then(folders => {
        res.json(folders)
      })
      .catch(next)
  })
  .post(bodyParser, (req, res) => {

  })

notesRouter
  .route('/notes/:id')
  .get((req, res) => {

  }) 
  .delete((req, res) => {

  })

module.exports = notesRouter
