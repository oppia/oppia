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

oppia.directive('unicodeStringEditor', [
  '$compile', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'UnicodeString';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: {
        initArgs: '@',
        alwaysEditable: '@',
        value: '='
      },
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        $scope.alwaysEditable = $scope.$parent.alwaysEditable;
        $scope.largeInput = false;

        $scope.$watch('$parent.initArgs', function(newValue) {
          $scope.largeInput = false;
          if (newValue && newValue.largeInput) {
            $scope.largeInput = newValue.largeInput;
          }
        });

        // Reset the component each time the value changes (e.g. if this is part
        // of an editable list).
        $scope.$watch('$parent.value', function() {
          $scope.localValue = {
            label: $scope.$parent.value || ''
          };
        }, true);

        if ($scope.alwaysEditable) {
          $scope.$watch('localValue.label', function(newValue) {
            $scope.$parent.value = newValue;
          });
        } else {
          $scope.openEditor = function() {
            $scope.active = true;
          };

          $scope.closeEditor = function() {
            $scope.active = false;
          };

          $scope.replaceValue = function(newValue) {
            $scope.localValue = {
              label: newValue
            };
            $scope.$parent.value = newValue;
            $scope.closeEditor();
          };

          $scope.$on('externalSave', function() {
            if ($scope.active) {
              $scope.replaceValue($scope.localValue.label);
              // The $scope.$apply() call is needed to propagate the replaced
              // value.
              $scope.$apply();
            }
          });

          $scope.closeEditor();
        }
      }]
    };
  }]);
