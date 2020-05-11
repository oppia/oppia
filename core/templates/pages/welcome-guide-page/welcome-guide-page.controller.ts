// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers for the Welcome Guide page.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('welcomeGuidePage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/welcome-guide-page/welcome-guide-page.directive.html'),
      controllerAs: '$ctrl',
      controller: ['UrlInterpolationService', function(
          UrlInterpolationService) {
        var ctrl = this;
        ctrl.$onInit = function() {
          ctrl.arr = [
            {pClass: 'oppia-welcome-guide-numbers',
              spanClass: 'oppia-welcome-guide-blue',
              I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_1'},
            {pClass: 'oppia-welcome-guide-numbers',
              spanClass: 'oppia-welcome-guide-purple',
              I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_2'},
            {pClass: 'oppia-welcome-guide-numbers',
              spanClass: 'oppia-welcome-guide-red',
              I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_3'},
            {pClass: 'oppia-welcome-guide-numbers',
              spanClass: 'oppia-welcome-guide-orange',
              I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_4'},
            {pClass: 'oppia-welcome-guide-numbers',
              spanClass: 'oppia-welcome-guide-green',
              I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_5'}
          ];

          ctrl.fractionExplorationPngImageUrl = (
            UrlInterpolationService.getStaticImageUrl(
              '/welcome_guide/fractions_exploration.png'));
          ctrl.fractionExplorationWebpImageUrl = (
            UrlInterpolationService.getStaticImageUrl(
              '/welcome_guide/fractions_exploration.webp'));
          ctrl.oppiaUsersPngImageUrl = (
            UrlInterpolationService.getStaticImageUrl(
              '/welcome_guide/oppia_users.png'));
          ctrl.oppiaUsersWebpImageUrl = (
            UrlInterpolationService.getStaticImageUrl(
              '/welcome_guide/oppia_users.webp'));
          ctrl.explorationLibraryPngImageUrl = (
            UrlInterpolationService.getStaticImageUrl(
              '/welcome_guide/exploration_library.png'));
          ctrl.explorationLibraryWebpImageUrl = (
            UrlInterpolationService.getStaticImageUrl(
              '/welcome_guide/exploration_library.webp'));
        };
      }]
    };
  }]);
