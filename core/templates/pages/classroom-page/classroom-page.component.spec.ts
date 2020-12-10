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
 * @fileoverview Unit tests for classroom page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
import { Subscription } from 'rxjs';

import { ClassroomData } from 'domain/classroom/classroom-data.model';
// ^^^ This block is to be removed.

require('pages/classroom-page/classroom-page.component.ts');

describe('Classroom page', () => {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;

  var AlertsService = null;
  var ClassroomBackendApiService = null;
  var LoaderService = null;
  var PageTitleService = null;
  var UrlService = null;

  var loadingMessage = null;
  var subscriptions = [];
  var testSubscriptions = null;

  const translationInitializedSpy = jasmine.createSpy('topicInitialized');
  var classroomData = {};

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    AlertsService = $injector.get('AlertsService');
    ClassroomBackendApiService = $injector.get('ClassroomBackendApiService');
    LoaderService = $injector.get('LoaderService');
    PageTitleService = $injector.get('PageTitleService');
    UrlService = $injector.get('UrlService');

    subscriptions.push(LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ));

    ctrl = $componentController('classroomPage', {
      $rootScope: $rootScope
    });

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property classroomBackendApiService does not have access type get'
    // or 'Property classroomBackendApiService does not have access type set'
    // error.
    Object.defineProperty(ctrl, 'classroomBackendApiService', {
      get: () => undefined,
      set: () => {}
    });
    Object.defineProperty(ctrl, 'pageTitleService', {
      get: () => undefined,
      set: () => {}
    });
  }));

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      ClassroomBackendApiService.onInitializeTranslation.subscribe(
        translationInitializedSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  afterEach(function() {
    for (let subscription of subscriptions) {
      subscription.unsubscribe();
    }
  });

  it('should get static image url', function() {
    var imagePath = '/path/to/image.png';
    expect(ctrl.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
  });

  describe('when fetching dashboard data successfully', function() {
    beforeEach(function() {
      spyOnProperty(ctrl, 'classroomBackendApiService').and.returnValue(
        ClassroomBackendApiService);
      classroomData = ClassroomData.createFromBackendData(
        'Math', [], 'Course details', 'Topics covered'
      );
      spyOn(
        ClassroomBackendApiService,
        'fetchClassroomDataAsync').and.returnValue($q.resolve(classroomData));
      spyOnProperty(ctrl, 'pageTitleService').and.returnValue(PageTitleService);
      spyOn(PageTitleService, 'setPageTitle').and.callThrough();
      spyOn(UrlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
        'mock');
    });

    it('should evaluate data get from backend, set page title and init' +
      ' translation', function() {
      ctrl.$onInit();
      expect(loadingMessage).toBe('Loading');

      $rootScope.$apply();

      expect(loadingMessage).toBe('');
      expect(ctrl.bannerImageFileUrl).toBe('/assets/images/splash/books.svg');
      expect(ctrl.classroomDisplayName).toBe('Math');

      expect(PageTitleService.setPageTitle).toHaveBeenCalledWith(
        'Learn Math with Oppia | Oppia');

      expect(translationInitializedSpy).toHaveBeenCalled();
      expect(ctrl.classroomData.getName()).toEqual('Math');
    });
  });

  describe('when fetching dashboard data fails', function() {
    beforeEach(function() {
      spyOnProperty(ctrl, 'classroomBackendApiService').and.returnValue(
        ClassroomBackendApiService);
      spyOn(
        ClassroomBackendApiService,
        'fetchClassroomDataAsync').and.returnValue(
        $q.reject({
          status: 404
        }));
      spyOn(AlertsService, 'addWarning').and.callThrough();
      spyOn(UrlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
        'mock');
    });

    it('should use reject handler', function() {
      ctrl.$onInit();
      expect(loadingMessage).toBe('Loading');

      $rootScope.$apply();

      expect(loadingMessage).toBe('Loading');
      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get dashboard data');
      expect(ctrl.classroomData).toBeUndefined();
    });
  });
});
