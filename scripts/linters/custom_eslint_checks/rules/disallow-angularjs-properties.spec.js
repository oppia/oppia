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
 * @fileoverview Tests for the disallow-angularjs-properties.js file.
 */

'use strict';

var rule = require('./disallow-angularjs-properties');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('disallow-angularjs-properties', rule, {
  valid: [
    `
    var ParentCtrl = function($scope) {
      $scope.cities = ['NY', 'Amsterdam', 'Barcelona'];
    };
    `,
  ],

  invalid: [
    {
      code: `
      var ChildCtrl = function($scope) {
        $scope.parentcities = $scope.$parent.cities;
      };
      `,
      errors: [
        {
          message:
            'Please do not access parent properties using $parent.' +
            ' Use the scope object for this purpose.',
        },
      ],
    },
    {
      code: `
      angular.module('oppia').directive('sampleDirective', [
      function() {
        return {
          controller: ['$rootScope',
          function($rootScope) {
            $rootScope.$broadcast('sampleEvent');
          }
          ]
        };
      }]);
      `,
      errors: [
        {
          message:
            'Please do not use $broadcast/$on for propagating events.' +
            ' Use @Input/@Output instead',
        },
      ],
    },
  ],
});
