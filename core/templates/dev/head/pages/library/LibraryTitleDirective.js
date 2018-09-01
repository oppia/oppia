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
 * @fileoverview Directive for replacement of jinja template issue#3950.
 */
oppia.directive('libraryTitle', [function() {
  return {
    restrict: 'E',
    controller: [
      '$scope', '$rootScope', '$timeout', '$window', 'LIBRARY_PAGE_MODES',
      function($scope, $rootScope, $timeout, $window, LIBRARY_PAGE_MODES) {
        $scope.pageTranslate = GLOBALS.PAGE_MODE === LIBRARY_PAGE_MODES.GROUP ||
        GLOBALS.PAGE_MODE === LIBRARY_PAGE_MODES.SEARCH ?
        'Find explorations to learn from - Oppia' : 'I18N_LIBRARY_PAGE_TITLE';
        $window.document.title = 'Find explorations to learn from - Oppia';
        $window.document.getElementsByTagName('title')[0]
          .setAttribute('translate', $scope.pageTranslate);
      }
    ]
  };
}]);
