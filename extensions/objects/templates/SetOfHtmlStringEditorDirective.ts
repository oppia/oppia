// Copyright 2012 The Oppia Authors. All Rights Reserved.
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

oppia.directive('setOfHtmlStringEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {
        getInitArgs: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/set_of_html_string_editor_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.SCHEMA = {
          type: 'list',
          items: {
            type: 'html'
          }
        };

        if (!$scope.value) {
          $scope.value = [];
        }
        $scope.initArgs = $scope.getInitArgs();
        $scope.choices = $scope.initArgs.choices;
        $scope.selections = $scope.choices.map(function(choice) {
          return $scope.value.indexOf(choice.id) !== -1;
        });

        // The following function is necessary to insert elements into the
        // answer groups for the Item Selection Widget.
        $scope.toggleSelection = function(choiceListIndex) {
          var choiceHtml = $scope.choices[choiceListIndex].id;
          var selectedChoicesIndex = $scope.value.indexOf(choiceHtml);
          if (selectedChoicesIndex > -1) {
            $scope.value.splice(selectedChoicesIndex, 1);
          } else {
            $scope.value.push(choiceHtml);
          }
        };
      }]
    };
  }]);
