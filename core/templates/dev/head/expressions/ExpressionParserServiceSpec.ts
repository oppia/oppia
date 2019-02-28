// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

describe('Expression parser service', function() {
  beforeEach(module('oppia'));

  var eps = null;
  beforeEach(inject(function($injector) {
    eps = $injector.get('ExpressionParserService');
  }));

  it('should parse to a correct tree', function() {
    [
      [10, '10'],
      [32, '0x20'],
      [10.1, '10.1'],
      [0.001, '1e-3'],
      [0.35, '.35'],
      ['abc', '"abc"'],
      ['a\'b\'c', '"a\'b\'c"'],
      [null, 'null'],
      [true, 'true'],
      [false, 'false'],

      [['#', 'abc'],
        'abc'],
      [['#', 'あいうえお'],
        'あいうえお'],
      [['abc'],
        'abc()'],
      [['abc', 1],
        'abc(1)'],
      [['abc', 1, 2],
        'abc(1, 2)'],
      [[[['abc', 1, 2]], 3],
        'abc(1, 2)()(3)'],

      [['+', 10],
        '+10'],
      [['-', ['#', 'abc']],
        '-abc'],
      [['-', 0.35], '-.35'],

      [['+', 1, 2], '1     +    2'],
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
      [undefined, '*100']
    ].forEach(function(test) {
      // 'expected' should be either a JavaScript primitive value that would be
      //   the result of evaluating 'expression', or undefined (which means
      //   that the parser is expected to fail).
      // 'expression' is the expression string to be parsed.
      var expected = test[0];
      var expression = test[1];

      var failed = false;
      try {
        var parsed = eps.parse(expression);
        var parsedJson = JSON.stringify(parsed);
        var expectedJson = JSON.stringify(expected);
        if (expected === undefined || parsedJson !== expectedJson) {
          console.error('input    : ' + expression);
          console.error('parsed   : ' + parsedJson);
          console.error('expected : ' + expectedJson);
          failed = true;
        }
      } catch (e) {
        if (expected !== undefined || !(e instanceof eps.SyntaxError)) {
          // Wrong or unexpected exception.
          console.error('input     : ' + expression);
          console.error('exception : ' + e);
          console.error('expected  : ' + expected);
          failed = true;
        }
      }
      expect(failed).toBe(false);
    });
  });
});
