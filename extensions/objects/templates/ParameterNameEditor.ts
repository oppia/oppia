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

// NOTE TO DEVELOPERS: This editor requires ExplorationParamSpecsService to be
// available in the context in which it is used.

oppia.directive('parameterNameEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/parameter_name_editor_directive.html'),
      controller: [
        '$scope', '$attrs', 'ExplorationParamSpecsService',
        function($scope, $attrs, ExplorationParamSpecsService) {
          $scope.availableParamNames =
            ExplorationParamSpecsService.savedMemento.getParamNames();

          if ($scope.availableParamNames.length === 0) {
            $scope.localValue = null;
          } else {
            $scope.localValue = $scope.availableParamNames[0];
          }

          $scope.validate = function() {
            return ($scope.availableParamNames.length === 0) ? false : true;
          };

          $scope.SCHEMA = {
            type: 'unicode',
            choices: $scope.availableParamNames
          };

          // Reset the component each time the value changes (e.g. if this is
          // part of an editable list).
          $scope.$watch('value', function(newValue) {
            if (newValue) {
              $scope.localValue = newValue;
            }
          }, true);

          $scope.$watch('localValue', function(newValue) {
            $scope.value = newValue;
          });
        }
      ]
    };
  }
]);
