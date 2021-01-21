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

/**
 * @fileoverview Component for the Oppia 'edit preferences' page.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require(
  'pages/delete-account-page/templates/delete-account-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').component('deleteAccountPage', {
  template: require('./delete-account-page.component.html'),
  controller: [
    '$http', '$uibModal', '$window', 'SiteAnalyticsService',
    'UrlInterpolationService',
    function(
        $http, $uibModal, $window, SiteAnalyticsService,
        UrlInterpolationService) {
      var ctrl = this;
      ctrl.deleteAccount = function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/delete-account-page/templates/' +
            'delete-account-modal.template.html'),
          backdrop: true,
          controller: 'DeleteAccountModalController'
        }).result.then(function() {
          $http['delete']('/delete-account-handler').then(function() {
            SiteAnalyticsService.registerAccountDeletion();
            setTimeout(() => {
              $window.location = (
                '/logout?redirect_url=pending-account-deletion');
            }, SiteAnalyticsService.CAN_SEND_ANALYTICS_EVENTS ? 150 : 0);
          });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };
    }
  ]
});
