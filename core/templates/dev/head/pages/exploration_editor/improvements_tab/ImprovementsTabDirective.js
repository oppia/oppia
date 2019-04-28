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
 * @fileoverview Controllers for the exploration improvements tab in the
 * exploration editor.
 */

oppia.directive('improvementsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/improvements_tab/' +
        'improvements_tab_directive.html'),
      controller: [
        '$scope', 'ImprovementCardService',
        function($scope, ImprovementCardService) {
          var cards = [];
          var refreshCards = function() {
            ImprovementCardService.fetchCards().then(function(freshCards) {
              $scope.$apply(function() {
                cards = freshCards;
              });
            });
          };

          var cardView = 'open';
          var cardViewFilters = {
            /** @returns {boolean} */
            open: function(card) {
              return card.isOpen();
            },
            all: function() {
              return true;
            },
          };

          $scope.$on('refreshImprovementsTab', refreshCards);
          $scope.getCards = function() {
            return cards;
          };
          $scope.getCardView = function() {
            return cardView;
          };
          $scope.isCardInView = function(card) {
            return cardViewFilters[cardView](card);
          };
          $scope.getOpenCardCount = function() {
            return cards.filter(cardViewFilters.open).length;
          };
        }
      ],
    };
  }
]);
