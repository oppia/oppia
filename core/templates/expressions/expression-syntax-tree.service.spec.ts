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

/**
 * @fileoverview Unit tests for expression-syntax-tree.service.ts
 */
import { TestBed } from '@angular/core/testing';

import {
  ExpressionSyntaxTreeService,
  ExpressionError,
  ExprUndefinedVarError,
  ExprWrongArgTypeError,
  ExprWrongNumArgsError
} from 'expressions/expression-syntax-tree.service';

describe('Expression syntax tree service', () => {
  describe('expression syntax tree service', () => {
    let expressionSyntaxTreeService: ExpressionSyntaxTreeService;

    beforeEach(() => {
      expressionSyntaxTreeService = TestBed.get(ExpressionSyntaxTreeService);
    });

    it('should throw if environment is not found', () => {
      expect(() => expressionSyntaxTreeService.lookupEnvs('test', [{}]))
        .toThrowMatching(
          // Jasmine has no built-in matcher for classes derived from Error.
          e => e.toString() === 'ExprUndefinedVarError: test not found in [{}]'
        );
    });

    it('should return the correct environment if exists', () => {
      const expected = 'bar';
      const actual = expressionSyntaxTreeService.lookupEnvs('foo', [
        {foo: 'bar'}
      ]) as string;

      expect(expected).toBe(actual);
    });
  });

  describe('ExpressionError', () => {
    let expressionError: ExpressionError;

    it('should extend Error object', () => {
      expressionError = new ExpressionError();

      expect(expressionError.name).toBe('ExpressionError');
      expect(expressionError instanceof Error).toBe(true);
    });
  });

  describe('ExprUndefinedVarError', () => {
    let exprUndefinedVarError: ExprUndefinedVarError;

    it('should extend ExpressionError class', () => {
      const exampleVar = '';
      exprUndefinedVarError = new ExprUndefinedVarError(exampleVar, []);

      expect(exprUndefinedVarError.name).toBe('ExprUndefinedVarError');
      expect(exprUndefinedVarError instanceof ExpressionError).toBe(true);
    });
  });

  describe('ExprWrongNumArgsError', () => {
    let exprWrongNumArgsError: ExprWrongNumArgsError;

    it('should extend ExpressionError class', () => {
      exprWrongNumArgsError = new ExprWrongNumArgsError([], 0, 1);

      expect(exprWrongNumArgsError.name).toBe('ExprWrongNumArgsError');
      expect(exprWrongNumArgsError instanceof ExpressionError).toBe(true);
    });
  });

  describe('ExprWrongArgTypeError', () => {
    let exprWrongArgTypeError: ExprWrongArgTypeError;

    it('should extend ExpressionError class', () => {
      exprWrongArgTypeError = new ExprWrongArgTypeError('I', '0', '1');

      expect(exprWrongArgTypeError.name).toBe('ExprWrongArgTypeError');
      expect(exprWrongArgTypeError instanceof ExpressionError).toBe(true);
    });
  });
});
