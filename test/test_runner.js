const fs = require('fs');
const jsdom = require('jsdom');
const path = require('path');
const sinon = require('sinon');

beforeEach(function () {
  this.sinon = sinon.sandbox.create();
  global.document = jsdom.jsdom();
  global.window = document.defaultView;
});

afterEach(function () {
  delete global.window;
  delete global.document;
  this.sinon.restore();
});

fs.readdirSync(__dirname).forEach(name => {
  if (/_spec\.js$/.test(name)) {
    require(path.join(__dirname, name));
  }
});
