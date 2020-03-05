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
 * @fileoverview Controllers for the practice session.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'components/question-directives/question-player/' +
  'question-player.directive.ts');

require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequiresForPlayers.ts');

require('services/alerts.service.ts');
require('services/contextual/url.service.ts');
require('services/page-title.service.ts');
require('pages/practice-session-page/practice-session-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').directive('practiceSessionPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/practice-session-page/practice-session-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$rootScope', 'AlertsService', 'PageTitleService',
        'UrlInterpolationService', 'UrlService',
        'FATAL_ERROR_CODES', 'PRACTICE_SESSIONS_DATA_URL',
        'PRACTICE_SESSIONS_URL',
        'TOPIC_VIEWER_PAGE', 'TOTAL_QUESTIONS',
        function(
            $http, $rootScope, AlertsService, PageTitleService,
            UrlInterpolationService, UrlService,
            FATAL_ERROR_CODES, PRACTICE_SESSIONS_DATA_URL,
            PRACTICE_SESSIONS_URL,
            TOPIC_VIEWER_PAGE, TOTAL_QUESTIONS
        ) {
          var ctrl = this;
          var _fetchSkillDetails = function() {
            var practiceSessionsDataUrl = UrlInterpolationService
              .interpolateUrl(
                PRACTICE_SESSIONS_DATA_URL, {
                  topic_name: ctrl.topicName
                });
            var practiceSessionsUrl = UrlInterpolationService.interpolateUrl(
              PRACTICE_SESSIONS_URL, {
                topic_name: ctrl.topicName
              });
            var topicViewerUrl = UrlInterpolationService.interpolateUrl(
              TOPIC_VIEWER_PAGE, {
                topic_name: ctrl.topicName
              });
            $http.get(practiceSessionsDataUrl).then(function(result) {
              var skillList = [];
              var skillDescriptions = [];
              for (var skillId in result.data.skill_descriptions) {
                skillList.push(skillId);
                skillDescriptions.push(
                  result.data.skill_descriptions[skillId]);
              }
              var questionPlayerConfig = {
                resultActionButtons: [
                  {
                    type: 'BOOST_SCORE',
                    i18nId: 'I18N_QUESTION_PLAYER_BOOST_SCORE'
                  },
                  {
                    type: 'RETRY_SESSION',
                    i18nId: 'I18N_QUESTION_PLAYER_NEW_SESSION',
                    url: practiceSessionsUrl
                  },
                  {
                    type: 'DASHBOARD',
                    i18nId: 'I18N_QUESTION_PLAYER_MY_DASHBOARD',
                    url: topicViewerUrl
                  }
                ],
                skillList: skillList,
                skillDescriptions: skillDescriptions,
                questionCount: TOTAL_QUESTIONS,
                questionsSortedByDifficulty: false
              };
              ctrl.questionPlayerConfig = questionPlayerConfig;
            });
          };
          ctrl.$onInit = function() {
            ctrl.topicName = UrlService.getTopicNameFromLearnerUrl();
            _fetchSkillDetails();
            PageTitleService.setPageTitle(
              'Practice Session: ' + ctrl.topicName + ' - Oppia');
          };
        }
      ]
    };
  }]);
