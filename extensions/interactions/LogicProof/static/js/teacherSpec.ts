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
 * @fileoverview Unit tests for the editor components of the LogicProof
 * interaction.
 */

describe('Build questions', function() {
  it('should build assumptions correctly', function() {
    expect(
      logicProofShared.displayExpressionArray(
        logicProofTeacher.buildQuestion(
          'f(2)=3,\u2200x.x>1', 'p\u2227q', logicProofData.BASE_VOCABULARY
        ).assumptions, logicProofData.BASE_STUDENT_LANGUAGE.operators)
    ).toEqual('f(2)=3, \u2200x.(x>1)');
  });

  it('should build results correctly', function() {
    expect(
      logicProofShared.displayExpression(
        logicProofTeacher.buildQuestion(
          ' ', 'p\u2227q', logicProofData.BASE_VOCABULARY).results[0],
        logicProofData.BASE_STUDENT_LANGUAGE.operators)).toEqual('p\u2227q');
    expect(
      logicProofTeacher.buildQuestion(
        'R(albert)\u2227R(betty)', 'p', logicProofData.BASE_VOCABULARY
      ).results).toEqual([{
      top_kind_name: 'variable',
      top_operator_name: 'p',
      arguments: [],
      dummies: []
    }]);
  });

  it('should reject mis-typed expressions', function() {
    expect(function() {
      logicProofTeacher.buildQuestion(
        'f(x,y)=z', 'f(x)=z', logicProofData.BASE_VOCABULARY);
    }).toThrow(
      {
        message: 'f must have 1 arguments.'
      }
    );
  });

  it('should forbid the use of reserved words', function() {
    expect(function() {
      logicProofTeacher.buildQuestion('we\u2227you', 'p=q',
        logicProofData.BASE_VOCABULARY);
    }).toThrow(
      {
        message: (
          'The name \'we\' is reserved for vocabulary and so cannot ' +
          'be used here.')
      }
    );
  });
});
