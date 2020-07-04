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

require('domain/skill/concept-card-backend-api.service.ts');
require('domain/skill/ConceptCardObjectFactory.ts');
require('directives/angular-html-bind.directive.ts');
require('filters/format-rte-preview.filter.ts');

angular.module('oppia').directive('conceptCard', [
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
          ctrl.isLastWorkedExample = function() {
            return ctrl.numberOfWorkedExamplesShown ===
              ctrl.currentConceptCard.getWorkedExamples().length;
          };

          ctrl.showMoreWorkedExamples = function() {
            ctrl.explanationIsShown = false;
            ctrl.numberOfWorkedExamplesShown++;
          };

          ctrl.$onInit = function() {
            ctrl.conceptCards = [];
            ctrl.currentConceptCard = null;
            ctrl.numberOfWorkedExamplesShown = 0;
            ctrl.loadingMessage = 'Loading';
            $scope.$watch('$ctrl.index', function(newIndex) {
              ctrl.currentConceptCard = ctrl.conceptCards[newIndex];
              if (ctrl.currentConceptCard) {
                ctrl.numberOfWorkedExamplesShown = 0;
                if (ctrl.currentConceptCard.getWorkedExamples().length > 0) {
                  ctrl.numberOfWorkedExamplesShown = 1;
                }
              }
            });
            ConceptCardBackendApiService.loadConceptCards(
              ctrl.getSkillIds()
            ).then(function(conceptCardObjects) {
              conceptCardObjects.forEach(function(conceptCardObject) {
                ctrl.conceptCards.push(conceptCardObject);
              });
              ctrl.loadingMessage = '';
              ctrl.currentConceptCard = ctrl.conceptCards[ctrl.index];
              ctrl.numberOfWorkedExamplesShown = 0;
              if (ctrl.currentConceptCard.getWorkedExamples().length > 0) {
                ctrl.numberOfWorkedExamplesShown = 1;
              }
              // TODO(#8521): Remove when this directive is migrated to Angular.
              $rootScope.$apply();
            });
          };
        }
      ]
    };
  }]);
