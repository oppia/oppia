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
 * @fileoverview Unit tests for the component of the library page.
 */


import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { PageTitleService } from 'services/page-title.service';
import { of } from 'rxjs';
import { ClassroomBackendApiService } from
  'domain/classroom/classroom-backend-api.service';
import { UserService } from 'services/user.service';
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';


describe('Library controller', function() {
  var ctrl = null;
  var $flushPendingTasks = null;
  var $httpBackend = null;
  var $log = null;
  var $q = null;
  var $scope = null;
  var classroomBackendApiService = null;
  var csrfTokenService = null;
  var i18nLanguageCodeService = null;
  var userService = null;

  var logErrorSpy = null;
  var mockWindow = null;
  importAllAngularServices();

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });
  beforeEach(function() {
    classroomBackendApiService = TestBed.get(ClassroomBackendApiService);
    i18nLanguageCodeService = TestBed.get(I18nLanguageCodeService);
    OppiaAngularRootComponent.pageTitleService = (
      TestBed.get(PageTitleService)
    );
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'KeyboardShortcutService', TestBed.get(KeyboardShortcutService));
    $provide.value(
      'UserService', TestBed.get(UserService));
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowDimensionsService', {
      getWidth: () => 768,
      getResizeEvent: () => of(new Event('resize'))
    });
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  describe('when window location pathname is invalid', function() {
    beforeEach(angular.mock.module('oppia', function($provide) {
      mockWindow = {
        location: {
          pathname: '/invalid',
          href: ''
        }
      };
      $provide.value('$window', mockWindow);
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      $httpBackend = $injector.get('$httpBackend');
      $log = $injector.get('$log');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      csrfTokenService = $injector.get('CsrfTokenService');
      userService = $injector.get('UserService');

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      logErrorSpy = spyOn($log, 'error');
      spyOn(OppiaAngularRootComponent.pageTitleService, 'setPageTitle');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        $q.resolve({
          isLoggedIn: () => true
        }));

      $httpBackend.expectGET('/libraryindexhandler').respond({
        activity_summary_dicts_by_category: [{
          activity_summary_dicts: [{
            activity_type: 'exploration',
            id: 'exp1',
            title: 'Exploration Summary'
          }, {
            activity_type: 'collection',
            id: 'col1',
            title: 'Collection Summary'
          }, {
            activity_type: 'invalid',
            id: '3',
            title: 'Invalid Summary'
          }, {
            activity_type: 'exploration',
            id: 'exp4',
            title: 'Exploration Summary'
          }]
        }]
      });
      $httpBackend.expectGET('/creatordashboardhandler/data').respond({
        explorations_list: [{id: 'exp2'}, {id: 'exp3'}],
        collections_list: [{id: 'col2'}, {id: 'col3'}]
      });

      $scope = $rootScope.$new();
      ctrl = $componentController('libraryPage', {
        $scope: $scope,
        I18nLanguageCodeService: i18nLanguageCodeService
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
      spyOnProperty(ctrl, 'classroomBackendApiService').and.returnValue(
        classroomBackendApiService);
      spyOn(
        classroomBackendApiService,
        'fetchClassroomPromosAreEnabledStatusAsync').and.returnValue(
        $q.resolve(true));
      ctrl.$onInit();
      $scope.$apply();
      $httpBackend.flush(2);
    }));

    it('should initialize controller properties after its initialization',
      function() {
        expect(['banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'])
          .toContain(ctrl.bannerImageFilename);
        expect(ctrl.bannerImageFileUrl).toBe(
          '/assets/images/library/' + ctrl.bannerImageFilename);
        expect(ctrl.CLASSROOM_PROMOS_ARE_ENABLED).toBe(true);
        expect(logErrorSpy.calls.allArgs()).toContain(
          ['INVALID URL PATH: /invalid']);
        expect(
          OppiaAngularRootComponent.pageTitleService.setPageTitle
        ).toHaveBeenCalledWith('Community Library Lessons | Oppia');
        expect(ctrl.activitiesOwned).toEqual({
          explorations: {
            exp1: false,
            exp2: true,
            exp3: true,
            exp4: false
          },
          collections: {
            col1: false,
            col2: true,
            col3: true,
          }});
        expect(ctrl.tileDisplayCount).toBe(0);
      });

    it('should set active group index', function() {
      expect(ctrl.activeGroupIndex).toBe(null);

      ctrl.setActiveGroup(1);
      expect(ctrl.activeGroupIndex).toBe(1);

      ctrl.clearActiveGroup();
      expect(ctrl.activeGroupIndex).toBe(null);
    });

    it('should change left most card index carousel after carousel is' +
      ' initialized', function() {
      var windowMock = $(window);
      windowMock.width(1200);
      var libraryCarouselMock = $(document.createElement('div'));
      var carouselMock = $(document.createElement('div'));
      spyOn(carouselMock, 'scrollLeft').and.returnValue(100);

      var jQuerySpy = spyOn(window, '$');
      jQuerySpy
        .withArgs(window).and.returnValue(windowMock)
        .withArgs('.oppia-library-carousel').and
        .returnValue(libraryCarouselMock);
      jQuerySpy.withArgs('.oppia-library-carousel-tiles:eq(0)').and
        .returnValue(carouselMock);
      jQuerySpy.and.callThrough();

      // Init carousels.
      $flushPendingTasks();

      expect(ctrl.tileDisplayCount).toBe(2);
      expect(libraryCarouselMock.css('width')).toBe('416px');
      expect(ctrl.leftmostCardIndices).toEqual([1]);

      ctrl.incrementLeftmostCardIndex(0);
      expect(ctrl.leftmostCardIndices).toEqual([2]);
      ctrl.decrementLeftmostCardIndex(0);
      expect(ctrl.leftmostCardIndices).toEqual([1]);
    });

    it('should change page view when resizing window', function() {
      window.dispatchEvent(new Event('resize'));

      expect(ctrl.libraryWindowIsNarrow).toBe(false);
    });

    it('should log an error when exploration summary tile element width' +
      ' is different from 208 pixels', function() {
      var divMock = $(document.createElement('div'));
      divMock.width(100);

      var jQuerySpy = spyOn(window, '$');
      jQuerySpy.withArgs('exploration-summary-tile').and.returnValue(
        divMock);
      jQuerySpy.and.callThrough();
      $flushPendingTasks();

      expect($log.error).toHaveBeenCalledWith(
        'The actual width of tile is different than the ' +
        'expected width. Actual size: 100, Expected size: 208');
    });

    it('should search for content by category when no url is provided',
      function() {
        ctrl.showFullResultsPage(['Algebra', 'Math']);

        expect(mockWindow.location.href).toBe(
          '/search/find?q=&category=("Algebra" OR "Math")');
      });

    it('should search for content by url', function() {
      ctrl.showFullResultsPage([], '/search/find?q=all');

      expect(mockWindow.location.href).toBe(
        '/search/find?q=all');
    });

    it('should not scroll carousel when it is already being scrolled',
      function() {
        var cssValue = null;
        var windowMock = $(window);
        windowMock.width(1200);
        var libraryCarouselMock = $(document.createElement('div'));
        var carouselMock = $(document.createElement('div'));
        spyOn(carouselMock, 'scrollLeft').and.returnValue(100);
        var animateSpy = spyOn(carouselMock, 'animate').and.callFake(
          // This throws an error of argument type. We need to suppress this
          // error because animate expect to receive properties with different
          // names from css and animationSettings.
          // @ts-expect-error
          (css, animationSettings) => {
            cssValue = css;
            animationSettings.start();
          });

        var jQuerySpy = spyOn(window, '$');
        jQuerySpy.withArgs(window).and.returnValue(windowMock);
        jQuerySpy.withArgs('.oppia-library-carousel').and
          .returnValue(libraryCarouselMock);
        jQuerySpy.withArgs('.oppia-library-carousel-tiles:eq(0)').and
          .returnValue(carouselMock);
        jQuerySpy.and.callThrough();

        // Init carousels.
        $flushPendingTasks();

        ctrl.scroll(0, true);
        expect(animateSpy).toHaveBeenCalled();
        expect(cssValue.scrollLeft).toBe(-316);

        animateSpy.calls.reset();
        ctrl.scroll(0, false);
        expect(cssValue.scrollLeft).toBe(-316);

        expect(animateSpy).not.toHaveBeenCalled();
      });

    it('should scroll carousel again when it already finished scrolling',
      function() {
        var cssValue = null;
        var windowMock = $(window);
        windowMock.width(1200);
        var libraryCarouselMock = $(document.createElement('div'));
        var carouselMock = $(document.createElement('div'));
        spyOn(carouselMock, 'scrollLeft').and.returnValue(100);
        var animateSpy = spyOn(carouselMock, 'animate').and.callFake(
          // This throws an error of argument type. We need to suppress this
          // error because animate expect to receive properties with different
          // names from css and animationSettings.
          // @ts-expect-error
          (css, animationSettings) => {
            cssValue = css;
            animationSettings.start();
            animationSettings.complete();
          });

        var jQuerySpy = spyOn(window, '$');
        jQuerySpy.withArgs(window).and.returnValue(windowMock);
        jQuerySpy.withArgs('.oppia-library-carousel').and
          .returnValue(libraryCarouselMock);
        jQuerySpy.withArgs('.oppia-library-carousel-tiles:eq(0)').and
          .returnValue(carouselMock);
        jQuerySpy.and.callThrough();

        // Init carousels.
        $flushPendingTasks();

        ctrl.scroll(0, true);
        expect(cssValue.scrollLeft).toBe(-316);
        ctrl.scroll(0, false);
        expect(cssValue.scrollLeft).toBe(516);

        expect(animateSpy).toHaveBeenCalledTimes(2);
      });
  });

  describe('when window location pathname is invalid and user is not' +
    ' logged in on the platform', function() {
    beforeEach(angular.mock.module('oppia', function($provide) {
      mockWindow = {
        location: {
          pathname: '/invalid'
        }
      };
      $provide.value('$window', mockWindow);
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      $httpBackend = $injector.get('$httpBackend');
      $log = $injector.get('$log');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      csrfTokenService = $injector.get('CsrfTokenService');
      userService = $injector.get('UserService');

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      logErrorSpy = spyOn($log, 'error');
      spyOn(OppiaAngularRootComponent.pageTitleService, 'setPageTitle');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        $q.resolve({
          isLoggedIn: () => false
        }));

      $httpBackend.expectGET('/libraryindexhandler').respond({
        activity_summary_dicts_by_category: [{
          activity_summary_dicts: [{
            activity_type: 'exploration',
            id: '1',
            title: 'Exploration Summary'
          }]
        }]
      });

      $scope = $rootScope.$new();
      ctrl = $componentController('libraryPage', {
        $scope: $scope,
        I18nLanguageCodeService: i18nLanguageCodeService
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
      spyOnProperty(ctrl, 'classroomBackendApiService').and.returnValue(
        classroomBackendApiService);
      spyOn(
        classroomBackendApiService,
        'fetchClassroomPromosAreEnabledStatusAsync').and.returnValue(
        $q.resolve(true));
      ctrl.$onInit();
      $scope.$apply();
      $httpBackend.flush();
    }));

    it('should initialize controller properties after its initialization',
      function() {
        expect(['banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'])
          .toContain(ctrl.bannerImageFilename);
        expect(ctrl.bannerImageFileUrl).toBe(
          '/assets/images/library/' + ctrl.bannerImageFilename);
        expect(ctrl.CLASSROOM_PROMOS_ARE_ENABLED).toBe(true);
        expect(logErrorSpy.calls.allArgs()).toContain(
          ['INVALID URL PATH: /invalid']);
        expect(
          OppiaAngularRootComponent.pageTitleService.setPageTitle
        ).toHaveBeenCalledWith('Community Library Lessons | Oppia');
        expect(ctrl.activitiesOwned).toEqual({
          explorations: {},
          collections: {}
        });
        expect(ctrl.tileDisplayCount).toBe(0);
      });

    it('should not scroll carousel where there are more carousel pixed' +
      ' widhts than tile widths', function() {
      var windowMock = $(window);
      windowMock.width(1200);
      var libraryCarouselMock = $(document.createElement('div'));
      var carouselMock = $(document.createElement('div'));
      spyOn(carouselMock, 'animate');

      var jQuerySpy = spyOn(window, '$');
      jQuerySpy.withArgs(window).and.returnValue(windowMock);
      jQuerySpy.withArgs('.oppia-library-carousel').and
        .returnValue(libraryCarouselMock);
      jQuerySpy.withArgs('.oppia-library-carousel-tiles:eq(0)').and
        .returnValue(carouselMock);
      jQuerySpy.and.callThrough();

      // Init carousels.
      $flushPendingTasks();

      expect(ctrl.tileDisplayCount).toBe(2);

      ctrl.scroll(0, true);

      expect(carouselMock.animate).not.toHaveBeenCalled();
    });
  });

  describe('when window location pathname is group mode', function() {
    beforeEach(angular.mock.module('oppia', function($provide) {
      mockWindow = {
        location: {
          pathname: '/community-library/top-rated'
        }
      };
      $provide.value('$window', mockWindow);
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      csrfTokenService = $injector.get('CsrfTokenService');
      userService = $injector.get('UserService');
      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      spyOn(OppiaAngularRootComponent.pageTitleService, 'setPageTitle');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        $q.resolve({
          isLoggedIn: () => true
        }));

      $httpBackend.expectGET('/librarygrouphandler?group_name=top-rated')
        .respond({
          activity_list: [],
          header_i18n_id: '',
          preferred_language_codes: ['en']
        });

      $scope = $rootScope.$new();
      ctrl = $componentController('libraryPage', {
        $scope: $scope,
        I18nLanguageCodeService: i18nLanguageCodeService
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
      spyOnProperty(ctrl, 'classroomBackendApiService').and.returnValue(
        classroomBackendApiService);
      spyOn(
        classroomBackendApiService,
        'fetchClassroomPromosAreEnabledStatusAsync').and.returnValue(
        $q.resolve(true));
      ctrl.$onInit();
      $scope.$apply();
      $httpBackend.flush();
    }));

    it('should initialize controller properties after its initialization',
      function() {
        expect(['banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'])
          .toContain(ctrl.bannerImageFilename);
        expect(ctrl.bannerImageFileUrl).toBe(
          '/assets/images/library/' + ctrl.bannerImageFilename);
        expect(ctrl.CLASSROOM_PROMOS_ARE_ENABLED).toBe(true);
        expect(
          OppiaAngularRootComponent.pageTitleService.setPageTitle
        ).toHaveBeenCalledWith('Find explorations to learn from - Oppia');
        expect(ctrl.activitiesOwned).toBe(undefined);
        expect(ctrl.activityList).toEqual([]);
        expect(ctrl.groupHeaderI18nId).toEqual('');
        expect(ctrl.tileDisplayCount).toBe(0);
      });

    it(
      'should get complete image path corresponding to a given relative path',
      function() {
        var imagePath = '/path/to/image.png';
        expect(
          ctrl.getStaticImageUrl(imagePath)
        ).toBe('/assets/images/path/to/image.png');
      }
    );
  });
});
