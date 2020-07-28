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
 * @fileoverview Unit tests for notificationsDashboardPage.
 */

require(
  'pages/notifications-dashboard-page/' +
  'notifications-dashboard-page.component.ts');

describe('Notifications Dashboard Page', function() {
  var $scope, ctrl;
  var $httpBackend = null;
  var LoaderService = null;
  var loadingMessage = null;
  var subscriptions = [];
  var windowRefMock = {
    nativeWindow: {
      location: {
        href: ''
      }
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRefMock);
  }));
  beforeEach(angular.mock.inject(function(
      $injector, $componentController, $rootScope) {
    $httpBackend = $injector.get('$httpBackend');
    $scope = $rootScope.$new();
    loadingMessage = '';
    LoaderService = $injector.get('LoaderService');
    subscriptions.push(LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ));

    ctrl = $componentController('notificationsDashboardPage', {
      $rootScope: $scope
    });
  }));

  afterEach(function() {
    for (let subscription of subscriptions) {
      subscription.unsubscribe();
    }
  });

  it('should get item url', function() {
    expect(ctrl.getItemUrl('0', 'feedback_thread')).toBe(
      '/create/0#/feedback');
    expect(ctrl.getItemUrl('0', 'exploration_commit')).toBe(
      '/create/0');
  });

  it('should navigate to profile', function() {
    var $event = jasmine.createSpyObj('$event', ['stopPropagation']);
    ctrl.navigateToProfile($event, 'user1');
    expect($event.stopPropagation).toHaveBeenCalled();
    expect(windowRefMock.nativeWindow.location.href).toBe('/profile/user1');
  });

  it('shoud get locale date time string', function() {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    var NOW_MILLIS = 1416563100000;
    expect(ctrl.getLocaleAbbreviatedDatetimeString(NOW_MILLIS)).toBe(
      '11/21/14');
  });

  it('should successfully get data from backend notifications dashboard',
    function() {
      var response = {
        recent_notifications: {
          type: 'feedback_thread',
          activity_id: '0',
          activity_title: 'Title',
          last_updated_ms: 2000000,
          author_id: 'user1',
          subject: 'This is a brief description of the notification'
        },
        job_queued_msec: 1000000,
        last_seen_msec: null,
        username: 'user1'
      };

      $httpBackend.expect('GET', '/notificationsdashboardhandler/data')
        .respond(response);
      ctrl.$onInit();
      expect(loadingMessage).toBe('Loading');
      $httpBackend.flush();

      expect(loadingMessage).toBe('');
      expect(ctrl.recentNotifications).toEqual(response.recent_notifications);
      expect(ctrl.jobQueuedMsec).toBe(response.job_queued_msec);
      expect(ctrl.lastSeenMsec).toBe(0);
      expect(ctrl.currentUsername).toBe(response.username);
    });
});
