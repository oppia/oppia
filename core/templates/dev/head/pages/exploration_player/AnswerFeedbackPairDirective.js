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
 * @fileoverview Directive for an answer/feedback pair in the learner view.
 */

oppia.directive('answerFeedbackPair', [function() {
  return {
    restrict: 'E',
    scope: {
      data: '=',
      oppiaAvatarImageUrl: '&',
      profilePicture: '&'
    },
    templateUrl: 'components/answerFeedbackPair',
    controller: [
      '$scope', 'oppiaPlayerService', 'playerTranscriptService',
      'oppiaExplorationHtmlFormatterService', 'INTERACTION_SPECS',
      'playerPositionService',
      function(
          $scope, oppiaPlayerService, playerTranscriptService,
          oppiaExplorationHtmlFormatterService, INTERACTION_SPECS,
          playerPositionService) {
        $scope.isCurrentCardAtEndOfTranscript = function() {
          return playerTranscriptService.isLastCard(
            playerPositionService.getActiveCardIndex());
        };

        $scope.getAnswerHtml = function() {
          var interaction = oppiaPlayerService.getInteraction(
            playerPositionService.getCurrentStateName());
          if ($scope.data) {
            return oppiaExplorationHtmlFormatterService.getAnswerHtml(
              $scope.data.learnerAnswer, interaction.id,
              interaction.customization_args);
          }
        };

        // Returns a HTML string representing a short summary of the answer, or
        // null if the answer does not have to be summarized.
        $scope.getShortAnswerHtml = function() {
          var interaction = oppiaPlayerService.getInteraction(
            playerPositionService.getCurrentStateName());
          var shortAnswerHtml = '';
          if ($scope.data && interaction.id &&
              INTERACTION_SPECS[interaction.id].needs_summary) {
            shortAnswerHtml = (
              oppiaExplorationHtmlFormatterService.getShortAnswerHtml(
                $scope.data.learnerAnswer, interaction.id,
                interaction.customization_args));
          }
          return shortAnswerHtml;
        };
      }
    ]
  };
}]);
