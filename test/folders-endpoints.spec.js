const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makesFoldersArray } = require('./folders.fixtures')

describe('Folders Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('noteful_folders'))

  describe('GET /folders', () => {
    context('Given no folders', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('noteful_folders')
          .expect(200, [])
      })
    })
  })

  // context ('Given there are folders in the database', () => {

  // } )

})