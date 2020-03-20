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
import { ExpressionParserService } from
  'expressions/expression-parser.service.ts';
import { ExpressionSyntaxTreeService } from
  'expressions/expression-syntax-tree.service.ts';

describe('Expression syntax tree service', () => {
  describe('expression syntax tree service', () => {
    let expressionSyntaxTreeService: ExpressionSyntaxTreeService;

    beforeEach(() => {
      expressionSyntaxTreeService = new ExpressionSyntaxTreeService(
        new ExpressionParserService()
      );
    });

    it('should throw if environment is not found', () => {
      expect(() => expressionSyntaxTreeService.lookupEnvs('', [])).toThrow();
    });

    it('should return the correct environment if exists', () => {
      const expected = 'bar';
      const actual = expressionSyntaxTreeService.lookupEnvs('foo', [
        {foo: 'bar'}
      ]);

      expect(expected).toBe(actual);
    });
  });
});
