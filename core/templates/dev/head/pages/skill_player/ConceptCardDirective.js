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
 * @fileoverview Controller for the Concept Card.
 */
oppia.directive('conceptCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        returnToExploration: '&',
        getConceptCard: '&conceptCard',
        getSkillId: '&skillId'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_player/concept_card_directive.html'),
      controller: [
        '$scope', 'ConceptCardBackendApiService', 'ConceptCardObjectFactory',
        'PlayerTranscriptService', 'PlayerPositionService',
        function(
            $scope, ConceptCardBackendApiService, ConceptCardObjectFactory,
            PlayerTranscriptService, PlayerPositionService) {
          $scope.maximumVisibleExampleIndex = -1;
          if ($scope.getConceptCard()) {
            $scope.conceptCard = $scope.getConceptCard();
            $scope.oldConceptCard = true;
          } else {
            $scope.oldConceptCard = false;
            var currentCardIndex = PlayerPositionService.getActiveCardIndex();
            var currentCard = PlayerTranscriptService.getCard(currentCardIndex);
            ConceptCardBackendApiService.fetchConceptCard(
              $scope.getSkillId()
            ).then(function(conceptCardBackendDict) {
              $scope.conceptCard =
                ConceptCardObjectFactory.createFromBackendDict(
                  conceptCardBackendDict);
              currentCard.conceptCard = $scope.conceptCard;
              PlayerTranscriptService.addExistingCard(currentCard);
            });
          }

          $scope.viewNextExample = function() {
            $scope.maximumVisibleExampleIndex++;
          };

          $scope.OPPIA_AVATAR_IMAGE_URL = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/oppia_avatar_100px.svg'));
        }
      ]
    };
  }
]);
