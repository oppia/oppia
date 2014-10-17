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

describe('Expression evaluator service', function() {
  beforeEach(module('oppia'));

  var ees = null;
  var eps = null;
  beforeEach(inject(function($injector) {
    ees = $injector.get('expressionEvaluatorService');
    eps = $injector.get('expressionParserService');
  }));

  var ENVS = [
    {
      numZero: 0,
      boolTrue: true,
      strXYZ: 'XYZ',
      num100_001: 100.001,
      boolFalse: false,
      strNull: '',
    },
  ];

  it('should evaluate to correct values', function() {
    [
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
      [ees.ExprUndefinedVarError, 'numZero + numOne'],
      [ees.ExprWrongNumArgsError, ['+', 10, 20, 30]],
      [ees.ExprWrongNumArgsError, ['==', true]],

    ].forEach(function(test) {
      var expected = test[0];
      var expression = test[1];

      // 'expected' should be either a JavaScript primitive value that would be the
      // result of evaluation 'expression', or an exception that is expected to be
      // thrown.
      // 'expression' is either a string (in which case parsed) or an array
      // (representing a parse tree).
      var parsed = typeof(expression) == 'string' ?
          eps.parse(expression) : expression;
      var parsed_json = JSON.stringify(parsed);
      var failed = false;

      var failure = function(result, exception) {
        console.error('input     : ' + expression);
        console.error('parsed    : ' + parsed_json);
        if (result !== undefined) {
          console.error('evaluated : ' + result);
          console.error('expected  : ' + expected);
        }
        if (exception !== undefined) {
          console.error('exception : ' + exception);
          console.error('expected  : (exception)');
        }
        failed = true;
      }

      try {
        var evaled = ees.evaluateParseTree(parsed, ENVS);
        if (expected instanceof Error || evaled !== expected) {
          failure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          failure(undefined, e);
        }
      }
      expect(failed).toBe(false);

      if (typeof(expression) != 'string') {
        return;
      }
      failed = false;
      try {
        evaled = ees.evaluateExpression(expression, ENVS);
        if (expected instanceof Error || evaled !== expected) {
          failure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          failure(undefined, e);
        }
      }
      expect(failed).toBe(false);
    });
  });
});
