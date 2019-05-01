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
  'UserService', 'UrlInterpolationService',
  function(UserService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/improvements_tab/' +
        'improvements_tab_directive.html'),
      controller: [
        '$q', '$scope', '$timeout', 'ImprovementCardService',
        'FEEDBACK_IMPROVEMENT_CARD_TYPE', 'SUGGESTION_IMPROVEMENT_CARD_TYPE',
        function(
            $q, $scope, $timeout, ImprovementCardService,
            FEEDBACK_IMPROVEMENT_CARD_TYPE, SUGGESTION_IMPROVEMENT_CARD_TYPE) {
          var cards = [];
          var cardView = 'all';
          var cardViewFilters = {
            open: function(card) {
              return card.isOpen();
            },
            open_feedback: function(card) {
              return this.open(card) && (
                card.getDirectiveType() === FEEDBACK_IMPROVEMENT_CARD_TYPE ||
                card.getDirectiveType() === SUGGESTION_IMPROVEMENT_CARD_TYPE);
            },
            all: function() {
              return true;
            },
            none: function() {
              return false;
            },
          };

          var refreshCards = function() {
            var oldIndices = {};
            cards.forEach(function(card, index) {
              oldIndices[card.getKey()] = index;
            });
            var oldIndexOf = function(card) {
              return oldIndices[card.getKey()] || -1;
            };
            var isUserLoggedInPromise = UserService.getUserInfoAsync().then(
              function(userInfo) {
                return userInfo.isLoggedIn();
              }, function() {
                return false;
              });
            var cardsPromise = ImprovementCardService.fetchCards();
            $q.all([isUserLoggedInPromise, cardsPromise]).then(function(res) {
              var isUserLoggedIn = res[0];
              var freshCards = res[1];
              // Sort the cards by their old index. New cards will be placed
              // arbitrarily at the front of the array.
              freshCards.sort(function(leftHandCard, rightHandCard) {
                return oldIndexOf(leftHandCard) - oldIndexOf(rightHandCard);
              });
              $timeout(function() {
                cards = freshCards;
                // cardView = isUserLoggedIn ? 'open' : 'open_feedback';
              });
            });
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
            if (cardView.startsWith('open')) {
              return cards.filter(cardViewFilters[cardView]).length;
            } else {
              return cards.filter(cardViewFilters.open).length;
            }
          };
        }
      ],
    };
  }
]);
