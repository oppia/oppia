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

oppia.directive('codeStringEditor', [
  '$compile', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'CodeString';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        $scope.alwaysEditable = $scope.$parent.alwaysEditable;

        $scope.getWarningText = function() {
          if ($scope.localValue.label.indexOf('\t') !== -1) {
            return 'Code may not contain tab characters.';
          }
          return '';
        };

        // Reset the component each time the value changes (e.g. if this is part
        // of an editable list).
        $scope.$watch('$parent.value', function() {
          $scope.localValue = {
            label: $scope.$parent.value || ''
          };
        }, true);

        $scope.$watch('localValue.label', function(newValue) {
          $scope.$parent.value = newValue;
        });
      }]
    };
  }]);
