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
 * @fileoverview Unit tests for the splash page.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UserService } from 'services/user.service';

require('pages/splash-page/splash-page.component.ts');

const constants = require('constants.ts');

describe('Splash Page', function() {
  var $scope = null, ctrl = null;
  var $timeout = null;
  var $q = null;
  var userService: UserService = null;
  var LoaderService = null;
  var loadingMessage = null;
  var SiteAnalyticsService = null;
  var subscriptions = [];
  var windowRefMock = {
    nativeWindow: {
      location: ''
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRefMock);
    $provide.value('UserService', TestBed.get(UserService));
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $timeout = $injector.get('$timeout');
    $q = $injector.get('$q');
    userService = $injector.get('UserService');
    LoaderService = $injector.get('LoaderService');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');
    subscriptions.push(LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ));
    loadingMessage = '';
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    ctrl = $componentController('splashPage', {
      $rootScope: $scope
    });
  }));

  afterEach(function() {
    for (let subscription of subscriptions) {
      subscription.unsubscribe();
    }
  });

  it('should get static image url', function() {
    expect(ctrl.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should get static subject image url', function() {
    expect(ctrl.getStaticSubjectImageUrl('subject-file-name')).toBe(
      '/assets/images/subjects/subject-file-name.svg');
  });

  it('should redirect to login page', function() {
    var startLoginEventSpy = spyOn(
      SiteAnalyticsService, 'registerStartLoginEvent').and.callThrough();
    ctrl.onRedirectToLogin('/login');
    $timeout.flush(150);

    expect(windowRefMock.nativeWindow.location).toBe('/login');
    expect(startLoginEventSpy).toHaveBeenCalled();
  });

  it('should redirect to default classroom page', function() {
    var clickBrowseLibraryButtonEventSpy = spyOn(
      SiteAnalyticsService, 'registerClickBrowseLessonsButtonEvent')
      .and.callThrough();
    ctrl.onClickBrowseLessonsButton();
    $timeout.flush(150);

    expect(windowRefMock.nativeWindow.location).toBe(
      `/learn/${constants.DEFAULT_CLASSROOM_URL_FRAGMENT}`);
    expect(clickBrowseLibraryButtonEventSpy).toHaveBeenCalled();
  });

  it('should redirect to create exploration page', function() {
    var clickCreateExplorationButtonEventSpy = spyOn(
      SiteAnalyticsService, 'registerClickCreateExplorationButtonEvent')
      .and.callThrough();
    ctrl.onClickCreateExplorationButton();
    $timeout.flush(150);

    expect(windowRefMock.nativeWindow.location).toBe(
      '/creator-dashboard?mode=create');
    expect(clickCreateExplorationButtonEventSpy).toHaveBeenCalled();
  });

  it('should evaluate if user is logged in', function() {
    spyOn(userService, 'getUserInfoAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve({
        isLoggedIn: function() {
          return true;
        }
      });
      return deferred.promise;
    });

    ctrl.$onInit();
    expect(ctrl.userIsLoggedIn).toBe(null);
    expect(loadingMessage).toBe('Loading');

    $scope.$digest();
    expect(ctrl.userIsLoggedIn).toBe(true);
    expect(loadingMessage).toBe('');
  });

  it('should evaluate if user is not logged in', function() {
    spyOn(userService, 'getUserInfoAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve({
        isLoggedIn: function() {
          return false;
        }
      });
      return deferred.promise;
    });

    ctrl.$onInit();
    expect(ctrl.userIsLoggedIn).toBe(null);
    expect(loadingMessage).toBe('Loading');

    $scope.$digest();
    expect(ctrl.userIsLoggedIn).toBe(false);
    expect(loadingMessage).toBe('');
  });
});
