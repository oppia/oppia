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
 * @fileoverview Directive for requiring "isFloat" filter.
 */

// This should come before 'apply-validation', if that is defined as
// an attribute on the HTML tag.

require('components/forms/validators/is-float.filter.ts');

/* eslint-disable-next-line angular/directive-restrict */
angular.module('oppia').directive('requireIsFloat', [
  '$filter', function($filter) {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function(scope, elm, attrs, ctrl) {
        var floatValidator = function(viewValue) {
          var filteredValue = $filter('isFloat')(viewValue);
          ctrl.$setValidity('isFloat', filteredValue !== undefined);
          return filteredValue;
        };

        ctrl.$parsers.unshift(floatValidator);
        ctrl.$formatters.unshift(floatValidator);
      }
    };
  }]);
