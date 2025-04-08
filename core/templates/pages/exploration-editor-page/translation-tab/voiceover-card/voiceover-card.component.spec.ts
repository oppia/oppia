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
        TranslationLanguageService,
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
    changeListService = TestBed.inject(ChangeListService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);

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

    component.manualVoiceoverDuration = 10;
    component.voiceoverProgress = 0;
    component.pageIsLoaded = false;

    component.ngOnInit();
    translationLanguageService.onActiveLanguageAccentChanged.emit();
    translationLanguageService.onActiveLanguageChanged.emit();
    translationTabActiveContentIdService.onActiveContentIdChanged.emit();
    entityVoiceoversService.onVoiceoverLoad.emit();

    flush();
    tick(5000);
    tick();
    discardPeriodicTasks();

    expect(component.pageIsLoaded).toBeTrue();

    expect(component.voiceoverProgress).toEqual(100);
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

    component.pageIsLoaded = false;
    component.voiceoverProgress = 80;

    component.ngOnInit();
    flush();
    tick(5000);
    tick();
    discardPeriodicTasks();

    expect(component.pageIsLoaded).toBeTrue();
    expect(component.voiceoverProgress).toEqual(0);
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

    component.updateVoiceoverWithChangeList();
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
    let activeLanguageCodeSpy = spyOn(
      translationLanguageService,
      'getActiveLanguageCode'
    );

    activeLanguageCodeSpy.and.returnValue('en');

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

  it('should be able to update language accent code', fakeAsync(() => {
    component.languageAccentCode = 'en-US';
    component.unsupportedLanguageCode = true;

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
    component.audioIsLoaded = false;
    spyOn(audioPlayerService, 'loadAsync').and.returnValue(Promise.resolve());

    component.playAndPauseVoiceover('a.mp3');
    flush();
    discardPeriodicTasks();
    expect(audioPlayerService.loadAsync).toHaveBeenCalled();
  }));

  it('should be able to play loaded voiceover', fakeAsync(() => {
    audioPlayerService.pause();
    spyOn(audioPlayerService, 'play');

    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
    component.playAndPauseVoiceover('a.mp3');

    expect(audioPlayerService.play).toHaveBeenCalled();
  }));

  it('should be able to play and pause loaded voiceover', fakeAsync(() => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    audioPlayerService.play();
    component.playAndPauseVoiceover('a.mp3');
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
      },
    };
    let entityVoiceoversBackendDict = {
      entity_id: entityId,
      entity_type: entityType,
      entity_version: entityVersion,
      language_accent_code: languageAccentCode,
      voiceovers_mapping: contentIdToVoiceoversMappingBackendDict,
    };
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
});
