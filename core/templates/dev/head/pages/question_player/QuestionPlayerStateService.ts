// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

oppia.constant('EXPLORATION_MODE', {
  EXPLORATION: 'exploration',
  PRETEST: 'pretest',
  QUESTION_PLAYER: 'question_player',
  OTHER: 'other'
});

oppia.factory('QuestionPlayerStateService', [
  '$log', '$q', '$rootScope',
  function(
      $log, $q, $rootScope) {
    var questionState = {};

    var getCurrentTime = function() {
      return new Date().getTime();
    };

    var createNewQuestionState = function(questionId){
      questionState[questionId] = {'answers':[], 'usedHints':[]};
    }

    var _hintUsed = function(questionId) {
      console.log("Hint used");
      if(!questionState[questionId]){
        createNewQuestionState(questionId);
      }
      questionState[questionId]["usedHints"].push({'timestamp': getCurrentTime()});
    };

    var _solutionViewed = function(questionId) {
      console.log("Solution viewed");
      if(!questionState[questionId]){
        createNewQuestionState(questionId);
      }
      questionState[questionId]["viewedSolution"] = {'timestamp': getCurrentTime()};
    };

    var _answerSubmitted = function(questionId, isCorrect) {
      if(!questionState[questionId]){
        createNewQuestionState(questionId);
      }
      // Don't store a correct answer in the case where
      // the learner viewed the solution for this question.
      if(isCorrect && questionState[questionId]["viewedSolution"]) {
        return;
      }
      questionState[questionId]["answers"].push(
        {'isCorrect': isCorrect,
         'timestamp':getCurrentTime()
        });
    };


    return {
      hintUsed: function(questionId) {
        _hintUsed(questionId);
      },
      solutionViewed: function(questionId) {
        _solutionViewed(questionId);
      },
      answerSubmitted: function(questionId, isCorrect) {
        _answerSubmitted(questionId, isCorrect);
      },
      getQuestionStateData: function() {
        return questionState;
      }
    };
  }]);
