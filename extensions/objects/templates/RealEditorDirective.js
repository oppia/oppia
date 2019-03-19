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

oppia.directive('realEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/real_editor_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.schema = {
          type: 'float'
        };

        $scope.$watch('value', function() {
          if ($scope.value === '') {
            // A new rule
            $scope.value = 0.0;
          }
        });

        if ($scope.value === '') {
          $scope.value = 0.0;
        }
      }]
    };
  }]);
