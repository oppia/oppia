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

import { EventEmitter } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuestionSummary } from 'domain/question/question-summary-object.model';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit test for Questions List Component.
 */

class MockNgbModalRef {
  componentInstance = {
    skillSummaries: null,
    skillsInSameTopicCount: null,
    categorizedSkills: null,
    allowSkillsFromOtherTopics: null,
    untriagedSkillSummaries: null
  };
}

describe('QuestionsListComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $q = null;
  let $timeout = null;

  let ngbModal: NgbModal;
  let WindowDimensionsService = null;
  let QuestionsListService = null;
  let AlertsService = null;
  let SkillBackendApiService = null;
  let skillObjectFactory: SkillObjectFactory;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let QuestionObjectFactory: QuestionObjectFactory;
  let EditableQuestionBackendApiService = null;
  let QuestionUndoRedoService = null;
  let QuestionValidationService = null;
  let SkillEditorRoutingService = null;
  let ContextService = null;
  let question = null;
  let questionStateData = null;
  let skill = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $q = $injector.get('$q');
    $timeout = $injector.get('$timeout');

    WindowDimensionsService = $injector.get('WindowDimensionsService');
    QuestionsListService = $injector.get('QuestionsListService');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    SkillBackendApiService = $injector.get('SkillBackendApiService');
    AlertsService = $injector.get('AlertsService');
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    EditableQuestionBackendApiService = $injector
      .get('EditableQuestionBackendApiService');
    QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
    ContextService = $injector.get('ContextService');
    QuestionValidationService = $injector.get('QuestionValidationService');

    ctrl = $componentController('questionsList', {
      $scope: $scope,
      NgbModal: ngbModal
    }, {
      getSelectedSkillId: () => {},
      getSkillIds: () => {},
      getSkillIdToRubricsObject: () => {},
      selectSkillModalIsShown: () => {},
      canEditQuestion: () => {},
      getAllSkillSummaries: () => {},
      getGroupedSkillSummaries: () => {}
    });

    question = QuestionObjectFactory.createFromBackendDict({
      id: '1',
      question_state_data: {
        content: {
          html: 'Question 1',
          content_id: 'content_1'
        },
        interaction: {
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'content_5',
                html: ''
              },
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            rule_specs: [],
            training_data: null,
            tagged_skill_misconception_id: null
          }],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: null,
            dest_if_really_stuck: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2'
            },
            param_changes: [],
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null
          },
          hints: [{
            hint_content: {
              html: 'Hint 1',
              content_id: 'content_3'
            }
          }],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4'
            }
          },
          id: 'TextInput'
        },
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {}
        },
        written_translations: {
          translations_mapping: {}
        },
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        next_content_id_index: null,
      },
      inapplicable_skill_misconception_ids: null,
      language_code: 'en',
      linked_skill_ids: [],
      question_state_data_schema_version: 44,
      version: 45
    });

    questionStateData = question.getStateData();

    skill = skillObjectFactory.createFromBackendDict({
      id: 'skillId1',
      description: 'test description 1',
      misconceptions: [{
        id: 2,
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback',
        must_be_addressed: true
      }],
      rubrics: [],
      skill_contents: {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {}
        }
      },
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: null,
      next_misconception_id: null,
      superseding_skill_id: null
    });

    spyOn(ctrl, 'getSelectedSkillId').and.returnValue('skillId1');
    spyOn(ctrl, 'getSkillIds').and.returnValue(['skillId1', 'skillId2']);
  }));

  it('should set component properties on initialization', () => {
    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);

    expect(ctrl.showDifficultyChoices).toBe(undefined);
    expect(ctrl.difficultyCardIsShown).toBe(undefined);
    expect(ctrl.associatedSkillSummaries).toEqual(undefined);
    expect(ctrl.selectedSkillId).toBe(undefined);
    expect(ctrl.editorIsOpen).toBe(undefined);
    expect(ctrl.deletedQuestionIds).toEqual(undefined);
    expect(ctrl.questionEditorIsShown).toBe(undefined);
    expect(ctrl.questionIsBeingUpdated).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.showDifficultyChoices).toBe(false);
    expect(ctrl.difficultyCardIsShown).toBe(false);
    expect(ctrl.associatedSkillSummaries).toEqual([]);
    expect(ctrl.selectedSkillId).toBe('skillId1');
    expect(ctrl.editorIsOpen).toBe(false);
    expect(ctrl.deletedQuestionIds).toEqual([]);
    expect(ctrl.questionEditorIsShown).toBe(false);
    expect(ctrl.questionIsBeingUpdated).toBe(false);

    ctrl.$onDestroy();
  });

  it('should subscribe to question summaries init event on' +
    ' component initialization', () => {
    spyOn(QuestionsListService.onQuestionSummariesInitialized, 'subscribe');

    ctrl.$onInit();

    expect(QuestionsListService.onQuestionSummariesInitialized.subscribe)
      .toHaveBeenCalled();
  });

  it('should reset history and fetch question summaries on' +
    ' initialization', () => {
    let resetHistoryAndFetch = true;
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');

    expect(ctrl.skillIds).toEqual(undefined);

    ctrl.$onInit();

    expect(ctrl.skillIds).toEqual(['skillId1', 'skillId2']);
    expect(QuestionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1', resetHistoryAndFetch, resetHistoryAndFetch
    );
  });

  it('should not reset history and fetch question summaries when question' +
    ' summaries are initialized', () => {
    let resetHistoryAndFetch = false;
    let questionSummariesInitializedEmitter = new EventEmitter();
    spyOnProperty(QuestionsListService, 'onQuestionSummariesInitialized')
      .and.returnValue(questionSummariesInitializedEmitter);
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');

    ctrl.$onInit();

    questionSummariesInitializedEmitter.emit();

    expect(QuestionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1', resetHistoryAndFetch, resetHistoryAndFetch
    );
  });

  it('should fetch misconception ids for selected skill on' +
    ' initialization', () => {
    spyOn(SkillBackendApiService, 'fetchSkillAsync').and.returnValue($q.resolve(
      {
        skill: skill
      }
    ));

    expect(ctrl.misconceptionIdsForSelectedSkill).toEqual(undefined);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.misconceptionIdsForSelectedSkill).toEqual([2]);
  });

  it('should start creating question on navigating to question editor', () => {
    spyOn(SkillEditorRoutingService, 'navigateToQuestionEditor')
      .and.returnValue(true);
    spyOn(ctrl, 'createQuestion').and.stub();

    ctrl.$onInit();

    expect(ctrl.createQuestion).toHaveBeenCalled();
  });

  it('should get selected skill id when a question is created', () => {
    // When modal is not shown, then newQuestionSkillIds get the values of
    // skillIds.
    spyOn(ctrl, 'selectSkillModalIsShown').and.returnValues(true, false);
    ctrl.skillIds = ['skillId2'];
    expect(ctrl.newQuestionSkillIds).toEqual(undefined);

    ctrl.createQuestion();

    expect(ctrl.newQuestionSkillIds).toEqual(['skillId1']);

    ctrl.createQuestion();

    expect(ctrl.newQuestionSkillIds).toEqual(['skillId2']);
  });

  it('should populate misconceptions when a question is created', () => {
    const skill = skillObjectFactory.createFromBackendDict({
      id: 'skillId1',
      description: 'test description 1',
      misconceptions: [{
        id: 2,
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback',
        must_be_addressed: true
      }],
      rubrics: [],
      skill_contents: {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {}
        }
      },
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: null,
      next_misconception_id: null,
      superseding_skill_id: null
    });
    spyOn(SkillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
      $q.resolve([skill])
    );
    ctrl.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', '', 1)
    ];

    expect(ctrl.misconceptionsBySkill).toEqual(undefined);

    ctrl.initiateQuestionCreation();
    $scope.$apply();

    expect(ctrl.misconceptionsBySkill).toEqual({
      skillId1: [
        misconceptionObjectFactory.createFromBackendDict({
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true
        })
      ]
    });
  });

  it('should warning message if fetching skills fails', () => {
    spyOn(AlertsService, 'addWarning');
    spyOn(SkillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
      $q.reject('Error occurred.')
    );

    ctrl.populateMisconceptions();
    $scope.$apply();

    expect(AlertsService.addWarning).toHaveBeenCalled();
  });

  it('should show the index of a question', () => {
    spyOn(QuestionsListService, 'getCurrentPageNumber').and.returnValue(5);

    // Question index = NUM_QUESTION_PER_PAGE (10) * current page number (5) +
    // index + 1 = 10 * 5 + 1 + 1 = 52.
    expect(ctrl.getQuestionIndex(1)).toBe(52);
  });

  it('should fetch question summaries on moving to next page', () => {
    ctrl.selectedSkillId = 'skillId1';
    spyOn(QuestionsListService, 'incrementPageNumber');
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');

    ctrl.goToNextPage();

    expect(QuestionsListService.incrementPageNumber).toHaveBeenCalled();
    expect(QuestionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1', true, false
    );
  });

  it('should fetch question summaries on moving to previous page', () => {
    ctrl.selectedSkillId = 'skillId1';
    spyOn(QuestionsListService, 'decrementPageNumber');
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');

    ctrl.goToPreviousPage();

    expect(QuestionsListService.decrementPageNumber).toHaveBeenCalled();
    expect(QuestionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1', false, false
    );
  });

  it('should check if warning is to be shown for unaddressed skill' +
    ' misconceptions', () => {
    // The selected skill id is skillId1.
    ctrl.misconceptionIdsForSelectedSkill = [1, 2];

    expect(ctrl.showUnaddressedSkillMisconceptionWarning([
      'skillId1-1',
      'skillId1-2',
    ])).toBe(true);
    expect(ctrl.showUnaddressedSkillMisconceptionWarning([
      'skillId1-1',
      'skillId2-2',
    ])).toBe(false);
  });


  it('should get skill editor\'s URL', () => {
    expect(ctrl.getSkillEditorUrl('skillId1')).toBe('/skill_editor/skillId1');
  });

  it('should check if current page is the last one', () => {
    spyOn(QuestionsListService, 'isLastQuestionBatch').and.returnValue(true);

    expect(ctrl.isLastPage()).toBe(true);
  });

  it('should not save and publish question if there are' +
    ' validation errors', () => {
    ctrl.question = question;
    spyOn(AlertsService, 'addWarning');
    spyOn(ctrl.question, 'getValidationErrorMessage').and.returnValue('Error');
    spyOn(ctrl.question, 'getUnaddressedMisconceptionNames')
      .and.returnValue(['misconception1', 'misconception2']);

    ctrl.saveAndPublishQuestion('Commit');

    expect(AlertsService.addWarning).toHaveBeenCalledWith('Error');
  });

  it('should create new question in the backend if there are no validation' +
  ' error on saving and publishing a question when question is not already' +
  ' being updated', () => {
    ctrl.question = question;
    ctrl.questionIsBeingUpdated = false;
    ctrl.skillLinkageModificationsArray = ['1', '2', 1];
    spyOn(ctrl.question, 'getValidationErrorMessage').and.returnValue('');
    spyOn(ctrl.question, 'getUnaddressedMisconceptionNames')
      .and.returnValue([]);
    spyOn(EditableQuestionBackendApiService, 'createQuestionAsync')
      .and.returnValue($q.resolve({
        questionId: 'qId'
      }));
    spyOn(EditableQuestionBackendApiService, 'editQuestionSkillLinksAsync');

    ctrl.saveAndPublishQuestion('Commit');
    $scope.$apply();

    expect(EditableQuestionBackendApiService.editQuestionSkillLinksAsync)
      .toHaveBeenCalledWith('qId', ['1', '2', 1]);
  });

  it('should save question when another question is being updated', () => {
    ctrl.question = question;
    ctrl.questionIsBeingUpdated = true;
    spyOn(ctrl.question, 'getValidationErrorMessage').and.returnValue('');
    spyOn(ctrl.question, 'getUnaddressedMisconceptionNames')
      .and.returnValue([]);
    spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(EditableQuestionBackendApiService, 'updateQuestionAsync')
      .and.returnValue($q.resolve());
    spyOn(QuestionUndoRedoService, 'clearChanges');
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');

    ctrl.saveAndPublishQuestion('Commit');
    $scope.$apply();

    expect(QuestionUndoRedoService.clearChanges).toHaveBeenCalled();
    expect(QuestionsListService.getQuestionSummariesAsync)
      .toHaveBeenCalledWith('skillId1', true, true);
  });

  it('should show error if saving question fails when another question' +
    ' is being updated', () => {
    ctrl.question = question;
    ctrl.questionIsBeingUpdated = true;
    spyOn(ctrl.question, 'getValidationErrorMessage').and.returnValue('');
    spyOn(ctrl.question, 'getUnaddressedMisconceptionNames')
      .and.returnValue([]);
    spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(EditableQuestionBackendApiService, 'updateQuestionAsync')
      .and.returnValue($q.reject());
    spyOn(QuestionUndoRedoService, 'clearChanges');
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');
    spyOn(AlertsService, 'addWarning');

    ctrl.saveAndPublishQuestion('Commit');
    $scope.$apply();

    expect(QuestionUndoRedoService.clearChanges).not.toHaveBeenCalled();
    expect(QuestionsListService.getQuestionSummariesAsync)
      .not.toHaveBeenCalled();
    expect(AlertsService.addWarning).toHaveBeenCalledWith(
      'There was an error saving the question.');
  });

  it('should display warning if commit message is not given while saving' +
    ' a question', () => {
    ctrl.question = question;
    ctrl.questionIsBeingUpdated = true;
    spyOn(ctrl.question, 'getValidationErrorMessage').and.returnValue('');
    spyOn(ctrl.question, 'getUnaddressedMisconceptionNames')
      .and.returnValue([]);
    spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(AlertsService, 'addWarning');

    ctrl.saveAndPublishQuestion();
    $scope.$apply();

    expect(AlertsService.addWarning)
      .toHaveBeenCalledWith('Please provide a valid commit message.');
  });

  it('should show \'confirm question modal exit\' modal when user ' +
    'clicks cancel', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.resolve()
      } as NgbModalRef);
    });
    ctrl.cancel();
    tick();
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should reset image save destination when user clicks confirm on' +
    ' \'confirm question modal exit\' modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: $q.resolve('confirm')
    } as NgbModalRef);
    spyOn(ContextService, 'resetImageSaveDestination');

    ctrl.cancel();
    $scope.$apply();

    expect(ContextService.resetImageSaveDestination).toHaveBeenCalled();
  }));

  it('should close \'confirm question modal exit\' modal when user clicks' +
    ' cancel', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.reject()
      } as NgbModalRef);
    });

    ctrl.cancel();
    tick();
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should update skill difficulty when user selects a difficulty', () => {
    let skill = SkillDifficulty.create('skillId1', '', 0.9);
    ctrl.newQuestionSkillIds = ['skillId1'];
    ctrl.linkedSkillsWithDifficulty = [];
    ctrl.skillLinkageModificationsArray = [];

    ctrl.updateSkillWithDifficulty(skill, 0);

    expect(ctrl.linkedSkillsWithDifficulty[0]).toBe(skill);
    expect(ctrl.newQuestionSkillDifficulties).toEqual([0.9]);
    expect(ctrl.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.9
      }
    ]);

    ctrl.newQuestionSkillIds = [];
    ctrl.linkedSkillsWithDifficulty = [];
    ctrl.skillLinkageModificationsArray = [];
    ctrl.newQuestionSkillDifficulties = [];

    ctrl.updateSkillWithDifficulty(skill, 0);

    expect(ctrl.newQuestionSkillIds).toEqual(
      ['skillId1']);
    expect(ctrl.newQuestionSkillDifficulties).toEqual([0.9]);
    expect(ctrl.skillLinkageModificationsArray).toEqual([
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.9
      }
    ]);
  });

  describe('when user clicks on edit question', () => {
    let questionSummaryForOneSkill = QuestionSummary
      .createFromBackendDict({
        id: 'qId',
        interaction_id: '',
        misconception_ids: [],
        question_content: ''
      });
    let skillDescription = 'Skill Description';
    let difficulty: 0.9;

    it('should return null if editor is already opened', () => {
      spyOn(ctrl, 'canEditQuestion');
      ctrl.editorIsOpen = true;

      expect(ctrl.editQuestion()).toBe(undefined);
      expect(ctrl.canEditQuestion).not.toHaveBeenCalled();
    });

    it('should warning if user does not have rights to delete a' +
      ' question', () => {
      spyOn(ctrl, 'canEditQuestion').and.returnValue(false);
      spyOn(AlertsService, 'addWarning');

      ctrl.editQuestion();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'User does not have enough rights to delete the question');
    });

    it('should fetch question data from backend and set new ' +
      'question\'s properties', () => {
      ctrl.editorIsOpen = false;
      spyOn(ctrl, 'canEditQuestion').and.returnValue(true);
      spyOn(ctrl, 'selectSkillModalIsShown').and.returnValue(true);
      spyOn(EditableQuestionBackendApiService, 'fetchQuestionAsync')
        .and.returnValue($q.resolve({
          associated_skill_dicts: [{
            id: 'skillId1',
            misconceptions: [{
              id: 1,
              feedback: '',
              must_be_addressed: false,
              notes: '',
              name: 'MIsconception 1'
            }],
            description: ''
          }],
          questionObject: question
        }));

      ctrl.editQuestion(
        questionSummaryForOneSkill, skillDescription, difficulty);
      $scope.$apply();

      expect(ctrl.question).toEqual(question);
      expect(ctrl.questionId).toBe('1');
      expect(ctrl.questionStateData).toEqual(questionStateData);
    });

    it('should display warning if fetching from backend fails', () => {
      ctrl.editorIsOpen = false;
      ctrl.skillIds = ['skillId1'];
      spyOn(ctrl, 'canEditQuestion').and.returnValue(true);
      spyOn(ctrl, 'selectSkillModalIsShown').and.returnValue(false);
      spyOn(EditableQuestionBackendApiService, 'fetchQuestionAsync')
        .and.returnValue($q.reject({
          error: 'Failed to fetch question.'
        }));
      spyOn(AlertsService, 'addWarning');

      ctrl.editQuestion(
        questionSummaryForOneSkill, skillDescription, difficulty);
      $scope.$apply();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Failed to fetch question.'
      );
    });
  });

  it('should save image destination to local storage if question editor is' +
    ' opened while a question is already being created', () => {
    ctrl.newQuestionIsBeingCreated = true;
    spyOn(ContextService, 'setImageSaveDestinationToLocalStorage');

    ctrl.openQuestionEditor();

    expect(ContextService.setImageSaveDestinationToLocalStorage)
      .toHaveBeenCalled();
  });

  describe('when deleting question from skill', () => {
    let questionId = 'qId';
    let skillDescription = 'Skill Description';

    it('should display warning when user does not have rights to delete' +
      ' a question', () => {
      spyOn(ctrl, 'canEditQuestion').and.returnValue(false);
      spyOn(AlertsService, 'addWarning');

      ctrl.deleteQuestionFromSkill(questionId, skillDescription);

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'User does not have enough rights to delete the question');
    });

    it('should delete question when user is in the skill editor', () => {
      ctrl.selectedSkillId = 'skillId1';
      ctrl.deletedQuestionIds = [];
      spyOn(ctrl, 'canEditQuestion').and.returnValue(true);
      spyOn(AlertsService, 'addSuccessMessage');
      spyOn(ctrl, 'getAllSkillSummaries').and.returnValue([]);
      spyOn(EditableQuestionBackendApiService, 'editQuestionSkillLinksAsync')
        .and.returnValue($q.resolve());

      ctrl.deleteQuestionFromSkill(questionId, skillDescription);
      $scope.$apply();

      expect(AlertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Deleted Question'
      );
    });

    it('should delete question when user is not in the skill editor', () => {
      ctrl.selectedSkillId = 'skillId1';
      ctrl.deletedQuestionIds = [];
      spyOn(ctrl, 'canEditQuestion').and.returnValue(true);
      spyOn(AlertsService, 'addSuccessMessage');
      spyOn(ctrl, 'getAllSkillSummaries').and.returnValue([
        ShortSkillSummary.createFromBackendDict({
          skill_id: '1',
          skill_description: 'Skill Description'
        })
      ]);
      spyOn(EditableQuestionBackendApiService, 'editQuestionSkillLinksAsync')
        .and.returnValue($q.resolve());

      ctrl.deleteQuestionFromSkill(questionId, skillDescription);
      $scope.$apply();

      expect(AlertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Deleted Question'
      );
    });
  });

  it('should not remove skill if it is the only one', () => {
    ctrl.associatedSkillSummaries = ['summary'];
    spyOn(AlertsService, 'addInfoMessage');

    ctrl.removeSkill();

    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'A question should be linked to at least one skill.');
  });

  it('should remove skill linked to a question', () => {
    ctrl.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: '1',
        skill_description: 'Skill Description'
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: '2',
        skill_description: 'Skill Description'
      })
    ];
    ctrl.skillLinkageModificationsArray = [];
    ctrl.removeSkill('1');

    expect(ctrl.associatedSkillSummaries).toEqual([
      ShortSkillSummary.createFromBackendDict({
        skill_id: '2',
        skill_description: 'Skill Description'
      })
    ]);
    expect(ctrl.skillLinkageModificationsArray).toEqual([
      {
        id: '1',
        task: 'remove'
      }
    ]);
  });

  it('should check that question is not savable if there are no' +
    ' changes', () => {
    ctrl.skillLinkageModificationsArray = [];
    ctrl.isSkillDifficultyChanged = false;
    spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(false);

    expect(ctrl.isQuestionSavable()).toBe(false);
  });

  it('should check if question is savable', () => {
    ctrl.questionIsBeingUpdated = false;
    ctrl.newQuestionSkillDifficulties = [0.9];
    spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(QuestionValidationService, 'isQuestionValid')
      .and.returnValues(true, false);

    expect(ctrl.isQuestionSavable()).toBe(true);

    ctrl.questionIsBeingUpdated = true;
    expect(ctrl.isQuestionSavable()).toBe(false);
  });

  it('should show solution if interaction can have solution', () => {
    ctrl.question = question;
    spyOn(ctrl.question, 'getStateData').and.returnValue({
      interaction: {
        id: 'TextInput'
      }
    });

    expect(ctrl.showSolutionCheckpoint()).toBe(true);
  });

  it('should show info message if skills is already linked to question', () => {
    var skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193
    };
    ctrl.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId1',
        skill_description: 'Skill Description'
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description'
      })
    ];
    spyOn(ctrl, 'getGroupedSkillSummaries').and.returnValue({
      current: [],
      others: [skillSummaryDict]
    });
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: new MockNgbModalRef(),
        result: $q.resolve(skillSummaryDict)
      } as NgbModalRef
    );
    spyOn(AlertsService, 'addInfoMessage');

    ctrl.addSkill();
    $scope.$apply();

    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'Skill already linked to question'
    );
  });

  it('should link skill if it is not already linked to question', () => {
    var skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193
    };
    ctrl.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description'
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId3',
        skill_description: 'Skill Description'
      })
    ];
    spyOn(ctrl, 'getGroupedSkillSummaries').and.returnValue({
      current: [],
      others: [skillSummaryDict]
    });
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: new MockNgbModalRef(),
        result: $q.resolve(skillSummaryDict)
      } as NgbModalRef
    );

    ctrl.addSkill();
    $scope.$apply();

    expect(ctrl.associatedSkillSummaries).toEqual(
      [
        ShortSkillSummary.createFromBackendDict({
          skill_id: 'skillId2',
          skill_description: 'Skill Description'
        }),
        ShortSkillSummary.createFromBackendDict({
          skill_id: 'skillId3',
          skill_description: 'Skill Description'
        }),
        ShortSkillSummary.createFromBackendDict({
          skill_id: 'skillId1',
          skill_description: 'description1'
        })
      ]
    );
    expect(ctrl.skillLinkageModificationsArray).toEqual([{
      id: 'skillId1',
      task: 'add',
      difficulty: 0.3
    }]);
  });

  it('should close modal when user clicks on cancel', () => {
    var skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193
    };
    ctrl.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description'
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId3',
        skill_description: 'Skill Description'
      })
    ];
    spyOn(ctrl, 'getGroupedSkillSummaries').and.returnValue({
      current: [],
      others: [skillSummaryDict]
    });
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: new MockNgbModalRef(),
        result: $q.reject(skillSummaryDict)
      } as NgbModalRef
    );
    spyOn(AlertsService, 'addInfoMessage');

    ctrl.addSkill();
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should save and publish question after updating linked skill', () => {
    spyOn(EditableQuestionBackendApiService, 'editQuestionSkillLinksAsync')
      .and.returnValue($q.resolve());
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');
    spyOn(ctrl, 'saveAndPublishQuestion');

    ctrl.updateSkillLinkageAndQuestions('commit');
    $scope.$apply();
    $timeout.flush(500);

    expect(QuestionsListService.getQuestionSummariesAsync).toHaveBeenCalled();
    expect(ctrl.editorIsOpen).toBe(false);
    expect(ctrl.saveAndPublishQuestion).toHaveBeenCalledWith('commit');
  });

  it('should update skill linkage correctly', () => {
    ctrl.skillLinkageModificationsArray = [
      {
        id: 'skillId1',
        task: 'update_difficulty',
        difficulty: 0.9
      }
    ];
    spyOn(EditableQuestionBackendApiService, 'editQuestionSkillLinksAsync')
      .and.returnValue($q.resolve());

    ctrl.updateSkillLinkage();
    $scope.$apply();
    $timeout.flush(500);

    expect(ctrl.skillLinkageModificationsArray).toEqual([]);
  });

  it('should open question editor save modal if question' +
    ' is being updated when user click on \'SAVE\' button', fakeAsync(() => {
    ctrl.questionIsBeingUpdated = true;
    spyOn(ngbModal, 'open').and.returnValue({
      result: $q.resolve('commit')
    } as NgbModalRef);
    spyOn(ctrl, 'updateSkillLinkageAndQuestions');
    spyOn(ctrl, 'saveAndPublishQuestion');

    // If skillLinkageModificationsArray is present.
    ctrl.skillLinkageModificationsArray = ['1', '2'];

    ctrl.saveQuestion();
    tick();
    $scope.$apply();

    expect(ctrl.updateSkillLinkageAndQuestions).toHaveBeenCalledWith('commit');

    // If skillLinkageModificationsArray is not present.
    ctrl.skillLinkageModificationsArray = [];

    ctrl.saveQuestion();
    tick();
    $scope.$apply();

    expect(ctrl.saveAndPublishQuestion).toHaveBeenCalledWith('commit');
  }));

  it('should create new question if user clicks on \'SAVE\' and if question' +
    ' is not being updates', () => {
    ctrl.questionIsBeingUpdated = false;
    spyOn(SkillEditorRoutingService, 'creatingNewQuestion');
    spyOn(ctrl, 'saveAndPublishQuestion');

    ctrl.saveQuestion();

    expect(ctrl.saveAndPublishQuestion).toHaveBeenCalled();
    expect(SkillEditorRoutingService.creatingNewQuestion).toHaveBeenCalled();
  });

  it('should close question editor save modal if user clicks cancel',
    fakeAsync(() => {
      ctrl.questionIsBeingUpdated = true;
      spyOn(ctrl, 'saveAndPublishQuestion');
      ctrl.skillLinkageModificationsArray = ['1', '2'];

      spyOn(ngbModal, 'open').and.returnValue({
        result: $q.reject()
      } as NgbModalRef);

      ctrl.saveQuestion();
      tick();
      $scope.$apply();

      expect(ctrl.saveAndPublishQuestion).not.toHaveBeenCalled();
    }));

  it('should get cached question summaries for one skill', () => {
    let summary = QuestionSummary
      .createFromBackendDict({
        id: 'qId',
        interaction_id: '',
        misconception_ids: [],
        question_content: ''
      });
    spyOn(QuestionsListService, 'getCachedQuestionSummaries').and.returnValue(
      summary);

    expect(ctrl.getQuestionSummariesForOneSkill()).toEqual(summary);
  });

  it('should not toggle difficulty card if window is not narrow', () => {
    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    ctrl.difficultyCardIsShown = true;

    ctrl.toggleDifficultyCard();

    expect(ctrl.difficultyCardIsShown).toBe(true);
  });

  it('should toggle difficulty card if window is narrow', () => {
    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    ctrl.difficultyCardIsShown = true;

    ctrl.toggleDifficultyCard();

    expect(ctrl.difficultyCardIsShown).toBe(false);
  });

  it('should get current page number', () => {
    spyOn(QuestionsListService, 'getCurrentPageNumber').and.returnValue(5);

    expect(ctrl.getCurrentPageNumber()).toBe(5);
  });
});
