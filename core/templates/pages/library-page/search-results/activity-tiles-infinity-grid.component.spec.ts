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
 * @fileoverview Unit tests for activityTilesInfinityGrid.
 */

import { HttpClientTestingModule } from
  '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { UserService } from 'services/user.service';
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Activity tiles infinity grid component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var searchService = null;
  var userService = null;
  var windowDimensionsService = null;

  var mockWindow = {
    location: ''
  };
  var loadingMessageChangeEventEmitter = new EventEmitter();
  var initialSearchResultsLoadedEmitter = new EventEmitter();
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
    $provide.value('LoaderService', {
      onLoadingMessageChange: loadingMessageChangeEventEmitter
    });
  }));

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(function() {
    userService = TestBed.get(UserService);
    windowDimensionsService = TestBed.get(WindowDimensionsService);
  });

  afterEach(function() {
    ctrl.$onDestroy();
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    searchService = $injector.get('SearchService');

    spyOnProperty(searchService, 'onInitialSearchResultsLoaded').and
      .returnValue(initialSearchResultsLoadedEmitter);
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));

    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      of(new Event('resize')));

    $scope = $rootScope.$new();
    ctrl = $componentController('activityTilesInfinityGrid', {
      $scope: $scope,
      WindowDimensionsService: windowDimensionsService
    });
  }));

  it('should initialize controller properties after its initialization',
    function() {
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(470);
      ctrl.$onInit();
      expect(ctrl.libraryWindowIsNarrow).toBe(true);
    });

  it('should change container view when resizing page to more than 530 pixels',
    function() {
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(768);
      ctrl.$onInit();
      angular.element(window).triggerHandler('resize');
      expect(ctrl.libraryWindowIsNarrow).toBe(false);
    });

  it('should get more data from backend when reaching end of page and there' +
    ' is more data to be loaded', function() {
    ctrl.$onInit();
    initialSearchResultsLoadedEmitter.emit([{}]);

    var loadMoreDataSpy = spyOn(searchService, 'loadMoreData');
    loadMoreDataSpy.and.callFake(
      (successCallback, failCallback) => successCallback({
        activity_list: [{}, {}, {}]
      }, true));
    ctrl.showMoreActivities();
    $scope.$apply();

    expect(ctrl.allActivitiesInOrder.length).toBe(4);
    expect(ctrl.endOfPageIsReached).toBe(true);

    loadMoreDataSpy.calls.reset();
    loadMoreDataSpy.and.callThrough();
    ctrl.showMoreActivities();
    expect(searchService.loadMoreData).not.toHaveBeenCalled();
  });

  it('should get more data from backend until reach end of page', function() {
    ctrl.$onInit();
    initialSearchResultsLoadedEmitter.emit([{}]);
    loadingMessageChangeEventEmitter.emit('Loading...');

    var loadMoreDataSpy = spyOn(searchService, 'loadMoreData');
    loadMoreDataSpy.and.callThrough();
    ctrl.showMoreActivities();

    expect(searchService.loadMoreData).not.toHaveBeenCalled();

    loadingMessageChangeEventEmitter.emit('');

    loadMoreDataSpy.and.callFake(
      (successCallback, failCallback) => successCallback({
        activity_list: [{}]
      }, true));
    ctrl.showMoreActivities();
    $scope.$apply();

    expect(ctrl.allActivitiesInOrder.length).toBe(2);
    expect(ctrl.endOfPageIsReached).toBe(true);
  });

  it('should not get more data from backend when reaching the end of the page',
    function() {
      ctrl.$onInit();
      initialSearchResultsLoadedEmitter.emit([]);

      spyOn(searchService, 'loadMoreData').and.callFake(
        (successCallback, failCallback) => failCallback(false));
      ctrl.showMoreActivities();
      $scope.$apply();

      expect(ctrl.endOfPageIsReached).toBe(false);
    });
});
