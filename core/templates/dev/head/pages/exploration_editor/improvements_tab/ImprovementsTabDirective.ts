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
        '$scope', '$timeout', 'ImprovementCardService', 'UserService',
        'FEEDBACK_IMPROVEMENT_CARD_TYPE', 'SUGGESTION_IMPROVEMENT_CARD_TYPE',
        function(
            $scope, $timeout, ImprovementCardService, UserService,
            FEEDBACK_IMPROVEMENT_CARD_TYPE, SUGGESTION_IMPROVEMENT_CARD_TYPE) {
          var cardView = null;
          var cardViewFilters = {
            open: function(card) {
              return card.isOpen();
            },
            resolved: function(card) {
              return !card.isOpen();
            },
          };

          var isUserLoggedIn = null;
          var fetchIsUserLoggedIn = function() {
            return UserService.getUserInfoAsync().then(function(userInfo) {
              isUserLoggedIn = userInfo.isLoggedIn();
            });
          };

          var cards = [];
          var refreshCards = function() {
            var freshCardsPromise = ImprovementCardService.fetchCards();
            return freshCardsPromise.then(function(freshCards) {
              ImprovementCardService.sortByRelativeOrder(freshCards, cards);
              return $timeout(function() {
                cards = freshCards;
                cardView = cardView || 'open';
              });
            });
          };

          $scope.getCards = function() {
            return cards;
          };
          $scope.isCardInView = function(card) {
            return cardView !== null && cardViewFilters[cardView](card);
          };
          $scope.isUserAllowedToViewCard = function(card) {
            return (isUserLoggedIn ||
              // Guests are only allowed to view feedback threads.
              card.getDirectiveType() === FEEDBACK_IMPROVEMENT_CARD_TYPE ||
              card.getDirectiveType() === SUGGESTION_IMPROVEMENT_CARD_TYPE);
          };
          $scope.getOpenCardCount = function() {
            return cards.filter(function(card) {
              return $scope.isUserAllowedToViewCard(card) && card.isOpen();
            }).length;
          };

          // Now we can initialize the directive.
          fetchIsUserLoggedIn().then(refreshCards).then(function() {
            $scope.$on('refreshImprovementsTab', refreshCards);
          });
        }
      ],
    };
  }
]);
