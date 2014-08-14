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

oppia.directive('graphEditor', function($compile, warningsData) {
  return {
    link: function(scope, element, attrs) {
      scope.getTemplateUrl = function() {
        return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<div ng-include="getTemplateUrl()"></div>',
    controller: function($scope, $element, $attrs) {
      $scope.alwaysEditable = true;
      $scope.graph = $scope.$parent.value; 
      $scope.vertexEditPermissions = true;
      $scope.movePermissions = true;

      var testGraph = {
        "vertices":  [
          {"x": 50, "y": 50, label: ""},
          {"x": 100, "y": 50, label: ""},
          {"x": 50, "y": 100, label: ""}
        ],
        "edges":  [
          {"src": 0, "dst": 1, weight: 1}, 
          {"src": 0, "dst": 2, weight: 1}
        ],
        "isLabeled": false,
        "isDirected": false,
        "isWeighted": false
      };

      $scope.useTestGraph = function() {
        try {
          var newGraph = angular.copy(testGraph);
          $scope.$parent.value = newGraph;
          $scope.graph = $scope.$parent.value;
        } catch (err) {
          console.log(err.message);
        }
      }
    }
  };
});


