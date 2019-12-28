// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the library footer.
 */

require('pages/OppiaFooterDirective.ts');

require('pages/library-page/library-page.constants.ajs.ts');

angular.module('oppia').directive('libraryFooter', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library-page/library-footer/library-footer.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$window', 'LIBRARY_PAGE_MODES', 'LIBRARY_PATHS_TO_MODES',
        function($window, LIBRARY_PAGE_MODES, LIBRARY_PATHS_TO_MODES) {
          var ctrl = this;
          ctrl.$onInit = function() {
            var pageMode = LIBRARY_PATHS_TO_MODES[$window.location.pathname];
            ctrl.footerIsDisplayed = (pageMode !== LIBRARY_PAGE_MODES.SEARCH);
          };
        }
      ]
    };
  }]);
