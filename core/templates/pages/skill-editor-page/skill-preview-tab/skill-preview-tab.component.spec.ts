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
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {QuestionBackendDict} from 'domain/question/question.model';
import {InteractionRulesService} from '../../../pages/exploration-player-page/services/answer-classification.service';
import {Interaction} from 'domain/exploration/interaction.model';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {ExplorationPlayerConstants} from '../../../pages/exploration-player-page/current-lesson-player/exploration-player-page.constants';
import {UrlService} from 'services/contextual/url.service';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {SkillPreviewTabComponent} from './skill-preview-tab.component';
import {QuestionPlayerEngineService} from 'pages/exploration-player-page/services/question-player-engine.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {AlertsService} from 'services/alerts.service';
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

  async fetchQuestionsForSkillPreviewPageAsync() {
    return Promise.resolve({
      questionDicts: [questionDict as unknown as QuestionBackendDict],
      more: false,
    });
  }

  async fetchTotalQuestionCountForSkillIdsAsync() {
    return Promise.resolve(1);
  }
}

describe('Skill Preview Tab Component', () => {
  let component: SkillPreviewTabComponent;
  let fixture: ComponentFixture<SkillPreviewTabComponent>;
  let urlService: UrlService;
  let skillEditorStateService: SkillEditorStateService;
  let currentInteractionService: CurrentInteractionService;
  let conversationFlowService: ConversationFlowService;
  let questionBackendApiService: QuestionBackendApiService;
  let mockOnSkillChangeEmitter = new EventEmitter();
  let mockInteractionRule: InteractionRulesService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let windowDimensionsService: WindowDimensionsService;
  let alertsService: AlertsService;

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
    ''
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillPreviewTabComponent, MockTranslatePipe],
      providers: [
        SkillEditorStateService,
        UrlService,
        CurrentInteractionService,
        ConversationFlowService,
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
    conversationFlowService = TestBed.inject(ConversationFlowService);
    questionBackendApiService = TestBed.inject(QuestionBackendApiService);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    alertsService = TestBed.inject(AlertsService);
    questionPlayerEngineService =
      questionPlayerEngineService as unknown as jasmine.SpyObj<QuestionPlayerEngineService>;
    let skillId = 'df432fe';
    spyOn(questionPlayerEngineService, 'init').and.callFake(
      (
        questionObject: [],
        successCallback: () => void,
        errorCallback: () => void
      ) => {}
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
    expect(component.isCurrentSupplementalCardNonEmpty()).toBe(false);

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
      ''
    );

    expect(component.isCurrentSupplementalCardNonEmpty()).toBe(true);
  });

  it('should tell if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1
    );

    expect(component.canWindowShowTwoCards()).toBe(true);
  });

  it('should tell if supplemental card is non empty', () => {
    component.displayedCard = displayedCard;
    expect(component.displayedCard.isInteractionInline()).toBe(true);

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
      ''
    );

    expect(component.displayedCard.isInteractionInline()).toBe(false);
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
    spyOn(conversationFlowService.onOppiaFeedbackAvailable, 'emit');

    component.ngOnInit();
    currentInteractionService.onSubmit('answer', mockInteractionRule);

    expect(component.questionsFetched).toBe(false);
  }));

  describe('when loading paginated questions', () => {
    it(
      'should fetch total question count and load page 1 via ' +
        'loadTotalQuestionCountAndPage',
      fakeAsync(() => {
        spyOn(
          questionBackendApiService,
          'fetchTotalQuestionCountForSkillIdsAsync'
        ).and.returnValue(Promise.resolve(21));
        spyOn(component, 'loadPage').and.callThrough();

        component.loadTotalQuestionCountAndPage();
        tick();

        expect(
          questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync
        ).toHaveBeenCalledWith([component.skillId]);
        expect(component.totalQuestionCount).toBe(21);
        expect(component.loadPage).toHaveBeenCalledWith(component.page);
      })
    );

    it('should compute the correct offset for a given page in loadPage', fakeAsync(() => {
      spyOn(
        questionBackendApiService,
        'fetchQuestionsForSkillPreviewPageAsync'
      ).and.returnValue(
        Promise.resolve({questionDicts: [questionDict1], more: false})
      );
      spyOn(component, 'selectQuestionToPreview').and.stub();

      component.QUESTION_COUNT = 20;
      component.loadPage(3);
      tick();

      expect(
        questionBackendApiService.fetchQuestionsForSkillPreviewPageAsync
      ).toHaveBeenCalledWith(component.skillId, 20, 40);
    }));

    it(
      'should toggle questionsFetched, assign questionDicts, apply ' +
        'filters, and select the first question when loadPage resolves ' +
        'with results',
      fakeAsync(() => {
        spyOn(
          questionBackendApiService,
          'fetchQuestionsForSkillPreviewPageAsync'
        ).and.returnValue(
          Promise.resolve({
            questionDicts: [questionDict1, questionDict2],
            more: true,
          })
        );
        spyOn(component, 'applyFilters').and.callThrough();
        spyOn(component, 'selectQuestionToPreview').and.stub();

        component.loadPage(1);
        expect(component.questionsFetched).toBe(false);
        tick();

        expect(component.questionsFetched).toBe(true);
        expect(component.questionDicts).toEqual([questionDict1, questionDict2]);
        expect(component.applyFilters).toHaveBeenCalled();
        expect(component.selectQuestionToPreview).toHaveBeenCalledWith(0);
      })
    );

    it(
      'should not attempt to select a question when loadPage resolves ' +
        'with no questions',
      fakeAsync(() => {
        spyOn(
          questionBackendApiService,
          'fetchQuestionsForSkillPreviewPageAsync'
        ).and.returnValue(Promise.resolve({questionDicts: [], more: false}));
        spyOn(component, 'selectQuestionToPreview').and.stub();

        component.loadPage(1);
        tick();

        expect(component.questionDicts).toEqual([]);
        expect(component.selectQuestionToPreview).not.toHaveBeenCalled();
      })
    );

    it('should update the current page and load it in onPageChange', fakeAsync(() => {
      spyOn(component, 'loadPage').and.stub();

      component.onPageChange(3);

      expect(component.page).toBe(3);
      expect(component.loadPage).toHaveBeenCalledWith(3);
    }));

    it(
      'should show a warning and not call loadPage when ' +
        'fetchTotalQuestionCountForSkillIdsAsync rejects',
      fakeAsync(() => {
        spyOn(
          questionBackendApiService,
          'fetchTotalQuestionCountForSkillIdsAsync'
        ).and.returnValue(Promise.reject('Error fetching total count.'));
        spyOn(alertsService, 'addWarning').and.callThrough();
        spyOn(component, 'loadPage').and.stub();

        component.loadTotalQuestionCountAndPage();
        tick();

        expect(alertsService.addWarning).toHaveBeenCalled();
        expect(component.loadPage).not.toHaveBeenCalled();
      })
    );

    it(
      'should set questionsFetched to true and show a warning when ' +
        'fetchQuestionsForSkillPreviewPageAsync rejects',
      fakeAsync(() => {
        spyOn(
          questionBackendApiService,
          'fetchQuestionsForSkillPreviewPageAsync'
        ).and.returnValue(
          Promise.reject('Error fetching paginated questions.')
        );
        spyOn(alertsService, 'addWarning').and.callThrough();
        spyOn(component, 'selectQuestionToPreview').and.stub();

        component.loadPage(1);
        expect(component.questionsFetched).toBe(false);
        tick();

        expect(component.questionsFetched).toBe(true);
        expect(alertsService.addWarning).toHaveBeenCalled();
        expect(component.selectQuestionToPreview).not.toHaveBeenCalled();
      })
    );
  });

  describe('firstQuestionOnPageNum getter', () => {
    it('should return 0 when there are no questions', () => {
      component.totalQuestionCount = 0;
      component.page = 1;

      expect(component.firstQuestionOnPageNum).toBe(0);
    });

    it('should return the correct first question number for a given page', () => {
      component.QUESTION_COUNT = 20;
      component.totalQuestionCount = 45;

      component.page = 1;
      expect(component.firstQuestionOnPageNum).toBe(1);

      component.page = 2;
      expect(component.firstQuestionOnPageNum).toBe(21);

      component.page = 3;
      expect(component.firstQuestionOnPageNum).toBe(41);
    });
  });

  describe('lastQuestionOnPageNum getter', () => {
    it('should return a full page size when the page is not the last one', () => {
      component.QUESTION_COUNT = 20;
      component.totalQuestionCount = 45;
      component.page = 1;

      expect(component.lastQuestionOnPageNum).toBe(20);
    });

    it(
      'should be capped at totalQuestionCount on the final, partially ' +
        'filled page',
      () => {
        component.QUESTION_COUNT = 20;
        component.totalQuestionCount = 45;
        component.page = 3;

        expect(component.lastQuestionOnPageNum).toBe(45);
      }
    );
  });
});
