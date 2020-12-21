process.env.TZ = 'UTC' //not sure if this is works w/ Windows
require('dotenv').config()
const { expect } = require('chai')
const supertest = require('supertest')

global.expect = expect
global.supertest = supertest