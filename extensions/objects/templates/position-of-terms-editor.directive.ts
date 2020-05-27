// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for position of terms editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

angular.module('oppia').directive('positionOfTermsEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./position-of-terms-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        ctrl.$onInit = function() {
          $scope.$watch('$ctrl.localValue.position', function() {
            ctrl.value = ctrl.localValue.position.name;
          });
          ctrl.alwaysEditable = true;

          ctrl.positionOfTerms = [{
            name: 'lhs',
            humanReadableName: 'on LHS'
          }, {
            name: 'rhs',
            humanReadableName: 'on RHS'
          }, {
            name: 'both',
            humanReadableName: 'on both sides'
          }, {
            name: 'irrelevant',
            humanReadableName: 'with reordering allowed around ='
          }];

          ctrl.localValue = {
            position: ctrl.positionOfTerms[2]
          };
          for (var i = 0; i < ctrl.positionOfTerms.length; i++) {
            if (ctrl.positionOfTerms[i].name === ctrl.value) {
              ctrl.localValue.position = ctrl.positionOfTerms[i];
            }
          }
        };
      }]
    };
  }]);
