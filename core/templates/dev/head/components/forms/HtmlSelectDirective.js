// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the selection dropdown with HTML content.
 */

// This directive allows user to put html into select's options.
// 'options' should be an array of objects containing attributes 'id' and 'val'
// Attribute 'val' is presented to the user. After user selection, the
// corresponding attribute 'id' is assigned to 'selection'

oppia.directive('htmlSelect', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        options: '=',
        selection: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/html_select_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.select = function(id) {
          $scope.selection = id;
        };

        $scope.getSelectionIndex = function() {
          for (var index = 0; index < $scope.options.length; index++) {
            if ($scope.options[index].id === $scope.selection) {
              return index;
            }
          }
        };
      }]
    };
  }
]);
