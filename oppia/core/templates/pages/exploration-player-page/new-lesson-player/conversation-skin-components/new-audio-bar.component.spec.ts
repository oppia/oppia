// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the NewAudioBarComponent.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NewAudioBarComponent} from './new-audio-bar.component';
import {Voiceover} from 'domain/exploration/voiceover.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AudioPlayerService} from 'services/audio-player.service';
import {AudioPreloaderService} from 'pages/exploration-player-page/services/audio-preloader.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PageContextService} from 'services/page-context.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {VoiceoverPlayerService} from 'pages/exploration-player-page/services/voiceover-player.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {MobileMenuService} from 'pages/exploration-player-page/services/mobile-menu.service';

describe('NewAudioBarComponent', () => {
  let component: NewAudioBarComponent;
  let fixture: ComponentFixture<NewAudioBarComponent>;

  let assetsBackendApiService: AssetsBackendApiService;
  let audioPlayerService: AudioPlayerService;
  let audioPreloaderService: AudioPreloaderService;
  let playerPositionService: PlayerPositionService;
  let pageContextService: PageContextService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let voiceoverPlayerService: VoiceoverPlayerService;
  let mobileMenuService: MobileMenuService;
  let entityVoiceoversService: EntityVoiceoversService;
  let stateEditorService: StateEditorService;
  let siteAnalyticsService: SiteAnalyticsService;

  let mockOnTranslationLanguageChanged: EventEmitter<void>;
  let mockOnActiveVoiceoverChanged: EventEmitter<void>;
  let mockOnAutoplayAudio: EventEmitter<void>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [NewAudioBarComponent, MockTranslatePipe],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewAudioBarComponent);
    component = fixture.componentInstance;

    audioPlayerService = TestBed.inject(AudioPlayerService);
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    pageContextService = TestBed.inject(PageContextService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    voiceoverPlayerService = TestBed.inject(VoiceoverPlayerService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    stateEditorService = TestBed.inject(StateEditorService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    mobileMenuService = TestBed.inject(MobileMenuService);

    mockOnTranslationLanguageChanged = new EventEmitter<void>();
    mockOnActiveVoiceoverChanged = new EventEmitter<void>();
    mockOnAutoplayAudio = new EventEmitter<void>();

    spyOnProperty(
      voiceoverPlayerService,
      'onTranslationLanguageChanged',
      'get'
    ).and.returnValue(mockOnTranslationLanguageChanged);
    spyOnProperty(
      voiceoverPlayerService,
      'onActiveVoiceoverChanged',
      'get'
    ).and.returnValue(mockOnActiveVoiceoverChanged);
    spyOnProperty(audioPlayerService, 'onAutoplayAudio', 'get').and.returnValue(
      mockOnAutoplayAudio
    );

    fixture.detectChanges();
  });

  beforeEach(() => {
    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize component properties on init', () => {
    spyOn(
      voiceoverPlayerService,
      'getLanguageAccentDescriptions'
    ).and.returnValue(['English (US)', 'English (UK)']);
    spyOn(audioPreloaderService, 'setAudioLoadedCallback');

    component.ngOnInit();

    expect(component.progressBarIsShown).toBe(false);
    expect(component.audioLoadingIndicatorIsShown).toBe(false);
    expect(component.languageAccentDescriptions).toEqual([
      'English (US)',
      'English (UK)',
    ]);
    expect(audioPreloaderService.setAudioLoadedCallback).toHaveBeenCalled();
  });

  it('should handle translation language changed event', () => {
    spyOn(audioPlayerService, 'stop');
    spyOn(audioPlayerService, 'clear');
    spyOn(component, 'setProgress');
    spyOn(component, 'updateDisplayableLanguageAccentDescription');

    component.ngOnInit();
    mockOnTranslationLanguageChanged.emit();

    expect(audioPlayerService.stop).toHaveBeenCalled();
    expect(audioPlayerService.clear).toHaveBeenCalled();
    expect(component.voiceoverToBePlayed).toBeUndefined();
    expect(component.setProgress).toHaveBeenCalledWith({value: 0});
    expect(
      component.updateDisplayableLanguageAccentDescription
    ).toHaveBeenCalled();
  });

  it('should return sidebar expanded state from mobileMenuService', () => {
    spyOn(mobileMenuService, 'getSidebarIsExpanded').and.returnValue(true);
    expect(component.getSidebarIsExpanded()).toBe(true);

    (mobileMenuService.getSidebarIsExpanded as jasmine.Spy).and.returnValue(
      false
    );
    expect(component.getSidebarIsExpanded()).toBe(false);
  });

  it('should handle active voiceover changed event', () => {
    const mockVoiceover = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });
    spyOn(voiceoverPlayerService, 'getActiveVoiceover').and.returnValue(
      mockVoiceover
    );

    component.ngOnInit();
    mockOnActiveVoiceoverChanged.emit();

    expect(component.voiceoverToBePlayed).toEqual(mockVoiceover);
  });

  it('should handle autoplay audio event when not paused', fakeAsync(() => {
    spyOn(audioPlayerService, 'stop');
    spyOn(component, 'onPlayButtonClicked');
    component.isPaused = false;

    component.ngOnInit();
    mockOnAutoplayAudio.emit();

    tick(100);

    expect(audioPlayerService.stop).toHaveBeenCalled();
    expect(component.onPlayButtonClicked).toHaveBeenCalled();
  }));

  it('should not call onPlayButtonClicked when paused on autoplay', fakeAsync(() => {
    spyOn(audioPlayerService, 'stop');
    spyOn(component, 'onPlayButtonClicked');
    component.isPaused = true;

    component.ngOnInit();
    mockOnAutoplayAudio.emit();

    tick(100);

    expect(audioPlayerService.stop).toHaveBeenCalled();
    expect(component.onPlayButtonClicked).not.toHaveBeenCalled();
  }));

  it('should update current voiceover time after content checked when track is loaded and playing', () => {
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    spyOn(audioPlayerService, 'getCurrentTimeInSecs').and.returnValue(15);
    spyOn(audioPlayerService, 'getAudioDuration').and.returnValue(30.7);

    component.ngAfterContentChecked();

    expect(component.currentVoiceoverTime).toBe(15);
    expect(component.totalVoiceoverDurationSecs).toBe(30);
  });

  it('should reset current voiceover time when track is not loaded', () => {
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);
    component.currentVoiceoverTime = 10;

    component.ngAfterContentChecked();

    expect(component.currentVoiceoverTime).toBe(0);
  });

  it('should set progress by calling audioPlayerService.setCurrentTime', () => {
    spyOn(audioPlayerService, 'setCurrentTime');

    component.setProgress({value: 25});

    expect(audioPlayerService.setCurrentTime).toHaveBeenCalledWith(25);
  });

  it('should return true if audio bar is available', () => {
    component.languageAccentDescriptions = ['English (US)', 'English (UK)'];

    expect(component.isAudioBarAvailable()).toBe(true);
  });

  it('should return false if audio bar is not available', () => {
    expect(component.isAudioBarAvailable()).toBe(false);
  });

  it('should return true if current language is RTL', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );

    expect(component.isLanguageRTL()).toBe(true);
  });

  it('should return false if current language is not RTL', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      false
    );

    expect(component.isLanguageRTL()).toBe(false);
  });

  it('should return true if audio is playing', () => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);

    expect(component.isAudioPlaying()).toBe(true);
  });

  it('should return false if audio is not playing', () => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);

    expect(component.isAudioPlaying()).toBe(false);
  });

  it('should return true if audio is available in current language accent', () => {
    component.voiceoverToBePlayed = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    expect(component.isAudioAvailableInCurrentLanguageAccent()).toBe(true);
  });

  it('should return false if audio is not available in current language accent', () => {
    component.voiceoverToBePlayed = undefined;

    expect(component.isAudioAvailableInCurrentLanguageAccent()).toBe(false);
  });

  it('should return true if current audio translation needs update', () => {
    component.voiceoverToBePlayed = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: true,
      duration_secs: 10,
    });

    expect(component.doesCurrentAudioTranslationNeedUpdate()).toBe(true);
  });

  it('should return false if current audio translation does not need update', () => {
    component.voiceoverToBePlayed = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    expect(component.doesCurrentAudioTranslationNeedUpdate()).toBe(false);
  });

  it('should return false if voiceover is undefined when checking needs update', () => {
    component.voiceoverToBePlayed = undefined;

    expect(component.doesCurrentAudioTranslationNeedUpdate()).toBe(false);
  });

  it('should update displayable language accent descriptions', () => {
    spyOn(
      voiceoverPlayerService,
      'getLanguageAccentDescriptions'
    ).and.returnValue(['English (US)', 'English (UK)']);
    spyOn(component, 'updateSelectedLanguageAccent');

    component.updateDisplayableLanguageAccentDescription();

    expect(component.languageAccentDescriptions).toEqual([
      'English (US)',
      'English (UK)',
    ]);
    expect(component.selectedLanguageAccentDescription).toBe('English (US)');
    expect(component.updateSelectedLanguageAccent).toHaveBeenCalled();
  });

  it('should not update selected language accent if no descriptions available', () => {
    spyOn(
      voiceoverPlayerService,
      'getLanguageAccentDescriptions'
    ).and.returnValue([]);
    spyOn(component, 'updateSelectedLanguageAccent');

    component.updateDisplayableLanguageAccentDescription();

    expect(component.languageAccentDescriptions).toEqual([]);
    expect(component.updateSelectedLanguageAccent).not.toHaveBeenCalled();
  });

  it('should update selected language accent with manual voiceover', () => {
    const manualVoiceover = Voiceover.createFromBackendDict({
      filename: 'manual.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    const mockEntityVoiceovers = jasmine.createSpyObj('EntityVoiceovers', [
      'getManualVoiceover',
      'getAutomaticVoiceover',
    ]);
    mockEntityVoiceovers.getManualVoiceover.and.returnValue(manualVoiceover);
    mockEntityVoiceovers.getAutomaticVoiceover.and.returnValue(null);

    voiceoverPlayerService.languageAccentDescriptionsToCodes = {
      'English (US)': 'en-US',
    };
    voiceoverPlayerService.activeContentId = 'content1';
    component.selectedLanguageAccentDescription = 'English (US)';

    spyOn(audioPlayerService, 'stop');
    spyOn(audioPlayerService, 'clear');
    spyOn(component, 'setProgress');
    spyOn(entityVoiceoversService, 'setActiveLanguageAccentCode');
    spyOn(entityVoiceoversService, 'getActiveEntityVoiceovers').and.returnValue(
      mockEntityVoiceovers
    );
    spyOn(
      entityVoiceoversService,
      'getAllContentIdsToVoiceovers'
    ).and.returnValue({});
    spyOn(audioPreloaderService, 'restartAudioPreloader');
    spyOn(component, 'getCurrentStateName').and.returnValue('TestState');

    component.updateSelectedLanguageAccent();

    expect(audioPlayerService.stop).toHaveBeenCalled();
    expect(audioPlayerService.clear).toHaveBeenCalled();
    expect(component.setProgress).toHaveBeenCalledWith({value: 0});
    expect(
      entityVoiceoversService.setActiveLanguageAccentCode
    ).toHaveBeenCalledWith('en-US');
    expect(component.voiceoverToBePlayed).toBe(manualVoiceover);
    expect(audioPreloaderService.restartAudioPreloader).toHaveBeenCalledWith(
      'TestState'
    );
  });

  it('should update selected language accent with automatic voiceover when manual needs update', () => {
    const manualVoiceover = Voiceover.createFromBackendDict({
      filename: 'manual.mp3',
      file_size_bytes: 1000,
      needs_update: true,
      duration_secs: 10,
    });
    const automaticVoiceover = Voiceover.createFromBackendDict({
      filename: 'auto.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    const mockEntityVoiceovers = jasmine.createSpyObj('EntityVoiceovers', [
      'getManualVoiceover',
      'getAutomaticVoiceover',
    ]);
    mockEntityVoiceovers.getManualVoiceover.and.returnValue(manualVoiceover);
    mockEntityVoiceovers.getAutomaticVoiceover.and.returnValue(
      automaticVoiceover
    );

    voiceoverPlayerService.languageAccentDescriptionsToCodes = {
      'English (US)': 'en-US',
    };
    voiceoverPlayerService.activeContentId = 'content1';
    component.selectedLanguageAccentDescription = 'English (US)';

    spyOn(audioPlayerService, 'stop');
    spyOn(audioPlayerService, 'clear');
    spyOn(component, 'setProgress');
    spyOn(entityVoiceoversService, 'setActiveLanguageAccentCode');
    spyOn(entityVoiceoversService, 'getActiveEntityVoiceovers').and.returnValue(
      mockEntityVoiceovers
    );
    spyOn(
      entityVoiceoversService,
      'getAllContentIdsToVoiceovers'
    ).and.returnValue({});
    spyOn(audioPreloaderService, 'restartAudioPreloader');
    spyOn(component, 'getCurrentStateName').and.returnValue('TestState');

    component.updateSelectedLanguageAccent();

    expect(component.voiceoverToBePlayed).toBe(automaticVoiceover);
  });

  it('should get current state name from player position service when in exploration player page', () => {
    spyOn(pageContextService, 'isInExplorationPlayerPage').and.returnValue(
      true
    );
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'PlayerState'
    );

    const result = component.getCurrentStateName();

    expect(result).toBe('PlayerState');
  });

  it('should get current state name from state editor service when not in exploration player page', () => {
    spyOn(pageContextService, 'isInExplorationPlayerPage').and.returnValue(
      false
    );
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'EditorState'
    );

    const result = component.getCurrentStateName();

    expect(result).toBe('EditorState');
  });

  it('should handle play button click with voiceover available', () => {
    component.isPaused = true;
    component.voiceoverToBePlayed = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    spyOn(component, 'playPauseUploadedAudioTranslation');
    spyOn(siteAnalyticsService, 'registerStartAudioPlayedEvent');
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);

    component.onPlayButtonClicked();

    expect(component.isPaused).toBe(false);
    expect(component.progressBarIsShown).toBe(true);
    expect(component.playPauseUploadedAudioTranslation).toHaveBeenCalled();
    expect(
      siteAnalyticsService.registerStartAudioPlayedEvent
    ).toHaveBeenCalledWith('exp1', 0);
  });

  it('should return true if audio file is cached', () => {
    const voiceover = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });
    spyOn(assetsBackendApiService, 'isCached').and.returnValue(true);

    const result = component.isCached(voiceover);

    expect(result).toBe(true);
    expect(assetsBackendApiService.isCached).toHaveBeenCalledWith('test.mp3');
  });

  it('should play uploaded audio when track is loaded and not playing', () => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
    spyOn(audioPlayerService, 'play');

    component.playPauseUploadedAudioTranslation();

    expect(audioPlayerService.play).toHaveBeenCalled();
  });

  it('should load and play audio when track is not loaded', () => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);
    spyOn(component, 'loadAndPlayAudioTranslation');

    component.playPauseUploadedAudioTranslation();

    expect(component.loadAndPlayAudioTranslation).toHaveBeenCalled();
  });

  it('should pause audio when playing', () => {
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
    spyOn(audioPlayerService, 'pause');

    component.playPauseUploadedAudioTranslation();

    expect(audioPlayerService.pause).toHaveBeenCalled();
  });

  it('should play cached audio translation', fakeAsync(() => {
    spyOn(audioPlayerService, 'loadAsync').and.returnValue(Promise.resolve());
    spyOn(audioPlayerService, 'play');

    component.playCachedAudioTranslation('test.mp3');
    tick();

    expect(audioPlayerService.loadAsync).toHaveBeenCalledWith('test.mp3');
    expect(component.audioLoadingIndicatorIsShown).toBe(false);
    expect(audioPlayerService.play).toHaveBeenCalled();
  }));

  it('should call playCachedAudioTranslation when finished loading audio matches most recent request', () => {
    component.audioLoadingIndicatorIsShown = true;
    spyOn(
      audioPreloaderService,
      'getMostRecentlyRequestedAudioFilename'
    ).and.returnValue('test.mp3');
    spyOn(component, 'playCachedAudioTranslation');

    component.onFinishedLoadingAudio('test.mp3');

    expect(component.playCachedAudioTranslation).toHaveBeenCalledWith(
      'test.mp3'
    );
  });

  it('should not call playCachedAudioTranslation when finished loading audio does not match most recent request', () => {
    component.audioLoadingIndicatorIsShown = true;
    spyOn(
      audioPreloaderService,
      'getMostRecentlyRequestedAudioFilename'
    ).and.returnValue('other.mp3');
    spyOn(component, 'playCachedAudioTranslation');

    component.onFinishedLoadingAudio('test.mp3');

    expect(component.playCachedAudioTranslation).not.toHaveBeenCalled();
  });

  it('should not call playCachedAudioTranslation when audio loading indicator is not shown', () => {
    component.audioLoadingIndicatorIsShown = false;
    spyOn(
      audioPreloaderService,
      'getMostRecentlyRequestedAudioFilename'
    ).and.returnValue('test.mp3');
    spyOn(component, 'playCachedAudioTranslation');

    component.onFinishedLoadingAudio('test.mp3');

    expect(component.playCachedAudioTranslation).not.toHaveBeenCalled();
  });

  it('should load and play cached audio translation', () => {
    component.voiceoverToBePlayed = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    spyOn(audioPreloaderService, 'setMostRecentlyRequestedAudioFilename');
    spyOn(component, 'isCached').and.returnValue(true);
    spyOn(component, 'playCachedAudioTranslation');

    component.loadAndPlayAudioTranslation();

    expect(component.audioLoadingIndicatorIsShown).toBe(true);
    expect(
      audioPreloaderService.setMostRecentlyRequestedAudioFilename
    ).toHaveBeenCalledWith('test.mp3');
    expect(component.playCachedAudioTranslation).toHaveBeenCalledWith(
      'test.mp3'
    );
  });

  it('should restart audio preloader when audio is not cached and not loading', () => {
    component.voiceoverToBePlayed = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    spyOn(audioPreloaderService, 'setMostRecentlyRequestedAudioFilename');
    spyOn(component, 'isCached').and.returnValue(false);
    spyOn(audioPreloaderService, 'isLoadingAudioFile').and.returnValue(false);
    spyOn(
      entityVoiceoversService,
      'getAllContentIdsToVoiceovers'
    ).and.returnValue({});
    spyOn(audioPreloaderService, 'restartAudioPreloader');
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'TestState'
    );

    component.loadAndPlayAudioTranslation();

    expect(audioPreloaderService.restartAudioPreloader).toHaveBeenCalledWith(
      'TestState'
    );
  });

  it('should not restart audio preloader when audio is already loading', () => {
    component.voiceoverToBePlayed = Voiceover.createFromBackendDict({
      filename: 'test.mp3',
      file_size_bytes: 1000,
      needs_update: false,
      duration_secs: 10,
    });

    spyOn(audioPreloaderService, 'setMostRecentlyRequestedAudioFilename');
    spyOn(component, 'isCached').and.returnValue(false);
    spyOn(audioPreloaderService, 'isLoadingAudioFile').and.returnValue(true);
    spyOn(audioPreloaderService, 'restartAudioPreloader');

    component.loadAndPlayAudioTranslation();

    expect(audioPreloaderService.restartAudioPreloader).not.toHaveBeenCalled();
  });

  it('should handle loadAndPlayAudioTranslation when voiceoverToBePlayed is undefined', () => {
    component.voiceoverToBePlayed = undefined;

    spyOn(audioPreloaderService, 'setMostRecentlyRequestedAudioFilename');

    component.loadAndPlayAudioTranslation();

    expect(component.audioLoadingIndicatorIsShown).toBe(true);
    expect(
      audioPreloaderService.setMostRecentlyRequestedAudioFilename
    ).not.toHaveBeenCalled();
  });

  it('should unsubscribe from directive subscriptions on destroy', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
