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
 * @fileoverview Unit tests for translatorOverview.
 */

import { EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

var MockWindow = function() {
  var language = 'en';
  this.localStorage = {
    getItem: () => language,
    setItem: (_, lang) => {
      language = lang;
    }
  };
};

describe('Translator Overview component', function() {
  var ctrl = null;
  var $rootScope = null;
  var $scope = null;
  var explorationLanguageCodeService = null;
  var languageUtilService = null;
  let contextService = null;
  var stateEditorService = null;
  var translationLanguageService = null;
  var translationStatusService = null;
  var translationTabActiveModeService = null;
  var explorationLanguageCode = 'hi';
  var focusManagerService = null;
  var routerService = null;

  var mockWindow = null;
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  importAllAngularServices();

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    languageUtilService = TestBed.get(LanguageUtilService);
    focusManagerService = TestBed.get(FocusManagerService);
    contextService = TestBed.get(ContextService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('LanguageUtilService', languageUtilService);
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
    $provide.value(
      'StateRecordedVoiceoversService',
      TestBed.get(StateRecordedVoiceoversService));
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value(
      'StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
    mockWindow = new MockWindow();
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    explorationLanguageCodeService = $injector.get(
      'ExplorationLanguageCodeService');
    stateEditorService = $injector.get('StateEditorService');
    translationLanguageService = $injector.get('TranslationLanguageService');
    translationStatusService = $injector.get('TranslationStatusService');
    translationTabActiveModeService = $injector.get(
      'TranslationTabActiveModeService');
    focusManagerService = $injector.get('FocusManagerService');
    routerService = $injector.get('RouterService');

    spyOn(translationTabActiveModeService, 'isTranslationModeActive').and
      .returnValue(true);
    spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
      .returnValue(true);

    explorationLanguageCodeService.init(explorationLanguageCode);

    $scope = $rootScope.$new();
    ctrl = $componentController('translatorOverview', {
      $rootScope: $rootScope,
      $scope: $scope,
      LanguageUtilService: languageUtilService
    }, {
      isTranslationTabBusy: false
    });
    ctrl.$onInit();
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.languageCode).toBe('en');
      expect($scope.inTranslationMode).toBe(true);
      expect($scope.inVoiceoverMode).toBe(true);
      expect($scope.languageCodesAndDescriptions.length).toBe(
        languageUtilService.getAllVoiceoverLanguageCodes().length - 1);
      expect(languageUtilService.getAllVoiceoverLanguageCodes()).toContain(
        explorationLanguageCode);
      expect($scope.languageCodesAndDescriptions).not.toContain({
        id: explorationLanguageCode,
        description: languageUtilService.getAudioLanguageDescription(
          explorationLanguageCode)
      });
    });

  it('should show tab mode switcher when language code is different' +
    ' from exploration\'s language code', function() {
    spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
    expect($scope.canShowTabModeSwitcher()).toBe(true);
  });

  it('should change to voiceover active mode when changing translation tab',
    function() {
      spyOn(translationTabActiveModeService, 'activateVoiceoverMode');
      $scope.changeActiveMode('Voiceover');

      expect(translationTabActiveModeService.activateVoiceoverMode)
        .toHaveBeenCalled();
    });

  it('should change to translation active mode when changing translation tab',
    function() {
      spyOn(translationTabActiveModeService, 'activateTranslationMode');
      $scope.changeActiveMode('Translate');

      expect(translationTabActiveModeService.activateTranslationMode)
        .toHaveBeenCalled();
    });

  it('should change translation language when translation tab is not busy',
    function() {
      spyOn(translationLanguageService, 'setActiveLanguageCode');
      $scope.languageCode = 'es';
      $scope.changeTranslationLanguage();
      expect(translationLanguageService.setActiveLanguageCode)
        .toHaveBeenCalled();
      expect(mockWindow.localStorage.getItem()).toBe('es');
    });

  it('should not change translation language when translation tab is busy',
    function() {
      ctrl.isTranslationTabBusy = true;
      var showTranslationTabBusyModalEmitter = new EventEmitter();
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOnProperty(stateEditorService, 'onShowTranslationTabBusyModal').and
        .returnValue(showTranslationTabBusyModalEmitter);
      $scope.changeTranslationLanguage();

      expect($scope.languageCode).toBe('en');
      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();

      // Reset value for isTranslationTabBusy.
      ctrl.isTranslationTabBusy = false;
    });

  it('should get translation bar progress data when there are more' +
    ' than 1 item to be translated', function() {
    spyOn(translationStatusService, 'getExplorationContentRequiredCount').and
      .returnValue(3);
    spyOn(translationStatusService, 'getExplorationContentNotAvailableCount')
      .and.returnValue(1);
    $scope.getTranslationProgressStyle();
    expect($scope.getTranslationProgressAriaLabel()).toBe(
      '2 items translated out of 3 items');
  });

  it('should get translation bar progress data when there is 1 item to be' +
    ' translated', function() {
    spyOn(translationStatusService, 'getExplorationContentRequiredCount')
      .and.returnValue(2);
    spyOn(translationStatusService, 'getExplorationContentNotAvailableCount')
      .and.returnValue(1);
    $scope.getTranslationProgressStyle();
    expect($scope.getTranslationProgressAriaLabel()).toBe(
      '1 item translated out of 2 items');
  });

  it('should apply autofocus to history tab element when tab is switched',
    function() {
      spyOn(routerService, 'getActiveTabName').and.returnValue('translation');
      spyOn(focusManagerService, 'setFocus');
      ctrl.$onInit();
      expect(focusManagerService.setFocus).toHaveBeenCalledWith(
        'audioTranslationLanguageCodeField');
    });
});
