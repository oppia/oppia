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


// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

oppia.directive('graphPropertyEditor', function($compile, warningsData) {
  return {
    link: function(scope, element, attrs) {
      scope.getTemplateUrl = function() {
        return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<span ng-include="getTemplateUrl()"></span>',
    controller: function($scope, $attrs) {
      $scope.alwaysEditable = true;
      $scope.properties = [{
        name: 'regular',
        humanReadable: 'Regular'
      }, {
        name: 'acyclic',
        humanReadable: 'acyclic'
      }, {
        name: 'strongly_connected',
        humanReadable: 'Strongly connected'
      }, {
        name: 'weakly_connected',
        humanReadable: 'Weakly connected'
      }];

      $scope.localValue = {
        property: $scope.properties[0]
      };
      for (var i = 0; i < $scope.properties.length; i++) {
        if ($scope.properties[i].name === $scope.$parent.value) {
          $scope.localValue.property = $scope.properties[i];
        }
      }

      $scope.$watch('localValue.property', function(oldValue, newValue) {
        $scope.$parent.value = $scope.localValue.property.name;
      })
    }
  };
});
