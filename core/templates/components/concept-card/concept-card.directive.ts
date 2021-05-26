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
require('directives/angular-html-bind.directive.ts');
require('filters/format-rte-preview.filter.ts');

angular.module('oppia').directive('conceptCard', [function() {
  return {
    restrict: 'E',
    scope: {},
    bindToController: {
      skillIds: '<',
      index: '<'
    },
    template: require('./concept-card.template.html'),
    controllerAs: '$ctrl',
    controller: [
      '$rootScope', '$scope', 'ConceptCardBackendApiService',
      function(
          $rootScope, $scope, ConceptCardBackendApiService) {
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
          ConceptCardBackendApiService.loadConceptCardsAsync(
            ctrl.skillIds
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

// Allow $scope to be provided to parent Component.
export const ScopeProvider = {
  deps: ['$injector'],
  provide: '$scope',
  useFactory: (injector: Injector): void => injector.get('$rootScope').$new(),
};

import { Directive, ElementRef, Injector, Input } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

@Directive({
  selector: 'concept-card',
  providers: [ScopeProvider]
})
export class ConceptCardComponent extends UpgradeComponent {
  @Input() skillIds;
  @Input() index;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('conceptCard', elementRef, injector);
  }
}
