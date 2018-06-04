
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

oppia.directive('graphPropertyEditor', [
  '$compile', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'GraphProperty';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: {
        value: '='
      },
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        $scope.alwaysEditable = true;

        $scope.graphProperties = [{
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
        $scope.localValue = {
          property: $scope.graphProperties[0]
        };

        for (var i = 0; i < $scope.graphProperties.length; i++) {
          if ($scope.graphProperties[i].name === $scope.value) {
            $scope.localValue.property = $scope.graphProperties[i];
          }
        }

        $scope.$watch('localValue.property', function() {
          $scope.value = $scope.localValue.property.name;
        });
      }]
    };
  }]);
