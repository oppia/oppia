// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for Questions List Component.
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
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {QuestionUndoRedoService} from 'domain/editor/undo_redo/question-undo-redo.service';
import {
  EditableQuestionBackendApiService,
  FetchQuestionResponse,
  SkillLinkageModificationsArray,
} from 'domain/question/editable-question-backend-api.service';
import {QuestionSummary} from 'domain/question/question-summary-object.model';
import {Question} from 'domain/question/question.model';
import {Misconception} from 'domain/skill/misconception.model';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {SkillDifficulty} from 'domain/skill/skill-difficulty.model';
import {Skill} from 'domain/skill/skill.model';
import {State} from 'domain/state/state.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SkillEditorRoutingService} from 'pages/skill-editor-page/services/skill-editor-routing.service';
import {AlertsService} from 'services/alerts.service';
import {PageContextService} from 'services/page-context.service';
import {LoggerService} from 'services/contextual/logger.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {QuestionValidationService} from 'services/question-validation.service';
import {QuestionsListService} from 'services/questions-list.service';
import {QuestionsListComponent} from './questions-list.component';

class MockNgbModalRef {
  componentInstance = {
    skillSummaries: null,
    skillsInSameTopicCount: null,
    categorizedSkills: null,
    allowSkillsFromOtherTopics: null,
    untriagedSkillSummaries: null,
  };
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockUrlInterpolationService {
  interpolateUrl(
    value: string,
    interpolationValues?: Record<string, string | null>
  ): string {
    // Defensive check: ensure all interpolation values are valid strings.
    if (interpolationValues) {
      for (const key in interpolationValues) {
        if (
          interpolationValues[key] === null ||
          interpolationValues[key] === undefined
        ) {
          console.warn(
            `Warning: interpolateUrl received null/undefined for key '${key}'`
          );
          // Return a safe default URL instead of throwing an error.
          return '/assets/images/default-thumbnail.svg';
        }
      }
    }
    return value;
  }
}

// Helper to access component's private services in tests via bracket notation.
// TypeScript allows bracket notation to access private members for testing purposes.
// We use Reflect.get to access private members in tests where needed to avoid unsafe casts,
// which is necessary for testing private properties that don't have an index signature.
const getPrivate = <T>(comp: QuestionsListComponent, key: string): T => {
  // We need to use bracket notation to access private members in tests.
  // eslint-disable-next-line dot-notation
  return Reflect.get(comp as object, key) as T;
};

describe('Questions List Component', () => {
  let component: QuestionsListComponent;
  let fixture: ComponentFixture<QuestionsListComponent>;
  let ngbModal: NgbModal;
  let windowDimensionsService: WindowDimensionsService;
  let questionsListService: QuestionsListService;
  let skillEditorRoutingService: SkillEditorRoutingService;
  let skillBackendApiService: SkillBackendApiService;
  let alertsService: AlertsService;
  let loggerService: LoggerService;
  let editableQuestionBackendApiService: EditableQuestionBackendApiService;
  let questionUndoRedoService: QuestionUndoRedoService;
  let pageContextService: PageContextService;
  let questionValidationService: QuestionValidationService;
  let skill: Skill;
  let question!: Question;
  let questionStateData!: State;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [QuestionsListComponent],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        WindowDimensionsService,
        QuestionsListService,
        SkillEditorRoutingService,
        SkillBackendApiService,
        AlertsService,
        EditableQuestionBackendApiService,
        QuestionUndoRedoService,
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
        },
        PageContextService,
        QuestionValidationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionsListComponent);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);

    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    questionsListService = TestBed.inject(QuestionsListService);
    skillEditorRoutingService = TestBed.inject(SkillEditorRoutingService);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    editableQuestionBackendApiService = TestBed.inject(
      EditableQuestionBackendApiService
    );
    questionUndoRedoService = TestBed.inject(QuestionUndoRedoService);
    loggerService = TestBed.inject(LoggerService);
    pageContextService = TestBed.inject(PageContextService);
    questionValidationService = TestBed.inject(QuestionValidationService);

    question = Question.createFromBackendDict({
      id: '1',
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
                missing_prerequisite_skill_id: null,
              },
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
            },
          ],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: '',
              },
            },
            rows: {value: 1},
            catchMisspellings: {
              value: false,
            },
          },
          default_outcome: {
            dest: '',
            dest_if_really_stuck: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2',
            },
            param_changes: [],
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
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
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        inapplicable_skill_misconception_ids: [],
      },
      inapplicable_skill_misconception_ids: [],
      language_code: 'en',
      linked_skill_ids: [],
      next_content_id_index: 5,
      question_state_data_schema_version: 44,
      version: 45,
    });

    questionStateData = question.getStateData();

    skill = Skill.createFromBackendDict({
      id: 'skillId1',
      description: 'test description 1',
      misconceptions: [
        {
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true,
        },
      ],
      rubrics: [],
      skill_contents: {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: false,
      next_misconception_id: 0,
      superseding_skill_id: '',
    });

    component.selectedSkillId = 'skillId1';
  });

  it(
    'should subscribe to question summaries init event on' +
      ' component initialization',
    () => {
      spyOn(questionsListService.onQuestionSummariesInitialized, 'subscribe');

      component.ngOnInit();

      expect(
        questionsListService.onQuestionSummariesInitialized.subscribe
      ).toHaveBeenCalled();
    }
  );

  it(
    'should reset history and fetch question summaries on' + ' initialization',
    () => {
      let resetHistoryAndFetch = true;
      spyOn(questionsListService, 'getQuestionSummariesAsync');

      component.ngOnInit();

      expect(
        questionsListService.getQuestionSummariesAsync
      ).toHaveBeenCalledWith(
        'skillId1',
        resetHistoryAndFetch,
        resetHistoryAndFetch
      );
    }
  );

  it(
    'should not reset history and fetch question summaries when question' +
      ' summaries are initialized',
    () => {
      let resetHistoryAndFetch = false;
      let questionSummariesInitializedEmitter = new EventEmitter();
      spyOnProperty(
        questionsListService,
        'onQuestionSummariesInitialized'
      ).and.returnValue(questionSummariesInitializedEmitter);
      spyOn(questionsListService, 'getQuestionSummariesAsync');

      component.ngOnInit();

      questionSummariesInitializedEmitter.emit();

      expect(
        questionsListService.getQuestionSummariesAsync
      ).toHaveBeenCalledWith(
        'skillId1',
        resetHistoryAndFetch,
        resetHistoryAndFetch
      );
    }
  );

  it(
    'should fetch misconception ids for selected skill on' + ' initialization',
    fakeAsync(() => {
      component.selectedSkillId = 'true';
      spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
        Promise.resolve({
          skill: skill,
          assignedSkillTopicData: {},
          groupedSkillSummaries: {},
        })
      );

      expect(component.misconceptionIdsForSelectedSkill).toBeUndefined();

      component.ngOnInit();
      tick();

      expect(component.misconceptionIdsForSelectedSkill).toEqual([2]);
    })
  );

  it(
    'should fetch difficulty count for selected skill on' + ' initialization',
    fakeAsync(() => {
      component.selectedSkillId = 'true';

      const skillWithExplanations = Skill.createFromBackendDict({
        id: 'skillId1',
        description: 'test description 1',
        misconceptions: [],
        rubrics: [
          {
            difficulty: 'Easy',
            explanations: ['explanation1'],
          },
          {
            difficulty: 'Medium',
            explanations: [],
          },
        ],
        skill_contents: {
          explanation: {html: 'test explanation', content_id: 'explanation'},
          recorded_voiceovers: {voiceovers_mapping: {}},
        },
        language_code: 'en',
        version: 3,
        prerequisite_skill_ids: [],
        all_questions_merged: false,
        next_misconception_id: 0,
        superseding_skill_id: '',
      });

      spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
        Promise.resolve({
          skill: skillWithExplanations,
          assignedSkillTopicData: {},
          groupedSkillSummaries: {},
        })
      );

      expect(component.difficultyCount).toBeUndefined();

      component.ngOnInit();
      tick();

      expect(component.difficultyCount).toEqual(1);
    })
  );

  it('should start creating question on navigating to question editor', () => {
    spyOn(
      skillEditorRoutingService,
      'navigateToQuestionEditor'
    ).and.returnValue(true);
    spyOn(component, 'createQuestion').and.stub();

    component.ngOnInit();

    expect(component.createQuestion).toHaveBeenCalled();
  });

  it('should not start creating a question if there are alerts', fakeAsync(() => {
    alertsService.addWarning('a warning');
    spyOn(loggerService, 'error').and.stub();

    component.createQuestion();

    expect(loggerService.error).toHaveBeenCalledWith(
      'Could not create new question due to warnings: a warning'
    );
  }));

  it('should get selected skill id when a question is created', () => {
    // When modal is not shown, then newQuestionSkillIds get the values of
    // skillIds.
    expect(component.newQuestionSkillIds).toBeUndefined();

    component.selectSkillModalIsShown = true;
    component.createQuestion();

    expect(component.newQuestionSkillIds).toEqual(['skillId1']);

    component.selectSkillModalIsShown = false;
    component.createQuestion();

    expect(component.newQuestionSkillIds).toEqual(['skillId1']);
  });

  it('should populate misconceptions when a question is created', fakeAsync(() => {
    const skill = Skill.createFromBackendDict({
      id: 'skillId1',
      description: 'test description 1',
      misconceptions: [
        {
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true,
        },
      ],
      rubrics: [],
      skill_contents: {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: false,
      next_misconception_id: 0,
      superseding_skill_id: '',
    });
    spyOn(skillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
      Promise.resolve([skill])
    );
    component.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', '', 1),
    ];

    expect(component.misconceptionsBySkill).toBeUndefined();

    component.createQuestion();
    tick();

    expect(component.misconceptionsBySkill).toEqual({
      skillId1: [
        Misconception.createFromBackendDict({
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true,
        }),
      ],
    });
  }));

  it('should create question with proper skill linkage initialization', () => {
    component.selectedSkillId = 'skillId2';
    spyOn(
      getPrivate<{setFocus: (focusLabel: string) => void}>(
        component,
        'focusManagerService'
      ),
      'setFocus'
    );
    spyOn(component, 'populateMisconceptions');
    spyOn(
      getPrivate<{flushStoredImagesData: () => void}>(
        component,
        'imageLocalStorageService'
      ),
      'flushStoredImagesData'
    );
    spyOn(pageContextService, 'setImageSaveDestinationToLocalStorage');
    spyOn(
      getPrivate<{
        toggleQuestionEditor: (
          isOpen: boolean,
          newQuestionIsBeingCreated?: boolean
        ) => void;
      }>(component, 'topicEditorStateService'),
      'toggleQuestionEditor'
    );

    component.createQuestion();

    expect(component.newQuestionSkillIds).toEqual(['skillId2']);
    expect(component.linkedSkillsWithDifficulty.length).toBe(1);
    expect(component.linkedSkillsWithDifficulty[0].getId()).toBe('skillId2');
    expect(component.newQuestionSkillDifficulties).toEqual([0.6]);
    expect(component.showDifficultyChoices).toBe(true);
    expect(component.newQuestionIsBeingCreated).toBe(true);
    expect(component.editorIsOpen).toBe(true);
    expect(component.skillLinkageModificationsArray).toEqual([]);
    expect(component.isSkillDifficultyChanged).toBe(false);
  });

  it('should create question with multiple skills', () => {
    component.selectedSkillId = 'skillId1';
    component.createQuestion();

    // Add additional skill.
    component.linkedSkillsWithDifficulty.push(
      SkillDifficulty.create('skillId2', 'Skill 2', 0.8)
    );
    component.changeLinkedSkillDifficulty();

    expect(component.newQuestionSkillIds).toContain('skillId2');
    expect(component.newQuestionSkillDifficulties).toContain(0.8);
    expect(component.skillLinkageModificationsArray.length).toBeGreaterThan(0);
  });

  it('should handle changeLinkedSkillDifficulty for question being updated', () => {
    component.questionIsBeingUpdated = true;
    component.isSkillDifficultyChanged = true;
    component.newQuestionSkillIds = ['skillId1'];
    component.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', 'Skill 1', 0.7),
    ];
    component.skillLinkageModificationsArray = [];

    component.changeLinkedSkillDifficulty();

    expect(component.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.7,
      },
    ]);
  });

  it('should handle changeLinkedSkillDifficulty for single skill', () => {
    component.questionIsBeingUpdated = false;
    component.newQuestionSkillIds = ['skillId1'];
    component.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', 'Skill 1', 0.9),
    ];
    component.skillLinkageModificationsArray = [];

    component.changeLinkedSkillDifficulty();

    expect(component.newQuestionSkillDifficulties).toEqual([0.9]);
    expect(component.isSkillDifficultyChanged).toBe(true);
  });

  it('should initialize undefined arrays in changeLinkedSkillDifficulty', () => {
    component.questionIsBeingUpdated = false;
    Reflect.set(component as object, 'newQuestionSkillIds', undefined);
    Reflect.set(component as object, 'newQuestionSkillDifficulties', undefined);
    component.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', 'Skill 1', 0.9),
    ];
    component.skillLinkageModificationsArray = [];

    component.changeLinkedSkillDifficulty();

    expect(component.newQuestionSkillIds).toEqual(['skillId1']);
    expect(component.newQuestionSkillDifficulties).toEqual([0.9]);
  });

  it('should show warning message if fetching skills fails', () => {
    spyOn(alertsService, 'addWarning');
    spyOn(skillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
      Promise.reject('Error occurred.')
    );

    component.populateMisconceptions(['']);

    expect(skillBackendApiService.fetchMultiSkillsAsync).toHaveBeenCalled();
  });

  it('should show the index of a question', () => {
    spyOn(questionsListService, 'getCurrentPageNumber').and.returnValue(5);

    // Question index = NUM_QUESTION_PER_PAGE (10) * current page number (5) +
    // index + 1 = 10 * 5 + 1 + 1 = 52.
    expect(component.getQuestionIndex(1)).toBe(52);
  });

  it('should fetch question summaries and use them on moving to next page', done => {
    component.selectedSkillId = 'skillId1';
    spyOn(questionsListService, 'incrementPageNumber');
    spyOn(questionsListService, 'getQuestionSummariesAsync').and.resolveTo();
    spyOn(questionsListService, 'getCachedQuestionSummaries');

    component.goToNextPage();

    // Since goToNextPage calls an async function but is not async itself, we need to let that call finish.
    setTimeout(() => {
      expect(questionsListService.incrementPageNumber).toHaveBeenCalled();
      expect(
        questionsListService.getQuestionSummariesAsync
      ).toHaveBeenCalledWith('skillId1', true, false);
      expect(
        questionsListService.getCachedQuestionSummaries
      ).toHaveBeenCalled();
      done();
    });
  });

  it('should use cached question summaries on moving to previous page', () => {
    component.selectedSkillId = 'skillId1';
    spyOn(questionsListService, 'decrementPageNumber');
    spyOn(questionsListService, 'getCachedQuestionSummaries');

    component.goToPreviousPage();

    expect(questionsListService.decrementPageNumber).toHaveBeenCalled();
    expect(questionsListService.getCachedQuestionSummaries).toHaveBeenCalled();
  });

  it(
    'should check if warning is to be shown for unaddressed skill' +
      ' misconceptions',
    () => {
      // The selected skill id is skillId1.
      component.misconceptionIdsForSelectedSkill = [1, 2];

      expect(
        component.showUnaddressedSkillMisconceptionWarning([
          'skillId1-1',
          'skillId1-2',
        ])
      ).toBe(true);
      expect(
        component.showUnaddressedSkillMisconceptionWarning([
          'skillId1-1',
          'skillId2-2',
        ])
      ).toBe(false);
    }
  );

  it('should handle skill misconception IDs that do not start with selected skill ID', () => {
    component.misconceptionIdsForSelectedSkill = [1];
    spyOn(
      getPrivate<{
        isEquivalent: (a: Object | null, b: Object | null) => boolean;
      }>(component, 'utilsService'),
      'isEquivalent'
    ).and.returnValue(true);

    const result = component.showUnaddressedSkillMisconceptionWarning([
      'skillId1-1',
      'otherskill-2',
    ]);

    expect(result).toBe(true);
    expect(
      getPrivate<{
        isEquivalent: (a: Object | null, b: Object | null) => boolean;
      }>(component, 'utilsService').isEquivalent
    ).toHaveBeenCalledWith([1, undefined], [1]);
  });

  it("should get skill editor's URL", () => {
    expect(component.getSkillEditorUrl('skillId1')).toBe(
      '/skill_editor/skillId1'
    );
  });

  it('should check if current page is the last one', () => {
    spyOn(questionsListService, 'isLastQuestionBatch').and.returnValue(true);

    expect(component.isLastPage()).toBe(true);
  });

  it(
    'should not save and publish question if there are' + ' validation errors',
    () => {
      component.question = question;
      spyOn(alertsService, 'addWarning');
      spyOn(
        questionValidationService,
        'getValidationErrorMessage'
      ).and.returnValue('Error');
      spyOn(
        component.question,
        'getUnaddressedMisconceptionNames'
      ).and.returnValue(['misconception1', 'misconception2']);

      component.saveAndPublishQuestion('Commit');

      expect(alertsService.addWarning).toHaveBeenCalledWith('Error');
    }
  );

  it('should not save and publish question if there are unaddressed misconceptions', () => {
    component.question = question;
    spyOn(alertsService, 'addWarning');
    spyOn(
      questionValidationService,
      'getValidationErrorMessage'
    ).and.returnValue('');
    spyOn(
      component.question,
      'getUnaddressedMisconceptionNames'
    ).and.returnValue(['misconception1', 'misconception2']);

    component.saveAndPublishQuestion('Commit');

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Remaining misconceptions that need to be addressed: misconception1, misconception2'
    );
  });

  it(
    'should show an error and not save question if there are' +
      ' errors from question backend api service',
    fakeAsync(() => {
      component.question = question;
      component.questionIsBeingUpdated = false;
      spyOn(
        editableQuestionBackendApiService,
        'createQuestionAsync'
      ).and.returnValue(Promise.reject('Error'));
      spyOn(
        component.question,
        'getUnaddressedMisconceptionNames'
      ).and.returnValue([]);
      spyOn(alertsService, 'addWarning');

      component.saveAndPublishQuestion('');
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith('Error');
    })
  );

  it(
    'should create new question in the backend if there are no validation' +
      ' error on saving and publishing a question when question is not already' +
      ' being updated',
    fakeAsync(() => {
      component.question = question;
      component.questionIsBeingUpdated = false;
      component.skillLinkageModificationsArray = [
        {
          id: '1',
          task: 'update_difficulty',
          difficulty: 1,
        },
        {
          id: '2',
          task: 'update_difficulty',
          difficulty: 2,
        },
        {
          id: '1',
          task: 'update_difficulty',
          difficulty: 1,
        },
      ];

      spyOn(
        questionValidationService,
        'getValidationErrorMessage'
      ).and.returnValue('');
      spyOn(
        component.question,
        'getUnaddressedMisconceptionNames'
      ).and.returnValue([]);
      spyOn(
        editableQuestionBackendApiService,
        'createQuestionAsync'
      ).and.returnValue(
        Promise.resolve({
          questionId: 'qId',
        })
      );
      spyOn(editableQuestionBackendApiService, 'editQuestionSkillLinksAsync');

      component.saveAndPublishQuestion('Commit');
      tick();

      // When creating a new question, skills are already linked via createQuestionAsync.
      // Additional skill linkage modifications with valid tasks should be applied.
      expect(
        editableQuestionBackendApiService.editQuestionSkillLinksAsync
      ).toHaveBeenCalledWith('qId', [
        {
          id: '1',
          task: 'update_difficulty',
          difficulty: 1,
        },
        {
          id: '2',
          task: 'update_difficulty',
          difficulty: 2,
        },
        {
          id: '1',
          task: 'update_difficulty',
          difficulty: 1,
        },
      ]);
    })
  );

  it('should handle stored images when creating a new question', fakeAsync(() => {
    component.question = question;
    component.questionIsBeingUpdated = false;
    component.skillLinkageModificationsArray = [];

    const mockImageData = [
      {
        filename: 'image1.png',
        imageBlob: new Blob(['image data'], {type: 'image/png'}),
      },
      {
        filename: 'image2.png',
        imageBlob: null,
      },
    ];

    spyOn(
      questionValidationService,
      'getValidationErrorMessage'
    ).and.returnValue('');
    spyOn(
      component.question,
      'getUnaddressedMisconceptionNames'
    ).and.returnValue([]);
    spyOn(
      getPrivate<{
        getStoredImagesData: () => {
          filename: string;
          imageBlob: Blob | null;
        }[];
      }>(component, 'imageLocalStorageService'),
      'getStoredImagesData'
    ).and.returnValue(mockImageData);
    spyOn(
      getPrivate<{flushStoredImagesData: () => void}>(
        component,
        'imageLocalStorageService'
      ),
      'flushStoredImagesData'
    );
    spyOn(
      editableQuestionBackendApiService,
      'createQuestionAsync'
    ).and.returnValue(
      Promise.resolve({
        questionId: 'qId',
      })
    );

    component.saveAndPublishQuestion('');
    tick();

    expect(
      getPrivate<{
        getStoredImagesData: () => {
          filename: string;
          imageBlob: Blob | null;
        }[];
      }>(component, 'imageLocalStorageService').getStoredImagesData
    ).toHaveBeenCalled();
    expect(
      getPrivate<{flushStoredImagesData: () => void}>(
        component,
        'imageLocalStorageService'
      ).flushStoredImagesData
    ).toHaveBeenCalled();
  }));

  it('should save question when another question is being updated', fakeAsync(() => {
    component.question = question;
    component.questionIsBeingUpdated = true;

    spyOn(
      questionValidationService,
      'getValidationErrorMessage'
    ).and.returnValue('');
    spyOn(
      component.question,
      'getUnaddressedMisconceptionNames'
    ).and.returnValue([]);
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(
      editableQuestionBackendApiService,
      'updateQuestionAsync'
    ).and.returnValue(Promise.resolve(null));
    spyOn(questionUndoRedoService, 'clearChanges');
    spyOn(questionsListService, 'getQuestionSummariesAsync');

    component.saveAndPublishQuestion('Commit');
    tick();

    expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    expect(questionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1',
      true,
      true
    );
  }));

  it(
    'should show error if saving question fails when another question' +
      ' is being updated',
    fakeAsync(() => {
      component.question = question;
      component.questionIsBeingUpdated = true;
      spyOn(
        questionValidationService,
        'getValidationErrorMessage'
      ).and.returnValue('');
      spyOn(
        component.question,
        'getUnaddressedMisconceptionNames'
      ).and.returnValue([]);
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(questionUndoRedoService, 'getCommittableChangeList');
      spyOn(
        editableQuestionBackendApiService,
        'updateQuestionAsync'
      ).and.returnValue(Promise.reject());
      spyOn(questionUndoRedoService, 'clearChanges');
      spyOn(questionsListService, 'getQuestionSummariesAsync');
      spyOn(alertsService, 'addWarning');

      component.saveAndPublishQuestion('Commit');
      tick();

      expect(questionUndoRedoService.clearChanges).not.toHaveBeenCalled();
      expect(
        questionsListService.getQuestionSummariesAsync
      ).not.toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'There was an error saving the question.'
      );
    })
  );

  it(
    'should display warning if commit message is not given while saving' +
      ' a question',
    fakeAsync(() => {
      component.question = question;
      component.questionIsBeingUpdated = true;
      spyOn(
        questionValidationService,
        'getValidationErrorMessage'
      ).and.returnValue('');
      spyOn(
        component.question,
        'getUnaddressedMisconceptionNames'
      ).and.returnValue([]);
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(alertsService, 'addWarning');

      component.saveAndPublishQuestion(null);
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Please provide a valid commit message.'
      );
    })
  );

  it('should handle null question version defensively when saving', fakeAsync(() => {
    // Create a question object without getVersion method.
    const questionWithoutVersion = {
      getUnaddressedMisconceptionNames: () => [],
    } as unknown as Question;
    component.question = questionWithoutVersion;
    component.questionIsBeingUpdated = true;

    spyOn(
      questionValidationService,
      'getValidationErrorMessage'
    ).and.returnValue('');
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(loggerService, 'error');

    component.saveAndPublishQuestion('Test commit');
    tick();

    expect(loggerService.error).toHaveBeenCalledWith(
      'Cannot save question: version is undefined'
    );
    expect(component.questionIsBeingSaved).toBe(false);
  }));

  it('should handle undefined question version when saving', fakeAsync(() => {
    // Create a question object with getVersion returning undefined.
    const questionWithUndefinedVersion = {
      getUnaddressedMisconceptionNames: () => [],
      getVersion: () => undefined,
    } as unknown as Question;
    component.question = questionWithUndefinedVersion;
    component.questionIsBeingUpdated = true;

    spyOn(
      questionValidationService,
      'getValidationErrorMessage'
    ).and.returnValue('');
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(loggerService, 'error');

    component.saveAndPublishQuestion('Test commit');
    tick();

    expect(loggerService.error).toHaveBeenCalledWith(
      'Cannot save question: version is undefined'
    );
    expect(component.questionIsBeingSaved).toBe(false);
  }));

  it(
    "should show 'confirm question modal exit' modal when user " +
      'clicks cancel',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          result: Promise.resolve(),
        } as NgbModalRef;
      });

      component.cancel();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    })
  );

  it(
    'should reset image save destination when user clicks confirm on' +
      " 'confirm question modal exit' modal",
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve('confirm'),
      } as NgbModalRef);
      spyOn(pageContextService, 'resetImageSaveDestination').and.stub();

      component.cancel();
      tick();

      expect(pageContextService.resetImageSaveDestination).toHaveBeenCalled();
    })
  );

  it('should not disable save button when user cancels the save modal', fakeAsync(() => {
    component.questionIsBeingUpdated = true;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);

    component.saveQuestion();
    tick();

    expect(component.questionIsBeingSaved).toBe(false);
  }));

  it(
    "should close 'confirm question modal exit' modal when user clicks" +
      ' cancel',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          result: Promise.reject(),
        } as NgbModalRef;
      });

      component.cancel();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    })
  );

  it('should update skill difficulty when user selects a difficulty', () => {
    let skill = SkillDifficulty.create('skillId1', '', 0.9);
    component.newQuestionSkillIds = ['skillId1'];
    component.linkedSkillsWithDifficulty = [];
    component.skillLinkageModificationsArray = [];
    component.questionIsBeingUpdated = false;

    component.updateSkillWithDifficulty(skill, 0);

    expect(component.linkedSkillsWithDifficulty[0]).toBe(skill);
    expect(component.newQuestionSkillDifficulties).toEqual([0.9]);
    expect(component.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.9,
      },
    ]);

    component.newQuestionSkillIds = [];
    component.linkedSkillsWithDifficulty = [];
    component.skillLinkageModificationsArray = [];
    component.newQuestionSkillDifficulties = [];
    component.questionIsBeingUpdated = false;

    component.updateSkillWithDifficulty(skill, 0);

    expect(component.newQuestionSkillIds).toEqual(['skillId1']);
    expect(component.newQuestionSkillDifficulties).toEqual([0.9]);
    expect(component.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.9,
      },
    ]);
  });

  describe('when user clicks on edit question', () => {
    let questionSummaryForOneSkill = QuestionSummary.createFromBackendDict({
      id: 'qId',
      interaction_id: '',
      misconception_ids: [],
      question_content: '',
    });
    let skillDescription = 'Skill Description';
    let difficulty: number = 0.9;

    it('should return null if editor is already opened', () => {
      component.editorIsOpen = true;

      // Passing dummy arguments to satisfy TS types.
      expect(
        component.editQuestion(
          questionSummaryForOneSkill,
          skillDescription,
          difficulty
        )
      ).toBe(undefined);
    });

    it(
      'should warning if user does not have rights to delete a' + ' question',
      () => {
        component.canEditQuestion = false;
        spyOn(alertsService, 'addWarning');

        component.editQuestion(
          questionSummaryForOneSkill,
          skillDescription,
          difficulty
        );

        expect(alertsService.addWarning).toHaveBeenCalledWith(
          'User does not have enough rights to edit the question'
        );
      }
    );

    it(
      'should fetch question data from backend and set new ' +
        "question's properties",
      fakeAsync(() => {
        component.editorIsOpen = false;
        component.canEditQuestion = true;
        component.selectSkillModalIsShown = true;

        spyOn(
          editableQuestionBackendApiService,
          'fetchQuestionAsync'
        ).and.returnValue(
          Promise.resolve({
            associated_skill_dicts: [
              {
                id: 'skillId1',
                misconceptions: [
                  {
                    id: 1,
                    feedback: '',
                    must_be_addressed: false,
                    notes: '',
                    name: 'MIsconception 1',
                  },
                ],
                description: '',
              },
            ],
            questionObject: question,
          } as FetchQuestionResponse)
        );

        component.editQuestion(
          questionSummaryForOneSkill,
          skillDescription,
          difficulty
        );
        tick();

        expect(component.question).toEqual(question);
        expect(component.questionId).toBe('1');
        expect(component.questionStateData).toEqual(questionStateData);
      })
    );

    it('should display warning if fetching from backend fails', fakeAsync(() => {
      component.editorIsOpen = false;

      component.canEditQuestion = true;
      component.selectSkillModalIsShown = false;
      spyOn(
        editableQuestionBackendApiService,
        'fetchQuestionAsync'
      ).and.returnValue(
        Promise.reject({
          error: 'Failed to fetch question.',
        })
      );
      spyOn(alertsService, 'addWarning');

      component.editQuestion(
        questionSummaryForOneSkill,
        skillDescription,
        difficulty
      );
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to fetch question.'
      );
    }));
  });

  it(
    'should save image destination to local storage if question editor is' +
      ' opened while a question is already being created',
    () => {
      component.newQuestionIsBeingCreated = true;
      spyOn(pageContextService, 'setImageSaveDestinationToLocalStorage');

      component.openQuestionEditor();

      expect(
        pageContextService.setImageSaveDestinationToLocalStorage
      ).toHaveBeenCalled();
    }
  );

  it('should properly initialize question editor when opened', () => {
    component.newQuestionIsBeingCreated = false;
    component.questionId = 'testQuestionId';
    spyOn(questionUndoRedoService, 'clearChanges');
    spyOn(
      getPrivate<{
        toggleQuestionEditor: (
          isOpen: boolean,
          newQuestionIsBeingCreated?: boolean
        ) => void;
      }>(component, 'topicEditorStateService'),
      'toggleQuestionEditor'
    );
    spyOn(
      getPrivate<{flushStoredImagesData: () => void}>(
        component,
        'imageLocalStorageService'
      ),
      'flushStoredImagesData'
    );

    component.openQuestionEditor();

    expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    expect(component.editorIsOpen).toBe(true);
    expect(
      getPrivate<{
        toggleQuestionEditor: (
          isOpen: boolean,
          newQuestionIsBeingCreated?: boolean
        ) => void;
      }>(component, 'topicEditorStateService').toggleQuestionEditor
    ).toHaveBeenCalledWith(true);
    expect(
      getPrivate<{flushStoredImagesData: () => void}>(
        component,
        'imageLocalStorageService'
      ).flushStoredImagesData
    ).toHaveBeenCalled();
  });

  describe('when removing question from skill', () => {
    let questionId = 'qId';

    it('should remove question when user is in the skill editor', fakeAsync(() => {
      component.selectedSkillId = 'skillId1';
      component.deletedQuestionIds = [];
      spyOn(alertsService, 'addSuccessMessage');
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          skillId: 'skillId',
          canEditQuestion: true,
          numberOfQuestions: 3,
        },
        result: Promise.resolve(),
      } as NgbModalRef);
      component.allSkillSummaries = [];
      spyOn(
        editableQuestionBackendApiService,
        'editQuestionSkillLinksAsync'
      ).and.returnValue(Promise.resolve());

      component.removeQuestionFromSkill(questionId, 0.6);
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Question Removed'
      );
    }));

    it('should remove question when user is not in the skill editor', fakeAsync(() => {
      component.selectedSkillId = 'skillId1';
      component.deletedQuestionIds = [];
      spyOn(alertsService, 'addSuccessMessage');
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          skillId: 'skillId',
          canEditQuestion: true,
          numberOfQuestions: 3,
        },
        result: Promise.resolve(),
      } as NgbModalRef);
      component.allSkillSummaries = [
        ShortSkillSummary.createFromBackendDict({
          skill_id: '1',
          skill_description: 'Skill Description',
        }),
      ];
      spyOn(
        editableQuestionBackendApiService,
        'editQuestionSkillLinksAsync'
      ).and.returnValue(Promise.resolve());

      component.removeQuestionFromSkill(questionId, 0.6);
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Question Removed'
      );
    }));

    it('should cancel remove question modal', fakeAsync(() => {
      component.deletedQuestionIds = [];
      spyOn(alertsService, 'addInfoMessage');
      component.allSkillSummaries = [
        ShortSkillSummary.createFromBackendDict({
          skill_id: '1',
          skill_description: 'Skill Description',
        }),
      ];
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          skillId: 'skillId',
          canEditQuestion: true,
          numberOfQuestions: 3,
        },
        result: Promise.reject(),
      } as NgbModalRef);
      spyOn(
        editableQuestionBackendApiService,
        'editQuestionSkillLinksAsync'
      ).and.returnValue(Promise.resolve());
      spyOn(component, 'removeQuestionSkillLinkAsync');

      component.removeQuestionFromSkill(questionId, 0.6);
      tick();
      expect(ngbModal.open).toHaveBeenCalled();
      expect(component.removeQuestionSkillLinkAsync).not.toHaveBeenCalled();
    }));
  });

  it('should remove question skill link asynchronously', fakeAsync(() => {
    component.selectedSkillId = 'skillId1';
    component.deletedQuestionIds = [];
    spyOn(questionsListService, 'resetPageNumber');
    spyOn(questionsListService, 'getQuestionSummariesAsync');
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(component, '_removeArrayElement');
    spyOn(
      editableQuestionBackendApiService,
      'editQuestionSkillLinksAsync'
    ).and.returnValue(Promise.resolve());

    component.removeQuestionSkillLinkAsync('questionId', 'skillId1', 0.8);
    tick();

    expect(
      editableQuestionBackendApiService.editQuestionSkillLinksAsync
    ).toHaveBeenCalledWith('questionId', [
      {
        id: 'skillId1',
        task: 'remove',
        difficulty: 0.8,
      },
    ]);
    expect(questionsListService.resetPageNumber).toHaveBeenCalled();
    expect(questionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1',
      true,
      true
    );
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Question Removed'
    );
    expect(component._removeArrayElement).toHaveBeenCalledWith('questionId');
  }));

  it('should remove array element from deleted question IDs', () => {
    component.deletedQuestionIds = ['q1', 'q2', 'q3'];
    component._removeArrayElement('q2');
    expect(component.deletedQuestionIds).toEqual(['q1', 'q3']);
  });

  it('should do nothing if element to remove is not in deleted question IDs', () => {
    component.deletedQuestionIds = ['q1', 'q3'];
    component._removeArrayElement('q2');
    expect(component.deletedQuestionIds).toEqual(['q1', 'q3']);
  });

  it('should not remove skill if it is the only one', () => {
    component.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: '1',
        skill_description: 'Skill Description',
      }),
    ];
    spyOn(alertsService, 'addInfoMessage');

    component.removeSkill('1');

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'A question should be linked to at least one skill.'
    );
  });

  it('should remove skill linked to a question', () => {
    component.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: '1',
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: '2',
        skill_description: 'Skill Description',
      }),
    ];
    component.skillLinkageModificationsArray = [];
    component.removeSkill('1');

    expect(component.associatedSkillSummaries).toEqual([
      ShortSkillSummary.createFromBackendDict({
        skill_id: '2',
        skill_description: 'Skill Description',
      }),
    ]);
    expect(component.skillLinkageModificationsArray).toEqual([
      {
        id: '1',
        task: 'remove',
        difficulty: component.difficulty,
      } as SkillLinkageModificationsArray,
    ]);
  });

  it(
    'should check that question is not savable if there are no' + ' changes',
    () => {
      component.skillLinkageModificationsArray = [];
      component.isSkillDifficultyChanged = false;
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);

      expect(component.isQuestionSavable()).toBe(false);
    }
  );

  it('should check if question is savable', () => {
    component.questionIsBeingUpdated = false;
    component.newQuestionSkillDifficulties = [0.9];
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(questionValidationService, 'isQuestionValid').and.returnValues(
      true,
      false
    );

    expect(component.isQuestionSavable()).toBe(true);

    component.questionIsBeingUpdated = true;
    expect(component.isQuestionSavable()).toBe(false);
  });

  it('should show solution if interaction can have solution', () => {
    component.question = question;
    spyOn(component.question, 'getStateData').and.returnValue({
      interaction: {
        id: 'TextInput',
      },
    } as State);

    expect(component.showSolutionCheckpoint()).toBe(true);

    // Reset the spy to return the original state data without TextInput id.
    component.question = question;
    (component.question.getStateData as jasmine.Spy).and.returnValue({
      interaction: {
        id: null,
      },
    } as State);
    expect(component.showSolutionCheckpoint()).toBe(false);
  });

  it('should return false for showSolutionCheckpoint when question is null', () => {
    Reflect.set(component as object, 'question', null);
    expect(component.showSolutionCheckpoint()).toBe(false);
  });

  it('should return false for showSolutionCheckpoint when interactionSpec is undefined', () => {
    component.question = question;
    spyOn(component.question, 'getStateData').and.returnValue({
      interaction: {
        id: 'UnknownInteractionType',
      },
    } as State);

    expect(component.showSolutionCheckpoint()).toBe(false);
  });

  it('should show info message if skills is already linked to question', fakeAsync(() => {
    var skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193,
    };
    component.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId1',
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description',
      }),
    ];
    component.groupedSkillSummaries = {
      current: [],
      others: [skillSummaryDict],
    };
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.resolve(skillSummaryDict),
    } as NgbModalRef);
    spyOn(alertsService, 'addInfoMessage');

    component.addSkill();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should link skill if it is not already linked to question', fakeAsync(() => {
    var skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193,
    };
    component.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId3',
        skill_description: 'Skill Description',
      }),
    ];
    component.groupedSkillSummaries = {
      current: [],
      others: [skillSummaryDict],
    };
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.resolve(skillSummaryDict),
    } as NgbModalRef);

    component.addSkill();
    tick();

    expect(component.associatedSkillSummaries).toEqual([
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId3',
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId1',
        skill_description: 'description1',
      }),
    ]);
    expect(component.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'add',
        difficulty: 0.6,
      },
    ]);
  }));

  it('should close modal when user clicks on cancel', fakeAsync(() => {
    var skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193,
    };
    component.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId3',
        skill_description: 'Skill Description',
      }),
    ];
    component.groupedSkillSummaries = {
      current: [],
      others: [skillSummaryDict],
    };

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.reject(skillSummaryDict),
    } as NgbModalRef);
    spyOn(alertsService, 'addInfoMessage');

    component.addSkill();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should save and publish question after updating linked skill', fakeAsync(() => {
    spyOn(
      editableQuestionBackendApiService,
      'editQuestionSkillLinksAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(questionsListService, 'getQuestionSummariesAsync');
    spyOn(component, 'saveAndPublishQuestion');

    component.updateSkillLinkageAndQuestions('commit');

    tick(500);

    expect(questionsListService.getQuestionSummariesAsync).toHaveBeenCalled();
    expect(component.editorIsOpen).toBe(false);
    expect(component.saveAndPublishQuestion).toHaveBeenCalledWith('commit');
  }));

  it('should update skill linkage correctly', fakeAsync(() => {
    component.skillLinkageModificationsArray = [
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.9,
      },
    ];
    spyOn(
      editableQuestionBackendApiService,
      'editQuestionSkillLinksAsync'
    ).and.returnValue(Promise.resolve());

    component.updateSkillLinkage();

    tick(500);

    expect(component.skillLinkageModificationsArray).toEqual([]);
  }));

  it(
    'should open question editor save modal if question' +
      " is being updated when user click on 'SAVE' button",
    fakeAsync(() => {
      component.questionIsBeingUpdated = true;
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve('commit'),
      } as NgbModalRef);
      spyOn(component, 'updateSkillLinkageAndQuestions');
      spyOn(component, 'saveAndPublishQuestion');

      // If skillLinkageModificationsArray is present.
      component.skillLinkageModificationsArray = [
        {
          id: '1',
          task: 'update_difficulty',
          difficulty: 1,
        },
      ];

      component.saveQuestion();
      tick();

      expect(component.updateSkillLinkageAndQuestions).toHaveBeenCalledWith(
        'commit'
      );

      // If skillLinkageModificationsArray is not present.
      component.skillLinkageModificationsArray = [];

      component.saveQuestion();
      tick();

      expect(component.saveAndPublishQuestion).toHaveBeenCalledWith('commit');
    })
  );

  it(
    "should create new question if user clicks on 'SAVE' and if question" +
      ' is not being updates',
    () => {
      component.questionIsBeingUpdated = false;
      spyOn(skillEditorRoutingService, 'creatingNewQuestion');
      spyOn(component, 'saveAndPublishQuestion');

      component.saveQuestion();

      expect(component.saveAndPublishQuestion).toHaveBeenCalled();
      expect(skillEditorRoutingService.creatingNewQuestion).toHaveBeenCalled();
    }
  );

  it('should close question editor save modal if user clicks cancel', fakeAsync(() => {
    component.questionIsBeingUpdated = true;
    spyOn(component, 'saveAndPublishQuestion');
    component.skillLinkageModificationsArray = [
      {
        id: '1',
        task: 'update_difficulty',
        difficulty: 1,
      },
      {
        id: '2',
        task: 'update_difficulty',
        difficulty: 2,
      },
    ];

    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);

    component.saveQuestion();
    tick();

    expect(component.saveAndPublishQuestion).not.toHaveBeenCalled();
  }));

  it('should get cached question summaries for one skill', () => {
    spyOn(questionsListService, 'getCachedQuestionSummaries').and.returnValue(
      undefined
    );

    expect(component.getQuestionSummariesForOneSkill()).toBeUndefined();
  });

  it('should not toggle difficulty card if window is not narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    component.difficultyCardIsShown = true;

    component.toggleDifficultyCard();

    expect(component.difficultyCardIsShown).toBe(true);
  });

  it('should toggle difficulty card if window is narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    component.difficultyCardIsShown = true;

    component.toggleDifficultyCard();

    expect(component.difficultyCardIsShown).toBe(false);
  });

  it('should return current page number', () => {
    spyOn(questionsListService, 'getCurrentPageNumber').and.returnValue(7);
    expect(component.getCurrentPageNumber()).toBe(7);
  });

  it('should call unsubscribe on ngOnDestroy', () => {
    const spy = spyOn(component.directiveSubscriptions, 'unsubscribe');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('should return false for isQuestionSavable if no changes', () => {
    component.skillLinkageModificationsArray = [];
    component.isSkillDifficultyChanged = false;
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);
    expect(component.isQuestionSavable()).toBe(false);
  });

  it('should return true for isQuestionSavable if new question and valid', () => {
    component.questionIsBeingUpdated = false;
    component.newQuestionSkillDifficulties = [0.5];
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(questionValidationService, 'isQuestionValid').and.returnValue(true);
    expect(component.isQuestionSavable()).toBe(true);
  });

  it('should return false for isQuestionSavable if updated question and not valid', () => {
    component.questionIsBeingUpdated = true;
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(questionValidationService, 'isQuestionValid').and.returnValue(false);
    expect(component.isQuestionSavable()).toBe(false);
  });

  it('should return true for isQuestionSavable if updated question and valid', () => {
    component.questionIsBeingUpdated = true;
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(questionValidationService, 'isQuestionValid').and.returnValue(true);
    expect(component.isQuestionSavable()).toBe(true);
  });

  it('should set update_difficulty task when changing linked skill difficulty for updated question', () => {
    component.questionIsBeingUpdated = true;
    component.isSkillDifficultyChanged = true;
    component.newQuestionSkillIds = ['skillId1'];
    component.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', 'Skill 1', 0.7),
    ];
    component.skillLinkageModificationsArray = [];

    component.changeLinkedSkillDifficulty();

    expect(component.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.7,
      },
    ]);
  });

  it('should set update task when question is being updated but difficulty unchanged', () => {
    component.questionIsBeingUpdated = true;
    // Initial state arrays reflect a single linked skill.
    component.newQuestionSkillIds = ['skillId1'];
    component.newQuestionSkillDifficulties = [0.7];
    component.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', 'Skill 1', 0.7),
    ];
    component.skillLinkageModificationsArray = [];
    component.isSkillDifficultyChanged = false;

    // Call the real method. When updating an existing question, we always use update_difficulty.
    component.changeLinkedSkillDifficulty();

    expect(component.isSkillDifficultyChanged).toBeFalse();
    expect(component.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.7,
      },
    ]);
  });

  it('should return false for showSolutionCheckpoint when interaction has spec but cannot have solution', () => {
    // Provide a question with an interaction id known but with can_have_solution false.
    component.question = question;
    spyOn(component.question, 'getStateData').and.returnValue({
      interaction: {id: 'Continue'}, // Continue has can_have_solution = false in specs.
    } as State);
    expect(component.showSolutionCheckpoint()).toBe(false);
  });

  it('should initialize tab to fetch summaries when not navigating to editor', fakeAsync(() => {
    // Cover branch in _initTab where navigateToQuestionEditor returns false but selectedSkillId truthy.
    component.selectedSkillId = 'skillId1';
    spyOn(
      skillEditorRoutingService,
      'navigateToQuestionEditor'
    ).and.returnValue(false);
    spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
      Promise.resolve({
        skill: skill,
        assignedSkillTopicData: {},
        groupedSkillSummaries: {},
      })
    );
    spyOn(questionsListService, 'getQuestionSummariesAsync');

    // Directly call private method via bracket notation.
    // eslint-disable-next-line dot-notation
    component['_initTab'](true);
    tick();

    expect(questionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1',
      true,
      true
    );
  }));

  it('should set difficultyCardIsShown true on ngOnInit for wide window', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    component.ngOnInit();
    expect(component.difficultyCardIsShown).toBe(true);
  });

  it('should handle showUnaddressedSkillMisconceptionWarning with no matching ids', () => {
    component.selectedSkillId = 'skillId1';
    component.misconceptionIdsForSelectedSkill = [1, 2];
    spyOn(
      getPrivate<{
        isEquivalent: (a: Object | null, b: Object | null) => boolean;
      }>(component, 'utilsService'),
      'isEquivalent'
    ).and.returnValue(false);
    const result = component.showUnaddressedSkillMisconceptionWarning([
      'skillId2-3',
      'skillId2-4',
    ]);
    expect(result).toBe(false);
  });

  it('should not save question when being updated but has no changes', () => {
    component.question = question;
    component.questionIsBeingUpdated = true;
    spyOn(
      questionValidationService,
      'getValidationErrorMessage'
    ).and.returnValue('');
    spyOn(
      component.question,
      'getUnaddressedMisconceptionNames'
    ).and.returnValue([]);
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);
    spyOn(editableQuestionBackendApiService, 'updateQuestionAsync');

    component.saveAndPublishQuestion('Commit');

    expect(
      editableQuestionBackendApiService.updateQuestionAsync
    ).not.toHaveBeenCalled();
  });

  it('should handle _initTab when selectedSkillId is null', () => {
    component.selectedSkillId = '';
    spyOn(skillBackendApiService, 'fetchSkillAsync');
    spyOn(
      skillEditorRoutingService,
      'navigateToQuestionEditor'
    ).and.returnValue(false);
    spyOn(questionsListService, 'getQuestionSummariesAsync');
    spyOn(component, 'getQuestionSummariesForOneSkill');

    // eslint-disable-next-line dot-notation
    component['_initTab'](true);

    expect(skillBackendApiService.fetchSkillAsync).not.toHaveBeenCalled();
    expect(questionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      '',
      true,
      true
    );
  });

  it('should handle editQuestion when no associated_skill_dicts in response', fakeAsync(() => {
    const questionSummaryForOneSkill = QuestionSummary.createFromBackendDict({
      id: 'qId',
      interaction_id: '',
      misconception_ids: [],
      question_content: '',
    });
    component.editorIsOpen = false;
    component.canEditQuestion = true;

    spyOn(
      editableQuestionBackendApiService,
      'fetchQuestionAsync'
    ).and.returnValue(
      Promise.resolve({
        associated_skill_dicts: [],
        questionObject: question,
      } as FetchQuestionResponse)
    );
    spyOn(component, 'openQuestionEditor');

    component.editQuestion(
      questionSummaryForOneSkill,
      'Skill Description',
      0.9
    );
    tick();

    expect(component.associatedSkillSummaries).toEqual([]);
    expect(component.openQuestionEditor).toHaveBeenCalled();
  }));

  it('should handle addSkill when modal result is rejected with error', fakeAsync(() => {
    component.groupedSkillSummaries = {
      current: [],
      others: [],
    };
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.reject('User cancelled'),
    } as NgbModalRef);

    component.addSkill();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
  }));
});
