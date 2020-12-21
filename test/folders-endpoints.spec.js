const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeFoldersArray } = require('./folders.fixtures')

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

  afterEach('cleanup', () => db.raw('TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))

//1 DESCRIBE - get folders endpoint
  describe(' 1 GET /api/folders', () => {
//1A - CONTEXT to folders endpoint - given no folders in the db
    context('1A Given no folders', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, [])
      })
    })
//1B - CONTEXT to folders endpoint - given there are folder in the db
    context('1B Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
          })
      })

      it('responds with 200 and all of the folders', () => {
        return supertest(app)
        .get('/api/folders')
        .expect(200, testFolders)
      })
    })
  //1C - CONTEXT to folders endpoint - Malicious Folder
  // context(`Given an XSS attack article`, () => {
  //   const { maliciousArticle, expectedArticle } = makeMaliciousArticle()
  //   const testUsers = makeUsersArray()

  //   beforeEach('insert malicious article', () => {
  //     return db
  //       .into('blogful_users')
  //       .insert(testUsers)
  //       .then(() => {
  //         return db
  //         .into('blogful_articles')
  //         .insert([ maliciousArticle ])
  //       })
  //   })

  //   it('removes XSS attach content', () => {
  //     return supertest(app)
  //       .get(`/api/articles`)
  //       .expect(200)
  //       .expect(res => {
  //         expect(res.body[0].title).to.eql(expectedArticle.title)
  //         expect(res.body[0].content).to.eql(expectedArticle.content) 
  //       })
  //   })
  // })
  })
//2 DESCRIBE - folders by id    
  describe(` 2 GET /api/folders/:folder_id`, () => {
//2A CONTEXT - to folders by id - given no folder id in db
    context(`2A Given no folders`, () => {
      it(`responds with 404`, () => {
        const folder_id = 123456
        return supertest(app)
          .get(`/api/folders/${folder_id}`)
          .expect(404, { error: { message: `Folder doesn't exist` } })
       })
    })
//2B CONTEXT - to folders by id - given there are folders by id in db
    context('2B Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

    beforeEach('insert folders', () => {
      return db
        .into('noteful_folders')
        .insert(testFolders)
        .then(() => {
          return db
        })
    })

    it('responds with 200 and the specified folder', () => {
      const folderId = 2
      const expectedFolder = testFolders[folderId - 1]
      return supertest(app)
        .get(`/api/folders/${folderId}`)
        .expect(200, expectedFolder)
      })
    })
//2C CONTEXT - to folders by id - given there are malicious folders in db
    // context(`Given an XSS attack article`, () => {
    //   const { maliciousArticle, expectedArticle } = makeMaliciousArticle()
    //   const testUsers = makeUsersArray()

    //     beforeEach('insert malicious article', () => {
    //       return db
    //         .into('blogful_users')
    //         .insert(testUsers)
    //         .then(() => {
    //           return db
    //             .into('blogful_articles')
    //             .insert([ maliciousArticle ])
    //         })
    //     })
      
    //     it('removes XSS attack content', () => {
    //       return supertest(app)
    //         .get(`/api/articles/${maliciousArticle.id}`)
    //         .expect(200)
    //         .expect(res => {
    //           expect(res.body.title).to.eql(expectedArticle.title)
    //           expect(res.body.content).to.eql(expectedArticle.content)
    //         })
    //       })
    //     })
  })
//3 DESCRIBE - POST folders by id  
  describe(` 3 POST /api/folders`, () => {

    // beforeEach('insert malicious article', () => {
    //   return db
    //     .into('blogful_users')
    //     .insert(testUsers)
    // })

    it(`creates a folder, responding with 201 and the new folder`,  function() {
      this.retries(3)
      const newFolder = {
        name: 'Test new folder',
      }
    return supertest(app)
      .post('/api/folders')
      .send(newFolder)
      .expect(201)
      .expect(res => {
        expect(res.body.name).to.eql(newFolder.name)
        expect(res.body).to.have.property('id')
        expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
      })
      .then(postRes =>
        supertest(app)
        .get(`/api/folders/${postRes.body.id}`)
        .expect(postRes.body)
      )
    })

    const requiredFields = ['name']

    requiredFields.forEach(field => {
    const newFolder = {
      name: 'Test new folder',
    }

    it(`responds with 400 and an error message when the '${field}' is missing`, () => {
      delete newFolder[field]

      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(400, {
          error: { message: `Missing '${field}' in request body` }
        })
      })
    })

    // it('removes XSS attack content from response', () => { 
    //   const { maliciousArticle, expectedArticle } = makeMaliciousArticle()
    //   return supertest(app)
    //   .post(`/api/articles`)
    //   .send(maliciousArticle)
    //   .expect(201)
    //   .expect(res => {
    //     expect(res.body.title).to.eql(expectedArticle.title)
    //     expect(res.body.content).to.eql(expectedArticle.content)
    //   })
    // })
  })
//4 DESCRIBE - DELETE folders by id  
  describe(`4 DELETE /api/folders/:folder_id`, () => {
//4A CONTEXT - given there are no folders by id to delete
    context(`4A Given no folders`, () => {
      it(`responds with 404`, () => {
        const folder_Id = 123456
        return supertest(app)
          .delete(`/api/articles/${folder_Id}`)
          .expect(404, { error: { message: `Folder doesn't exist` } })
      })
    })
//4B CONTEXT - given there are folders by id to delete
    context('4B Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              // .into('blogful_articles')
              // .insert(testArticles)
          })
      })
    
      it('responds with 204 and removes the folder', () => {
        const idToRemove = 2
        const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders`)
              .expect(expectedFolders)
          )
      })
    })
  })
//5 DESCRIBE - PATCH folders by id 
describe(`5 PATCH /api/folders/:folder_id`, () => {
//5A CONTEXT given there are no folders by id
    context(`5A Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456
        return supertest(app)
          .patch(`/api/articles/${folderId}`)
          .expect(404, { error: { message: `Folder doesn't exist` } })
      })
    })
//5B CONTEXT given there are folders in the database
    context('5B Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()
      
      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then (() => {
            return db
          })
      })
      
      it('responds with 204 and updates the folder', () => {
        const idToUpdate = 2
        const updateFolder = {
          name: 'updated folder name',
        }
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder
        }
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updateFolder)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
            )
        })
      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain 'name'`
            }
          })
        })
      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateFolder = {
          name: 'updated folder name',
        }
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder
        }

        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({
            ...updateFolder,
              fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          )
      })
    })
  })
})