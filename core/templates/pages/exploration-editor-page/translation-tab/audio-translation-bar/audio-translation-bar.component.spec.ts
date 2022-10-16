// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Audio Translation Bar component.
 */

import { ElementRef, EventEmitter, NgZone, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { EditabilityService } from 'services/editability.service';
import { AlertsService } from 'services/alerts.service';
import { AudioPlayerService } from 'services/audio-player.service';
import WaveSurfer from 'wavesurfer.js';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { UserExplorationPermissionsService } from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { UserService } from 'services/user.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationTabActiveContentIdService } from '../services/translation-tab-active-content-id.service';
import { VoiceoverRecordingService } from '../services/voiceover-recording.service';
import { AudioTranslationBarComponent } from './audio-translation-bar.component';
import { ExternalSaveService } from 'services/external-save.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExplorationPermissions } from 'domain/exploration/exploration-permissions.model';
import { UserInfo } from 'domain/user/user-info.model';
import { Voiceover } from 'domain/exploration/voiceover.model';
import { FormatTimePipe } from 'filters/format-timer.pipe';

@Pipe({ name: 'formatTime' })
class MockFormatTimePipe {
  transform(value: number): string {
    return String(value);
  }
}
describe('Audio translation bar Component', () => {
  let component: AudioTranslationBarComponent;
  let fixture: ComponentFixture<AudioTranslationBarComponent>;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;
  let assetsBackendApiService: AssetsBackendApiService;
  let audioPlayerService: AudioPlayerService;
  let contextService: ContextService;
  let editabilityService: EditabilityService;
  let explorationStatesService: ExplorationStatesService;
  let siteAnalyticsService: SiteAnalyticsService;
  let stateEditorService: StateEditorService;
  let stateRecordedVoiceoversService: StateRecordedVoiceoversService;
  let translationLanguageService: TranslationLanguageService;
  let translationTabActiveContentIdService:
     TranslationTabActiveContentIdService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;
  let userService: UserService;
  let voiceoverRecordingService: VoiceoverRecordingService;
  let zone = null;
  let stateName = 'State1';
  let explorationId = 'exp1';
  let isTranslatableSpy = null;
  let mockExternalSaveEventEmitter = new EventEmitter();
  let mockActiveContentIdChangedEventEmitter = new EventEmitter();
  let mockActiveLanguageChangedEventEmitter = new EventEmitter();
  let mockShowTranslationTabBusyModalEventEmitter = new EventEmitter();
  let modalSpy;
  var mainBodyDivMock = null;
  var translationTabDivMock = null;
  var dropAreaMessageDivMock = null;

   class MockExternalSaveService {
     onExternalSave = mockExternalSaveEventEmitter;
   }

   class MockNgbModal {
     open() {
       return {
         result: Promise.resolve()
       };
     }
   }

   beforeEach(waitForAsync(() => {
     TestBed.configureTestingModule({
       imports: [HttpClientTestingModule],
       declarations: [
         AudioTranslationBarComponent,
         MockFormatTimePipe
       ],
       providers: [
         ContextService,
         {
           provide: NgbModal,
           useClass: MockNgbModal
         },
         {
           provide: FormatTimePipe,
           useClass: MockFormatTimePipe
         },
         {
           provide: ExternalSaveService,
           useClass: MockExternalSaveService
         }
       ],
       schemas: [NO_ERRORS_SCHEMA]
     }).compileComponents();
   }));

   beforeEach(() => {
     fixture = TestBed.createComponent(AudioTranslationBarComponent);
     component = fixture.componentInstance;

     alertsService = TestBed.inject(AlertsService);
     editabilityService = TestBed.inject(EditabilityService);
     siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
     stateRecordedVoiceoversService = TestBed.inject(
       StateRecordedVoiceoversService);
     zone = TestBed.inject(NgZone);
     ngbModal = TestBed.inject(NgbModal);
     assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
     audioPlayerService = TestBed.inject(AudioPlayerService);
     contextService = TestBed.inject(ContextService);
     userService = TestBed.inject(UserService);
     userExplorationPermissionsService = TestBed.inject(
       UserExplorationPermissionsService);

     spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
       .returnValue(Promise.resolve({
         canVoiceover: true
       } as ExplorationPermissions));

     spyOn(userService, 'getUserInfoAsync').and.returnValue(
       Promise.resolve({
         isLoggedIn: () => true
       } as UserInfo));

     spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
     explorationStatesService = TestBed.inject(ExplorationStatesService);
     stateEditorService = TestBed.inject(StateEditorService);
     translationLanguageService = TestBed.inject(TranslationLanguageService);
     translationTabActiveContentIdService = TestBed.inject(
       TranslationTabActiveContentIdService);
     voiceoverRecordingService = TestBed.inject(VoiceoverRecordingService);

     OppiaAngularRootComponent.ngZone = zone;

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
       .callFake(() => {});
     modalSpy = spyOn(ngbModal, 'open');
     modalSpy.and.returnValue({
       componentInstance: {
         busyMessage: ''
       },
       result: Promise.resolve()
     } as NgbModalRef);

     spyOnProperty(
       translationTabActiveContentIdService,
       'onActiveContentIdChanged').and.returnValue(
       mockActiveContentIdChangedEventEmitter);

     spyOnProperty(
       translationLanguageService, 'onActiveLanguageChanged').and.returnValue(
       mockActiveLanguageChangedEventEmitter);

     spyOnProperty(
       stateEditorService,
       'onShowTranslationTabBusyModal').and.returnValue(
       mockShowTranslationTabBusyModalEventEmitter);

     stateRecordedVoiceoversService.init(
       stateName, RecordedVoiceovers.createFromBackendDict({
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

     spyOn(zone, 'runOutsideAngular').and.callFake((fn: Function) => fn());
     spyOn(zone, 'run').and.callFake((fn: Function) => fn());


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


     fixture.detectChanges();
     component.showRecorderWarning = true;
     component.visualized = {
       nativeElement: {
         innerHTML: ''
       }
     } as ElementRef<Element>;

     component.ngOnInit();
   });

   it('should trigger dragover event in translation tab element',
     fakeAsync(() => {
       component.ngOnInit();
       tick();

       translationTabDivMock.triggerHandler('dragover');
       tick();

       component.waveSurferOnFinishCb();
       tick();

       expect(component.dropAreaIsAccessible).toBe(true);
       expect(component.userIsGuest).toBe(false);
     }));

   it('should load and play audio', () => {
     spyOn(component, 'getAvailableAudio')
       .and.returnValue(new Voiceover('filename', 1, false, 12));
     spyOn(audioPlayerService, 'loadAsync').and.returnValue(
       Promise.resolve()
     );
     spyOn(audioPlayerService, 'play').and.stub();

     component.loadAndPlayAudioTranslation();

     expect(audioPlayerService.play).not.toHaveBeenCalled();
   });

   it('should stop setInterval after timeout', fakeAsync(() => {
     spyOn(voiceoverRecordingService, 'startRecordingAsync').and.returnValue(
       Promise.resolve(null)
     );
     spyOn(component, 'stopRecording').and.callThrough();

     component.recordingTimeLimit = 2;
     component.showPermissionAndStartRecording();
     tick();
     tick(5000);

     expect(component.stopRecording).toHaveBeenCalled();
     flush();
   }));

   it('should play, pause and upload audio', () => {
     spyOn(component, 'getAvailableAudio')
       .and.returnValue(new Voiceover('filename', 1, false, 12));
     spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
     spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);
     spyOn(audioPlayerService, 'play').and.stub();

     component.playPauseUploadedAudioTranslation('en');

     expect(audioPlayerService.play).not.toHaveBeenCalled();
   });

   it('should trigger dragleave event in main body element', fakeAsync(() => {
     spyOn(component, 'openAddAudioTranslationModal').and.stub();

     component.ngOnInit();
     tick();

     mainBodyDivMock.triggerHandler({
       pageX: 0,
       pageY: 0,
       preventDefault: () => {},
       type: 'dragleave'
     });
     tick();

     translationTabDivMock.triggerHandler('dragover');
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
     tick();

     expect(component.dropAreaIsAccessible)
       .toBe(false);
     expect(component.openAddAudioTranslationModal).toHaveBeenCalled();
   }));
   it('should evaluate component properties after audio bar initialization',
     () => {
       expect(component.languageCode).toBe('en');
       expect(component.contentId).toBe('content');

       component.ngOnDestroy();
     });

   it('should clear interval', fakeAsync(() => {
     let waveSurferObjSpy = {
       load: () => {},
       on: (evt, callback) => {},
       empty: () => {},
       pause: () => {},
       play: () => {},
       destroy: () => {}
     };
     spyOn(waveSurferObjSpy, 'play');
     // This throws "Argument of type '{ load: () => void; ... }'
     // is not assignable to parameter of type 'WaveSurfer'."
     // This is because the actual 'WaveSurfer.create` function returns a
     // object with around 50 more properties than `waveSurferObjSpy`.
     // We need to suppress this error because we have defined the properties
     // we need for this test in 'waveSurferObjSpy' object.
     // @ts-expect-error
     spyOn(WaveSurfer, 'create').and.returnValue(waveSurferObjSpy);
     component.waveSurfer = WaveSurfer.create({
       container: '#visualized',
       waveColor: '#009688',
       progressColor: '#cccccc',
       height: 38
     });
     component.showRecorderWarning = true;
     spyOn(component, 'checkAndStartRecording').and.stub();
     component.audioBlob = null;
     spyOn(voiceoverRecordingService, 'status').and.returnValue({
       isRecording: false,
       isAvailable: false
     });
     component.timerInterval = setInterval(() => {}, 500);
     component.cancelTimer();
     tick();
     flush();
     component.unsavedAudioIsPlaying = true;
     component.playAndPauseUnsavedAudio();
     tick();

     component.toggleStartAndStopRecording();
     tick();
     expect(component.checkAndStartRecording).toHaveBeenCalled();


     expect(component.getTranslationTabBusyMessage()).toBe(
       'You haven\'t saved your recording. Please save or ' +
         'cancel the recording.'
     );
   }));

   it('should not check and start recording when user deny access',
     () => {
       component.cannotRecord = true;
       spyOn(voiceoverRecordingService, 'status').and.returnValue({
         isAvailable: true,
         isRecording: true
       });
       spyOn(voiceoverRecordingService, 'startRecordingAsync').and.returnValue(
         Promise.reject());

       component.checkAndStartRecording();
       mockActiveContentIdChangedEventEmitter.emit();
       expect(component.unsupportedBrowser).toBe(false);
       expect(component.cannotRecord).toBe(true);

       expect(component.getTranslationTabBusyMessage()).toBe(
         'You haven\'t finished recording. Please stop ' +
         'recording and either save or cancel the recording.'
       );
     });

   it('should not check and start recording when voiceover recorder is' +
     ' not available', () => {
     spyOn(voiceoverRecordingService, 'status').and.returnValue({
       isAvailable: false,
       isRecording: false
     });
     spyOn(voiceoverRecordingService, 'startRecordingAsync').and.returnValue(
       Promise.resolve(null));
     component.checkAndStartRecording();

     expect(component.unsupportedBrowser).toBe(true);
     expect(component.cannotRecord).toBe(true);
   });

   it('should stop record when language changes', () => {
     component.showRecorderWarning = (true);
     spyOn(voiceoverRecordingService, 'status').and.returnValue({
       isAvailable: true,
       isRecording: true
     });
     spyOn(voiceoverRecordingService, 'startRecordingAsync').and.returnValue(
       Promise.resolve(null));
     spyOn(voiceoverRecordingService, 'stopRecord');
     spyOn(voiceoverRecordingService, 'closeRecorder');

     component.checkAndStartRecording();
     mockActiveLanguageChangedEventEmitter.emit();

     expect(voiceoverRecordingService.stopRecord).toHaveBeenCalled();
     expect(voiceoverRecordingService.closeRecorder).toHaveBeenCalled();
   });

   it('should open translation busy modal on event', () => {
     mockShowTranslationTabBusyModalEventEmitter.emit();
     expect(ngbModal.open).toHaveBeenCalled();
   });

   it('should stop record when externalSave flag is broadcasted', () => {
     spyOn(voiceoverRecordingService, 'status').and.returnValue({
       isAvailable: true,
       isRecording: true
     });
     spyOn(voiceoverRecordingService, 'startRecordingAsync').and.returnValue(
       Promise.resolve(null));
     spyOn(voiceoverRecordingService, 'stopRecord');
     spyOn(voiceoverRecordingService, 'closeRecorder');
     spyOn(audioPlayerService, 'stop');
     spyOn(audioPlayerService, 'clear');

     component.checkAndStartRecording();

     mockExternalSaveEventEmitter.emit();

     expect(voiceoverRecordingService.stopRecord).toHaveBeenCalled();
     expect(voiceoverRecordingService.closeRecorder).toHaveBeenCalled();
     expect(audioPlayerService.stop).toHaveBeenCalled();
     expect(audioPlayerService.clear).toHaveBeenCalled();
     expect(component.audioBlob).toEqual(undefined);
   });

   it('should toggle audio needs update', () => {
     spyOn(
       stateRecordedVoiceoversService.displayed, 'toggleNeedsUpdateAttribute');

     component.toggleAudioNeedsUpdate();
     expect(
       stateRecordedVoiceoversService.displayed.toggleNeedsUpdateAttribute)
       .toHaveBeenCalled();
     expect(component.audioNeedsUpdate).toBe(true);

     component.toggleAudioNeedsUpdate();
     expect(
       stateRecordedVoiceoversService.displayed.toggleNeedsUpdateAttribute)
       .toHaveBeenCalled();
     expect(component.audioNeedsUpdate).toBe(false);
   });

   it('should play and pause unsaved audio when wave surfer calls on method' +
     ' callback', fakeAsync(() => {
     component.ngOnInit();
     tick();
     let mockVoiceoverRecorderEventEmitter = new EventEmitter();
     spyOn(component.voiceoverRecorder, 'getMp3Data').and.returnValue(
       mockVoiceoverRecorderEventEmitter);
     let waveSurferObjSpy = {
       load: () => {},
       on: (evt, callback) => {},
       empty: () => {},
       pause: () => {},
       play: () => {},
       destroy: () => {}
     };
     spyOn(waveSurferObjSpy, 'play');
     // This throws "Argument of type '{ load: () => void; ... }'
     // is not assignable to parameter of type 'WaveSurfer'."
     // This is because the actual 'WaveSurfer.create` function returns a
     // object with around 50 more properties than `waveSurferObjSpy`.
     // We need to suppress this error because we have defined the properties
     // we need for this test in 'waveSurferObjSpy' object.
     // @ts-expect-error
     spyOn(WaveSurfer, 'create').and.returnValue(waveSurferObjSpy);
     component.stopRecording();
     component.stopRecording();
     mockVoiceoverRecorderEventEmitter.emit();
     tick();
     flush();

     component.playAndPauseUnsavedAudio();
     expect(waveSurferObjSpy.play).toHaveBeenCalled();
   }));

   it('should play and pause unsaved audio when wave surfer on method does' +
     ' not call the callback', fakeAsync(() => {
     let mockVoiceoverRecorderEventEmitter = new EventEmitter();
     spyOn(component.voiceoverRecorder, 'getMp3Data').and.returnValue(
       mockVoiceoverRecorderEventEmitter);
     let waveSurferObjSpy = {
       load: () => {},
       on: () => {},
       empty: () => {},
       pause: () => {},
       play: () => {},
       destroy: () => {}
     };
     spyOn(waveSurferObjSpy, 'play');
     spyOn(waveSurferObjSpy, 'pause');
     component.unsavedAudioIsPlaying = false;
     // This throws "Argument of type '{ load: () => void; ... }'
     // is not assignable to parameter of type 'WaveSurfer'."
     // This is because the actual 'WaveSurfer.create` function returns a
     // object with around 50 more properties than `waveSurferObjSpy`.
     // We need to suppress this error because we have defined the properties
     // we need for this test in 'waveSurferObjSpy' object.
     // @ts-expect-error
     spyOn(WaveSurfer, 'create').and.returnValue(waveSurferObjSpy);
     component.stopRecording();
     mockVoiceoverRecorderEventEmitter.emit();
     tick();

     component.playAndPauseUnsavedAudio();
     tick();
     expect(component.unsavedAudioIsPlaying).toBe(true);

     component.playAndPauseUnsavedAudio();
     tick();
     expect(component.unsavedAudioIsPlaying).toBe(false);
   }));

   it('should toggle start and stop recording on keyup event', fakeAsync(() => {
     let mockVoiceoverRecorderEventEmitter = new EventEmitter();
     component.canVoiceover = true;
     component.isAudioAvailable = false;
     spyOn(component, 'cancelTimer').and.stub();
     let waveSurferObjSpy = {
       load: () => {},
       on: () => {},
       empty: () => {},
       pause: () => {},
       play: () => {},
       destroy: () => {}
     };
     // This throws "Argument of type '{ load: () => void; ... }'
     // is not assignable to parameter of type 'WaveSurfer'."
     // This is because the actual 'WaveSurfer.create` function returns a
     // object with around 50 more properties than `waveSurferObjSpy`.
     // We need to suppress this error because we have defined the properties
     // we need for this test in 'waveSurferObjSpy' object.
     // @ts-expect-error
     spyOn(WaveSurfer, 'create').and.returnValue(waveSurferObjSpy);
     spyOn(voiceoverRecordingService, 'status').and.returnValue({
       isAvailable: true,
       isRecording: true
     });
     spyOn(component.voiceoverRecorder, 'getMp3Data').and.returnValue(
       mockVoiceoverRecorderEventEmitter);
     spyOn(siteAnalyticsService, 'registerStartAudioRecordingEvent');

     let keyEvent = new KeyboardEvent('keyup', { code: 'KeyR' });
     document.body.dispatchEvent(keyEvent);
     tick();

     expect(siteAnalyticsService.registerStartAudioRecordingEvent)
       .not.toHaveBeenCalled();

     document.body.dispatchEvent(keyEvent);
     mockVoiceoverRecorderEventEmitter.emit();
     tick();
     expect(component.recordingComplete).toBe(true);

     // Reset value to not affect other specs.
     component.canVoiceover = false;
     flush();
   }));

   it('should not toggle start and stop recording on keyup event', () => {
     component.canVoiceover = false;

     spyOn(siteAnalyticsService, 'registerStartAudioRecordingEvent');

     let keyEvent = new KeyboardEvent('keyup', { code: 'KeyR' });
     document.body.dispatchEvent(keyEvent);

     expect(siteAnalyticsService.registerStartAudioRecordingEvent)
       .not.toHaveBeenCalled();
   });

   it('should rerecord successfully', () => {
     component.reRecord();


     expect(component.selectedRecording).toBe(false);
   });

   it('should cancel recording successfully', () => {
     component.cancelRecording();

     expect(component.selectedRecording).toBe(false);
     expect(component.audioIsUpdating).toBe(false);
     expect(component.audioBlob).toBe(null);
     expect(component.showRecorderWarning).toBe(false);
   });

   it('should save recorded audio successfully', fakeAsync(() => {
     spyOn(component, 'saveRecordedVoiceoversChanges').and.stub();
     spyOn(siteAnalyticsService, 'registerSaveRecordedAudioEvent');
     spyOn(alertsService, 'addSuccessMessage');
     spyOn(stateRecordedVoiceoversService.displayed, 'addVoiceover');
     spyOn(assetsBackendApiService, 'saveAudio')
       .and.returnValue(Promise.resolve({
         filename: 'filename',
         duration_secs: 90
       }));

     component.updateAudio();
     tick();

     component.saveRecordedAudio();
     tick();

     expect(siteAnalyticsService.registerSaveRecordedAudioEvent)
       .toHaveBeenCalled();
     expect(stateRecordedVoiceoversService.displayed.addVoiceover)
       .toHaveBeenCalled();
     expect(component.durationSecs).toBe(90);
     expect(component.audioIsCurrentlyBeingSaved).toBe(false);
     expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
       'Succesfuly uploaded recorded audio.');
   }));

   it('should use reject handler when saving recorded audio fails',
     () => {
       spyOn(siteAnalyticsService, 'registerSaveRecordedAudioEvent');
       spyOn(alertsService, 'addWarning');
       spyOn(assetsBackendApiService, 'saveAudio')
         .and.returnValue(Promise.reject({
           error: 'It was not possible to save the recorded audio'
         }));
       component.saveRecordedAudio();

       expect(siteAnalyticsService.registerSaveRecordedAudioEvent)
         .toHaveBeenCalled();

       expect(component.audioIsCurrentlyBeingSaved).toBe(true);
       expect(alertsService.addWarning).not.toHaveBeenCalledWith(
         'It was not possible to save the recorded audio');
     });

   it('should open translation tab busy modal with NgbModal',
     fakeAsync(() => {
       component.openTranslationTabBusyModal();
       tick();

       expect(ngbModal.open).toHaveBeenCalled();
     }));

   it('should play a loaded audio translation', fakeAsync(() => {
     spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
     spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
     spyOn(audioPlayerService, 'play');
     spyOn(audioPlayerService, 'loadAsync').and.returnValue(Promise.resolve());
     expect(component.isPlayingUploadedAudio()).toBe(false);
     component.playPauseUploadedAudioTranslation('en');
     tick();

     expect(component.audioTimerIsShown).toBe(true);
     expect(audioPlayerService.play).toHaveBeenCalled();
   }));

   it('should pause ongoing audio translation', () => {
     spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
     spyOn(audioPlayerService, 'pause');

     expect(component.isPlayingUploadedAudio()).toBe(true);
     component.playPauseUploadedAudioTranslation('en');

     expect(audioPlayerService.pause).toHaveBeenCalled();
   });

   it('should get set progress audio timer', () => {
     const setCurrentTimeSpy = spyOn(audioPlayerService, 'setCurrentTime');
     setCurrentTimeSpy.and.returnValue(undefined);
     component.setProgress({value: 100});
     expect(setCurrentTimeSpy).toHaveBeenCalledWith(100);
   });

   it('should delete audio when closing delete audio translation modal',
     fakeAsync(() => {
       spyOn(stateRecordedVoiceoversService.displayed, 'deleteVoiceover');

       component.openDeleteAudioTranslationModal();
       tick();

       expect(stateRecordedVoiceoversService.displayed.deleteVoiceover)
         .toHaveBeenCalled();
       expect(explorationStatesService.saveRecordedVoiceovers)
         .toHaveBeenCalled();
     }));

   it('should not delete audio when dismissing delete audio translation' +
     ' modal', fakeAsync(() => {
     spyOn(stateRecordedVoiceoversService.displayed, 'deleteVoiceover');
     ngbModal.open = jasmine.createSpy().and.returnValue({
       result: Promise.reject()
     } as NgbModalRef);

     component.openDeleteAudioTranslationModal();
     tick();


     expect(stateRecordedVoiceoversService.displayed.deleteVoiceover)
       .not.toHaveBeenCalled();
   }));

   it('should add audio translation when closing add audio translation modal',
     fakeAsync(() => {
       spyOn(stateRecordedVoiceoversService.displayed, 'deleteVoiceover');
       spyOn(stateRecordedVoiceoversService.displayed, 'addVoiceover').and
         .callFake(() => {});
       modalSpy.and.returnValue({
         componentInstance: {
           busyMessage: ''
         },
         result: Promise.resolve({
           durationSecs: 100
         })
       } as NgbModalRef);

       component.openAddAudioTranslationModal(null);
       tick();

       expect(stateRecordedVoiceoversService.displayed.deleteVoiceover)
         .toHaveBeenCalled();
       expect(stateRecordedVoiceoversService.displayed.addVoiceover)
         .toHaveBeenCalled();
       expect(component.durationSecs).toBe(0);
     }));

   it('should not add audio translation when dismissing add audio' +
     ' translation modal', fakeAsync(() => {
     spyOn(alertsService, 'clearWarnings');
     modalSpy.and.returnValue({
       componentInstance: {
         audioFile: 'null',
         generatedFilename: 'generatedFilename',
         languageCode: '',
         isAudioAvailable: false,
         busyMessage: ''
       },
       result: Promise.reject()
     } as NgbModalRef);

     component.openAddAudioTranslationModal(null);
     tick();

     expect(alertsService.clearWarnings).toHaveBeenCalled();
   }));

   it('should apply changed when view update emits', fakeAsync(() => {
     audioPlayerService.viewUpdate.emit();
     audioPlayerService.onAudioStop.next();
     tick();
   }));
});
