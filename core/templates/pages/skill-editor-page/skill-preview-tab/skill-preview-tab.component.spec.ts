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

// @ts-nocheck

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
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
  totalQuestionCount = 0;

  async fetchQuestionsAsync(
    skillIds: string[],
    questionCount: number,
    questionsSortedByDifficulty: boolean,
    page: number = 0
  ): Promise<QuestionBackendDict[]> {
    return Promise.resolve([questionDict as unknown as QuestionBackendDict]);
  }

  async fetchTotalQuestionCountForSkillIdsAsync(
    skillIds: string[]
  ): Promise<number> {
    return Promise.resolve(this.totalQuestionCount);
  }
}

describe('Skill Preview Tab Component', () => {
  let component: SkillPreviewTabComponent;
  let fixture: ComponentFixture<SkillPreviewTabComponent>;
  let urlService: UrlService;
  let skillEditorStateService: SkillEditorStateService;
  let currentInteractionService: CurrentInteractionService;
  let conversationFlowService: ConversationFlowService;
  let mockOnSkillChangeEmitter = new EventEmitter();
  let mockInteractionRule: InteractionRulesService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let windowDimensionsService: WindowDimensionsService;
  let mockQuestionBackendApiService: MockQuestionBackendApiService;

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
      declarations: [SkillPreviewTabComponent],
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
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    mockQuestionBackendApiService = TestBed.inject(
      QuestionBackendApiService
    ) as unknown as MockQuestionBackendApiService;
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
  });

  it('should initialize the variables', () => {
    component.ngOnInit();
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

  it('should fetch the first page and compute the total page count', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    const fetchSpy = spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValue(Promise.resolve([questionDict1]));
    mockQuestionBackendApiService.totalQuestionCount = 45;

    component.ngOnInit();
    flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledWith(['df432fe'], 20, false, 0);
    expect(component.totalPageCount).toBe(3);
    expect(component.questionsFetched).toBe(true);
    expect(component.displayedQuestions).toEqual([questionDict1]);
    expect(component.selectQuestionToPreview).toHaveBeenCalledWith(0);
  }));

  it('should keep filters applied when paging through questions', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    const fetchSpy = spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(
      Promise.resolve([questionDict1]),
      Promise.resolve([questionDict3]),
      Promise.resolve([questionDict1])
    );
    mockQuestionBackendApiService.totalQuestionCount = 40;

    component.ngOnInit();
    flushMicrotasks();

    component.questionTextFilter = 'question1';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict1]);

    component.nextPage();
    flushMicrotasks();

    expect(component.currentPage).toBe(1);
    expect(fetchSpy).toHaveBeenCalledWith(['df432fe'], 20, false, 1);
    // The active filter is re-applied to the newly fetched page, so the
    // non-matching question is filtered out.
    expect(component.displayedQuestions).toEqual([]);

    component.questionTextFilter = 'question3';
    component.applyFilters();
    expect(component.displayedQuestions).toEqual([questionDict3]);

    component.previousPage();
    flushMicrotasks();

    expect(component.currentPage).toBe(0);
    expect(fetchSpy).toHaveBeenCalledWith(['df432fe'], 20, false, 0);
  }));

  it('should not page before the first or past the last page', () => {
    const fetchSpy = spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValue(Promise.resolve([]));
    component.currentPage = 0;
    component.totalPageCount = 2;
    component.totalPageCountIsKnown = true;

    component.previousPage();
    expect(component.currentPage).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();

    component.currentPage = 1;
    component.nextPage();
    expect(component.currentPage).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should ignore a stale response from an older page fetch', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    let resolveFirstPage: (value: QuestionBackendDict[]) => void = () => {};
    const firstPagePromise = new Promise<QuestionBackendDict[]>(resolve => {
      resolveFirstPage = resolve;
    });
    spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(firstPagePromise, Promise.resolve([questionDict3]));
    component.questionTextFilter = '';
    component.interactionFilter = component.INTERACTION_TYPES.ALL;
    component.currentPage = 0;
    component.totalPageCount = 3;

    component.nextPage();
    component.nextPage();
    flushMicrotasks();
    expect(component.questionDicts).toEqual([questionDict3]);

    // Resolving the stale first page must not overwrite the current page.
    resolveFirstPage([questionDict1]);
    flushMicrotasks();
    expect(component.questionDicts).toEqual([questionDict3]);
  }));

  it('should ignore a stale response that targets the current page', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    let resolveFirstPage: (value: QuestionBackendDict[]) => void = () => {};
    const firstPagePromise = new Promise<QuestionBackendDict[]>(resolve => {
      resolveFirstPage = resolve;
    });
    spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(
      // The first page 0 fetch, which stays pending.
      firstPagePromise,
      // The page 1 fetch.
      Promise.resolve([questionDict3]),
      // The second page 0 fetch, which supersedes the first one.
      Promise.resolve([questionDict4])
    );
    component.questionTextFilter = '';
    component.interactionFilter = component.INTERACTION_TYPES.ALL;
    component.currentPage = 1;
    component.totalPageCount = 2;

    component.previousPage();
    flushMicrotasks();
    component.nextPage();
    flushMicrotasks();
    expect(component.currentPage).toBe(1);

    component.previousPage();
    flushMicrotasks();
    expect(component.currentPage).toBe(0);
    expect(component.questionDicts).toEqual([questionDict4]);

    // The stale page 0 response must not overwrite the newer page 0 response,
    // even though both requests target the same page.
    resolveFirstPage([questionDict1]);
    flushMicrotasks();
    expect(component.questionDicts).toEqual([questionDict4]);
  }));

  it('should restore the previous page when a page fetch fails', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    let rejectPageFetch: (reason: string) => void = () => {};
    const failedPagePromise = new Promise<QuestionBackendDict[]>(
      (resolve, reject) => {
        rejectPageFetch = reject;
      }
    );
    spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(Promise.resolve([questionDict1]), failedPagePromise);
    mockQuestionBackendApiService.totalQuestionCount = 40;

    component.ngOnInit();
    flushMicrotasks();
    expect(component.totalPageCount).toBe(2);
    expect(component.questionDicts).toEqual([questionDict1]);

    component.nextPage();
    rejectPageFetch('Error loading questions.');
    flushMicrotasks();

    // The failed fetch must not leave page 0's questions under page 1.
    expect(component.currentPage).toBe(0);
    expect(component.questionDicts).toEqual([questionDict1]);
  }));

  it('should roll back to the applied page when a pending page fetch fails', fakeAsync(() => {
    let rejectSecondPage: (reason: string) => void = () => {};
    // The first page 1 fetch never resolves, so page 1 never gets applied.
    const pendingFirstPage = new Promise<QuestionBackendDict[]>(() => {});
    const failedSecondPage = new Promise<QuestionBackendDict[]>(
      (resolve, reject) => {
        rejectSecondPage = reject;
      }
    );
    spyOn(component, 'selectQuestionToPreview');
    spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(
      Promise.resolve([questionDict1]),
      pendingFirstPage,
      failedSecondPage
    );
    mockQuestionBackendApiService.totalQuestionCount = 60;

    component.ngOnInit();
    flushMicrotasks();
    expect(component.currentPage).toBe(0);
    expect(component.questionDicts).toEqual([questionDict1]);

    // Two rapid paging requests: page 1 stays pending, page 2 fails.
    component.nextPage();
    component.nextPage();
    flushMicrotasks();
    expect(component.currentPage).toBe(2);

    rejectSecondPage('Error loading questions.');
    flushMicrotasks();

    // The rollback must target page 0, whose questions are still shown, and
    // not page 1, whose fetch never completed.
    expect(component.currentPage).toBe(0);
    expect(component.questionDicts).toEqual([questionDict1]);
  }));

  it('should ignore a failed response from an older fetch', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    let rejectOldFetch: (reason: string) => void = () => {};
    const oldFetchPromise = new Promise<QuestionBackendDict[]>(
      (resolve, reject) => {
        rejectOldFetch = reject;
      }
    );
    spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(oldFetchPromise, Promise.resolve([questionDict3]));
    component.questionTextFilter = '';
    component.interactionFilter = component.INTERACTION_TYPES.ALL;
    component.currentPage = 0;
    component.totalPageCount = 3;

    // Start a page 1 fetch that will fail later, then a newer page 2 fetch.
    component.nextPage();
    component.nextPage();
    flushMicrotasks();
    expect(component.currentPage).toBe(2);
    expect(component.questionDicts).toEqual([questionDict3]);

    // The stale failure must not roll the page back.
    rejectOldFetch('Error loading questions.');
    flushMicrotasks();
    expect(component.currentPage).toBe(2);
    expect(component.questionDicts).toEqual([questionDict3]);
  }));

  it('should keep paging forward when the question count request fails', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    const fullPageOfQuestions = new Array(component.QUESTION_COUNT).fill(
      questionDict1
    );
    const fetchSpy = spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValue(Promise.resolve(fullPageOfQuestions));
    let rejectCountFetch: (reason: string) => void = () => {};
    const failedCountPromise = new Promise<number>((resolve, reject) => {
      rejectCountFetch = reject;
    });
    spyOn(
      mockQuestionBackendApiService,
      'fetchTotalQuestionCountForSkillIdsAsync'
    ).and.returnValue(failedCountPromise);

    component.ngOnInit();
    rejectCountFetch('Error fetching question count.');
    flushMicrotasks();

    // The total is unknown and page 0 is full, so paging must stay available.
    expect(component.totalPageCountIsKnown).toBe(false);
    expect(component.totalPageCount).toBe(0);
    expect(component.questionsFetched).toBe(true);

    component.nextPage();
    flushMicrotasks();

    expect(component.currentPage).toBe(1);
    expect(fetchSpy).toHaveBeenCalledWith(['df432fe'], 20, false, 1);
  }));

  it('should detect the last page when the question count is unknown', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    const fetchSpy = spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(
      Promise.resolve(new Array(component.QUESTION_COUNT).fill(questionDict1)),
      Promise.resolve([questionDict3])
    );
    let rejectCountFetch: (reason: string) => void = () => {};
    const failedCountPromise = new Promise<number>((resolve, reject) => {
      rejectCountFetch = reject;
    });
    spyOn(
      mockQuestionBackendApiService,
      'fetchTotalQuestionCountForSkillIdsAsync'
    ).and.returnValue(failedCountPromise);

    component.ngOnInit();
    rejectCountFetch('Error fetching question count.');
    flushMicrotasks();

    component.nextPage();
    flushMicrotasks();

    // A response with fewer questions than requested marks the last page.
    expect(component.currentPage).toBe(1);
    expect(component.totalPageCount).toBe(2);
    expect(component.totalPageCountIsKnown).toBe(true);
    expect(component.questionDicts).toEqual([questionDict3]);

    component.nextPage();
    expect(component.currentPage).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  }));

  it('should stay on the last applied page when the next page is empty and the count is unknown', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    spyOn(
      mockQuestionBackendApiService,
      'fetchQuestionsAsync'
    ).and.returnValues(
      Promise.resolve(new Array(component.QUESTION_COUNT).fill(questionDict1)),
      Promise.resolve([])
    );
    let rejectCountFetch: (reason: string) => void = () => {};
    const failedCountPromise = new Promise<number>((resolve, reject) => {
      rejectCountFetch = reject;
    });
    spyOn(
      mockQuestionBackendApiService,
      'fetchTotalQuestionCountForSkillIdsAsync'
    ).and.returnValue(failedCountPromise);

    component.ngOnInit();
    rejectCountFetch('Error fetching question count.');
    flushMicrotasks();
    const appliedQuestions = component.questionDicts;

    component.nextPage();
    flushMicrotasks();

    // The requested page does not exist, so the component stays on page 0.
    expect(component.currentPage).toBe(0);
    expect(component.totalPageCount).toBe(1);
    expect(component.totalPageCountIsKnown).toBe(true);
    expect(component.questionDicts).toEqual(appliedQuestions);
  }));

  it('should finish loading when the first page is empty and the count is unknown', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    spyOn(mockQuestionBackendApiService, 'fetchQuestionsAsync').and.returnValue(
      Promise.resolve([])
    );
    let rejectCountFetch: (reason: string) => void = () => {};
    const failedCountPromise = new Promise<number>((resolve, reject) => {
      rejectCountFetch = reject;
    });
    spyOn(
      mockQuestionBackendApiService,
      'fetchTotalQuestionCountForSkillIdsAsync'
    ).and.returnValue(failedCountPromise);

    component.ngOnInit();
    flushMicrotasks();

    // An empty first page means the skill has no questions. The request has
    // completed, so the loading state must clear even though the total count
    // is unknown and no questions are displayed.
    expect(component.questionsFetched).toBe(true);
    expect(component.currentPage).toBe(0);
    expect(component.totalPageCount).toBe(0);
    expect(component.questionDicts).toEqual([]);

    rejectCountFetch('Error fetching question count.');
    flushMicrotasks();
  }));

  it('should clear the loading state when the first page fetch fails', fakeAsync(() => {
    spyOn(component, 'selectQuestionToPreview');
    let rejectPageFetch: (reason: string) => void = () => {};
    const failedPagePromise = new Promise<QuestionBackendDict[]>(
      (resolve, reject) => {
        rejectPageFetch = reject;
      }
    );
    spyOn(mockQuestionBackendApiService, 'fetchQuestionsAsync').and.returnValue(
      failedPagePromise
    );
    spyOn(
      mockQuestionBackendApiService,
      'fetchTotalQuestionCountForSkillIdsAsync'
    ).and.returnValue(Promise.resolve(0));

    component.ngOnInit();
    rejectPageFetch('Error loading questions.');
    flushMicrotasks();

    // A failed initial fetch must not leave the component stuck in the
    // loading state.
    expect(component.questionsFetched).toBe(true);
    expect(component.currentPage).toBe(0);
    expect(component.questionDicts).toEqual([]);
  }));
});
