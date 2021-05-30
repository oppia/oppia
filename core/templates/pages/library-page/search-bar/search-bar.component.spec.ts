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
 * @fileoverview Unit tests for searchBar.
 */

import { TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';

import { ConstructTranslationIdsService } from
  'services/construct-translation-ids.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
import { NavigationService } from 'services/navigation.service';

var MockWindow = function() {
  this.location = {
    pathname: '',
    href: ''
  };
};

describe('Search bar component', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $location = null;
  var $scope = null;
  var $rootScope = null;
  var classroomBackendApiService = null;
  var constructTranslationIdsService = null;
  var i18nLanguageCodeService = null;
  var navigationService = null;
  var urlService = null;

  var initTranslationEmitter = new EventEmitter();
  var preferredLanguageCodesLoadedEmitter = new EventEmitter();
  var mockWindow = null;
  importAllAngularServices();

  beforeEach(function() {
    constructTranslationIdsService = TestBed.get(
      ConstructTranslationIdsService);
    i18nLanguageCodeService = TestBed.get(I18nLanguageCodeService);
    navigationService = TestBed.get(NavigationService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    mockWindow = new MockWindow();
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');
    classroomBackendApiService = $injector.get('ClassroomBackendApiService');
    urlService = $injector.get('UrlService');

    $scope = $rootScope.$new();
    ctrl = $componentController('searchBar', {
      $location: $location,
      $rootScope: $rootScope,
      $scope: $scope,
      ConstructTranslationIdsService: constructTranslationIdsService,
      I18nLanguageCodeService: i18nLanguageCodeService,
      NavigationService: navigationService
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
    spyOnProperty(
      classroomBackendApiService,
      'onInitializeTranslation').and.returnValue(initTranslationEmitter);
    spyOnProperty(
      i18nLanguageCodeService,
      'onPreferredLanguageCodesLoaded').and.returnValue(
      preferredLanguageCodesLoadedEmitter);
    ctrl.$onInit();
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  it('should initialize controller properties after its initialization',
    function() {
      expect(Object.keys(ctrl.selectionDetails)).toContain('categories');
      expect(Object.keys(ctrl.selectionDetails)).toContain('languageCodes');

      expect(ctrl.translationData).toEqual({
        categoriesCount: 0,
        languagesCount: 0
      });
    });

  it('should get placeholder and button text translation when translation' +
    ' is initialized', function() {
    initTranslationEmitter.emit();

    expect(ctrl.searchBarPlaceholder).toBe('I18N_LIBRARY_SEARCH_PLACEHOLDER');
    expect(ctrl.categoryButtonText).toBe('I18N_LIBRARY_ALL_CATEGORIES');
    expect(ctrl.languageButtonText).toBe('I18N_LIBRARY_ALL_LANGUAGES');
  });

  it('should search for all content in given languages', function() {
    expect(ctrl.isSearchInProgress()).toBe(false);

    mockWindow.location.pathname = '/search/find';
    preferredLanguageCodesLoadedEmitter.emit(['en', 'es', 'hi']);
    expect(ctrl.isSearchInProgress()).toBe(true);

    expect(ctrl.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });
    expect($location.url()).toBe(
      '/find?q=&language_code=(%22en%22%20OR%20%22es%22%20OR%20%22hi%22)');

    preferredLanguageCodesLoadedEmitter.emit(['en']);

    expect(ctrl.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 2
    });
    expect($location.url()).toBe(
      '/find?q=&language_code=(%22es%22%20OR%20%22hi%22)');
  });

  it('should filter and search content by categories, language and text when' +
    'changing language code', function() {
    var getUrlParamsSpy = spyOn(urlService, 'getUrlParams');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22mars%22&' +
      'category=("astronomy")&language_code=("pt")').respond({});
    getUrlParamsSpy.and.returnValue({q: 'mars'});
    mockWindow.location.pathname = '/search/find';
    mockWindow.location.search = (
      '?q=%22mars%22&language_code=(%22pt%22)&category=(%22astronomy%22)');
    preferredLanguageCodesLoadedEmitter.emit([]);

    expect($location.url()).toBe(
      '/find?q=%22mars%22&category=(%22astronomy%22)&' +
      'language_code=(%22pt%22)');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22sun%22&category=("astronomy")&' +
      'language_code=("es")').respond({});
    mockWindow.location.pathname = '';
    mockWindow.location.search = (
      '?q=%22sun%22&language_code=(%22es%22)&category=(%22astronomy%22)');
    getUrlParamsSpy.and.returnValue({q: 'sun'});
    preferredLanguageCodesLoadedEmitter.emit([]);
    $scope.$digest();

    expect(mockWindow.location.href).toBe(
      '/search/find?q=%22sun%22&category=("astronomy")&language_code=("es")');
  });

  it('should filter and search content by categories, language and text' +
    ' when url location changes', function() {
    var getUrlParamsSpy = spyOn(urlService, 'getUrlParams');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22mars%22&' +
      'category=("astronomy")&language_code=("pt")').respond({});
    getUrlParamsSpy.and.returnValue({q: 'mars'});
    mockWindow.location.pathname = '/search/find';
    mockWindow.location.search = (
      '?q=%22mars%22&language_code=(%22pt%22)&category=(%22astronomy%22)');
    preferredLanguageCodesLoadedEmitter.emit([]);

    expect($location.url()).toBe(
      '/find?q=%22mars%22&category=(%22astronomy%22)&' +
        'language_code=(%22pt%22)');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22sun%22&category=("astronomy")&' +
      'language_code=("es")').respond({});
    mockWindow.location.pathname = '';
    mockWindow.location.search = (
      '?q=%22sun%22&language_code=(%22es%22)&category=(%22astronomy%22)');
    getUrlParamsSpy.and.returnValue({q: 'sun'});
    $rootScope.$broadcast('$locationChangeSuccess');
    $scope.$digest();

    expect(mockWindow.location.href).toBe(
      '/search/find?q=%22sun%22&category=("astronomy")&language_code=("es")');
  });

  it('should toggle select languages when searching content', function() {
    preferredLanguageCodesLoadedEmitter.emit(['en', 'es', 'hi']);

    expect(ctrl.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });

    ctrl.toggleSelection('languageCodes', 'en');

    expect(ctrl.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 2
    });

    ctrl.toggleSelection('languageCodes', 'pt');

    expect(ctrl.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });
  });

  it('should deselect all selected languages at once', function() {
    preferredLanguageCodesLoadedEmitter.emit(['en', 'es', 'hi']);

    expect(ctrl.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });

    ctrl.deselectAll('languageCodes');

    expect(ctrl.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 0
    });
  });

  it('should open submenu and key down an action when clicking on language or' +
    ' category button', function() {
    spyOn(navigationService, 'onMenuKeypress');
    var event = new Event('click');
    ctrl.openSubmenu(event, 'menuName');
    ctrl.onMenuKeypress(event, 'menuName', {enter: 'open'});

    expect(navigationService.onMenuKeypress)
      .toHaveBeenCalledWith(event, 'menuName', {enter: 'open'});
    expect(ctrl.activeMenuName).toBe('menuName');
  });
});
