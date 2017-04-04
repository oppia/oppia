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

oppia.directive('logicErrorCategoryEditor', [
  '$compile', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'LogicErrorCategory';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        $scope.alwaysEditable = true;
        $scope.errorCategories = [{
          name: 'parsing',
          humanReadable: 'Unparseable'
        }, {
          name: 'typing',
          humanReadable: 'Ill-typed'
        }, {
          name: 'line',
          humanReadable: 'Incorrect line'
        }, {
          name: 'layout',
          humanReadable: 'Wrong indenting'
        }, {
          name: 'variables',
          humanReadable: 'Variables error'
        }, {
          name: 'logic',
          humanReadable: 'Invalid deduction'
        }, {
          name: 'target',
          humanReadable: 'Target not proved'
        }, {
          name: 'mistake',
          humanReadable: 'Unspecified'
        }];

        $scope.localValue = {
          category: $scope.errorCategories[0]
        };
        for (var i = 0; i < $scope.errorCategories.length; i++) {
          if ($scope.errorCategories[i].name === $scope.$parent.value) {
            $scope.localValue.category = $scope.errorCategories[i];
          }
        }

        $scope.$watch('localValue.category', function() {
          $scope.$parent.value = $scope.localValue.category.name;
        });
      }]
    };
  }]);
