// Copyright 2013 Google Inc. All Rights Reserved.
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


oppia.directive('restrictedCopier', function($compile, warningsData) {
  return {
    link: function(scope, element, attrs) {
      scope.getTemplateUrl = function() {
        return VALUE_GENERATOR_TEMPLATES_URL + scope.generatorId;
      };
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    scope: true,
    template: '<div ng-include="getTemplateUrl()"></div>',
    controller: function($scope, $attrs) {
      // TODO(sll): Should initArgs be set in the template, rather than passed
      // down through the parent?
      $scope.$watch('$parent.initArgs', function(newValue, oldValue) {
        $scope.initArgs = $scope.$parent.initArgs;
      }, true);

      $scope.$watch('$parent.objType', function(newValue, oldValue) {
        $scope.objType = $scope.$parent.objType;
      }, true);

      $scope.$watch('$parent.customizationArgs', function(newValue, oldValue) {
        $scope.customizationArgs = $scope.$parent.customizationArgs;
        $scope.initArgs = $scope.$parent.initArgs;

        if ($scope.customizationArgs.parse_with_jinja === true) {
          // Do not try to do frontend validation of the input in this case.
          return;
        }

        if ($scope.customizationArgs !== undefined || oldValue !== undefined) {
          var isInList = false;
          for (var i = 0; i < $scope.initArgs.choices.length; i++) {
            if ($scope.initArgs.choices[i] == $scope.customizationArgs.value) {
              isInList = true;
            }
          }

          if (!isInList) {
            warningsData.addWarning(
              'Value must be one of ' + $scope.initArgs.choices + '; received ' +
              $scope.customizationArgs.value);
            return;
          }
        }
      }, true);
    }
  };
});
