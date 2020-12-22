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

describe('Splash Page', function() {
  var $scope = null, ctrl = null;
  var $timeout = null;
  var $q = null;
  var userService: UserService = null;
  var LoaderService = null;
  var loadingMessage = null;
  var SiteAnalyticsService = null;
  var subscriptions = [];
  var WindowDimensionsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('UserService', TestBed.get(UserService));
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $timeout = $injector.get('$timeout');
    $q = $injector.get('$q');
    userService = $injector.get('UserService');
    LoaderService = $injector.get('LoaderService');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');
    WindowDimensionsService = $injector.get('WindowDimensionsService');
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

  it('should record analytics when Browse Lessons is clicked', function() {
    var clickBrowseLibraryButtonEventSpy = spyOn(
      SiteAnalyticsService, 'registerClickBrowseLessonsButtonEvent')
      .and.callThrough();
    ctrl.onClickBrowseLessonsButton();
    $timeout.flush(150);

    expect(clickBrowseLibraryButtonEventSpy).toHaveBeenCalled();
  });

  it('should check if window is narrow', function() {
    spyOn(
      WindowDimensionsService, 'isWindowNarrow').and.returnValues(false, true);
    expect(ctrl.isWindowNarrow()).toBe(false);
    expect(ctrl.isWindowNarrow()).toBe(true);
  });

  it('should increment and decrement testimonial IDs correctly', function() {
    ctrl.$onInit();
    expect(ctrl.displayedTestimonialId).toBe(0);
    ctrl.incrementDisplayedTestimonialId();
    expect(ctrl.displayedTestimonialId).toBe(1);
    ctrl.incrementDisplayedTestimonialId();
    ctrl.incrementDisplayedTestimonialId();
    ctrl.incrementDisplayedTestimonialId();
    expect(ctrl.displayedTestimonialId).toBe(0);

    ctrl.decrementDisplayedTestimonialId();
    expect(ctrl.displayedTestimonialId).toBe(3);
    ctrl.decrementDisplayedTestimonialId();
    expect(ctrl.displayedTestimonialId).toBe(2);
  });

  it('should get testimonials correctly', function() {
    ctrl.$onInit();
    expect(ctrl.getTestimonials().length).toBe(ctrl.testimonialCount);
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
    expect(ctrl.classroomUrl).toBe('/learn/math');
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
