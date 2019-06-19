// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the question player state service.
 */

require(
  'components/question-directives/question-player/services/' +
  'question-player-state.service.ts');

describe('Question player state service', function() {
  var qpservice;
  var questionId = 'question_1';

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    qpservice = $injector.get('QuestionPlayerStateService');
  }));

  it('should return an empty question state dictionary', function() {
    expect(qpservice.getQuestionPlayerStateData()).toEqual({});
  });

  it('should add a hint to the question state data', function() {
    qpservice.hintUsed(questionId);
    var stateData = qpservice.getQuestionPlayerStateData();
    expect(stateData[questionId]).toBeTruthy();
    expect(stateData[questionId].usedHints).toBeDefined();
    expect(stateData[questionId].usedHints.length).toEqual(1);
    expect(stateData[questionId].usedHints[0].timestamp).toBeDefined();
    expect(stateData[questionId].usedHints[0].timestamp).toBeGreaterThan(0);
  });

  it('should record a wrong answer was submitted to the question state data',
    function() {
      qpservice.answerSubmitted(questionId, false);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].answers).toBeDefined();
      expect(stateData[questionId].answers.length).toEqual(1);
      expect(stateData[questionId].answers[0].isCorrect).toEqual(false);
      expect(stateData[questionId].answers[0].timestamp).toBeGreaterThan(0);
    });

  it('should record a right answer was submitted to the question state data',
    function() {
      qpservice.answerSubmitted(questionId, true);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].answers).toBeDefined();
      expect(stateData[questionId].answers.length).toEqual(1);
      expect(stateData[questionId].answers[0].isCorrect).toEqual(true);
      expect(stateData[questionId].answers[0].timestamp).toBeGreaterThan(0);
    });

  it('should record that a solution was viewed',
    function() {
      qpservice.solutionViewed(questionId);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].viewedSolution).toBeDefined();
      expect(stateData[questionId].viewedSolution.timestamp).toBeDefined();
      expect(
        stateData[questionId].viewedSolution.timestamp).toBeGreaterThan(0);
    });

  it('should shouldn\'t record a correct answer if a solution was viewed',
    function() {
      qpservice.solutionViewed(questionId);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].viewedSolution).toBeDefined();
      expect(stateData[questionId].viewedSolution.timestamp).toBeDefined();
      expect(
        stateData[questionId].viewedSolution.timestamp).toBeGreaterThan(0);
      qpservice.answerSubmitted(questionId, true);
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].answers.length).toEqual(0);
    });
});
