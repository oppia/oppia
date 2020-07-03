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
 * @fileoverview Controllers for the Parents and Teachers Welcome Guide page.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').component('parentTeacherWelcomePage', {
  template: require('./parent-teacher-welcome-page.mainpage.html'),
  controller: ['UrlInterpolationService',
    function(UrlInterpolationService) {
      var ctrl = this;
      ctrl.$onInit = function() {
        ctrl.arr = [
          {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
            spanClass: 'oppia-parent-teacher-welcome-guide-blue',
            I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_1'},
          {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
            spanClass: 'oppia-parent-teacher-welcome-guide-purple',
            I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_2'},
          {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
            spanClass: 'oppia-parent-teacher-welcome-guide-red',
            I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_3'},
          {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
            spanClass: 'oppia-parent-teacher-welcome-guide-orange',
            I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_4'},
          {pClass: 'oppia-parent-teacher-welcome-guide-numbers',
            spanClass: 'oppia-parent-teacher-welcome-guide-green',
            I8n: 'I18N_WELCOME_GUIDE_BROWSER_BULLET_5'}
        ];

        ctrl.fractionExplorationPngImageUrl = (
          UrlInterpolationService.getStaticImageUrl(
            '/parent_teacher_welcome_page/fractions_exploration.png'));
        ctrl.fractionExplorationWebpImageUrl = (
          UrlInterpolationService.getStaticImageUrl(
            '/parent_teacher_welcome_page/fractions_exploration.webp'));
        ctrl.oppiaUsersPngImageUrl = (
          UrlInterpolationService.getStaticImageUrl(
            '/parent_teacher_welcome_page/oppia_users.png'));
        ctrl.oppiaUsersWebpImageUrl = (
          UrlInterpolationService.getStaticImageUrl(
            '/parent_teacher_welcome_page/oppia_users.webp'));
        ctrl.explorationLibraryPngImageUrl = (
          UrlInterpolationService.getStaticImageUrl(
            '/parent_teacher_welcome_page/exploration_library.png'));
        ctrl.explorationLibraryWebpImageUrl = (
          UrlInterpolationService.getStaticImageUrl(
            '/parent_teacher_welcome_page/exploration_library.webp'));
      };
    }]
});
