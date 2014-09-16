// TODO(kashida): Integrated with Karma.

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
  [32, '0x20'],
  [10.1, '10.1'],
  [0.001, '1e-3'],
  [0.35, '.35'],
  ['abc', '"abc"'],
  ["a'b'c", '"a\'b\'c"'],
  [null, 'null'],
  [true, 'true'],
  [false, 'false'],

  [['#', 'abc'],
      'abc'],
  [['#', 'あいうえお'],
      'あいうえお'],
  [[['#', 'abc'], [1, 2]],
      'abc(1, 2)'],
  [[[[['#', 'abc'], [1, 2]], []], [3]],
      'abc(1, 2)()(3)'],

  [['+', 10],
      '+10'],
  [['-', ['#', 'abc']],
      '-abc'],
  [['-', 0.35], '-.35'],

  // There is a double width space after '+'.
  [['+', 1, 2], '\t1 +　2 '],

  [['*', ['/', 3, 4], 5],
      '3 / 4 * 5'],
  [['-', ['+', 2, ['*', ['/', 3, 4], 5]], 6],
      '2 + 3 / 4 * 5 - 6'],

  [['||', ['&&', ['<', 2, 3], ['==', 4, 6]], true],
      '2 < 3 && 4 == 6 || true'],

  // Expected to produce parser error.
  [undefined, 'a1a-'],
  [undefined, '0.3.4'],
  [undefined, 'abc()('],
  [undefined, '()'],
  [undefined, '*100'],

], function(expected, expression) {
  // 'expected' should be either a JavaScript primitive value that would be the
  // result of evaluating 'expression', or undefined (which means that the
  // parser is expected to fail).
  // 'expression' is the expression string to be parsed.

  var failed = false;
  try {
    var parsed = parser.parse(expression);
    parsed_json = JSON.stringify(parsed);
    var expected_json = JSON.stringify(expected);
    if (expected === undefined || parsed_json != expected_json) {
      console.error('input    : ' + expression);
      console.error('parsed   : ' + parsed_json);
      console.error('expected : ' + expected_json);
      failed = true;
    }
  } catch (e) {
    if (expected !== undefined || !(e instanceof parser.SyntaxError)) {
      // Wrong or unexpected exception.
      console.error('input     : ' + expression);
      console.error('exception : ' + e);
      console.error('expected  : ' + expected);
      failed = true;
    }
  }
  if (failed) {
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
  [0, '0x100 - 256'],
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
  // 'expression' is either a string (in which case parsed) or an array
  // (representing a parse tree).
  var parsed = typeof(expression) == 'string' ?
      parser.parse(expression) : expression;
  var parsed_json = JSON.stringify(parsed);
  var failed = false;
  try {
    var evaled = evaluate(parsed, ENVS);
    if (expected instanceof Error || evaled !== expected) {
      console.error('input     : ' + expression);
      console.error('parsed    : ' + parsed_json);
      console.error('evaluated : ' + evaled);
      console.error('expected  : ' + expected);
      failed = true;
    }
  } catch (e) {
    if (!(e instanceof expected)) {
      // Wrong or unexpected exception.
      console.error('input     : ' + expression);
      console.error('parsed    : ' + parsed_json);
      console.error('exception : ' + e);
      console.error('expected  : ' + expected);
      failed = true;
    }
  }
  if (failed) {
    throw new Error;
  }
});

console.log('All tests passed!');
