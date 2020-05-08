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
 * @fileoverview Data and controllers for the user's notifications dashboard.
 */

require('base-components/base-content.directive.ts');

require('services/date-time-format.service.ts');
require('services/contextual/window-ref.service.ts');

angular.module('oppia').directive('notificationsDashboardPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/notifications-dashboard-page/' +
        'notifications-dashboard-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', 'LoaderService', 'DateTimeFormatService', 'WindowRef',
        function($http, LoaderService, DateTimeFormatService, WindowRef) {
          var ctrl = this;
          ctrl.getItemUrl = function(activityId, notificationType) {
            return (
              '/create/' + activityId + (
                notificationType === 'feedback_thread' ? '#/feedback' : ''));
          };

          ctrl.navigateToProfile = function($event, username) {
            $event.stopPropagation();
            WindowRef.nativeWindow.location.href = '/profile/' + username;
          };

          ctrl.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              millisSinceEpoch);
          };
          ctrl.$onInit = function() {
            LoaderService.showLoadingScreen('Loading');
            $http.get('/notificationsdashboardhandler/data').then(function(
                response) {
              var data = response.data;
              ctrl.recentNotifications = data.recent_notifications;
              ctrl.jobQueuedMsec = data.job_queued_msec;
              ctrl.lastSeenMsec = data.last_seen_msec || 0.0;
              ctrl.currentUsername = data.username;
              LoaderService.hideLoadingScreen();
            });
          };
        }
      ]
    };
  }]);
