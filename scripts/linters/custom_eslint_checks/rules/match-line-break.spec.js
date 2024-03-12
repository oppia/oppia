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
 * @fileoverview Tests for the match-line-break.js file.
 */

'use strict';

var rule = require('./match-line-break');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('match-line-break', rule, {
  valid: [
    {
      code: `angular.module('oppia').directive('oppiaRoot', [
    '$translate', function($translate) {
      return {
        template: require('./oppia-root.directive.html'),
        scope: {},
        transclude: true,
        controllerAs: '$ctrl',
        controller: ['$scope',
          function($scope) {
            $scope.initialized = false;
          }]
      };
    }
  ]);`,
    },
    {
      code: `angular.module('oppia').directive('oppiaRoot', 'testing', [
      '$translate', function($translate) {
        return {
          template: require('./oppia-root.directive.html'),
          scope: {},
          transclude: true,
          controllerAs: '$ctrl',
          controller: ['$scope',
            function($scope) {
              $scope.initialized = false;
            }]
        };
      }
    ]);`,
    },
    {
      code: `angular.module('oppia').directive('oppiaRoot', [
    '$translate', function($translate) { 'test'
  }
  ]);`,
    },
  ],

  invalid: [
    {
      code: `angular.module('oppia').directive('oppiaRoot', [
      '$translate', function($translate) {
        return {
          template: require('./oppia-root.directive.html'),
          scope: {},
          transclude: true,
          controllerAs: '$ctrl',
          controller: ['$scope',
                       'test',
            function($scope, test) {
              $scope.initialized = false;
            }]
        };
      }
    ]);`,
      errors: [
        {
          message:
            'Please ensure that the line breaks pattern between the dependenci' +
            'es mentioned as strings and the dependencies mentioned as function' +
            ' parameters for the corresponding controller should exactly match.',
        },
      ],
    },
  ],
});
