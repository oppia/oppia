// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for VoiceoverCardComponent.
 */

import {
  ComponentFixture,
  fakeAsync,
  flush,
  tick,
  TestBed,
  discardPeriodicTasks,
  waitForAsync,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, Pipe, EventEmitter} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AudioPlayerService} from 'services/audio-player.service';
import {ContextService} from 'services/context.service';
import {TranslationLanguageService} from '../services/translation-language.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {TranslationTabActiveContentIdService} from '../services/translation-tab-active-content-id.service';
import {Voiceover} from 'domain/exploration/voiceover.model';
import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';
import {LocalStorageService} from 'services/local-storage.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {VoiceoverCardComponent} from './voiceover-card.component';
import {FormatTimePipe} from 'filters/format-timer.pipe';
import {VoiceoverBackendDict} from 'domain/exploration/voiceover.model';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {AppConstants} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {VoiceoverLanguageManagementService} from 'services/voiceover-language-management-service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeatureStatusChecker} from 'domain/feature-flag/feature-status-summary.model';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';

@Pipe({name: 'formatTime'})
class MockFormatTimePipe {
  transform(value: number): string {
    return String(value);
  }
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockPlatformFeatureService {
  get status(): object {
    return {
      AutomaticVoiceoverRegenerationFromExp: {
        isEnabled: true,
      },
    };
  }
}

describe('Voiceover card component', () => {
  let component: VoiceoverCardComponent;
  let fixture: ComponentFixture<VoiceoverCardComponent>;
  let ngbModal: NgbModal;
  let contextService: ContextService;
  let audioPlayerService: AudioPlayerService;
  let translationLanguageService: TranslationLanguageService;
  let translationTabActiveContentIdService: TranslationTabActiveContentIdService;
  let changeListService: ChangeListService;
  let localStorageService: LocalStorageService;
  let entityVoiceoversService: EntityVoiceoversService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let alertsService: AlertsService;
  let voiceoverLanguageManagementService: VoiceoverLanguageManagementService;
  let platformFeatureService: PlatformFeatureService;
  let explorationStatesService: ExplorationStatesService;
  let sof: StateObjectFactory;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [VoiceoverCardComponent, MockFormatTimePipe],
      providers: [
        {
          provide: FormatTimePipe,
          useClass: MockFormatTimePipe,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
        TranslationLanguageService,
        ExplorationStatesService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VoiceoverCardComponent);
    component = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    ngbModal = TestBed.inject(NgbModal);
    audioPlayerService = TestBed.inject(AudioPlayerService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService
    );
    changeListService = TestBed.inject(ChangeListService);
    localStorageService = TestBed.inject(LocalStorageService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    voiceoverLanguageManagementService = TestBed.inject(
      VoiceoverLanguageManagementService
    );
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    sof = TestBed.inject(StateObjectFactory);

    spyOn(
      translationLanguageService,
      'onActiveLanguageChanged'
    ).and.returnValue(new EventEmitter<void>());
    spyOn(
      translationTabActiveContentIdService,
      'onActiveContentIdChanged'
    ).and.returnValue(new EventEmitter<string>());
    spyOn(
      translationLanguageService,
      'onActiveLanguageAccentChanged'
    ).and.returnValue(new EventEmitter<void>());
    spyOn(entityVoiceoversService, 'onVoiceoverLoad').and.returnValue(
      new EventEmitter<void>()
    );
  });

  it('should be able to initialize the voiceover card component', fakeAsync(() => {
    spyOn(
      localStorageService,
      'getLastSelectedLanguageAccentCode'
    ).and.returnValue('en-US');
    spyOn(component, 'updateLanguageCode');
    spyOn(component, 'updateActiveContent');
    spyOn(component, 'updateLanguageAccentCode');
    let questionSummariesInitializedEmitter = new EventEmitter();
    spyOn(
      translationLanguageService,
      'onActiveLanguageChanged'
    ).and.returnValue(questionSummariesInitializedEmitter);

    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    spyOn(audioPlayerService, 'getCurrentTimeInSecs').and.returnValue(10);
    spyOn(entityVoiceoversService, 'isEntityVoiceoversLoaded').and.returnValue(
      true
    );

    component.manualVoiceoverTotalDuration = 10;
    component.manualVoiceoverProgress = 0;
    component.isManualVoiceoverPlaying = true;
    component.isAutomaticVoiceoverPlaying = true;

    component.ngOnInit();
    translationLanguageService.onActiveLanguageAccentChanged.emit();
    translationLanguageService.onActiveLanguageChanged.emit();
    translationTabActiveContentIdService.onActiveContentIdChanged.emit();
    entityVoiceoversService.onVoiceoverLoad.emit();

    flush();
    tick(5000);
    tick();
    discardPeriodicTasks();

    expect(component.manualVoiceoverProgress).toEqual(100);
  }));

  it('should be able to initialize the voiceover card component when audio is not loaded', fakeAsync(() => {
    spyOn(
      localStorageService,
      'getLastSelectedLanguageAccentCode'
    ).and.returnValue('en-US');
    spyOn(component, 'updateLanguageCode');
    spyOn(component, 'updateActiveContent');
    spyOn(component, 'updateLanguageAccentCode');

    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);

    component.manualVoiceoverProgress = 80;

    component.ngOnInit();
    flush();
    tick(5000);
    tick();
    discardPeriodicTasks();

    expect(component.manualVoiceoverProgress).toEqual(0);
  }));

  it('should be able to update voiceover with the active change list', fakeAsync(() => {
    let voiceover1: VoiceoverBackendDict = {
      filename: 'b.mp3',
      file_size_bytes: 100000,
      needs_update: false,
      duration_secs: 12.0,
    };

    let changeDicts = [
      {
        cmd: 'update_voiceovers',
        language_accent_code: 'en-US',
        content_id: 'content_id_1',
        voiceovers: {
          manual: voiceover1,
        },
      },
      {
        cmd: 'update_voiceovers',
        language_accent_code: 'en-US',
        content_id: 'content_id_2',
        voiceovers: {},
      },
    ];

    spyOn(changeListService, 'getVoiceoverChangeList').and.returnValue(
      changeDicts
    );

    spyOn(
      entityVoiceoversService,
      'getEntityVoiceoversByLanguageAccentCode'
    ).and.returnValue(undefined);

    spyOn(entityVoiceoversService, 'addEntityVoiceovers');

    component.updateManualVoiceoverWithChangeList();
    flush();
    discardPeriodicTasks();

    expect(entityVoiceoversService.addEntityVoiceovers).toHaveBeenCalled();
  }));

  it('should be able to update active content', fakeAsync(() => {
    component.activeContentId = 'content_0';

    spyOn(
      translationTabActiveContentIdService,
      'getActiveContentId'
    ).and.returnValue('content_1');
    spyOn(
      localStorageService,
      'getLastSelectedLanguageAccentCode'
    ).and.returnValue('en-US');

    component.updateActiveContent();
    flush();
    discardPeriodicTasks();
    expect(component.activeContentId).toEqual('content_1');
  }));

  it('should be able to update language code', fakeAsync(() => {
    spyOn(
      localStorageService,
      'getLastSelectedLanguageAccentCode'
    ).and.returnValue('en-US');
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );
    spyOn(
      voiceoverLanguageManagementService,
      'canVoiceoverForLanguage'
    ).and.returnValue(true);
    spyOn(
      voiceoverLanguageManagementService,
      'setCloudSupportedLanguageAccents'
    );
    spyOn(
      voiceoverLanguageManagementService,
      'isAutogenerationSupportedGivenLanguageAccent'
    ).and.returnValue(true);
    spyOn(component, 'updateContentAvailabilityStatusForVoiceovers');

    let activeLanguageCodeSpy = spyOn(
      translationLanguageService,
      'getActiveLanguageCode'
    );

    activeLanguageCodeSpy.and.returnValue('en');
    component.voiceoversAreLoaded = true;

    expect(component.languageCode).toBeUndefined();

    component.updateLanguageCode();
    flush();
    discardPeriodicTasks();
    expect(component.languageCode).toEqual('en');

    activeLanguageCodeSpy.and.returnValue('hi');
    component.updateLanguageCode();
    flush();
    discardPeriodicTasks();
    expect(component.languageCode).toEqual('hi');
  }));

  it('should be able to set active manual voiceover', fakeAsync(() => {
    let manualVoiceoverBackendDict: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    let contentIdToVoiceoversMappingBackendDict = {
      content0: {
        manual: manualVoiceoverBackendDict,
      },
    };
    let entityId = 'exploration_1';
    let entityType = 'exploration';
    let entityVersion = 1;
    let languageAccentCode = 'en-US';

    let entityVoiceoversBackendDict = {
      entity_id: entityId,
      entity_type: entityType,
      entity_version: entityVersion,
      language_accent_code: languageAccentCode,
      voiceovers_mapping: contentIdToVoiceoversMappingBackendDict,
    };
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    entityVoiceoversService.init(entityId, entityType, entityVersion, 'en');
    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);
    component.languageAccentCode = 'en-US';
    component.activeContentId = 'content1';

    component.setActiveContentManualVoiceover();
    flush();
    discardPeriodicTasks();

    component.activeContentId = 'content0';
    component.setActiveContentManualVoiceover();
    flush();
    discardPeriodicTasks();

    expect(component.manualVoiceover.filename).toEqual('a.mp3');
  }));

  it('should be able to set active automatic voiceover', fakeAsync(() => {
    let automaticVoiceoverBackendDict: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    let contentIdToVoiceoversMappingBackendDict = {
      content0: {
        manual: undefined,
        auto: automaticVoiceoverBackendDict,
      },
    };
    let entityId = 'exploration_1';
    let entityType = 'exploration';
    let entityVersion = 1;
    let languageAccentCode = 'en-US';

    let entityVoiceoversBackendDict = {
      entity_id: entityId,
      entity_type: entityType,
      entity_version: entityVersion,
      language_accent_code: languageAccentCode,
      voiceovers_mapping: contentIdToVoiceoversMappingBackendDict,
    };
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    entityVoiceoversService.init(entityId, entityType, entityVersion, 'en');
    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);
    component.languageAccentCode = 'en-US';
    component.activeContentId = 'content1';

    component.setActiveContentAutomaticVoiceover();
    flush();
    discardPeriodicTasks();

    component.activeContentId = 'content0';
    component.setActiveContentAutomaticVoiceover();
    flush();
    discardPeriodicTasks();

    expect(component.automaticVoiceover.filename).toEqual('a.mp3');
  }));

  it('should be able to update language accent code', fakeAsync(() => {
    component.languageCode = 'en';
    component.languageAccentCode = 'en-US';
    component.unsupportedLanguageCode = true;
    component.voiceoversAreLoaded = true;

    spyOn(
      voiceoverLanguageManagementService,
      'canVoiceoverForLanguage'
    ).and.returnValue(true);
    spyOn(
      voiceoverLanguageManagementService,
      'setCloudSupportedLanguageAccents'
    );
    spyOn(
      voiceoverLanguageManagementService,
      'isAutogenerationSupportedGivenLanguageAccent'
    ).and.returnValue(true);
    spyOn(component, 'updateContentAvailabilityStatusForVoiceovers');

    component.updateLanguageAccentCode('en-IN');
    flush();
    discardPeriodicTasks();

    expect(component.languageAccentCode).toEqual('en-IN');
    expect(component.unsupportedLanguageCode).toBeFalse();

    component.updateLanguageAccentCode('');
    flush();
    discardPeriodicTasks();

    expect(component.unsupportedLanguageCode).toBeTrue();
    expect(component.languageAccentCode).toEqual('');
  }));

  it('should be able to load and play voiceover', fakeAsync(() => {
    audioPlayerService.pause();
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);
    spyOn(audioPlayerService, 'loadAsync').and.returnValue(Promise.resolve());

    component.playAndPauseVoiceover(
      'a.mp3',
      AppConstants.VOICEOVER_TYPE_MANUAL
    );
    flush();
    discardPeriodicTasks();
    expect(audioPlayerService.loadAsync).toHaveBeenCalled();
  }));

  it('should be able to play loaded manual voiceover', fakeAsync(() => {
    audioPlayerService.pause();
    spyOn(audioPlayerService, 'play');
    component.currentVoiceoverLoadedType = AppConstants.VOICEOVER_TYPE_MANUAL;

    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
    component.playAndPauseVoiceover(
      'a.mp3',
      AppConstants.VOICEOVER_TYPE_MANUAL
    );

    expect(audioPlayerService.play).toHaveBeenCalled();
  }));

  it('should be able to play and pause loaded manual voiceover', fakeAsync(() => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    audioPlayerService.play();
    component.playAndPauseVoiceover(
      'a.mp3',
      AppConstants.VOICEOVER_TYPE_MANUAL
    );
    flush();
    discardPeriodicTasks();
    expect(audioPlayerService.isPlaying()).toBeTrue();
  }));

  it('should be able to play manual voiceover by pausing automatic voiceover', fakeAsync(() => {
    component.isAutomaticVoiceoverPlaying = true;
    component.isManualVoiceoverPlaying = false;
    component.currentVoiceoverLoadedType = AppConstants.VOICEOVER_TYPE_MANUAL;

    spyOn(audioPlayerService, 'play');
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);

    component.playAndPauseVoiceover(
      'a.mp3',
      AppConstants.VOICEOVER_TYPE_MANUAL
    );

    expect(audioPlayerService.play).toHaveBeenCalled();
    expect(component.isAutomaticVoiceoverPlaying).toBeFalse();
    expect(component.isManualVoiceoverPlaying).toBeTrue();
  }));

  it('should be able to play automatic voiceover by pausing manual voiceover', fakeAsync(() => {
    component.isAutomaticVoiceoverPlaying = false;
    component.isManualVoiceoverPlaying = true;
    component.currentVoiceoverLoadedType = AppConstants.VOICEOVER_TYPE_AUTO;

    spyOn(audioPlayerService, 'play');
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);

    component.playAndPauseVoiceover('a.mp3', AppConstants.VOICEOVER_TYPE_AUTO);

    expect(audioPlayerService.play).toHaveBeenCalled();
    expect(component.isAutomaticVoiceoverPlaying).toBeTrue();
    expect(component.isManualVoiceoverPlaying).toBeFalse();
  }));

  it('should be able to play and pause loaded automatic voiceover', fakeAsync(() => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    audioPlayerService.play();
    component.playAndPauseVoiceover('a.mp3', AppConstants.VOICEOVER_TYPE_AUTO);
    flush();
    discardPeriodicTasks();
    expect(audioPlayerService.isPlaying()).toBeTrue();
  }));

  it('should be able to delete manual voiceover', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef);

    let manualVoiceoverBackendDict: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    component.manualVoiceover = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict
    );

    let entityId = 'exploration_1';
    let entityType = 'exploration';
    let entityVersion = 1;
    let languageAccentCode = 'en-US';
    let contentIdToVoiceoversMappingBackendDict = {
      content0: {
        manual: manualVoiceoverBackendDict,
        auto: undefined,
      },
    };
    let contentIdToVoiceoversAudioOffsetsMsecsBackendDict = {};
    let entityVoiceoversBackendDict = {
      entity_id: entityId,
      entity_type: entityType,
      entity_version: entityVersion,
      language_accent_code: languageAccentCode,
      voiceovers_mapping: contentIdToVoiceoversMappingBackendDict,
      automated_voiceovers_audio_offsets_msecs:
        contentIdToVoiceoversAudioOffsetsMsecsBackendDict,
    };
    component.activeContentId = 'content0';
    component.activeEntityVoiceoversInstance =
      EntityVoiceovers.createFromBackendDict(entityVoiceoversBackendDict);

    component.deleteManualVoiceover();
    flush();
    discardPeriodicTasks();

    expect(component.manualVoiceover).toBeUndefined();
  }));

  it('should not be able to delete manual voiceover for rejection handler', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.reject(),
    } as NgbModalRef);

    let manualVoiceoverBackendDict: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    component.manualVoiceover = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict
    );

    component.deleteManualVoiceover();
    flush();
    discardPeriodicTasks();

    expect(component.manualVoiceover.filename).toEqual('a.mp3');
  }));

  it('should be able to toggle manual voiceover status', fakeAsync(() => {
    let manualVoiceoverBackendDict: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    component.manualVoiceover = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict
    );
    let entityId = 'exploration_1';
    let entityType = 'exploration';
    let entityVersion = 1;
    let languageAccentCode = 'en-US';
    let contentIdToVoiceoversMappingBackendDict = {
      content0: {
        manual: manualVoiceoverBackendDict,
      },
    };
    let entityVoiceoversBackendDict = {
      entity_id: entityId,
      entity_type: entityType,
      entity_version: entityVersion,
      language_accent_code: languageAccentCode,
      voiceovers_mapping: contentIdToVoiceoversMappingBackendDict,
    };
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    component.languageAccentCode = 'en-US';
    component.activeContentId = 'content0';

    entityVoiceoversService.init(entityId, entityType, entityVersion, 'en');
    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);

    expect(component.manualVoiceover.needsUpdate).toBeFalse();
    component.toggleAudioNeedsUpdate();
    flush();
    discardPeriodicTasks();

    expect(component.manualVoiceover.needsUpdate).toBeTrue();
  }));

  it('should be able to add manual voiceovers', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    spyOn(contextService, 'getExplorationVersion').and.returnValue(1);

    let result = {
      filename: 'a.mp3',
      fileSizeBytes: 200000,
      durationSecs: 10.0,
    };

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(result),
    } as NgbModalRef);

    expect(component.manualVoiceover).toBeUndefined();

    component.addManualVoiceover();
    flush();
    discardPeriodicTasks();

    expect(component.manualVoiceover.filename).toEqual('a.mp3');
    expect(component.manualVoiceover.durationSecs).toEqual(10.0);
  }));

  it('should not add manual voiceovers for reject handler', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    spyOn(contextService, 'getExplorationVersion').and.returnValue(1);

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.reject(),
    } as NgbModalRef);

    expect(component.manualVoiceover).toBeUndefined();

    component.addManualVoiceover();
    flush();
    discardPeriodicTasks();

    expect(component.manualVoiceover).toBeUndefined();
  }));

  it('should be able to regenerate automatic voiceovers', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    spyOn(contextService, 'getExplorationVersion').and.returnValue(1);
    component.activeContentId = 'content0';
    component.languageAccentCode = 'en-US';
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef);

    let response = {
      filename: 'filename.mp3',
      durationSecs: 10.0,
      fileSizeBytes: 200000,
      needsUpdate: false,
      sentenceTokenWithDurations: [
        {token: 'This', audioOffsetMsecs: 0.0},
        {token: 'is', audioOffsetMsecs: 100.0},
        {token: 'a', audioOffsetMsecs: 200.0},
        {token: 'text', audioOffsetMsecs: 300.0},
      ],
    };

    spyOn(
      voiceoverBackendApiService,
      'generateAutotmaticVoiceoverAsync'
    ).and.returnValue(Promise.resolve(response));

    expect(component.automaticVoiceover).toBeUndefined();

    component.generateVoiceover();

    flush();
    tick(5000);
    discardPeriodicTasks();

    expect(component.automaticVoiceover?.filename).toEqual('filename.mp3');
    expect(component.automaticVoiceover?.durationSecs).toEqual(10.0);
  }));

  it('should not be able to regenerate automatic voiceovers if any error is raised', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    spyOn(contextService, 'getExplorationVersion').and.returnValue(1);
    component.activeContentId = 'content0';
    component.languageAccentCode = 'en-US';
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef);
    spyOn(
      voiceoverBackendApiService,
      'generateAutotmaticVoiceoverAsync'
    ).and.returnValue(Promise.reject({error: 'Voiceover regenration failed'}));
    spyOn(alertsService, 'addWarning');

    expect(component.automaticVoiceover).toBeUndefined();

    component.generateVoiceover();

    flush();
    tick(5000);
    discardPeriodicTasks();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Voiceover regenration failed'
    );
    expect(component.automaticVoiceover).toBeUndefined();
  }));

  it('should not regenerate automatic voiceovers for reject handler', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    spyOn(contextService, 'getExplorationVersion').and.returnValue(1);

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.reject(),
    } as NgbModalRef);

    expect(component.automaticVoiceover).toBeUndefined();

    component.generateVoiceover();
    flush();
    discardPeriodicTasks();

    expect(component.automaticVoiceover).toBeUndefined();
  }));

  it('should be able to check exploration change list for voiceover changes', fakeAsync(() => {
    let isOnlyVoiceoverChangeListPresentSpy = spyOn(
      changeListService,
      'isOnlyVoiceoverChangeListPresent'
    );

    component.isGenerateAutomaticVoiceoverOptionEnabled = false;

    changeListService.explorationChangeList = [
      {
        cmd: 'update_voiceovers',
        language_accent_code: 'en-US',
        content_id: 'content_id_1',
        voiceovers: {
          manual: {
            filename: 'a.mp3',
            file_size_bytes: 200000,
            needs_update: false,
            duration_secs: 10.0,
          },
        },
      },
    ];
    isOnlyVoiceoverChangeListPresentSpy.and.returnValue(true);

    component.ngAfterViewChecked();

    expect(component.isGenerateAutomaticVoiceoverOptionEnabled).toBeTrue();

    changeListService.explorationChangeList = [];
    isOnlyVoiceoverChangeListPresentSpy.and.returnValue(false);

    component.ngAfterViewChecked();

    expect(component.isGenerateAutomaticVoiceoverOptionEnabled).toBeFalse();
  }));

  it('should be able to update content availability status', fakeAsync(() => {
    let isContentAvaiableForVoiceoverSpy = spyOn(
      component,
      'isContentAvaiableForVoiceover'
    );

    isContentAvaiableForVoiceoverSpy.and.returnValue(true);
    component.contentAvailableForVoiceovers = false;
    component.updateContentAvailabilityStatusForVoiceovers();
    expect(component.contentAvailableForVoiceovers).toBeTrue();

    isContentAvaiableForVoiceoverSpy.and.returnValue(false);
    component.contentAvailableForVoiceovers = true;
    component.updateContentAvailabilityStatusForVoiceovers();
    expect(component.contentAvailableForVoiceovers).toBeFalse();
  }));

  it('should return correct content availability status', () => {
    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content_0',
        html: 'Hello world!',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content_0: {},
          default_outcome_1: {},
        },
      },
      inapplicable_skill_misconception_ids: [],
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
          catchMisspellings: {
            value: false,
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome_1',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
    };
    const state = sof.createFromBackendDict('State name', stateObject);
    component.activeContentId = 'content_0';
    component.languageCode = 'en';

    spyOn(explorationStatesService, 'getState').and.returnValue(state);

    expect(component.isContentAvaiableForVoiceover()).toBeTrue();
    component.activeContentId = 'feedback_1';
    expect(component.isContentAvaiableForVoiceover()).toBeFalse();
  });

  it('should disable voiceover regeneration feature flag', () => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      AutomaticVoiceoverRegenerationFromExp: {
        isEnabled: false,
      },
    } as FeatureStatusChecker);

    expect(
      component.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()
    ).toBeFalse();
  });

  it('should enable voiceover regeneration feature flag', () => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      AutomaticVoiceoverRegenerationFromExp: {
        isEnabled: true,
      },
    } as FeatureStatusChecker);

    expect(
      component.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()
    ).toBeTrue();
  });
});
