'use strict';

const sinon = require('sinon');
const chai = require('chai');

global.sinon = sinon
global.assert = chai.assert;

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
sinon.assert.expose(chai.assert, {prefix: ''});
