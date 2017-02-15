const config = require('./index');

test('exports some globals', () => {
  expect(Object.keys(config)).toContain('globals');
});
