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

require('domain/question/QuestionsListBackendApiService.ts');
require('services/ContextService.ts');

oppia.constant('ACTIVITY_TYPE', {
  SKILL: 'skill',
  TOPIC: 'topic',
  PRETEST: 'pretest'
});

oppia.constant(
  'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'questionSummariesInitialized');

oppia.factory('NewService', ['$rootScope', 'QuestionsListBackendApiService',
  'ACTIVITY_TYPE', 'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'ContextService', function(
      $rootScope, QuestionsListBackendApiService,
      ACTIVITY_TYPE, EVENT_QUESTION_SUMMARIES_INITIALIZED, ContextService) {
    var _questionSummaries = [];
    var _nextCursorForQuestions = '';
    var _isInSkillEditorPage = ContextService.isInSkillEditorPage();
    var _isInTopicEditorPage = ContextService.isInTopicEditorPage();

    var _getActivityType = function() {
      if (_isInSkillEditorPage) {
        return ACTIVITY_TYPE.SKILL;
      } else if (_isInTopicEditorPage) {
        return ACTIVITY_TYPE.TOPIC;
      }
    };
    var _setQuestionSummaries = function(newQuestionSummaries) {
      if (_questionSummaries.length > 0) {
        newQuestionSummaries = _deduplicateQuestionSummaries(
          newQuestionSummaries);
      }
      _questionSummaries = _questionSummaries.concat(
        angular.copy(newQuestionSummaries));
      console.log(_questionSummaries);
      $rootScope.$broadcast(EVENT_QUESTION_SUMMARIES_INITIALIZED);
    };
    var _setNextQuestionsCursor = function(nextCursor) {
      _nextCursorForQuestions = nextCursor;
    };
    var _deduplicateQuestionSummaries = function(newQuestionSummaries) {
      // If the first id of newQuestionSummaries is equal to the last id of
      // _questionSummaries, deduplicate by merging them to solve the page
      // boundary issue.
      if (newQuestionSummaries[0].summary.id ===
          _questionSummaries.slice(-1)[0].summary.id) {
        _questionSummaries.slice(-1)[0].skill_descriptions =
          newQuestionSummaries[0].skill_descriptions.concat(
            _questionSummaries.slice(-1)[0].skill_descriptions
          );
        newQuestionSummaries = newQuestionSummaries.slice(1);
      }
      return newQuestionSummaries;
    };

    return {
      getNextCursor: function() {
        return _nextCursorForQuestions;
      },

      setQuestionSummaries: function(newQuestionSummaries) {
        _setQuestionSummaries(newQuestionSummaries);
      },
      
      setNextQuestionsCursor: function(nextCursor) {
        _setNextQuestionsCursor(nextCursor);
      },

      isLastQuestionBatch: function(index) {
        return (
          _nextCursorForQuestions === null &&
          (index + 1) * constants.NUM_QUESTIONS_PER_PAGE >=
            _questionSummaries.length);
      },

      fetchQuestionSummaries: function(activityId, resetHistory) {
        if (resetHistory) {
          _questionSummaries = [];
          _nextCursorForQuestions = '';
        }
        QuestionsListBackendApiService.fetchQuestions(
          _getActivityType(), activityId, _nextCursorForQuestions).then(
          function(returnObject) {
            _setQuestionSummaries(returnObject.questionSummaries);
            _setNextQuestionsCursor(returnObject.nextCursor);
          }
        );
      },

      getQuestionSummaries: function(index, fetchMore) {
        var num = constants.NUM_QUESTIONS_PER_PAGE;
        if ((index + 1) * num > _questionSummaries.length &&
            _nextCursorForQuestions !== null && fetchMore) {
          return null;
        } else {
          return _questionSummaries.slice(index * num, (index + 1) * num);
        }
      },
    }
  }
])