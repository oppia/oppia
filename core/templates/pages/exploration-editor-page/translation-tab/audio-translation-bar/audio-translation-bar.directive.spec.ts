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
 * @fileoverview Unit tests for Audio Translation Bar directive.
 */

import { TestBed } from '@angular/core/testing';
import { AnswerGroupsCacheService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { IdGenerationService } from 'services/id-generation.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { EditabilityService } from 'services/editability.service';
import { AlertsService } from 'services/alerts.service';

import WaveSurfer from 'wavesurfer.js';
import $ from 'jquery';

require('pages/exploration-editor-page/translation-tab/audio-translation-bar/' +
  'audio-translation-bar.directive.ts');

describe('State Graph Visualization directive', function() {
  var ctrl = null;
  var $interval = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var alertsService = null;
  var assetsBackendApiService = null;
  var audioPlayerService = null;
  var contextService = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var recordedVoiceoversObjectFactory = null;
  var siteAnalyticsService = null;
  var stateEditorService = null;
  var stateRecordedVoiceoversService = null;
  var translationLanguageService = null;
  var translationTabActiveContentIdService = null;
  var userExplorationPermissionsService = null;
  var userService = null;
  var voiceoverRecordingService = null;

  var stateName = 'State1';
  var explorationId = 'exp1';
  var isTranslatableSpy = null;

  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(function() {
    alertsService = TestBed.get(AlertsService);
    editabilityService = TestBed.get(EditabilityService);
    recordedVoiceoversObjectFactory = TestBed.get(
      RecordedVoiceoversObjectFactory);
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
    stateRecordedVoiceoversService = TestBed.get(
      StateRecordedVoiceoversService);
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'AnswerGroupsCacheService', TestBed.get(AnswerGroupsCacheService));
    $provide.value('IdGenerationService', TestBed.get(IdGenerationService));
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value('SiteAnalyticsService', TestBed.get(SiteAnalyticsService));
    $provide.value('StateEditorService', TestBed.get(StateEditorService));
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.get(StateCustomizationArgsService));
    $provide.value('StateInteractionIdService',
      TestBed.get(StateInteractionIdService));
    $provide.value('StateRecordedVoiceoversService',
      stateRecordedVoiceoversService);
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value('StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $interval = $injector.get('$interval');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    assetsBackendApiService = $injector.get('AssetsBackendApiService');
    audioPlayerService = $injector.get('AudioPlayerService');
    contextService = $injector.get('ContextService');
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    explorationStatesService = $injector.get('ExplorationStatesService');
    stateEditorService = $injector.get('StateEditorService');
    translationLanguageService = $injector.get('TranslationLanguageService');
    translationTabActiveContentIdService = $injector.get(
      'TranslationTabActiveContentIdService');
    voiceoverRecordingService = $injector.get('VoiceoverRecordingService');

    isTranslatableSpy = spyOn(editabilityService, 'isTranslatable');
    isTranslatableSpy.and.returnValue(false);
    spyOn(translationLanguageService, 'getActiveLanguageCode').and
      .returnValue('en');
    spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
      .returnValue('content');
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      stateName);
    // This method is being mocked because this spec only handles with
    // recordedvoiceovers and not all the exploration.
    spyOn(explorationStatesService, 'saveRecordedVoiceovers').and
      .callFake(function() {});

    stateRecordedVoiceoversService.init(stateName,
      recordedVoiceoversObjectFactory.createFromBackendDict({
        voiceovers_mapping: {
          content: {
            en: {
              duration_secs: 0,
              filename: '',
              file_size_bytes: 0,
              needs_update: false
            }
          }
        }
      }));

    var directive = $injector.get('audioTranslationBarDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      AlertsService: alertsService,
      StateRecordedVoiceoversService: stateRecordedVoiceoversService
    });
    ctrl.$onInit();
    $scope.getVoiceoverRecorder();
  }));

  afterEach(function() {
    $rootScope.$broadcast('$destroy');
  });

  it('should evaluate $scope properties after audio bar initialization',
    function() {
      expect($scope.languageCode).toBe('en');
      expect($scope.contentId).toBe('content');
    });

  it('should not check and start recording when user deny access',
    function() {
      spyOn(voiceoverRecordingService, 'status').and.returnValue({
        isAvailable: true
      });
      spyOn(voiceoverRecordingService, 'startRecording').and.returnValue(
        $q.reject());

      $scope.checkAndStartRecording();
      $scope.$apply();

      expect($scope.unsupportedBrowser).toBe(false);
      expect($scope.recordingPermissionDenied).toBe(true);
      expect($scope.cannotRecord).toBe(true);
    });

  it('should not check and start recording when voiceover recorder is' +
    ' not available', function() {
    spyOn(voiceoverRecordingService, 'status').and.returnValue({
      isAvailable: false
    });
    $scope.checkAndStartRecording();

    expect($scope.unsupportedBrowser).toBe(true);
    expect($scope.cannotRecord).toBe(true);
  });

  it('should stop recording when reaching recording time limit', function() {
    spyOn(voiceoverRecordingService, 'status').and.returnValue({
      isAvailable: true
    });
    spyOn(voiceoverRecordingService, 'startRecording').and.returnValue(
      $q.resolve());
    spyOn($scope.voiceoverRecorder, 'getMp3Data').and.returnValue(
      $q.resolve([]));

    $scope.checkAndStartRecording();
    $scope.$apply();

    $scope.elapsedTime = 298;
    $interval.flush(1000);

    expect($scope.recordingComplete).toBe(true);
    expect($scope.unsupportedBrowser).toBe(false);
    expect($scope.showRecorderWarning).toBe(true);
    expect($scope.recordingPermissionDenied).toBe(false);
    expect($scope.cannotRecord).toBe(false);
    expect($scope.selectedRecording).toBe(true);

    expect($scope.getTranslationTabBusyMessage()).toBe(
      'You haven\'t saved your recording. Please save or ' +
      'cancel the recording.');
  });

  it('should stop record when content id changes', function() {
    spyOn(voiceoverRecordingService, 'status').and.returnValue({
      isAvailable: true,
      isRecording: true
    });
    spyOn(voiceoverRecordingService, 'startRecording').and.returnValue(
      $q.resolve());
    spyOn(voiceoverRecordingService, 'stopRecord');
    spyOn(voiceoverRecordingService, 'closeRecorder');

    $scope.checkAndStartRecording();
    $scope.$apply();

    $rootScope.$broadcast('activeContentIdChanged');

    expect(voiceoverRecordingService.stopRecord).toHaveBeenCalled();
    expect(voiceoverRecordingService.closeRecorder).toHaveBeenCalled();

    expect($scope.getTranslationTabBusyMessage()).toBe(
      'You haven\'t finished recording. Please stop ' +
      'recording and either save or cancel the recording.');
  });

  it('should stop record when language changes', function() {
    spyOn(voiceoverRecordingService, 'status').and.returnValue({
      isAvailable: true,
      isRecording: true
    });
    spyOn(voiceoverRecordingService, 'startRecording').and.returnValue(
      $q.resolve());
    spyOn(voiceoverRecordingService, 'stopRecord');
    spyOn(voiceoverRecordingService, 'closeRecorder');

    $scope.checkAndStartRecording();
    $scope.$apply();

    $rootScope.$broadcast('activeLanguageChanged');

    expect(voiceoverRecordingService.stopRecord).toHaveBeenCalled();
    expect(voiceoverRecordingService.closeRecorder).toHaveBeenCalled();
  });

  it('should stop record when externalSave flag is broadcasted', function() {
    spyOn(voiceoverRecordingService, 'status').and.returnValue({
      isAvailable: true,
      isRecording: true
    });
    spyOn(voiceoverRecordingService, 'startRecording').and.returnValue(
      $q.resolve());
    spyOn(voiceoverRecordingService, 'stopRecord');
    spyOn(voiceoverRecordingService, 'closeRecorder');
    spyOn(audioPlayerService, 'stop');
    spyOn(audioPlayerService, 'clear');

    $scope.checkAndStartRecording();
    $scope.$apply();

    $rootScope.$broadcast('externalSave');

    expect(voiceoverRecordingService.stopRecord).toHaveBeenCalled();
    expect(voiceoverRecordingService.closeRecorder).toHaveBeenCalled();
    expect(audioPlayerService.stop).toHaveBeenCalled();
    expect(audioPlayerService.clear).toHaveBeenCalled();
    expect($scope.audioBlob).toBe(null);
  });

  it('should toggle audio needs update', function() {
    spyOn(stateRecordedVoiceoversService.displayed,
      'toggleNeedsUpdateAttribute');

    $scope.toggleAudioNeedsUpdate();
    expect(
      stateRecordedVoiceoversService.displayed.toggleNeedsUpdateAttribute)
      .toHaveBeenCalled();
    expect($scope.audioNeedsUpdate).toBe(true);

    $scope.toggleAudioNeedsUpdate();
    expect(
      stateRecordedVoiceoversService.displayed.toggleNeedsUpdateAttribute)
      .toHaveBeenCalled();
    expect($scope.audioNeedsUpdate).toBe(false);
  });

  it('should play and pause unsaved audio when wave surfer calls on method' +
    ' callback', function() {
    spyOn($scope.voiceoverRecorder, 'getMp3Data').and.returnValue(
      $q.resolve([]));
    var waveSurferObjSpy = {
      load: () => {},
      on: (evt, callback) => {
        callback();
      },
      pause: () => {},
      play: () => {},
    };
    spyOn(waveSurferObjSpy, 'play');
    // This throws "Argument of type '{ load: () => void; ... }'
    // is not assignable to parameter of type 'WaveSurfer'."
    // This is because the actual 'WaveSurfer.create` function returns a
    // object with around 50 more properties than `waveSurferObjSpy`.
    // We are suppressing this error because we have defined the properties
    // we need for this test in 'waveSurferObjSpy' object.
    // @ts-expect-error
    spyOn(WaveSurfer, 'create').and.returnValue(waveSurferObjSpy);
    $scope.stopRecording();
    $scope.$apply();

    $scope.playAndPauseUnsavedAudio();
    expect($scope.unsavedAudioIsPlaying).toBe(false);
    expect(waveSurferObjSpy.play).toHaveBeenCalled();
  });

  it('should play and pause unsaved audio when wave surfer on method does' +
    ' not call the callbacl', function() {
    spyOn($scope.voiceoverRecorder, 'getMp3Data').and.returnValue(
      $q.resolve([]));
    var waveSurferObjSpy = {
      load: () => {},
      on: () => {},
      pause: () => {},
      play: () => {},
    };
    spyOn(waveSurferObjSpy, 'play');
    spyOn(waveSurferObjSpy, 'pause');
    // This throws "Argument of type '{ load: () => void; ... }'
    // is not assignable to parameter of type 'WaveSurfer'."
    // This is because the actual 'WaveSurfer.create` function returns a
    // object with around 50 more properties than `waveSurferObjSpy`.
    // We are suppressing this error because we have defined the properties
    // we need for this test in 'waveSurferObjSpy' object.
    // @ts-expect-error
    spyOn(WaveSurfer, 'create').and.returnValue(waveSurferObjSpy);
    $scope.stopRecording();
    $scope.$apply();

    $scope.playAndPauseUnsavedAudio();
    expect($scope.unsavedAudioIsPlaying).toBe(true);
    expect(waveSurferObjSpy.play).toHaveBeenCalled();

    $scope.playAndPauseUnsavedAudio();
    expect($scope.unsavedAudioIsPlaying).toBe(false);
    expect(waveSurferObjSpy.pause).toHaveBeenCalled();
  });

  it('should toggle start and stop recording on keyup event', function() {
    $scope.canVoiceover = true;
    $scope.isAudioAvailable = false;

    spyOn(siteAnalyticsService, 'registerStartAudioRecordingEvent');

    var keyEvent = new KeyboardEvent('keyup', { code: 'KeyR' });
    document.body.dispatchEvent(keyEvent);

    expect(siteAnalyticsService.registerStartAudioRecordingEvent)
      .toHaveBeenCalled();

    spyOn(voiceoverRecordingService, 'status').and.returnValue({
      isAvailable: true,
      isRecording: true
    });
    spyOn($scope.voiceoverRecorder, 'getMp3Data').and.returnValue(
      $q.resolve([]));

    document.body.dispatchEvent(keyEvent);

    expect($scope.recordingComplete).toBe(true);

    // Reset value to not affect other specs.
    $scope.canVoiceover = false;
  });

  it('should not toggle start and stop recording on keyup event', function() {
    $scope.canVoiceover = false;

    spyOn(siteAnalyticsService, 'registerStartAudioRecordingEvent');

    var keyEvent = new KeyboardEvent('keyup', { code: 'KeyR' });
    document.body.dispatchEvent(keyEvent);

    expect(siteAnalyticsService.registerStartAudioRecordingEvent)
      .not.toHaveBeenCalled();
  });

  it('should rerecord successfully', function() {
    $scope.reRecord();
    $scope.$apply();

    expect($scope.selectedRecording).toBe(false);
  });

  it('should cancel recording successfully', function() {
    $scope.cancelRecording();

    expect($scope.selectedRecording).toBe(false);
    expect($scope.audioIsUpdating).toBe(false);
    expect($scope.audioBlob).toBe(null);
    expect($scope.showRecorderWarning).toBe(false);
  });

  it('should save recorded audio successfully', function() {
    $scope.updateAudio();
    $scope.$apply();

    spyOn(siteAnalyticsService, 'registerSaveRecordedAudioEvent');
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(stateRecordedVoiceoversService.displayed, 'addVoiceover');
    spyOn(assetsBackendApiService, 'saveAudio').and.returnValue($q.resolve({
      duration_secs: 90
    }));
    $scope.saveRecordedAudio();

    expect(siteAnalyticsService.registerSaveRecordedAudioEvent)
      .toHaveBeenCalled();
    expect($scope.audioIsCurrentlyBeingSaved).toBe(true);
    $scope.$apply();

    expect(stateRecordedVoiceoversService.displayed.addVoiceover)
      .toHaveBeenCalled();
    expect($scope.durationSecs).toBe(90);
    expect($scope.audioIsCurrentlyBeingSaved).toBe(false);
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Succesfuly uploaded recorded audio.');
  });

  it('should use reject handler when saving recorded audio fails',
    function() {
      spyOn(siteAnalyticsService, 'registerSaveRecordedAudioEvent');
      spyOn(alertsService, 'addWarning');
      spyOn(assetsBackendApiService, 'saveAudio').and.returnValue($q.reject({
        error: 'It was not possible to save the recorded audio'
      }));
      $scope.saveRecordedAudio();

      expect(siteAnalyticsService.registerSaveRecordedAudioEvent)
        .toHaveBeenCalled();
      $scope.$apply();

      expect($scope.audioIsCurrentlyBeingSaved).toBe(false);
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'It was not possible to save the recorded audio');
    });

  it('should open translation tab busy modal with $uibModal',
    function() {
      spyOn($uibModal, 'open').and.callThrough();

      $scope.openTranslationTabBusyModal();

      expect($uibModal.open).toHaveBeenCalled();
    });

  it('should close translation tab busy modal with promise resolve',
    function() {
      spyOn($q, 'resolve').and.callThrough();
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      $rootScope.$broadcast('showTranslationTabBusyModal');
      $scope.$apply();

      expect($q.resolve).toHaveBeenCalled();
    });

  it('should dismiss translation tab busy modal with promise reject',
    function() {
      spyOn($q, 'reject').and.callThrough();
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });

      $rootScope.$broadcast('showTranslationTabBusyModal');
      $scope.$apply();

      expect($q.reject).toHaveBeenCalled();
    });

  it('should play a loaded audio translation', function() {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
    spyOn(audioPlayerService, 'play');

    expect($scope.isPlayingUploadedAudio()).toBe(false);
    $scope.playPauseUploadedAudioTranslation('en');

    expect($scope.audioTimerIsShown).toBe(true);
    expect(audioPlayerService.play).toHaveBeenCalled();
  });

  it('should play a not loaded audio translation', function() {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);
    spyOn(audioPlayerService, 'load').and.returnValue($q.resolve());
    spyOn(audioPlayerService, 'play');

    expect($scope.isPlayingUploadedAudio()).toBe(false);
    $scope.playPauseUploadedAudioTranslation('en');
    $scope.$apply();

    expect($scope.audioLoadingIndicatorIsShown).toBe(false);
    expect($scope.audioIsLoading).toBe(false);
    expect($scope.audioTimerIsShown).toBe(true);
    expect(audioPlayerService.play).toHaveBeenCalled();
  });

  it('should pause ongoing audio translation', function() {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    spyOn(audioPlayerService, 'pause');

    expect($scope.isPlayingUploadedAudio()).toBe(true);
    $scope.playPauseUploadedAudioTranslation('en');

    expect(audioPlayerService.pause).toHaveBeenCalled();
  });

  it('should get uploded audio timer', function() {
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
    spyOn(audioPlayerService, 'getCurrentTime').and.returnValue(100);
    spyOn(audioPlayerService, 'getAudioDuration').and.returnValue(200);

    expect($scope.getUploadedAudioTimer()).toBe('01:40 / 03:20');
    expect($scope.audioTimerIsShown).toBe(true);
  });

  it('should get empty uploded audio timer when track is not loaded',
    function() {
      spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);

      expect($scope.getUploadedAudioTimer()).toBe('--:-- / --:--');
      expect($scope.audioTimerIsShown).toBe(false);
    });

  it('should delete audio when closing delete audio translation modal ',
    function() {
      spyOn(stateRecordedVoiceoversService.displayed, 'deleteVoiceover');
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      $scope.openDeleteAudioTranslationModal();
      $scope.$apply();

      expect(stateRecordedVoiceoversService.displayed.deleteVoiceover)
        .toHaveBeenCalled();
      expect(explorationStatesService.saveRecordedVoiceovers)
        .toHaveBeenCalled();
    });

  it('should not delete audio when dismissing delete audio translation' +
    ' modal ', function() {
    spyOn(stateRecordedVoiceoversService.displayed, 'deleteVoiceover');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    $scope.openDeleteAudioTranslationModal();
    $scope.$apply();

    expect(stateRecordedVoiceoversService.displayed.deleteVoiceover)
      .not.toHaveBeenCalled();
  });

  it('should add audio translation when closing add audio translation modal',
    function() {
      spyOn(stateRecordedVoiceoversService.displayed, 'deleteVoiceover');
      spyOn(stateRecordedVoiceoversService.displayed, 'addVoiceover').and
        .callFake(function() {});
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          durationSecs: 100
        })
      });

      $scope.openAddAudioTranslationModal();
      $scope.$apply();

      expect(stateRecordedVoiceoversService.displayed.deleteVoiceover)
        .toHaveBeenCalled();
      expect(stateRecordedVoiceoversService.displayed.addVoiceover)
        .toHaveBeenCalled();
      expect($scope.durationSecs).toBe(0);
    });

  it('should not add audio translation when dismissing add audio' +
    ' translation modal', function() {
    spyOn(alertsService, 'clearWarnings');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    $scope.openAddAudioTranslationModal();
    $scope.$apply();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
  });

  it('should set audio progress when progress percentage is defined',
    function() {
      spyOn(audioPlayerService, 'setProgress');

      $scope.track.progress(20);

      expect(audioPlayerService.setProgress).toHaveBeenCalledWith(0.2);
    });

  it('should get audio progress when progress percentage is not defined',
    function() {
      spyOn(audioPlayerService, 'getProgress').and.returnValue(30);

      expect($scope.track.progress()).toBe(3000);
    });

  describe('when compiling html element', function() {
    var compiledElement = null;
    var mainBodyDivMock = null;
    var translationTabDivMock = null;
    var dropAreaMessageDivMock = null;
    var scope = null;

    beforeEach(angular.mock.inject(function($injector, $compile) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $uibModal = $injector.get('$uibModal');
      userExplorationPermissionsService = $injector.get(
        'UserExplorationPermissionsService');
      userService = $injector.get('UserService');

      spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
        isLoggedIn: () => true
      }));
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve({
          canVoiceover: true
        }));
      stateRecordedVoiceoversService.init(stateName,
        recordedVoiceoversObjectFactory.createFromBackendDict({
          voiceovers_mapping: {
            content: {
              en: {
                duration_secs: 0,
                filename: '',
                file_size_bytes: 0,
                needs_update: false
              }
            }
          }
        }));

      dropAreaMessageDivMock = document.createElement('div');
      dropAreaMessageDivMock.classList.add('oppia-drop-area-message');

      translationTabDivMock = $(document.createElement('div'));
      mainBodyDivMock = $(document.createElement('div'));

      var jQuerySpy = spyOn(window, '$');

      jQuerySpy
        .withArgs('.oppia-translation-tab').and.returnValue(
          translationTabDivMock)
        .withArgs('.oppia-main-body').and.returnValue(mainBodyDivMock);
      jQuerySpy.and.callThrough();

      var element = angular.element(
        '<audio-translation-bar is-translation-tab-busy="true">' +
        '</audio-translation-bar>');

      compiledElement = $compile(element)($scope);
      $rootScope.$digest();

      scope = compiledElement[0].getControllerScope();
    }));

    it('should trigger dragover event in translation tab element', function() {
      translationTabDivMock.triggerHandler('dragover');

      expect(scope.dropAreaIsAccessible).toBe(true);
      expect(scope.userIsGuest).toBe(false);
    });

    it('should trigger drop event in translation tab element and open add' +
      ' audio translation modal with $uibModal', function() {
      translationTabDivMock.triggerHandler('dragover');

      spyOn($uibModal, 'open').and.callThrough();
      translationTabDivMock.triggerHandler({
        originalEvent: {
          dataTransfer: {
            files: []
          }
        },
        preventDefault: () => {},
        stopPropagation: () => {},
        target: dropAreaMessageDivMock,
        type: 'drop',
      });
      expect(scope.dropAreaIsAccessible)
        .toBe(false);
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should trigger dragleave event in main body element', function() {
      mainBodyDivMock.triggerHandler({
        pageX: 0,
        pageY: 0,
        preventDefault: () => {},
        type: 'dragleave'
      });

      expect(compiledElement[0].getControllerScope().dropAreaIsAccessible)
        .toBe(false);
      expect(compiledElement[0].getControllerScope().userIsGuest).toBe(false);
    });
  });
});
