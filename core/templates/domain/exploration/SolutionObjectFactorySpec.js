// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Solution object factory.
 */

describe('Solution object factory', function() {
  beforeEach(module('oppia'));

  describe('SolutionObjectFactory', function() {
    var scope, sof, solution;
    beforeEach(inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      sof = $injector.get('SolutionObjectFactory');
      solution = sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });
    }));


    it('should create a new solution', function() {
      expect(solution.toBackendDict()).toEqual({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });
    });

    it('should create summary correctly', function() {
      expect(solution.getSummary('TextInput')).toEqual(
        'One solution is "&quot;This is a correct answer!&quot;". ' +
        'This is the explanation to the answer.');

      solution.setCorrectAnswer({
        ascii: 'one',
        latex: 'one'
      });
      expect(solution.getSummary('MathExpressionInput')).toEqual(
        'One solution is "one". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        code: 'a=10',
        error: '',
        evaluation: '',
        output: ''
      });
      expect(solution.getSummary('CodeRepl')).toEqual(
        'One solution is "a=10". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        isNegative: false,
        wholeNumber: 0,
        numerator: 1,
        denominator: 6
      });
      expect(solution.getSummary('FractionInput')).toEqual(
        'One solution is "1/6". This is the explanation to the answer.');
    });
  });
});
