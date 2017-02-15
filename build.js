/* eslint-disable no-console, import/no-extraneous-dependencies */
const Future = require('fluture');
const fs = require('fs');
const fetch = require('node-fetch');
const { assoc, compose, concat, filter, map, pluck, prop, reduce, replace, test } = require('ramda');
const nonSketchGlobals = require('./nonSketchGlobals');

const fetchf = Future.fromPromise(fetch);

const githubUrl = ({
  owner,
  repo,
  sha,
  recursive = true,
}) =>
  `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=${recursive}`;

const getTree = () =>
  fetchf(githubUrl({
    owner: 'abynim',
    repo: 'Sketch-Headers',
    sha: '9fb2f4f',
    recursive: true,
  }))
  .chain(res => Future.fromPromise(() => res.json(), 0));

const hasSketchPrefix = test(/^_?MS/);
const stripCruft = replace(/Headers\/(.+)\.h/, '$1');

const transformGitHubResponse = compose(
  filter(hasSketchPrefix),
  map(stripCruft),
  pluck('path'),
  prop('tree')
);

const processSketchHeaders = getTree().map(transformGitHubResponse);

// objOfValue :: b -> [a] -> { a: b }
const objOfValue = val =>
  reduce((acc, key) => assoc(key, val, acc), {});

const stringify = x => JSON.stringify(x, null, 2);

const writeFile = path => data =>
  Future.node(done =>
    fs.writeFile(path, data, { encoding: 'utf-8' }, done)
  );

const prepareJSONFile = compose(
  stringify,
  globals => ({ globals }),
  objOfValue(false),
  concat(nonSketchGlobals)
);

const main = processSketchHeaders
  .map(prepareJSONFile)
  .chain(writeFile('index.json'));

module.exports = main;

if (!module.parent) {
  main.fork(
    err => console.log('error :(', err),
    res => console.log('done!', res)
  );
}
