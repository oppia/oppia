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
 * @fileoverview Directive for the exploration improvements tab in the
 * exploration editor.
 */

require(
  'pages/exploration-editor-page/improvements-tab/' +
  'feedback-improvement-card/feedback-improvement-card.directive.ts'
);
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'playthrough-improvement-card/playthrough-improvement-card.directive.ts'
);
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'suggestion-improvement-card/suggestion-improvement-card.directive.ts'
);

require('domain/utilities/UrlInterpolationService.ts');
require('services/ImprovementCardService.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvements-display.service.ts');

angular.module('oppia').directive('improvementsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/improvements-tab/' +
        'improvements-tab.directive.html'),
      controller: [
        '$scope', 'ImprovementCardService', 'ImprovementsDisplayService',
        function($scope, ImprovementCardService, ImprovementsDisplayService) {
          var fetchedCards = [];
          ImprovementCardService.fetchCards().then(function(cards) {
            fetchedCards = cards;
          });

          $scope.getStatusCssClass =
            ImprovementsDisplayService.getStatusCssClass;

          $scope.getHumanReadableStatus =
            ImprovementsDisplayService.getHumanReadableStatus;

          $scope.getCards = function() {
            return fetchedCards;
          };

          $scope.isCardOpen = function(card) {
            return ImprovementsDisplayService.isOpen(card.getStatus());
          };

          $scope.getCardTitle = function(card) {
            return card.getTitle();
          };

          $scope.isCardObsolete = function(card) {
            return card.isObsolete();
          };

          $scope.getOpenCardCount = function() {
            return fetchedCards.filter($scope.isCardOpen).length;
          };
        }
      ],
    };
  }]);
