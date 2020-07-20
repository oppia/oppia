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
 * @fileoverview Component for oppia email dashboard page.
 */

require('base-components/base-content.directive.ts');

require('services/user-backend-api.service.ts');

angular.module('oppia').component('emailDashboardPage', {
  template: require('./email-dashboard-page.component.html'),
  controller: [
    '$rootScope', 'EmailDashboardDataService', 'LoaderService',
    'UserBackendApiService',
    function($rootScope, EmailDashboardDataService, LoaderService,
        UserBackendApiService) {
      var ctrl = this;
      ctrl.resetForm = function() {
        ctrl.hasNotLoggedInForNDays = null;
        ctrl.inactiveInLastNDays = null;
        ctrl.createdAtLeastNExps = null;
        ctrl.createdFewerThanNExps = null;
        ctrl.editedAtLeastNExps = null;
        ctrl.editedFewerThanNExps = null;
      };

      ctrl.submitQuery = function() {
        var data = {
          hasNotLoggedInForNDays: ctrl.hasNotLoggedInForNDays,
          inactiveInLastNDays: ctrl.inactiveInLastNDays,
          createdAtLeastNExps: ctrl.createdAtLeastNExps,
          createdFewerThanNExps: ctrl.createdFewerThanNExps,
          editedAtLeastNExps: ctrl.editedAtLeastNExps,
          editedFewerThanNExps: ctrl.editedFewerThanNExps
        };
        EmailDashboardDataService.submitQuery(data).then(function(queries) {
          ctrl.currentPageOfQueries = queries;
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the directive is migrated to angular.
          $rootScope.$apply();
        });
        ctrl.resetForm();
        ctrl.showSuccessMessage = true;
      };

      ctrl.getNextPageOfQueries = function() {
        if (EmailDashboardDataService.isNextPageAvailable()) {
          EmailDashboardDataService.getNextQueries().then(
            function(queries) {
              ctrl.currentPageOfQueries = queries;
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            });
        }
      };

      ctrl.getPreviousPageOfQueries = function() {
        if (EmailDashboardDataService.isPreviousPageAvailable()) {
          ctrl.currentPageOfQueries = (
            EmailDashboardDataService.getPreviousQueries());
        }
      };

      ctrl.showNextButton = function() {
        return EmailDashboardDataService.isNextPageAvailable();
      };

      ctrl.showPreviousButton = function() {
        return EmailDashboardDataService.isPreviousPageAvailable();
      };

      ctrl.recheckStatus = function(index) {
        var query = ctrl.currentPageOfQueries !== undefined ?
          ctrl.currentPageOfQueries[index] : null;
        if (query) {
          var queryId = query.id;
          EmailDashboardDataService.fetchQuery(queryId).then(
            function(query) {
              ctrl.currentPageOfQueries[index] = query;
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            });
        }
      };

      ctrl.showLinkToResultPage = function(submitter, status) {
        return (submitter === ctrl.username) && (status === 'completed');
      };

      ctrl.$onInit = function() {
        ctrl.username = '';
        LoaderService.showLoadingScreen('Loading');
        UserBackendApiService.getUserInfoAsync().then(function(userInfo) {
          ctrl.username = userInfo.getUsername();
          LoaderService.hideLoadingScreen();
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$apply();
        });

        ctrl.currentPageOfQueries = [];
        EmailDashboardDataService.getNextQueries().then(function(queries) {
          ctrl.currentPageOfQueries = queries;
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the directive is migrated to angular.
          $rootScope.$apply();
        });
      };
    }
  ]
});
