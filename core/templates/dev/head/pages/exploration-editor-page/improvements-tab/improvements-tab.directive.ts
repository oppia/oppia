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

var oppia = require('AppInit.ts').module;

oppia.directive('improvementsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/improvements-tab/' +
        'improvements-tab.directive.html'),
      controller: [
        '$scope', 'ImprovementCardService',
        function($scope, ImprovementCardService) {
          var fetchedCards = [];
          ImprovementCardService.fetchCards().then(function(cards) {
            fetchedCards = cards;
          });

          $scope.getCards = function() {
            return fetchedCards;
          };
          $scope.getOpenCardCount = function() {
            return fetchedCards.filter(function(card) {
              return card.isOpen();
            }).length;
          };
        }
      ],
    };
  }]);
