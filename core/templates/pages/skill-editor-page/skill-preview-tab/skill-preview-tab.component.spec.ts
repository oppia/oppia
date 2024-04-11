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
 * @fileoverview Unit tests for skill preview tab component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {QuestionBackendDict} from 'domain/question/QuestionObjectFactory';
import {InteractionRulesService} from 'pages/exploration-player-page/services/answer-classification.service';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {ExplorationPlayerStateService} from 'pages/exploration-player-page/services/exploration-player-state.service';
import {ExplorationPlayerConstants} from 'pages/exploration-player-page/exploration-player-page.constants.ts';
import {UrlService} from 'services/contextual/url.service';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {SkillPreviewTabComponent} from './skill-preview-tab.component';
import {QuestionPlayerEngineService} from 'pages/exploration-player-page/services/question-player-engine.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
const questionDict = {
  id: 'question_id',
  question_state_data: {
    content: {
      html: 'Question 1',
      content_id: 'content_1',
    },
    interaction: {
      answer_groups: [
        {
          outcome: {
            dest: 'outcome 1',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'content_5',
              html: '',
            },
            labelled_as_correct: true,
            param_changes: [],
            refresher_exploration_id: null,
          },
          rule_specs: [
            {
              rule_type: 'Equals',
              inputs: {x: 10},
            },
          ],
        },
      ],
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: 'abc',
        },
        rows: {
          value: 1,
        },
      },
      default_outcome: {
        dest: null,
        dest_if_really_stuck: null,
        feedback: {
          html: 'Correct Answer',
          content_id: 'content_2',
        },
        param_changes: [],
        labelled_as_correct: false,
      },
      hints: [
        {
          hint_content: {
            html: 'Hint 1',
            content_id: 'content_3',
          },
        },
      ],
      solution: {
        correct_answer: 'This is the correct answer',
        answer_is_exclusive: false,
        explanation: {
          html: 'Solution explanation',
          content_id: 'content_4',
        },
      },
      id: 'TextInput',
    },
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {
        content_1: {},
      },
    },
    written_translations: {
      translations_mapping: {
        content_1: {},
      },
    },
    solicit_answer_details: false,
  },
  language_code: 'en',
};

class MockQuestionBackendApiService {
  async fetchQuestionsAsync() {
    return Promise.resolve([questionDict as unknown as QuestionBackendDict]);
  }
}

describe('Skill Preview Tab Component', () => {
  let component: SkillPreviewTabComponent;
  let fixture: ComponentFixture<SkillPreviewTabComponent>;
  let urlService: UrlService;
  let skillEditorStateService: SkillEditorStateService;
  let currentInteractionService: CurrentInteractionService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let mockOnSkillChangeEmitter = new EventEmitter();
  let mockInteractionRule: InteractionRulesService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let windowDimensionsService: WindowDimensionsService;

  let displayedCard = new StateCard(
    '',
    '',
    '',
    new Interaction(
      [],
      [],
      null as unknown as InteractionCustomizationArgs,
      null,
      [],
      null,
      null
    ),
    [],
    null as unknown as RecordedVoiceovers,
    '',
    null as unknown as AudioTranslationLanguageService
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillPreviewTabComponent],
      providers: [
        SkillEditorStateService,
        UrlService,
        CurrentInteractionService,
        ExplorationPlayerStateService,
        QuestionPlayerEngineService,
        {
          provide: QuestionBackendApiService,
          useClass: MockQuestionBackendApiService,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  let questionDict1 = {
    question_state_data: {
      content: {
        html: 'question1',
      },
      interaction: {
        id: 'TextInput',
      },
    },
  } as QuestionBackendDict;
  let questionDict2 = {
    question_state_data: {
      content: {
        html: 'question2',
      },
      interaction: {
        id: 'ItemSelectionInput',
      },
    },
  } as QuestionBackendDict;
  let questionDict3 = {
    question_state_data: {
      content: {
        html: 'question3',
      },
      interaction: {
        id: 'NumericInput',
      },
    },
  } as QuestionBackendDict;
  let questionDict4 = {
    question_state_data: {
      content: {
        html: 'question4',
      },
      interaction: {
        id: 'MultipleChoiceInput',
      },
    },
  } as QuestionBackendDict;

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillPreviewTabComponent);
    component = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    questionPlayerEngineService =
      questionPlayerEngineService as unknown as jasmine.SpyObj<QuestionPlayerEngineService>;
    let skillId = 'df432fe';
    spyOn(questionPlayerEngineService, 'init').and.callFake(
      (questionObject, successCallback, errorCallback) => {}
    );
    spyOn(urlService, 'getSkillIdFromUrl').and.returnValue(skillId);
    component.ngOnInit();
  });

  it('should initialize the variables', () => {
    expect(component.questionTextFilter).toEqual('');
    expect(component.displayCardIsInitialized).toEqual(false);
    expect(component.questionsFetched).toEqual(false);
    expect(component.ALLOWED_QUESTION_INTERACTIONS).toEqual([
      'All',
      'Text Input',
      'Multiple Choice',
      'Numeric Input',
      'Item Selection',
    ]);
  });

  it('should trigger a digest loop when onSkillChange is emitted', () => {
    spyOnProperty(skillEditorStateService, 'onSkillChange').and.returnValue(
      mockOnSkillChangeEmitter
    );
    spyOn(skillEditorStateService, 'loadSkill').and.stub();

    component.ngOnInit();
    mockOnSkillChangeEmitter.emit();
  });

  it('should initialize the question card', () => {
    expect(component.displayCardIsInitialized).toEqual(false);
    component.initializeQuestionCard({} as StateCard);
    expect(component.displayCardIsInitialized).toEqual(true);
  });

  it('should tell if current supplemental card is non empty', () => {
    component.displayedCard = displayedCard;
    expect(component.isCurrentSupplementalCardNonEmpty()).toBeFalse();

    component.displayedCard = new StateCard(
      '',
      '',
      '',
      new Interaction(
        [],
        [],
        null as unknown as InteractionCustomizationArgs,
        null,
        [],
        'ImageClickInput',
        null
      ),
      [],
      null as unknown as RecordedVoiceovers,
      '',
      null as unknown as AudioTranslationLanguageService
    );

    expect(component.isCurrentSupplementalCardNonEmpty()).toBeTrue();
  });

  it('should tell if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1
    );

    expect(component.canWindowShowTwoCards()).toBeTrue();
  });

  it('should tell if supplemental card is non empty', () => {
    component.displayedCard = displayedCard;
    expect(component.displayedCard.isInteractionInline()).toBeTrue();

    component.displayedCard = new StateCard(
      '',
      '',
      '',
      new Interaction(
        [],
        [],
        null as unknown as InteractionCustomizationArgs,
        null,
        [],
        'ImageClickInput',
        null
      ),
      [],
      null as unknown as RecordedVoiceovers,
      '',
      null as unknown as AudioTranslationLanguageService
    );

    expect(component.displayedCard.isInteractionInline()).toBeFalse();
  });

  it('should filter the questions', () => {
    component.questionDicts = [
      questionDict1,
      questionDict2,
      questionDict3,
      questionDict4,
    ];

    component.questionTextFilter = 'question1';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict1]);

    component.questionTextFilter = 'question3';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict3]);

    component.questionTextFilter = '';
    component.interactionFilter = 'Item Selection';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict2]);

    component.interactionFilter = 'Numeric Input';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict3]);

    component.interactionFilter = 'Multiple Choice';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict4]);

    component.interactionFilter = 'Text Input';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict1]);
  });

  it('should trigger feedback when an answer is submitted', fakeAsync(() => {
    spyOn(explorationPlayerStateService.onOppiaFeedbackAvailable, 'emit');

    component.ngOnInit();
    currentInteractionService.onSubmit('answer', mockInteractionRule);

    expect(component.questionsFetched).toBeFalse();
  }));
});
