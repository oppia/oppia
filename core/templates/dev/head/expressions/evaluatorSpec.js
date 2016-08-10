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
  var ests = null;
  var isString = null;
  beforeEach(inject(function($injector) {
    ees = $injector.get('expressionEvaluatorService');
    eps = $injector.get('expressionParserService');
    ests = $injector.get('expressionSyntaxTreeService');
    isString = $injector.get('utilsService').isString;
  }));

  var ENVS = [
    {
      numZero: 0,
      boolTrue: true,
      strXYZ: 'XYZ',
      num100_001: 100.001,
      boolFalse: false,
      strNull: ''
    }
  ];

  it('should get params used in expressions', function() {
    [
      ['numZero', ['numZero']],
      ['b + a', ['a', 'b']],
      ['a + b + a', ['a', 'b']],
      ['+10', []],
      ['2   + 10', []],
      ['num100_001   + numZero', ['num100_001', 'numZero']],
      ['20 - num100_001', ['num100_001']],
      ['0x100 - 256', []],
      ['!strNull', ['strNull']],
      ['1 - 2 * 3', []],
      ['num100_001 / 0.1', ['num100_001']],
      ['floor((numZero + num100_001)/2)', ['num100_001', 'numZero']],
      ['23 % 5', []],
      ['1 <= numZero || 1 >= numZero', ['numZero']],
      ['100 < num100_001 && 1 > num100_001', ['num100_001']],
      ['boolTrue == boolFalse', ['boolFalse', 'boolTrue']],
      ['strNull != strXYZ', ['strNull', 'strXYZ']],
      ['if boolFalse then boolTrue else numZero', [
        'boolFalse', 'boolTrue', 'numZero']],
      ['num100_001 / 0', ['num100_001']],
      ['abs(-3)', []],
      ['pow(num100_001, numZero)', ['num100_001', 'numZero']],
      ['log(9, 3)', []],
      ['numZero + numOne', ['numOne', 'numZero']]
    ].forEach(function(test) {
      var expression = test[0];
      var expectedParams = test[1];

      var parsed = (
        isString(expression) ? eps.parse(expression) : expression);
      var parsedJson = JSON.stringify(parsed);
      var failed = false;

      var recordFailure = function(params, exception) {
        console.error('input           : ' + expression);
        console.error('parsed          : ' + parsedJson);
        console.error('expected        : ' + JSON.stringify(expectedParams));
        if (params !== undefined) {
          console.error('evaluated       : ' + params);
        } else {
          console.error('exception       : ' + exception);
        }
        failed = true;
      };

      try {
        var params = ests.getParamsUsedInExpression(expression);
        if (!angular.equals(params, expectedParams)) {
          recordFailure(params, undefined);
        }
      } catch (e) {
        recordFailure(undefined, e);
      }
      expect(failed).toBe(false);
    });
  });

  it('should evaluate to correct values', function() {
    [
      ['numZero', 0],
      ['+10', 10],
      ['2   + 10', 12],
      ['num100_001   + numZero', 100.001],
      ['20 - num100_001', -80.001],
      ['0x100 - 256', 0],
      ['!strNull', true],
      ['1 - 2 * 3', -5],
      ['num100_001 / 0.1', 1000.01],
      ['floor((numZero + num100_001)/2)', 50],
      ['23 % 5', 3],
      ['1 <= numZero || 1 >= numZero', true],
      ['100 < num100_001 && 1 > num100_001', false],
      ['boolTrue == boolFalse', false],
      ['strNull != strXYZ', true],
      ['if boolFalse then boolTrue else numZero', 0],
      ['num100_001 / 0', Infinity],
      ['abs(-3)', 3],
      ['pow(num100_001, numZero)', 1],
      ['log(9, 3)', 2],
      ['numZero + numOne', ests.ExprUndefinedVarError],
      [['+', 10, 20, 30], ests.ExprWrongNumArgsError],
      [['==', true], ests.ExprWrongNumArgsError],
      [['+', 'abc', 1], ests.ExprWrongArgTypeError]
    ].forEach(function(test) {
      var expression = test[0];
      var expected = test[1];

      // 'expected' should be either a JavaScript primitive value that would be
      // the result of evaluation 'expression', or an exception that is
      // expected to be thrown.
      // 'expression' is either a string (in which case parsed) or an array
      // (representing a parse tree).
      var parsed = (
        isString(expression) ? eps.parse(expression) : expression);
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
        var evaled = ests.applyFunctionToParseTree(parsed, ENVS, ees.evaluate);
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

      if (typeof expression !== 'string') {
        return;
      }

      failed = false;
      try {
        evaled = ees.evaluateExpression(expression, ENVS);
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
