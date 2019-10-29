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
 * @fileoverview Directive for the Base Transclusion Component.
 */

require('base-components/warning-loader.directive.ts');
require('pages/OppiaFooterDirective.ts');

require('domain/sidebar/sidebar-status.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/UrlService.ts');
require('services/stateful/BackgroundMaskService.ts');

angular.module('oppia').directive('baseContent', [
  'UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      transclude: {
        breadcrumb: '?navbarBreadcrumb',
        content: 'content',
        footer: '?pageFooter',
        navOptions: '?navOptions',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/base-components/base-content.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$rootScope', 'BackgroundMaskService',
        'SidebarStatusService', 'UrlService', 'SITE_FEEDBACK_FORM_URL',
        function($rootScope, BackgroundMaskService,
            SidebarStatusService, UrlService, SITE_FEEDBACK_FORM_URL) {
          var ctrl = this;
          ctrl.iframed = UrlService.isIframed();
          ctrl.siteFeedbackFormUrl = SITE_FEEDBACK_FORM_URL;
          ctrl.isSidebarShown = SidebarStatusService.isSidebarShown;
          ctrl.closeSidebarOnSwipe = SidebarStatusService.closeSidebar;
          ctrl.isBackgroundMaskActive = BackgroundMaskService.isMaskActive;
          ctrl.DEV_MODE = $rootScope.DEV_MODE;
          ctrl.skipToMainContent = function() {
            var mainContentElement = document.getElementById(
              'oppia-main-content');

            if (!mainContentElement) {
              throw Error('Variable mainContentElement is undefined.');
            }
            mainContentElement.tabIndex = -1;
            mainContentElement.scrollIntoView();
            mainContentElement.focus();
          };
        }
      ]
    };
  }
]);
