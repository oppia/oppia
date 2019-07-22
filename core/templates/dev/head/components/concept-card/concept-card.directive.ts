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
 * @fileoverview Directive for the concept cards viewer.
 */

require('domain/skill/ConceptCardBackendApiService.ts');
require('domain/skill/ConceptCardObjectFactory.ts');
require('filters/format-rte-preview.filter.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('conceptCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getSkillIds: '&skillIds',
        index: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/concept-card/concept-card.template.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$rootScope',
        'ConceptCardBackendApiService', 'ConceptCardObjectFactory',
        function(
            $scope, $filter, $rootScope,
            ConceptCardBackendApiService, ConceptCardObjectFactory) {
          var ctrl = this;
          ctrl.conceptCards = [];
          var currentConceptCard = null;
          var numberOfWorkedExamplesShown = 0;
          ctrl.loadingMessage = 'Loading';

          ConceptCardBackendApiService.loadConceptCards(
            ctrl.getSkillIds()
          ).then(function(conceptCardBackendDicts) {
            conceptCardBackendDicts.forEach(function(conceptCardBackendDict) {
              ctrl.conceptCards.push(
                ConceptCardObjectFactory.createFromBackendDict(
                  conceptCardBackendDict));
            });
            ctrl.loadingMessage = '';
            currentConceptCard = ctrl.conceptCards[ctrl.index];
          });

          ctrl.getSkillExplanation = function() {
            return $filter('formatRtePreview')(
              currentConceptCard.getExplanation().getHtml());
          };

          ctrl.isLastWorkedExample = function() {
            return numberOfWorkedExamplesShown ===
              currentConceptCard.getWorkedExamples().length;
          };

          ctrl.showMoreWorkedExamples = function() {
            numberOfWorkedExamplesShown++;
          };

          ctrl.showWorkedExamples = function() {
            var workedExamplesShown = [];
            for (var i = 0; i < numberOfWorkedExamplesShown; i++) {
              workedExamplesShown.push(
                $filter('formatRtePreview')(
                  currentConceptCard.getWorkedExamples()[i].getHtml())
              );
            }
            return workedExamplesShown;
          };

          $scope.$watch('$ctrl.index', function(newIndex) {
            currentConceptCard = ctrl.conceptCards[newIndex];
            numberOfWorkedExamplesShown = 0;
          });
        }
      ]
    };
  }]);
