// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

/**
 * @fileoverview Unit tests for Expression Evaluator Service.
 */

import {Type} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {ExpressionEvaluatorService} from 'expressions/expression-evaluator.service';
import {ExpressionParserService} from 'expressions/expression-parser.service';
import {
  EnvDict,
  Expr,
  ExprUndefinedVarError,
  ExprWrongArgTypeError,
  ExprWrongNumArgsError,
  ExpressionError,
  ExpressionSyntaxTreeService,
} from 'expressions/expression-syntax-tree.service';

describe('Expression evaluator service', () => {
  let expressionEvaluatorService: ExpressionEvaluatorService;
  let expressionParserService: ExpressionParserService;
  let expressionSyntaxTreeService: ExpressionSyntaxTreeService;

  beforeEach(() => {
    expressionEvaluatorService = TestBed.get(ExpressionEvaluatorService);
    expressionParserService = TestBed.get(ExpressionParserService);
    expressionSyntaxTreeService = TestBed.get(ExpressionSyntaxTreeService);
  });

  const ENVS: EnvDict[] = [
    {
      numZero: 0,
      boolTrue: true,
      strXYZ: 'XYZ',
      num100_001: 100.001,
      boolFalse: false,
      strNull: '',
    },
  ];

  describe('Getting params from expressions', () => {
    type TestParam = [string, string[]];
    (
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
        [
          'if boolFalse then boolTrue else numZero',
          ['boolFalse', 'boolTrue', 'numZero'],
        ],
        ['num100_001 / 0', ['num100_001']],
        ['abs(-3)', []],
        ['pow(num100_001, numZero)', ['num100_001', 'numZero']],
        ['log(9, 3)', []],
        ['numZero + numOne', ['numOne', 'numZero']],
      ] as TestParam[]
    ).forEach(([expression, expectedParams]) => {
      it(
        'should get references from the expression ' +
          JSON.stringify(expression),
        () => {
          expect(
            expressionSyntaxTreeService.getParamsUsedInExpression(expression)
          ).toEqual(expectedParams);
        }
      );
    });
  });

  describe('Evaluating valid expressions', () => {
    type TestParam = [string, Expr];
    (
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
      ] as TestParam[]
    ).forEach(([expression, expected]) => {
      it('should evaluate ' + JSON.stringify(expression) + ' correctly', () => {
        expect(
          expressionSyntaxTreeService.applyFunctionToParseTree(
            expressionParserService.parse(expression),
            ENVS,
            (parsed, envs) => expressionEvaluatorService.evaluate(parsed, envs)
          )
        ).toEqual(expected);
        expect(
          expressionEvaluatorService.evaluateExpression(expression, ENVS)
        ).toEqual(expected);
      });
    });

    it(
      'should throw an error when parser generates ' +
        'intermediate node with zero children',
      () => {
        spyOn(expressionParserService, 'parse').and.returnValue([]);
        expect(() =>
          expressionSyntaxTreeService.applyFunctionToParseTree(
            expressionParserService.parse('+10'),
            ENVS,
            (parsed, envs) => expressionEvaluatorService.evaluate(parsed, envs)
          )
        ).toThrowError(
          'Parser generated an intermediate node with zero children'
        );
      }
    );
  });

  describe('Evaluating invalid expressions', () => {
    type TestParam = [string, Expr[], Type<ExpressionError>];
    (
      [
        ['there are too many args', ['+', 10, 20, 30], ExprWrongNumArgsError],
        ['there are too few args', ['==', true], ExprWrongNumArgsError],
        ['an arg has the wrong type', ['+', 'abc', 1], ExprWrongArgTypeError],
      ] as TestParam[]
    ).forEach(([problemDescription, expression, errorType]) => {
      it('should report an error when ' + problemDescription, () => {
        expect(() =>
          expressionSyntaxTreeService.applyFunctionToParseTree(
            expression,
            ENVS,
            (parsed, envs) => expressionEvaluatorService.evaluate(parsed, envs)
          )
        ).toThrowError(errorType);
      });
    });

    it('should report an error when using an undefined variable', () => {
      const expression = 'numZero + numOne'; // The param `numOne` is undefined.
      expect(() =>
        expressionSyntaxTreeService.applyFunctionToParseTree(
          expressionParserService.parse(expression),
          ENVS,
          (parsed, envs) => expressionEvaluatorService.evaluate(parsed, envs)
        )
      ).toThrowError(ExprUndefinedVarError);
      expect(() =>
        expressionEvaluatorService.evaluateExpression(expression, ENVS)
      ).toThrowError(ExprUndefinedVarError);
    });
  });
});
