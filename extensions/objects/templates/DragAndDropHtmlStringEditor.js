// Copyright 2018 The Oppia Authors. All Rights Reserved.
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


oppia.directive('dragAndDropHtmlStringEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {
        getInitArgs: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/drag_and_drop_html_string_editor_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.name = math.random().toString(36).substring(7);
        $scope.initArgs = $scope.getInitArgs();
        $scope.choices = $scope.initArgs.choices;

        if (!$scope.value || $scope.value === '') {
          $scope.value = $scope.choices[0].id;
        }
        $scope.selectedItem = $scope.value;

        $scope.selection = function(selectedItem) {
          $scope.value = selectedItem;
        };
      }]
    };
  }]);
