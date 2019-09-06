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
 * @fileoverview A service that maintains a record of the users progression
 * in the test session.
 */

angular.module('oppia').factory('QuestionPlayerStateService', [
  function() {
    var questionPlayerState = {};

    var getCurrentTime = function() {
      return new Date().getTime();
    };

    var createNewQuestionPlayerState = function(
        questionId, linkedSkillIds) {
      questionPlayerState[questionId] = {
        linkedSkillIds: linkedSkillIds,
        answers: [],
        usedHints: []
      };
    };

    var _hintUsed = function(question) {
      var questionId = question.getId();
      if (!questionPlayerState[questionId]) {
        createNewQuestionPlayerState(
          questionId,
          question.getLinkedSkillIds());
      }
      questionPlayerState[questionId].usedHints.push(
        {timestamp: getCurrentTime()});
    };

    var _solutionViewed = function(question) {
      var questionId = question.getId();
      if (!questionPlayerState[questionId]) {
        createNewQuestionPlayerState(
          questionId,
          question.getLinkedSkillIds());
      }
      questionPlayerState[questionId].viewedSolution = {
        timestamp: getCurrentTime()};
    };

    var _answerSubmitted = function(
        question, isCorrect, taggedSkillMisconceptionId) {
      var questionId = question.getId();
      if (!questionPlayerState[questionId]) {
        createNewQuestionPlayerState(
          questionId,
          question.getLinkedSkillIds());
      }
      // Don't store a correct answer in the case where
      // the learner viewed the solution for this question.
      if (isCorrect && questionPlayerState[questionId].viewedSolution) {
        return;
      }
      questionPlayerState[questionId].answers.push(
        {isCorrect: isCorrect,
          timestamp: getCurrentTime(),
          taggedSkillMisconceptionId: taggedSkillMisconceptionId
        });
    };


    return {
      hintUsed: function(question) {
        _hintUsed(question);
      },
      solutionViewed: function(question) {
        _solutionViewed(question);
      },
      answerSubmitted: function(
          question, isCorrect, taggedSkillMisconceptionId) {
        _answerSubmitted(question, isCorrect, taggedSkillMisconceptionId);
      },
      getQuestionPlayerStateData: function() {
        return questionPlayerState;
      }
    };
  }]);
