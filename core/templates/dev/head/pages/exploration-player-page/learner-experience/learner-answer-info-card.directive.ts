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
 * @fileoverview Directive for asking learner for answer details.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');
require(
  'pages/exploration-player-page/services/learner-answer-info.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('services/exploration-html-formatter.service.ts');

angular.module('oppia').directive('learnerAnswerInfoCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getSubmitAnswerFn: '&submitAnswer'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-player-page/learner-experience/' +
        'learner-answer-info-card.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'ExplorationEngineService', 'ExplorationHtmlFormatterService',
        'LearnerAnswerInfoService', 'PlayerTranscriptService',
        function(ExplorationEngineService, ExplorationHtmlFormatterService,
            LearnerAnswerInfoService, PlayerTranscriptService) {
          var ctrl = this;
          ctrl.answerDetails = null;
          var interaction = ExplorationEngineService.getState().interaction;
          ctrl.submitLearnerAnswerInfo = function() {
            LearnerAnswerInfoService.recordLearnerAnswerInfo(
              ctrl.answerDetails);
            PlayerTranscriptService.addNewInput(
              {answerDetails: ctrl.answerDetails}, false);
            PlayerTranscriptService.addNewResponse(
              LearnerAnswerInfoService.getSolicitAnswerDetailsFeedback());
            ctrl.getSubmitAnswerFn()(
              LearnerAnswerInfoService.getCurrentAnswer(),
              LearnerAnswerInfoService.getCurrentInteractionRulesService());
          };

          ctrl.displayCurrentAnswer = function() {
            return ExplorationHtmlFormatterService.getAnswerHtml(
              LearnerAnswerInfoService.getCurrentAnswer(), interaction.id,
              interaction.customizationArgs);
          };
        }
      ]
    };
  }
]
);
