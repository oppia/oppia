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

// The value for this editor is always editable.

oppia.directive('booleanEditor', [
  '$compile', 'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      controller: ['$scope', function($scope) {
        // Reset the component each time the value changes (e.g. if this is part
        // of an editable list).
        $scope.$watch('value', function(newValue) {
          $scope.localValue = {
            label: newValue || false
          };
        }, true);

        $scope.$watch('localValue.label', function(newValue) {
          $scope.value = newValue;
        });
      }],
      restrict: 'E',
      scope: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/boolean_editor_directive.html'),
    };
  }]);
