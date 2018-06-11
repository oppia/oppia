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


oppia.directive('numberWithUnitsEditor', [
  '$compile', 'NumberWithUnitsObjectFactory', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, NumberWithUnitsObjectFactory, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'NumberWithUnits';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: {
        value: '='
      },
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        var errorMessage = '';
        var numberWithUnitsString = '0';
        if ($scope.value !== null) {
          var defaultNumberWithUnits =
            NumberWithUnitsObjectFactory.fromDict($scope.value);
          numberWithUnitsString = defaultNumberWithUnits.toString();
        }
        $scope.localValue = {
          label: numberWithUnitsString
        };

        $scope.$watch('localValue.label', function(newValue) {
          try {
            var numberWithUnits =
              NumberWithUnitsObjectFactory.fromRawInputString(newValue);
            $scope.value = numberWithUnits;
            errorMessage = '';
          } catch (parsingError) {
            errorMessage = parsingError.message;
          }
        });

        $scope.getWarningText = function() {
          return errorMessage;
        };
      }]
    };
  }]);
