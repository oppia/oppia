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
 * @fileoverview Directive for an input/response pair in the learner view.
 */

oppia.directive('inputResponsePair', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        data: '=',
        oppiaAvatarImageUrl: '&',
        profilePicture: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'input_response_pair_directive.html'),
      controller: [
        '$scope', 'ExplorationPlayerService', 'PlayerTranscriptService',
        'ExplorationHtmlFormatterService', 'INTERACTION_SPECS',
        'PlayerPositionService',
        function(
            $scope, ExplorationPlayerService, PlayerTranscriptService,
            ExplorationHtmlFormatterService, INTERACTION_SPECS,
            PlayerPositionService) {
          $scope.isCurrentCardAtEndOfTranscript = function() {
            return PlayerTranscriptService.isLastCard(
              PlayerPositionService.getActiveCardIndex());
          };

          $scope.getAnswerHtml = function() {
            var interaction = ExplorationPlayerService.getInteraction(
              PlayerPositionService.getCurrentStateName());
            if ($scope.data) {
              return ExplorationHtmlFormatterService.getAnswerHtml(
                $scope.data.learnerInput, interaction.id,
                interaction.customizationArgs);
            }
          };

          // Returns a HTML string representing a short summary of the answer
          // , or null if the answer does not have to be summarized.
          $scope.getShortAnswerHtml = function() {
            var interaction = ExplorationPlayerService.getInteraction(
              PlayerPositionService.getCurrentStateName());
            var shortAnswerHtml = '';
            if ($scope.data && interaction.id &&
                INTERACTION_SPECS[interaction.id].needs_summary) {
              shortAnswerHtml = (
                ExplorationHtmlFormatterService.getShortAnswerHtml(
                  $scope.data.learnerInput, interaction.id,
                  interaction.customizationArgs));
            }
            return shortAnswerHtml;
          };
        }
      ]
    };
  }]);
