var parser = require('parser');

var applyTests = function(arr, validatorFunction) {
  arr.forEach(function(test, i) {
    var expected = test[0];
    var input = test[1];
    validatorFunction(expected, input);
  });
};

// Test the parser.
applyTests([
  [10, '10'],
  [10.1, '10.1'],
  ['abc', '"abc"'],
  [null, 'null'],
  [true, 'true'],
  [false, 'false'],

  [['#', 'abc'],
      'abc'],
  [[['#', 'abc'], [1, 2]],
      'abc(1, 2)'],
  [[[[['#', 'abc'], [1, 2]], []], [3]],
      'abc(1, 2)()(3)'],

  [['+', 10],
      '+10'],
  [['-', ['#', 'abc']],
      '-abc'],

  [['*', ['/', 3, 4], 5],
      '3 / 4 * 5'],
  [['-', ['+', 2, ['*', ['/', 3, 4], 5]], 6],
      '2 + 3 / 4 * 5 - 6'],

  [['||', ['&&', ['<', 2, 3], ['==', 4, 6]], true],
      '2 < 3 && 4 == 6 || true'],

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
    numZero: 0,
    boolTrue: true,
    strXYZ: 'XYZ',
    num100_001: 100.001,
    boolFalse: false,
    strNull: '',
  },
  system,
];
applyTests([
  [0, 'numZero'],
  [10, '+10'],
  [-80.001, '20 - num100_001'],
  [true, '!strNull'],
  [-5, '1 - 2 * 3'],
  [1000.01, 'num100_001 / 0.1'],
  [3, '23 % 5'],
  [true, '1 <= numZero || 1 >= numZero'],
  [false, '100 < num100_001 && 1 > num100_001'],
  [false, 'boolTrue == boolFalse'],
  [true, 'strNull != strXYZ'],
  [0, 'boolFalse ? boolTrue : numZero'],
  [ExprUndefinedVarError, 'numZero + numOne'],
  [ExprWrongNumArgsError, ['+', 10, 20, 30]],
  [ExprWrongNumArgsError, ['==', true]],

], function(expected, expression) {
  // 'expected' should be either a JavaScript primitive value that would be the
  // result of evaluation 'expression', or an exception that is expected to be
  // thrown.
  // 'expression' is either a string (in which case parsed) or a parse tree.
  var parsed = typeof(expression) == 'string' ?
      parser.parse(expression) : expression;
  var parsed_json = JSON.stringify(parsed);
  var evaled;
  try {
    evaled = evaluate(parsed, ENVS);
    if (expected instanceof Error || evaled != expected) {
      console.error('input     : ' + expression);
      console.error('parsed    : ' + parsed_json);
      console.error('evaluated : ' + evaled);
      console.error('expected  : ' + expected);
      throw new Error;
    }
  } catch (e) {
    if (!(e instanceof expected)) {
      // Wrong or unexpected exception.
      console.error('input     : ' + expression);
      console.error('parsed    : ' + parsed_json);
      console.error('exception : ' + e);
      console.error('expected  : ' + expected);
      throw new Error;
    }
  }
});

console.log('All tests passed!');
