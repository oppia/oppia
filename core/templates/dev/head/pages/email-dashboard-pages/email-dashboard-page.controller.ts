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
 * @fileoverview Controller for oppia email dashboard page.
 */

require('base-components/base-content.directive.ts');

require('pages/email-dashboard-pages/email-dashboard-data.service.ts');
require('services/user.service.ts');

angular.module('oppia').directive('emailDashboardPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/email-dashboard-pages/email-dashboard-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', 'EmailDashboardDataService', 'UserService',
        function($rootScope, EmailDashboardDataService, UserService) {
          var ctrl = this;
          ctrl.username = '';
          $rootScope.loadingMessage = 'Loading';
          UserService.getUserInfoAsync().then(function(userInfo) {
            ctrl.username = userInfo.getUsername();
            $rootScope.loadingMessage = '';
          });

          ctrl.currentPageOfQueries = [];

          ctrl.resetForm = function() {
            ctrl.has_not_logged_in_for_n_days = null;
            ctrl.inactive_in_last_n_days = null;
            ctrl.created_at_least_n_exps = null;
            ctrl.created_fewer_than_n_exps = null;
            ctrl.edited_at_least_n_exps = null;
            ctrl.edited_fewer_than_n_exps = null;
          };

          ctrl.submitQuery = function() {
            var data = {
              has_not_logged_in_for_n_days: ctrl.has_not_logged_in_for_n_days,
              inactive_in_last_n_days: ctrl.inactive_in_last_n_days,
              created_at_least_n_exps: ctrl.created_at_least_n_exps,
              created_fewer_than_n_exps: ctrl.created_fewer_than_n_exps,
              edited_at_least_n_exps: ctrl.edited_at_least_n_exps,
              edited_fewer_than_n_exps: ctrl.edited_fewer_than_n_exps
            };
            EmailDashboardDataService.submitQuery(data).then(function(queries) {
              ctrl.currentPageOfQueries = queries;
            });
            ctrl.resetForm();
            ctrl.showSuccessMessage = true;
          };

          ctrl.getNextPageOfQueries = function() {
            if (EmailDashboardDataService.isNextPageAvailable()) {
              EmailDashboardDataService.getNextQueries().then(
                function(queries) {
                  ctrl.currentPageOfQueries = queries;
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
            var queryId = ctrl.currentPageOfQueries[index].id;
            EmailDashboardDataService.fetchQuery(queryId).then(function(query) {
              ctrl.currentPageOfQueries[index] = query;
            });
          };

          ctrl.showLinkToResultPage = function(submitter, status) {
            return (submitter === ctrl.username) && (status === 'completed');
          };

          EmailDashboardDataService.getNextQueries().then(function(queries) {
            ctrl.currentPageOfQueries = queries;
          });
        }
      ]};
  }]);
