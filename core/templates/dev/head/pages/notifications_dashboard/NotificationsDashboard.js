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

oppia.controller('NotificationsDashboard', [
  '$http', '$rootScope', '$scope', 'DateTimeFormatService',
  function($http, $rootScope, $scope, DateTimeFormatService) {
    $scope.getItemUrl = function(activityId, notificationType) {
      return (
        '/create/' + activityId + (
          notificationType === 'feedback_thread' ? '#/feedback' : ''));
    };

    $scope.navigateToProfile = function($event, username) {
      $event.stopPropagation();
      window.location.href = '/profile/' + username;
    };

    $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
      return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $rootScope.loadingMessage = 'Loading';
    $http.get('/notificationsdashboardhandler/data').then(function(response) {
      var data = response.data;
      $scope.recentNotifications = data.recent_notifications;
      $scope.jobQueuedMsec = data.job_queued_msec;
      $scope.lastSeenMsec = data.last_seen_msec || 0.0;
      $scope.currentUsername = data.username;
      $rootScope.loadingMessage = '';
    });
  }
]);
