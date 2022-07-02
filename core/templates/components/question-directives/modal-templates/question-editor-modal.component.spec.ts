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
 * @fileoverview Unit tests for QuestionEditorModalComponent.
 */

import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { QuestionEditorModalComponent } from './question-editor-modal.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AlertsService } from 'services/alerts.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { QuestionValidationService } from 'services/question-validation.service';

class MockNgbModalRef {
  componentInstance: {
    skillSummaries: null;
    skillsInSameTopicCount: null;
    categorizedSkills: null;
    allowSkillsFromOtherTopics: null;
    untriagedSkillSummaries: null;
  };
}

class MockNgbModal {
  open() {
    return Promise.resolve();
  }
}

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Question Editor Modal Component', () => {
  let component: QuestionEditorModalComponent;
  let fixture: ComponentFixture<QuestionEditorModalComponent>;
  let ngbModal: NgbModal;
  let ngbActiveModal: NgbActiveModal;
  let alertsService: AlertsService;
  let questionObjectFactory: QuestionObjectFactory;
  let questionUndoRedoService: QuestionUndoRedoService;
  let stateEditorService: StateEditorService;
  let questionValidationService: QuestionValidationService;

  const associatedSkillSummariesDict = [{
    id: '1',
    description: 'Description 1'
  }, {
    id: '2',
    description: 'Description 2'
  }, {
    id: '3',
    description: 'Description 3'
  }];
  const canEditQuestion = true;
  const categorizedSkills = [];
  const untriagedSkillSummaries = [];
  const groupedSkillSummaries = {
    current: [],
    others: []
  };
  const misconceptionsBySkill = null;
  const newQuestionIsBeingCreated = true;
  let question = null;
  let questionId = null;
  let questionStateData = null;
  const rubric = [];
  const skillName = [];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        QuestionEditorModalComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        QuestionObjectFactory,
        QuestionUndoRedoService,
        StateEditorService,
        QuestionValidationService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionEditorModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    questionUndoRedoService = TestBed.inject(QuestionUndoRedoService);
    stateEditorService = TestBed.inject(StateEditorService);
    questionValidationService = TestBed.inject(QuestionValidationService);

    fixture.detectChanges();

    component.associatedSkillSummaries = associatedSkillSummariesDict.map(a => (
      ShortSkillSummary.create(a.id, a.description)));
    component.groupedSkillSummaries = groupedSkillSummaries;
    component.canEditQuestion = canEditQuestion;
    component.categorizedSkills = categorizedSkills;
    component.untriagedSkillSummaries = untriagedSkillSummaries;
    component.question = question;
    component.questionId = questionId;
    component.questionStateData = questionStateData;
    component.rubric = rubric;
    component.skillName = skillName;
    component.misconceptionsBySkill = misconceptionsBySkill;
    component.newQuestionIsBeingCreated = newQuestionIsBeingCreated;

    question = questionObjectFactory.createFromBackendDict({
      id: '1',
      question_state_data_schema_version: null,
      language_code: null,
      version: null,
      linked_skill_ids: null,
      inapplicable_skill_misconception_ids: null,
      question_state_data: {
        classifier_model_id: null,
        solicit_answer_details: null,
        card_is_checkpoint: null,
        linked_skill_id: null,
        next_content_id_index: null,
        content: {
          html: 'Question 1',
          content_id: 'content_1'
        },
        interaction: {
          answer_groups: [{
            outcome: {
              missing_prerequisite_skill_id: null,
              dest: 'outcome 1',
              feedback: {
                content_id: 'content_5',
                html: ''
              },
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null
            },
            training_data: [],
            tagged_skill_misconception_id: null,
            rule_specs: []
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
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2'
            },
            param_changes: [],
            labelled_as_correct: true
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
      },
    });
    questionId = question.getId();
    questionStateData = question.getStateData();

    spyOn(stateEditorService, 'isCurrentSolutionValid').and.returnValue(true);
    spyOn(ngbActiveModal, 'dismiss').and.stub();
    spyOn(ngbActiveModal, 'close').and.stub();
  });

  it('should get skill editor url based on the skill id', () => {
    expect(component.getSkillEditorUrl('1')).toBe('/skill_editor/1');
    expect(component.getSkillEditorUrl('undefined')).toBe(
      '/skill_editor/undefined');
  });

  it('should try to remove all skill successfully and then undo changes',
    () => {
      let skillId = '3';
      component.removeSkill(skillId);

      expect(component.getSkillLinkageModificationsArray().length).toBe(1);
      expect(component.associatedSkillSummaries[0].getId()).toBe('1');
      expect(component.associatedSkillSummaries[0].getDescription()).toBe(
        'Description 1');
      expect(component.associatedSkillSummaries[1].getId()).toBe('2');
      expect(component.associatedSkillSummaries[1].getDescription()).toBe(
        'Description 2');
      expect(component.associatedSkillSummaries[2]).toBe(undefined);

      skillId = '2';
      component.removeSkill(skillId);

      expect(component.getSkillLinkageModificationsArray().length).toBe(2);
      expect(component.associatedSkillSummaries[0].getId()).toBe('1');
      expect(component.associatedSkillSummaries[0].getDescription()).toBe(
        'Description 1');
      expect(component.associatedSkillSummaries[1]).toBe(undefined);

      spyOn(alertsService, 'addInfoMessage').and.callThrough();

      skillId = '1';
      component.removeSkill(skillId);

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'A question should be linked to at least one skill.');
      expect(component.getSkillLinkageModificationsArray().length).toBe(2);
      expect(component.associatedSkillSummaries[0].getId()).toBe('1');
      expect(component.associatedSkillSummaries[0].getDescription()).toBe(
        'Description 1');
      expect(component.associatedSkillSummaries[1]).toBe(undefined);

      component.undo();


      expect(component.getSkillLinkageModificationsArray().length).toBe(0);
    });

  it('should close modal successfully', () => {
    spyOn(component, 'isQuestionValid').and.returnValue(true);
    component.done();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should open add skill modal when adding a new skill', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return (
      { componentInstance: MockNgbModalRef,
        result: Promise.resolve('success')
      }) as NgbModalRef;
    });
    component.addSkill();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should not add a new skill when it\'s already exists',
    () => {
      const summary = {id: '1', description: 'Description 1'};
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        setTimeout(opt.beforeDismiss);
        return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve(summary)
        } as NgbModalRef);
      });
      component.addSkill();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should close add skill modal on clicking cancel', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return (
      { componentInstance: MockNgbModalRef,
        result: Promise.reject()
      } as NgbModalRef);
    });

    component.addSkill();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should save and commit when there is no pending changes', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);
    spyOn(questionValidationService, 'isQuestionValid').and.returnValue(true);
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);

    expect(component.isSaveAndCommitButtonDisabled()).toBe(true);

    component.saveAndCommit();

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should not save and commit when there is no pending changes', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);
    spyOn(component, 'isQuestionValid').and.returnValue(false);
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);

    expect(component.isSaveAndCommitButtonDisabled()).toBe(true);

    component.saveAndCommit();

    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should save and commit after modifying skills', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve('Commiting skills')
    } as NgbModalRef);
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(questionValidationService, 'isQuestionValid').and.returnValue(true);

    expect(component.isSaveAndCommitButtonDisabled()).toBe(false);

    component.saveAndCommit();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should not save and commit when dismissing the add skill modal',
    () => {
      const openModalSpy = spyOn(ngbModal, 'open');
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);

      spyOn(component, 'isQuestionValid').and.returnValue(true);
      expect(component.isSaveAndCommitButtonDisabled()).toBe(false);

      openModalSpy.and.returnValue({
        result: Promise.reject()
      } as NgbModalRef);

      component.saveAndCommit();

      expect(ngbActiveModal.close).not.toHaveBeenCalled();
    });

  it('should dismiss modal when there is no pending changes', () => {
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);
    component.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should dismiss modal when there are pending changes which won\'t be' +
  ' saved', () => {
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);

    component.cancel();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should not dismiss modal when there are pending changes which will be' +
  ' saved', () => {
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);

    component.cancel();

    expect(ngbActiveModal.dismiss).not.toHaveBeenCalledWith('cancel');
  });

  it('should not close modal', () => {
    spyOn(component, 'isQuestionValid')
      .and.returnValue(false);

    component.done();
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should close modal', () => {
    spyOn(component, 'isQuestionValid')
      .and.returnValue(true);

    component.done();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });
});
