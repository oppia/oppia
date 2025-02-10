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
import {QuestionObjectFactory} from 'domain/question/QuestionObjectFactory';
import {MisconceptionObjectFactory} from 'domain/skill/MisconceptionObjectFactory';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {SkillDifficulty} from 'domain/skill/skill-difficulty.model';
import {SkillObjectFactory} from 'domain/skill/SkillObjectFactory';
import {State} from 'domain/state/StateObjectFactory';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SkillEditorRoutingService} from 'pages/skill-editor-page/services/skill-editor-routing.service';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
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
  interpolateUrl(value) {
    return value;
  }
}

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
  let questionObjectFactory: QuestionObjectFactory;
  let editableQuestionBackendApiService: EditableQuestionBackendApiService;
  let questionUndoRedoService: QuestionUndoRedoService;
  let contextService: ContextService;
  let questionValidationService: QuestionValidationService;
  let skillObjectFactory: SkillObjectFactory;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let question = null;
  let questionStateData = null;
  let skill = null;

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
        QuestionObjectFactory,
        EditableQuestionBackendApiService,
        QuestionUndoRedoService,
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
        },
        ContextService,
        QuestionValidationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionsListComponent);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);

    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    questionsListService = TestBed.inject(QuestionsListService);
    skillEditorRoutingService = TestBed.inject(SkillEditorRoutingService);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    editableQuestionBackendApiService = TestBed.inject(
      EditableQuestionBackendApiService
    );
    questionUndoRedoService = TestBed.inject(QuestionUndoRedoService);
    loggerService = TestBed.inject(LoggerService);
    contextService = TestBed.inject(ContextService);
    questionValidationService = TestBed.inject(QuestionValidationService);

    question = questionObjectFactory.createFromBackendDict({
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
              training_data: null,
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
            dest: null,
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
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
      },
      inapplicable_skill_misconception_ids: null,
      language_code: 'en',
      linked_skill_ids: [],
      next_content_id_index: 5,
      question_state_data_schema_version: 44,
      version: 45,
    });

    questionStateData = question.getStateData();

    skill = skillObjectFactory.createFromBackendDict({
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
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: null,
      next_misconception_id: null,
      superseding_skill_id: null,
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

      expect(component.misconceptionIdsForSelectedSkill).toEqual(undefined);

      component.ngOnInit();
      tick();

      expect(component.misconceptionIdsForSelectedSkill).toEqual([2]);
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
    expect(component.newQuestionSkillIds).toEqual(undefined);

    component.selectSkillModalIsShown = true;
    component.createQuestion();

    expect(component.newQuestionSkillIds).toEqual(['skillId1']);

    component.selectSkillModalIsShown = false;
    component.createQuestion();

    expect(component.newQuestionSkillIds).toEqual(['skillId1']);
  });

  it('should populate misconceptions when a question is created', fakeAsync(() => {
    const skill = skillObjectFactory.createFromBackendDict({
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
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: null,
      next_misconception_id: null,
      superseding_skill_id: null,
    });
    spyOn(skillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
      Promise.resolve([skill])
    );
    component.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', '', 1),
    ];

    expect(component.misconceptionsBySkill).toEqual(undefined);

    component.createQuestion();
    tick();

    expect(component.misconceptionsBySkill).toEqual({
      skillId1: [
        misconceptionObjectFactory.createFromBackendDict({
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true,
        }),
      ],
    });
  }));

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

      component.saveAndPublishQuestion(null);
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
          task: null,
          difficulty: 1,
        },
        {
          id: '2',
          task: null,
          difficulty: 2,
        },
        {
          id: '1',
          task: null,
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

      expect(
        editableQuestionBackendApiService.editQuestionSkillLinksAsync
      ).toHaveBeenCalledWith('qId', [
        {
          id: '1',
          task: null,
          difficulty: 1,
        },
        {
          id: '2',
          task: null,
          difficulty: 2,
        },
        {
          id: '1',
          task: null,
          difficulty: 1,
        },
      ]);
    })
  );

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
      spyOn(contextService, 'resetImageSaveDestination').and.stub();

      component.cancel();
      tick();

      expect(contextService.resetImageSaveDestination).toHaveBeenCalled();
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
    let difficulty: 0.9;

    it('should return null if editor is already opened', () => {
      component.editorIsOpen = true;

      expect(component.editQuestion(null, null, null)).toBe(undefined);
    });

    it(
      'should warning if user does not have rights to delete a' + ' question',
      () => {
        component.canEditQuestion = false;
        spyOn(alertsService, 'addWarning');

        component.editQuestion(null, null, null);

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
      spyOn(contextService, 'setImageSaveDestinationToLocalStorage');

      component.openQuestionEditor();

      expect(
        contextService.setImageSaveDestinationToLocalStorage
      ).toHaveBeenCalled();
    }
  );

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

      component.removeQuestionFromSkill(questionId);
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

      component.removeQuestionFromSkill(questionId);
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

      component.removeQuestionFromSkill(questionId);
      tick();
      expect(ngbModal.open).toHaveBeenCalled();
      expect(component.removeQuestionSkillLinkAsync).not.toHaveBeenCalled();
    }));
  });

  it('should not remove skill if it is the only one', () => {
    component.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: '1',
        skill_description: 'Skill Description',
      }),
    ];
    spyOn(alertsService, 'addInfoMessage');

    component.removeSkill(null);

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

    component.question = null;
    expect(component.showSolutionCheckpoint()).toBe(false);
  });

  it('should show info message if skills is already linked to question', fakeAsync(() => {
    var skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
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
      worked_examples_count: 3,
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
      worked_examples_count: 3,
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
          task: null,
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
        task: null,
        difficulty: 1,
      },
      {
        id: '2',
        task: null,
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

    expect(component.getQuestionSummariesForOneSkill()).toEqual(undefined);
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

  it('should get current page number', () => {
    spyOn(questionsListService, 'getCurrentPageNumber').and.returnValue(5);

    expect(component.getCurrentPageNumber()).toBe(5);
  });
});
