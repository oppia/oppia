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
 * @fileoverview Unit tests for the CkEditor copy toolbar component.
 */

import {
  async,
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  TestBed,
} from '@angular/core/testing';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {
  ContentLanguageSelectorComponent,
  // eslint-disable-next-line max-len
} from 'pages/exploration-player-page/layout-directives/content-language-selector.component';
import {ContentTranslationLanguageService} from 'pages/exploration-player-page/services/content-translation-language.service';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {PlayerTranscriptService} from 'pages/exploration-player-page/services/player-transcript.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {
  SwitchContentLanguageRefreshRequiredModalComponent,
  // eslint-disable-next-line max-len
} from 'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {InteractionObjectFactory} from 'domain/exploration/InteractionObjectFactory';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {AudioPreloaderService} from '../services/audio-preloader.service';
import {VoiceoverPlayerService} from '../services/voiceover-player.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {ExplorationObjectFactory} from 'domain/exploration/ExplorationObjectFactory';

class MockContentTranslationLanguageService {
  currentLanguageCode!: string;

  getCurrentContentLanguageCode() {
    return this.currentLanguageCode;
  }

  getLanguageOptionsForDropdown() {
    return [
      {value: 'fr', displayed: 'français (French)'},
      {value: 'zh', displayed: '中文 (Chinese)'},
      {value: 'en', displayed: 'English'},
    ];
  }

  setCurrentContentLanguageCode(languageCode: string) {
    this.currentLanguageCode = languageCode;
  }
}

class MockI18nLanguageCodeService {
  getCurrentI18nLanguageCode() {
    return 'fr';
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: 'http://localhost:8181/explore/wZiXFx1iV5bz',
      pathname: '/explore/wZiXFx1iV5bz',
    },
  };
}

class MockPlatformFeatureService {
  get status(): object {
    return {
      EnableVoiceoverContribution: {
        isEnabled: true,
      },
      AddVoiceoverWithAccent: {
        isEnabled: false,
      },
    };
  }
}

describe('Content language selector component', () => {
  let component: ContentLanguageSelectorComponent;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let fixture: ComponentFixture<ContentLanguageSelectorComponent>;
  let windowRef: MockWindowRef;
  let playerTranscriptService: PlayerTranscriptService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let interactionObjectFactory: InteractionObjectFactory;
  let entityVoiceoversService: EntityVoiceoversService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let audioPreloaderService: AudioPreloaderService;
  let voiceoverPlayerService: VoiceoverPlayerService;
  let playerPositionService: PlayerPositionService;
  let explorationObjectFactory: ExplorationObjectFactory;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule, NgbModule],
      declarations: [
        ContentLanguageSelectorComponent,
        MockTranslatePipe,
        SwitchContentLanguageRefreshRequiredModalComponent,
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: ContentTranslationLanguageService,
          useClass: MockContentTranslationLanguageService,
        },
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
    })
      .overrideModule(BrowserDynamicTestingModule, {
        set: {
          entryComponents: [SwitchContentLanguageRefreshRequiredModalComponent],
        },
      })
      .compileComponents();
    contentTranslationLanguageService = TestBed.get(
      ContentTranslationLanguageService
    );
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    playerTranscriptService = TestBed.get(PlayerTranscriptService);
    audioTranslationLanguageService = TestBed.get(
      AudioTranslationLanguageService
    );
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
    fixture = TestBed.createComponent(ContentLanguageSelectorComponent);
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    voiceoverPlayerService = TestBed.inject(VoiceoverPlayerService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
    windowRef = TestBed.inject(WindowRef);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it(
    'should correctly initialize selectedLanguageCode, ' +
      'and languagesInExploration',
    () => {
      expect(component.selectedLanguageCode).toBe('fr');
      expect(component.languageOptions).toEqual([
        {value: 'fr', displayed: 'français (French)'},
        {value: 'zh', displayed: '中文 (Chinese)'},
        {value: 'en', displayed: 'English'},
      ]);
    }
  );

  it('should correcly initialize newLanguageCode', fakeAsync(() => {
    spyOn(
      component,
      'isVoiceoverContributionWithAccentEnabled'
    ).and.returnValue(true);
    entityVoiceoversService.entityType = 'exploration';
    entityVoiceoversService.entityId = 'exploration_id_1';
    entityVoiceoversService.entityVersion = 1;
    entityVoiceoversService.languageCode = 'en';
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );

    let response = {
      languageAccentMasterList: {
        en: {
          'en-US': 'English (United States)',
        },
      },
      languageCodesMapping: {
        en: {
          'en-US': true,
        },
      },
    };
    spyOn(
      voiceoverBackendApiService,
      'fetchVoiceoverAdminDataAsync'
    ).and.returnValue(Promise.resolve(response));
    spyOn(audioPreloaderService, 'kickOffAudioPreloader');
    spyOn(voiceoverPlayerService, 'setLanguageAccentCodesDescriptions');
    spyOn(audioTranslationLanguageService, 'setCurrentAudioLanguageCode');
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue('Hola');

    const explorationDict = {
      title: 'My Title',
      init_state_name: 'Introduction',
      language_code: 'en',
      auto_tts_enabled: false,
      states: {},
      param_specs: {},
      param_changes: [],
      draft_changes: [],
      is_version_of_draft_valid: true,
      version: 1,
      draft_change_list_id: 0,
      next_content_id_index: 4,
      exploration_metadata: {
        title: 'Exploration',
        category: 'Algebra',
        objective: 'To learn',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: 'Introduction',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
        edits_allowed: true,
      },
    };
    audioPreloaderService.exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);

    component.ngOnInit();
    flush();
    discardPeriodicTasks();

    expect(component.newLanguageCode).toBe('fr');

    windowRef.nativeWindow.location.href =
      'http://localhost:8181/explore/wZiXFx1iV5bz?initialContentLanguageCode=en';
    windowRef.nativeWindow.location.pathname =
      '/explore/wZiXFx1iV5bz?initialContentLanguageCode=en';

    component.ngOnInit();
    flush();
    discardPeriodicTasks();

    expect(component.newLanguageCode).toBe('en');
  }));

  it('should correctly select an option when refresh is not needed', () => {
    const setCurrentContentLanguageCodeSpy = spyOn(
      contentTranslationLanguageService,
      'setCurrentContentLanguageCode'
    );
    spyOn(
      component,
      'isVoiceoverContributionWithAccentEnabled'
    ).and.returnValue(true);
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );
    spyOn(entityVoiceoversService, 'getLanguageAccentCodes').and.returnValue(
      []
    );

    const card = StateCard.createNewCard(
      'State 1',
      '<p>Content</p>',
      '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict({
        id: 'GraphInput',
        answer_groups: [
          {
            outcome: {
              dest: 'State',
              dest_if_really_stuck: null,
              feedback: {
                html: '',
                content_id: 'This is a new feedback text',
              },
              refresher_exploration_id: 'test',
              missing_prerequisite_skill_id: 'test_skill_id',
              labelled_as_correct: true,
              param_changes: [],
            },
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
        ],
        default_outcome: {
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: '',
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: 'test',
          missing_prerequisite_skill_id: 'test_skill_id',
        },
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: true,
          },
          placeholder: {
            value: 1,
          },
        },
        hints: [],
        solution: {
          answer_is_exclusive: true,
          correct_answer: 'test_answer',
          explanation: {
            content_id: '2',
            html: 'test_explanation1',
          },
        },
      }),
      RecordedVoiceovers.createEmpty(),
      'content',
      audioTranslationLanguageService
    );
    spyOn(playerTranscriptService, 'getCard').and.returnValue(card);

    component.selectedLanguageCode = 'en';
    component.onSelectLanguage('fr');

    expect(setCurrentContentLanguageCodeSpy).toHaveBeenCalledWith('fr');
    expect(component.selectedLanguageCode).toBe('fr');
  });

  it(
    'should correctly open the refresh required modal when refresh is ' +
      'needed',
    () => {
      const setCurrentContentLanguageCodeSpy = spyOn(
        contentTranslationLanguageService,
        'setCurrentContentLanguageCode'
      );

      const card = StateCard.createNewCard(
        'State 1',
        '<p>Content</p>',
        '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict({
          id: 'GraphInput',
          answer_groups: [
            {
              outcome: {
                dest: 'State',
                dest_if_really_stuck: null,
                feedback: {
                  html: '',
                  content_id: 'This is a new feedback text',
                },
                refresher_exploration_id: 'test',
                missing_prerequisite_skill_id: 'test_skill_id',
                labelled_as_correct: true,
                param_changes: [],
              },
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: '',
            },
          ],
          default_outcome: {
            dest: 'Hola',
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: '',
            },
            labelled_as_correct: true,
            param_changes: [],
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id',
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: true,
            },
            placeholder: {
              value: 1,
            },
          },
          hints: [],
          solution: {
            answer_is_exclusive: true,
            correct_answer: 'test_answer',
            explanation: {
              content_id: '2',
              html: 'test_explanation1',
            },
          },
        }),
        RecordedVoiceovers.createEmpty(),
        'content',
        audioTranslationLanguageService
      );
      card.addInputResponsePair({
        learnerInput: '',
        oppiaResponse: '',
        isHint: false,
      });
      spyOn(playerTranscriptService, 'getCard').and.returnValue(card);

      component.onSelectLanguage('fr');
      expect(setCurrentContentLanguageCodeSpy).not.toHaveBeenCalled();
    }
  );
});
