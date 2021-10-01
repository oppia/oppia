
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
 * @fileoverview Directive for graph property editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

angular.module('oppia').directive('graphPropertyEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./graph-property-editor.component.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        ctrl.$onInit = function() {
          $scope.$watch('$ctrl.localValue.property', function() {
            ctrl.value = ctrl.localValue.property.name;
          });
          ctrl.alwaysEditable = true;

          ctrl.graphProperties = [{
            name: 'regular',
            humanReadableName: 'regular'
          }, {
            name: 'acyclic',
            humanReadableName: 'acyclic'
          }, {
            name: 'strongly_connected',
            humanReadableName: 'strongly connected'
          }, {
            name: 'weakly_connected',
            humanReadableName: 'weakly connected'
          }];
          ctrl.localValue = {
            property: ctrl.graphProperties[0]
          };

          for (var i = 0; i < ctrl.graphProperties.length; i++) {
            if (ctrl.graphProperties[i].name === ctrl.value) {
              ctrl.localValue.property = ctrl.graphProperties[i];
            }
          }
        };
      }]
    };
  }]);
