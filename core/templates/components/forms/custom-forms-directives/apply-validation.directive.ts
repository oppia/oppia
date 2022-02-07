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
 * @fileoverview Directive for applying validation.
 */

import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { UnderscoresToCamelCasePipe } from 'filters/string-utility-filters/underscores-to-camel-case.pipe';
import cloneDeep from 'lodash/cloneDeep';
import { SchemaValidators } from '../validators/schema-validators';

require('filters/string-utility-filters/underscores-to-camel-case.filter.ts');

interface InteractionValidator {
  'id': string;
  'min_value': number;
  'max_value': number;
}

interface ApplyValidationCustomScope extends ng.IScope {
  $ctrl: {
    validators: () => InteractionValidator[];
  };
}

@Directive({
  selector: '[applyValidation]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: ApplyValidationDirective,
    multi: true
  }]
})
export class ApplyValidationDirective implements Validator {
  @Input() validators;
  underscoresToCamelCasePipe = new UnderscoresToCamelCasePipe();
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.validators || this.validators.length === 0) {
      return null;
    }
    let errorsPresent = false;
    let errors: ValidationErrors = {};
    for (const validatorSpec of this.validators) {
      const frontendName = this.underscoresToCamelCasePipe.transform(
        validatorSpec.id
      );
      var filterArgs = {};
      for (var key in validatorSpec) {
        if (key !== 'id') {
          filterArgs[this.underscoresToCamelCasePipe.transform(key)] =
          cloneDeep(validatorSpec[key]);
        }
      }
      if (SchemaValidators[frontendName]) {
        const error = SchemaValidators[frontendName](filterArgs)(control);
        if (error !== null) {
          errorsPresent = true;
          errors = {...errors, ...error};
        }
      }
    }
    if (!errorsPresent) {
      return null;
    }
    return errors;
  }
}


/* eslint-disable-next-line angular/directive-restrict */
angular.module('oppia').directive('applyValidation', [
  '$filter', function($filter) {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {},
      bindToController: {
        validators: '&'
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
              ctrl.$setValidity(
                frontendName, $filter(frontendName)(viewValue, filterArgs));
              return viewValue;
            };

            ctrl.$parsers.unshift(customValidator);
            ctrl.$formatters.unshift(customValidator);
          });
        }
      }
    };
  }]);
