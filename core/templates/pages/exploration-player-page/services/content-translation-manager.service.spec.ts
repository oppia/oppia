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
 * @fileoverview Unit tests for the content translation manager service.
 */

import {
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {Interaction} from 'domain/exploration/interaction.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model';
import {StateCard} from 'domain/state_card/state-card.model';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityTranslation} from 'domain/translation/entity-translation.model';
import {ImagePreloaderService} from './image-preloader.service';
import {ExtensionTagAssemblerService} from 'services/extension-tag-assembler.service';
import {PageContextService} from 'services/page-context.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {VoiceoverPlayerService} from '../services/voiceover-player.service';
import {AutomaticVoiceoverHighlightService} from 'services/automatic-voiceover-highlight-service';
import {PlayerPositionService} from '../services/player-position.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {AudioPreloaderService} from '../services/audio-preloader.service';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

describe('Content translation manager service', () => {
  let ctms: ContentTranslationManagerService;
  let ehfs: ExplorationHtmlFormatterService;
  let pts: PlayerTranscriptService;
  let entityTranslationsService: EntityTranslationsService;
  let entityTranslation: EntityTranslation;
  let imagePreloaderService: ImagePreloaderService;
  let extensionTagAssemblerService: ExtensionTagAssemblerService;
  let pageContextService: PageContextService;
  let entityVoiceoversService: EntityVoiceoversService;
  let voiceoverPlayerService: VoiceoverPlayerService;
  let automaticVoiceoverHighlightService: AutomaticVoiceoverHighlightService;
  let playerPositionService: PlayerPositionService;
  let stateEditorService: StateEditorService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let audioPreloaderService: AudioPreloaderService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }).compileComponents();

    ctms = TestBed.inject(ContentTranslationManagerService);
    ehfs = TestBed.inject(ExplorationHtmlFormatterService);
    pts = TestBed.inject(PlayerTranscriptService);
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    imagePreloaderService = TestBed.inject(ImagePreloaderService);
    extensionTagAssemblerService = TestBed.inject(ExtensionTagAssemblerService);
    pageContextService = TestBed.inject(PageContextService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    voiceoverPlayerService = TestBed.inject(VoiceoverPlayerService);
    automaticVoiceoverHighlightService = TestBed.inject(
      AutomaticVoiceoverHighlightService
    );
    playerPositionService = TestBed.inject(PlayerPositionService);
    stateEditorService = TestBed.inject(StateEditorService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    pts.init();

    entityTranslation = EntityTranslation.createFromBackendDict({
      entity_id: 'exp',
      entity_type: 'exploration',
      entity_version: 5,
      language_code: 'fr',
      translations: {
        content: {
          content_format: 'html',
          content_value: '<p>fr content</p>',
          needs_update: false,
        },
        hint_0: {
          content_format: 'html',
          content_value: '<p>fr hint</p>',
          needs_update: false,
        },
        solution: {
          content_format: 'html',
          content_value: '<p>fr solution</p>',
          needs_update: false,
        },
        ca_placeholder_0: {
          content_format: 'unicode',
          content_value: 'fr placeholder',
          needs_update: false,
        },
        outcome_1: {
          content_format: 'html',
          content_value: '<p>fr feedback</p>',
          needs_update: false,
        },
        default_outcome: {
          content_format: 'html',
          content_value: '<p>fr default outcome</p>',
          needs_update: false,
        },
        rule_input_3: {
          content_format: 'set_of_normalized_string',
          content_value: ['fr rule input 1', 'fr rule input 2'],
          needs_update: false,
        },
      },
    });

    spyOn(
      entityTranslationsService,
      'getEntityTranslationsAsync'
    ).and.returnValue(Promise.resolve(entityTranslation));
    spyOn(imagePreloaderService, 'restartImagePreloader');
    spyOn(extensionTagAssemblerService, 'formatCustomizationArgAttrs');
    spyOn(entityVoiceoversService, 'setLanguageCode');
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.returnValue(
      Promise.resolve()
    );
    spyOn(entityVoiceoversService, 'getLanguageAccentCodes').and.returnValue([
      'en-US',
    ]);
    spyOn(entityVoiceoversService, 'getActiveEntityVoiceovers').and.returnValue(
      {
        automatedVoiceoversAudioOffsetsMsecs: {content: 100},
      }
    );
    spyOn(voiceoverPlayerService, 'setLanguageAccentCodesDescriptions');
    spyOn(
      automaticVoiceoverHighlightService,
      'setAutomatedVoiceoversAudioOffsets'
    );
    spyOn(
      automaticVoiceoverHighlightService,
      'getSentencesToHighlightForTimeRanges'
    );
    spyOn(contentTranslationLanguageService, 'setCurrentContentLanguageCode');

    spyOn(ehfs, 'getInteractionHtml').and.returnValue(
      '<div>mock interaction html</div>'
    );

    let defaultOutcomeDict = {
      dest: 'dest_default',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome',
        html: '<p>en default outcome</p>',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    };

    let answerGroupsDict = [
      {
        rule_specs: [
          {
            inputs: {
              x: {
                contentId: 'rule_input_3',
                normalizedStrSet: ['InputString'],
              },
            },
            rule_type: 'Equals',
          },
        ],
        outcome: {
          dest: 'dest_1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'outcome_1',
            html: '<p>en feedback</p>',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        training_data: ['training_data'],
        tagged_skill_misconception_id: 'skill_id-1',
      },
    ];

    let hintsDict = [
      {
        hint_content: {
          html: '<p>en hint</p>',
          content_id: 'hint_0',
        },
      },
    ];

    let solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: '<p>en solution</p>',
      },
    };

    let interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: 'en placeholder',
          },
        },
        rows: {value: 1},
        catchMisspellings: {
          value: false,
        },
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'TextInput',
      solution: solutionDict,
    };

    const interaction = Interaction.createFromBackendDict(interactionDict);

    pts.addNewCard(
      StateCard.createNewCard(
        'State 1',
        '<p>en content</p>',
        '<div>mock interaction html</div>',
        interaction,
        'content'
      )
    );
  });

  it('should get onStateCardContentUpdate emitter', () => {
    const emitter = ctms.onStateCardContentUpdate;

    expect(emitter).toBeDefined();
  });

  it('should get onLanguageChange emitter', () => {
    const emitter = ctms.onLanguageChange;

    expect(emitter).toBeDefined();
  });

  it('should switch to a new language', fakeAsync(() => {
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(pts, 'getCard').and.returnValue(pts.transcript[0]);

    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    tick();

    const card = pts.transcript[0];
    const interaction = card.getInteraction();
    const translatedCustomizationArgs = {
      placeholder: {
        value: SubtitledUnicode.createFromBackendDict({
          unicode_str: 'fr placeholder',
          content_id: 'ca_placeholder_0',
        }),
      },
      rows: {value: 1},
      catchMisspellings: {
        value: false,
      },
    };

    expect(card.contentHtml).toBe('<p>fr content</p>');
    expect(interaction.hints[0].hintContent.html).toBe('<p>fr hint</p>');
    expect(interaction.solution?.explanation.html).toBe('<p>fr solution</p>');
    expect(interaction.customizationArgs).toEqual(translatedCustomizationArgs);
    expect(interaction.answerGroups[0].outcome.feedback.html).toBe(
      '<p>fr feedback</p>'
    );
    expect(interaction.answerGroups[0].rules[0].inputs.x).toEqual({
      contentId: 'rule_input_3',
      normalizedStrSet: ['fr rule input 1', 'fr rule input 2'],
    });
    expect(interaction.defaultOutcome?.feedback.html).toBe(
      '<p>fr default outcome</p>'
    );
    expect(imagePreloaderService.restartImagePreloader).toHaveBeenCalledWith(
      'State 1'
    );
    expect(
      extensionTagAssemblerService.formatCustomizationArgAttrs
    ).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should not restart image preloader when in exploration editor page', fakeAsync(() => {
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      true
    );

    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    tick();

    expect(imagePreloaderService.restartImagePreloader).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should switch back to the original language', fakeAsync(() => {
    spyOn(pts, 'restoreImmutably');

    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    tick();
    ctms.displayTranslations('en');

    expect(pts.restoreImmutably).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should emit to onStateCardContentUpdateEmitter when the language is changed', fakeAsync(() => {
    const onStateCardContentUpdate = spyOn(
      ctms.onStateCardContentUpdate,
      'emit'
    );
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(pts, 'getCard').and.returnValue(pts.transcript[0]);

    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    tick();

    expect(onStateCardContentUpdate).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should emit to onStateCardContentUpdateEmitter when switching back to original language', () => {
    const onStateCardContentUpdate = spyOn(
      ctms.onStateCardContentUpdate,
      'emit'
    );
    spyOn(pts, 'restoreImmutably');

    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('en');

    expect(onStateCardContentUpdate).toHaveBeenCalled();
  });

  it('should change current content language', fakeAsync(() => {
    ctms.changeCurrentContentLanguage('fr');
    tick();

    expect(entityVoiceoversService.setLanguageCode).toHaveBeenCalledWith('fr');
    expect(entityVoiceoversService.fetchEntityVoiceovers).toHaveBeenCalled();
    expect(
      voiceoverPlayerService.setLanguageAccentCodesDescriptions
    ).toHaveBeenCalledWith('fr', ['en-US']);
    expect(
      automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
    ).toHaveBeenCalledWith({content: 100});
    expect(
      automaticVoiceoverHighlightService.getSentencesToHighlightForTimeRanges
    ).toHaveBeenCalled();
    expect(
      contentTranslationLanguageService.setCurrentContentLanguageCode
    ).toHaveBeenCalledWith('fr');
    discardPeriodicTasks();
  }));

  it('should handle empty automated voiceovers audio offsets when changing language', fakeAsync(() => {
    entityVoiceoversService.getActiveEntityVoiceovers = jasmine
      .createSpy()
      .and.returnValue(null);

    ctms.changeCurrentContentLanguage('fr');
    tick();

    expect(
      automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
    ).toHaveBeenCalledWith({});
    discardPeriodicTasks();
  }));

  it('should initialize lesson translations with matching language', fakeAsync(() => {
    const languageOptions = [
      {value: 'en', displayed: 'English'},
      {value: 'fr', displayed: 'French'},
    ];
    const voiceoverResponse = {
      languageAccentMasterList: {en: ['en-US']},
      languageCodesMapping: {en: 'English'},
    };

    spyOn(
      i18nLanguageCodeService,
      'getCurrentI18nLanguageCode'
    ).and.returnValue('fr');
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('en');
    spyOn(
      contentTranslationLanguageService,
      'getLanguageOptionsForDropdown'
    ).and.returnValue(languageOptions);
    spyOn(
      voiceoverBackendApiService,
      'fetchVoiceoverAdminDataAsync'
    ).and.returnValue(Promise.resolve(voiceoverResponse));
    spyOn(audioPreloaderService, 'kickOffAudioPreloader');
    spyOn(ctms, 'getCurrentStateName').and.returnValue('State1');

    audioPreloaderService.exploration = {};

    ctms.initLessonTranslations();
    tick();

    expect(
      contentTranslationLanguageService.setCurrentContentLanguageCode
    ).toHaveBeenCalledWith('fr');
    expect(voiceoverPlayerService.languageAccentMasterList).toEqual({
      en: ['en-US'],
    });
    expect(voiceoverPlayerService.languageCodesMapping).toEqual({
      en: 'English',
    });
    expect(
      voiceoverPlayerService.setLanguageAccentCodesDescriptions
    ).toHaveBeenCalledWith('fr', ['en-US']);
    expect(audioPreloaderService.kickOffAudioPreloader).toHaveBeenCalledWith(
      'State1'
    );
    discardPeriodicTasks();
  }));

  it('should initialize lesson translations without matching language', () => {
    const languageOptions = [
      {value: 'en', displayed: 'English'},
      {value: 'es', displayed: 'Spanish'},
    ];

    spyOn(
      i18nLanguageCodeService,
      'getCurrentI18nLanguageCode'
    ).and.returnValue('fr');
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('en');
    spyOn(
      contentTranslationLanguageService,
      'getLanguageOptionsForDropdown'
    ).and.returnValue(languageOptions);

    audioPreloaderService.exploration = undefined;

    ctms.initLessonTranslations();

    expect(
      contentTranslationLanguageService.setCurrentContentLanguageCode
    ).not.toHaveBeenCalledWith('fr');
  });

  it('should initialize lesson translations without exploration', () => {
    const languageOptions = [
      {value: 'en', displayed: 'English'},
      {value: 'fr', displayed: 'French'},
    ];

    spyOn(
      i18nLanguageCodeService,
      'getCurrentI18nLanguageCode'
    ).and.returnValue('fr');
    spyOn(
      contentTranslationLanguageService,
      'getCurrentContentLanguageCode'
    ).and.returnValue('en');
    spyOn(
      contentTranslationLanguageService,
      'getLanguageOptionsForDropdown'
    ).and.returnValue(languageOptions);
    spyOn(voiceoverBackendApiService, 'fetchVoiceoverAdminDataAsync');

    audioPreloaderService.exploration = undefined;

    ctms.initLessonTranslations();

    expect(
      voiceoverBackendApiService.fetchVoiceoverAdminDataAsync
    ).not.toHaveBeenCalled();
  });

  it('should get current state name in exploration player page', () => {
    spyOn(pageContextService, 'isInExplorationPlayerPage').and.returnValue(
      true
    );
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'PlayerState'
    );

    const stateName = ctms.getCurrentStateName();

    expect(stateName).toBe('PlayerState');
    expect(playerPositionService.getCurrentStateName).toHaveBeenCalled();
  });

  it('should get current state name in state editor page', () => {
    spyOn(pageContextService, 'isInExplorationPlayerPage').and.returnValue(
      false
    );
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'EditorState'
    );

    const stateName = ctms.getCurrentStateName();

    expect(stateName).toBe('EditorState');
    expect(stateEditorService.getActiveStateName).toHaveBeenCalled();
  });
});
