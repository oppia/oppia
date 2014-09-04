var parser = require('parser');

var applyTests = function(arr, validator) {
  var expected;
  arr.forEach(function(elem, i) {
    if (i % 2 == 0) {
      expected = elem;
    } else {
      validator(expected, elem);
    }
  });
};

// Test the parser.
applyTests([
  10, '10',
  10.1, '10.1',
  'abc', '"abc"',
  null, 'null',
  true, 'true',
  false, 'false',

  ['#', 'abc'],
      'abc',
  [['#', 'abc'], [1, 2]],
      'abc(1, 2)',
  [[[['#', 'abc'], [1, 2]], []], [3]],
      'abc(1, 2)()(3)',

  ['+', 10],
      '+10',
  ['-', ['#', 'abc']],
      '-abc',

  ['*', ['/', 3, 4], 5],
      '3 / 4 * 5',
  ['-', ['+', 2, ['*', ['/', 3, 4], 5]], 6],
      '2 + 3 / 4 * 5 - 6',

  ['||', ['&&', ['<', 2, 3], ['==', 4, 6]], true],
      '2 < 3 && 4 == 6 || true',

], function(expected, expression) {
  var parsed = parser.parse(expression);
  var parsed_json = JSON.stringify(parsed);
  var expected_json = JSON.stringify(expected);
  if (parsed_json != expected_json) {
    console.error('input    : ' + expression);
    console.error('parsed   : ' + parsed_json);
    console.error('expected : ' + expected_json);
    throw new Error;
  }
});

// Test the evaluator.
var ENVS = [
  {
    abc: 0,
    def: true,
    ghi: 'GHI',
    jkl: 100.001,
    mno: false,
    pqr: '',
  },
  system,
];
applyTests([
  0, 'abc',
  10, '+10',
  -80.001, '20 - jkl',
  true, '!pqr',
  -5, '1 - 2 * 3',
  1000.01, 'jkl / 0.1',
  3, '23 % 5',
  true, '1 <= abc || 1 >= abc',
  false, '100 < jkl && 1 > jkl',
  false, 'def == mno',
  true, 'ptr != ghi',
  0, 'mno ? def : abc',

], function(expected, expression) {
  var parsed = parser.parse(expression);
  var parsed_json = JSON.stringify(parsed);
  var evaled = evaluate(parsed, ENVS);
  if (evaled != expected) {
    console.error('input     : ' + expression);
    console.error('parsed    : ' + parsed_json);
    console.error('evaluated : ' + evaled);
    console.error('expected  : ' + expected);
    throw new Error;
  }
});

console.log('All tests passed!');
