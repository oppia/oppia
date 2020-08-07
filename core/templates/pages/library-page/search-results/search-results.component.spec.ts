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
 * @fileoverview Unit tests for searchResults.
 */

import { TestBed } from '@angular/core/testing';
import { SiteAnalyticsService } from 'services/site-analytics.service';

describe('Search Results component', function() {
  var ctrl = null;
  var $flushPendingTasks = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var siteAnalyticsService = null;
  var userService = null;

  var mockWindow = {
    location: ''
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(function() {
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $flushPendingTasks = $injector.get('$flushPendingTasks');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    userService = $injector.get('UserService');

    spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
      isLoggedIn: () => true
    }));

    $scope = $rootScope.$new();
    ctrl = $componentController('searchResults', {
      $scope: $scope,
      SiteAnalyticsService: siteAnalyticsService
    });
    ctrl.$onInit();
    $scope.$apply();
  }));

  it('should initialize controller properties after its initialization and' +
    ' get data from backend', function() {
    expect(ctrl.someResultsExist).toBe(true);
    expect(ctrl.userIsLoggedIn).toBe(true);
  });

  it('should show search results when data retrieved from backend is not' +
    ' empty', function() {
    $rootScope.$broadcast('initialSearchResultsLoaded', new Array(2));
    expect(ctrl.someResultsExist).toBe(true);
  });

  it('should not show search results when data retrieved from back is empty',
    function() {
      $rootScope.$broadcast('initialSearchResultsLoaded', []);
      expect(ctrl.someResultsExist).toBe(false);
    });

  it('should get url for static image resources', function() {
    var imagePath = '/path/to/image.png';
    expect(ctrl.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
  });

  it('should redirect to login page when trying to create a exploration' +
    ' question and user is not logged in', function() {
    spyOn(siteAnalyticsService, 'registerStartLoginEvent');
    ctrl.onRedirectToLogin('login-url');
    $flushPendingTasks();

    expect(siteAnalyticsService.registerStartLoginEvent).toHaveBeenCalled();
    expect(mockWindow.location).toBe('login-url');
  });
});
