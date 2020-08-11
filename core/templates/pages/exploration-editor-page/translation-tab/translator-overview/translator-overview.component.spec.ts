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

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';

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
  var translationLanguageService = null;
  var translationStatusService = null;
  var translationTabActiveModeService = null;

  var mockWindow = null;

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    languageUtilService = TestBed.get(LanguageUtilService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('LanguageUtilService', languageUtilService);
    $provide.value('StateRecordedVoiceoversService',
      TestBed.get(StateRecordedVoiceoversService));
    $provide.value('StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
    mockWindow = new MockWindow();
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    explorationLanguageCodeService = $injector.get(
      'ExplorationLanguageCodeService');
    translationLanguageService = $injector.get('TranslationLanguageService');
    translationStatusService = $injector.get('TranslationStatusService');
    translationTabActiveModeService = $injector.get(
      'TranslationTabActiveModeService');

    spyOn(translationTabActiveModeService, 'isTranslationModeActive').and
      .returnValue(true);
    spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
      .returnValue(true);

    explorationLanguageCodeService.init('hi');

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
      expect($scope.languageCodesAndDescriptions.length).toBe(45);
    });

  it('should show tab mode switcher when language code is different' +
    ' from exploration\'s language code ', function() {
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
      spyOn($rootScope, '$broadcast');
      $scope.changeTranslationLanguage();

      expect($scope.languageCode).toBe('en');
      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'showTranslationTabBusyModal');

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
});
