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

require('base-components/base-content.component.ts');

require('services/user.service.ts');

require('./email-dashboard-data.service');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');

angular.module('oppia').component('emailDashboardPage', {
  template: require('./email-dashboard-page.component.html'),
  controller: [
    '$rootScope', 'EmailDashboardDataService', 'LoaderService',
    'UserService', 'EMAIL_DASHBOARD_PREDICATE_DEFINITION', function(
        $rootScope, EmailDashboardDataService, LoaderService,
        UserService, EMAIL_DASHBOARD_PREDICATE_DEFINITION) {
      var ctrl = this;
      ctrl.resetForm = function() {
        ctrl.data = {};
        EMAIL_DASHBOARD_PREDICATE_DEFINITION.forEach(predicate => {
          ctrl.data[predicate.backend_attr] = predicate.default_value;
        });
      };

      ctrl.areAllInputsEmpty = function() {
        return Object.values(ctrl.data).every(
          value => value === null || value === false);
      };

      ctrl.submitQueryAsync = async function() {
        EmailDashboardDataService.submitQueryAsync(ctrl.data).then(
          function(queries) {
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
          EmailDashboardDataService.getNextQueriesAsync().then(
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
          EmailDashboardDataService.fetchQueryAsync(queryId).then(
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
        ctrl.customizationArgSpecs = EMAIL_DASHBOARD_PREDICATE_DEFINITION;
        ctrl.resetForm();

        UserService.getUserInfoAsync().then(function(userInfo) {
          ctrl.username = userInfo.getUsername();
          LoaderService.hideLoadingScreen();
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        });

        ctrl.currentPageOfQueries = [];
        EmailDashboardDataService.getNextQueriesAsync().then(function(queries) {
          ctrl.currentPageOfQueries = queries;
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the directive is migrated to angular.
          $rootScope.$apply();
        });
      };
    }
  ]
});
