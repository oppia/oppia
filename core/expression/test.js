var parser = require('parser');

var check = function(expected, expression) {
  var parsed = parser.parse(expression);
  var parsed_json = JSON.stringify(parsed);
  var expected_json = JSON.stringify(expected);
  if (parsed_json != expected_json) {
    console.error('input    : ' + expression);
    console.error('parsed   : ' + parsed_json);
    console.error('expected : ' + expected_json);
    throw new Error;
  }
};

check(10, '10');
check(10.1, '10.1');
check('abc', '"abc"');
check(null, 'null');
check(true, 'true');
check(false, 'false');

check(['#', 'abc'], 'abc');
check([['#', 'abc'], [1, 2]], 'abc(1, 2)');
check([[[['#', 'abc'], [1, 2]], []], [3]],
  'abc(1, 2)()(3)');

check(['+', 10], '+10');
check(['-', ['#', 'abc']], '-abc');

check(['*', ['/', 3, 4], 5], '3 / 4 * 5');
check(['-', ['+', 2, ['*', ['/', 3, 4], 5]], 6], '2 + 3 / 4 * 5 - 6');

check(['||', ['&&', ['<', 2, 3], ['==', 4, 6]], true],
  '2 < 3 && 4 == 6 || true');

console.log('All tests passed!');
