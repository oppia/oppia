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
 * @fileoverview Controllers for the about page.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('aboutPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/about-page/about-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'UrlInterpolationService', 'WindowRef',
        function(UrlInterpolationService, WindowRef) {
          const ctrl = this;
          const listOfNamesToThank = [
            'Alex Kauffmann', 'Allison Barros',
            'Amy Latten', 'Brett Barros',
            'Crystal Kwok', 'Daniel Hernandez',
            'Divya Siddarth', 'Ilwon Yoon',
            'Jennifer Chen', 'John Cox',
            'John Orr', 'Katie Berlent',
            'Michael Wawszczak', 'Mike Gainer',
            'Neil Fraser', 'Noah Falstein',
            'Nupur Jain', 'Peter Norvig',
            'Philip Guo', 'Piotr Mitros',
            'Rachel Chen', 'Rahim Nathwani',
            'Robyn Choo', 'Tricia Ngoon',
            'Vikrant Nanda', 'Vinamrata Singal',
            'Yarin Feigenbaum'];
          // Define constant for each tab on the page.
          ctrl.TAB_ID_ABOUT = 'about';
          ctrl.TAB_ID_FOUNDATION = 'foundation';
          ctrl.TAB_ID_CREDITS = 'credits';

          const ALLOWED_TABS = [
            ctrl.TAB_ID_ABOUT, ctrl.TAB_ID_FOUNDATION, ctrl.TAB_ID_CREDITS];

          ctrl.activeTabName = ctrl.TAB_ID_ABOUT;

          ctrl.onTabClick = function(tabName: string) {
            // Update hash
            WindowRef.nativeWindow.location.hash = '#' + tabName;
            ctrl.activeTabName = tabName;
          };
          ctrl.getStaticImageUrl = function(imagePath: string) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
          ctrl.$onInit = function() {
            const hash = WindowRef.nativeWindow.location.hash.slice(1);
            if (hash === 'license') {
              ctrl.activeTabName = ctrl.TAB_ID_FOUNDATION;
            } else if (ALLOWED_TABS.includes(hash)) {
              ctrl.activeTabName = hash;
            }

            ctrl.listOfNames = listOfNamesToThank
              .slice(0, listOfNamesToThank.length - 1).join(', ') +
              ' & ' + listOfNamesToThank[listOfNamesToThank.length - 1];
            ctrl.aboutPageMascotImgUrl = UrlInterpolationService
              .getStaticImageUrl('/general/about_page_mascot.png');

            WindowRef.nativeWindow.onhashchange = function() {
              const hashChange = window.location.hash.slice(1);
              if (hashChange === 'license') {
                ctrl.activeTabName = ctrl.TAB_ID_FOUNDATION;
                WindowRef.nativeWindow.location.reload(true);
              } else if (ALLOWED_TABS.includes(hashChange)) {
                ctrl.activeTabName = hashChange;
              }
            };
          };
        }
      ]
    };
  }]);
