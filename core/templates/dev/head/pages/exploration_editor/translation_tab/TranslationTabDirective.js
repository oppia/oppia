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

/**
 * @fileoverview Directive for the translation tab.
 */

oppia.directive('translationTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      link: function(scope) {
        scope.$broadcast('refreshTranslationTab');
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'translation_tab_directive.html'),
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        $rootScope.loadingMessage = 'Loading';
        $scope.isTranslationTabBusy = false;
        $scope.$on('refreshTranslationTab', function() {
          $scope.$broadcast('refreshStateTranslation');
        });
      }]
    };
  }]);
