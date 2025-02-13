// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the directive-scope.js file.
 */

'use strict';

var rule = require('./directive-scope');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('directive-scope', rule, {
  valid: [
    {
      code: `angular.module('oppia').directive('requireIsFloat', [
    '$filter', function($filter) {
      return {
        require: 'ngModel',
        scope: {},
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
    }]);`,
    },
    {
      code: `angular.module('oppia').directive('requireIsFloat', [
    '$filter', function($filter) {
      'testing'
    }])`,
    },
    {
      code: `angular.module('oppia').directive('requireIsFloat', [
    '$filter', 'testing']);
    `,
    },
    {
      code: `angular.module('oppia').directive('requireIsFloat', 'testing',
    function($filter) {
      'testing'
    })`,
    },
    {
      code: `angular.module('oppia').directive('requireIsFloat', [
    '$filter', function($filter) {
      return ('testing');
    }]);`,
    },
  ],

  invalid: [
    {
      code: `angular.module('oppia').directive('requireIsFloat', [
      '$filter', function($filter) {
        return {
          require: 'ngModel',
          scope: true,
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
      `,
      errors: [
        {
          message:
            'Please ensure that directive in file does not have scope set' +
            ' to true.',
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `angular.module('oppia').directive('requireIsFloat', [
      '$filter', function($filter) {
        return {
          require: 'ngModel',
          scope: 'testing',
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
      `,
      errors: [
        {
          message: 'Please ensure that directive in file has a scope: {}.',
        },
      ],
    },
  ],
});
