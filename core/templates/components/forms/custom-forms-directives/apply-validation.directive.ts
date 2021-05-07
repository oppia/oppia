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

import { ObjectFormValidityChangeEvent } from "app-events/app-events";
import { EventBusGroup } from "app-events/event-bus.service";

/**
 * @fileoverview Directive for applying validation.
 */

require('filters/string-utility-filters/underscores-to-camel-case.filter.ts');

interface InteractionValidator {
  'id': string;
  'min_value': number;
  'max_value': number;
}

interface ApplyValidationCustomScope extends ng.IScope {
  $ctrl: {
    validators: () => InteractionValidator[];
    modalId: symbol
  }
}

/* eslint-disable-next-line angular/directive-restrict */
angular.module('oppia').directive('applyValidation', [
  '$filter', 'EventBusService', function($filter, EventBusService) {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {},
      bindToController: {
        validators: '&',
        modalId: '<'
      },
      controllerAs: '$ctrl',
      controller: [function() {}],
      link: function(scope: ApplyValidationCustomScope, elm, attrs, ctrl) {
        // Add validators in reverse order.
        if (scope.$ctrl.validators()) {
          scope.$ctrl.validators().forEach(function(validatorSpec) {
            var frontendName = $filter('underscoresToCamelCase')(
              validatorSpec.id);

            // Note that there may not be a corresponding frontend filter for
            // each backend validator.
            try {
              $filter(frontendName);
            } catch (err) {
              return;
            }

            var filterArgs = {};
            for (var key in validatorSpec) {
              if (key !== 'id') {
                filterArgs[$filter('underscoresToCamelCase')(key)] =
                  angular.copy(validatorSpec[key]);
              }
            }

            var customValidator = function(viewValue) {
              let validationResult = $filter(frontendName)(
                viewValue, filterArgs);
              const eventBusGroup: EventBusGroup = new EventBusGroup(
                EventBusService);
              eventBusGroup.emit(new ObjectFormValidityChangeEvent({
                value: true,
                modalId: scope.$ctrl.modalId
              }));
              ctrl.$setValidity(frontendName, validationResult);
              return viewValue;
            };

            ctrl.$parsers.unshift(customValidator);
            ctrl.$formatters.unshift(customValidator);
          });
        }
      }
    };
  }]);
