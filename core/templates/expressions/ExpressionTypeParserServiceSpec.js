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

describe('Expression type parser service', function() {
  beforeEach(module('oppia'));

  var etps = null;
  var eps = null;
  var ests = null;
  var isString = null;
  beforeEach(inject(function($injector) {
    etps = $injector.get('ExpressionTypeParserService');
    eps = $injector.get('ExpressionParserService');
    ests = $injector.get('ExpressionSyntaxTreeService');
    isString = $injector.get('UtilsService').isString;
  }));

  var ENVS = [
    {
      numZero: 'Real',
      boolTrue: 'UnicodeString',
      strXYZ: 'UnicodeString',
      num100_001: 'Real',
      boolFalse: 'UnicodeString',
      strNull: 'UnicodeString'
    }
  ];

  it('should determine the correct types for the expressions', function() {
    [
      ['2', 'Real'],
      ['numZero', 'Real'],
      ['boolTrue', 'UnicodeString'],
      ['+10', 'Real'],
      ['2   + 10', 'Real'],
      ['num100_001   + numZero', 'Real'],
      ['20 - num100_001', 'Real'],
      ['0x100 - 256', 'Real'],
      ['!strNull', 'UnicodeString'],
      ['1 - 2 * 3', 'Real'],
      ['num100_001 / 0.1', 'Real'],
      ['floor((numZero + num100_001)/2)', 'Real'],
      ['23 % 5', 'Real'],
      ['1 <= numZero || 1 >= numZero', 'UnicodeString'],
      ['100 < num100_001 && 1 > num100_001', 'UnicodeString'],
      ['boolTrue == boolFalse', 'UnicodeString'],
      ['strNull != strXYZ', 'UnicodeString'],
      ['if boolFalse then 8 else numZero', 'Real'],
      ['if boolFalse then 8 else strXYZ', ests.ExprWrongArgTypeError,
        'ExprWrongArgTypeError: Type Real does not match expected type ' +
       'UnicodeString'],
      ['strXYZ * 2', ests.ExprWrongArgTypeError,
        'ExprWrongArgTypeError: Type UnicodeString does not match expected ' +
       'type Real'],
      ['num100_001 / 0', 'Real'],
      ['abs(-3)', 'Real'],
      ['pow(num100_001, numZero)', 'Real'],
      ['log(9, 3)', 'Real']
    ].forEach(function(test) {
      var expression = test[0];
      var expected = test[1];
      if (test.length > 2) {
        var errorString = test[2];
      }

      // 'expected' should be either a JavaScript primitive value that would be
      // the result of evaluation 'expression', or an exception that is
      // expected to be thrown.
      // 'expression' is either a string (in which case parsed) or an array
      // (representing a parse tree).
      var parsed = isString(expression) ? eps.parse(expression) : expression;
      var parsedJson = JSON.stringify(parsed);
      var failed = false;

      var recordFailure = function(result, exception) {
        console.error('input     : ' + expression);
        console.error('parsed    : ' + parsedJson);
        if (result !== undefined) {
          console.error('evaluated : ' + result);
          console.error('expected  : ' + expected);
        }
        if (exception !== undefined) {
          console.error('exception : ' + exception);
          console.error('expected  : (exception)');
        }
        failed = true;
      };

      try {
        var evaled = ests.applyFunctionToParseTree(
          parsed, ENVS, etps.getType);
        if (expected instanceof Error || evaled !== expected) {
          recordFailure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          recordFailure(undefined, e);
        } else {
          if (errorString !== e.toString()) {
            // Wrong error string.
            recordFailure(errorString, e.toString());
          }
        }
      }
      expect(failed).toBe(false);

      if (typeof (expression) !== 'string') {
        return;
      }

      failed = false;
      try {
        evaled = etps.getExpressionOutputType(expression, ENVS);
        if (expected instanceof Error || evaled !== expected) {
          recordFailure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          recordFailure(undefined, e);
        }
      }
      expect(failed).toBe(false);
    });
  });
});
