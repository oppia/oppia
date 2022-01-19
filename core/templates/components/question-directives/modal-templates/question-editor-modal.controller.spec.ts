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
 * @fileoverview Unit tests for QuestionEditorModalController.
 */

import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';

class MockNgbModalRef {
  componentInstance: {
    skillSummaries: null;
    skillsInSameTopicCount: null;
    categorizedSkills: null;
    allowSkillsFromOtherTopics: null;
    untriagedSkillSummaries: null;
  };
}

describe('Question Editor Modal Controller', function() {
  let $q = null;
  let $scope = null;
  let ngbModal: NgbModal;
  let $uibModalInstance = null;
  let AlertsService = null;
  let QuestionObjectFactory = null;
  let QuestionUndoRedoService = null;
  let StateEditorService = null;
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

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
  const misconceptionsBySkill = [];
  const newQuestionIsBeingCreated = true;
  let question = null;
  let questionId = null;
  let questionStateData = null;
  const rubric = [];
  const skillName = [];
  let associatedSkillSummaries = null;

  describe('when question is valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $q = $injector.get('$q');
      ngbModal = TestBed.inject(NgbModal);
      const $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      StateEditorService = $injector.get('StateEditorService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      associatedSkillSummaries = associatedSkillSummariesDict.map(a => (
        ShortSkillSummary.create(a.id, a.description)));

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
                feedback: {
                  content_id: 'content_5',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null
              },
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

      spyOn(StateEditorService, 'isCurrentSolutionValid').and.returnValue(true);

      $scope = $rootScope.$new();
      $controller('QuestionEditorModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        associatedSkillSummaries: associatedSkillSummaries,
        canEditQuestion: canEditQuestion,
        categorizedSkills: categorizedSkills,
        groupedSkillSummaries: groupedSkillSummaries,
        misconceptionsBySkill: misconceptionsBySkill,
        newQuestionIsBeingCreated: newQuestionIsBeingCreated,
        question: question,
        questionId: questionId,
        untriagedSkillSummaries: untriagedSkillSummaries,
        questionStateData: questionStateData,
        rubric: rubric,
        skillName: skillName,
        NgbModal: ngbModal
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.question).toEqual(question);
        expect($scope.questionStateData).toBe(questionStateData);
        expect($scope.associatedSkillSummaries).toEqual(
          associatedSkillSummaries);
        expect($scope.questionId).toBe(questionId);
        expect($scope.misconceptionsBySkill).toEqual(misconceptionsBySkill);
        expect($scope.canEditQuestion).toBe(canEditQuestion);
        expect($scope.newQuestionIsBeingCreated).toBe(
          newQuestionIsBeingCreated);
        expect($scope.rubric).toEqual(rubric);
        expect($scope.skillName).toEqual(skillName);
      });

    it('should get skill editor url based on the skill id', function() {
      expect($scope.getSkillEditorUrl('1')).toBe('/skill_editor/1');
      expect($scope.getSkillEditorUrl('undefined')).toBe(
        '/skill_editor/undefined');
    });

    it('should try to remove all skill successfully and then undo changes',
      function() {
        let skillId = '3';
        $scope.removeSkill(skillId);

        expect($scope.getSkillLinkageModificationsArray().length).toBe(1);
        expect($scope.associatedSkillSummaries[0].getId()).toBe('1');
        expect($scope.associatedSkillSummaries[0].getDescription()).toBe(
          'Description 1');
        expect($scope.associatedSkillSummaries[1].getId()).toBe('2');
        expect($scope.associatedSkillSummaries[1].getDescription()).toBe(
          'Description 2');
        expect($scope.associatedSkillSummaries[2]).toBe(undefined);

        skillId = '2';
        $scope.removeSkill(skillId);

        expect($scope.getSkillLinkageModificationsArray().length).toBe(2);
        expect($scope.associatedSkillSummaries[0].getId()).toBe('1');
        expect($scope.associatedSkillSummaries[0].getDescription()).toBe(
          'Description 1');
        expect($scope.associatedSkillSummaries[1]).toBe(undefined);

        spyOn(AlertsService, 'addInfoMessage').and.callThrough();

        skillId = '1';
        $scope.removeSkill(skillId);

        expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
          'A question should be linked to at least one skill.');
        expect($scope.getSkillLinkageModificationsArray().length).toBe(2);
        expect($scope.associatedSkillSummaries[0].getId()).toBe('1');
        expect($scope.associatedSkillSummaries[0].getDescription()).toBe(
          'Description 1');
        expect($scope.associatedSkillSummaries[1]).toBe(undefined);

        $scope.undo();

        expect($scope.associatedSkillSummaries).toEqual(
          associatedSkillSummaries);
        expect($scope.getSkillLinkageModificationsArray().length).toBe(0);
      });

    it('should close modal successfully', function() {
      $scope.done();
      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should open add skill modal when adding a new skill', function() {
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        setTimeout(opt.beforeDismiss);
        return (
          { componentInstance: MockNgbModalRef,
            result: Promise.resolve('success')
          }) as NgbModalRef;
      });
      $scope.addSkill();
      $scope.$apply();
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
        $scope.addSkill();
        $scope.$apply();
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
      $scope.addSkill();
      $scope.$apply();
      expect(modalSpy).toHaveBeenCalled();
    });

    it('should save and commit when there is no pending changes', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(false);

      expect($scope.isSaveAndCommitButtonDisabled()).toBe(true);

      $scope.saveAndCommit();

      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should save and commit after modifying skills', function() {
      const commitMessage = 'Commiting skills';
      const openModalSpy = spyOn(ngbModal, 'open');
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);

      expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);

      openModalSpy.and.returnValue({
        result: $q.resolve(commitMessage)
      } as NgbModalRef);

      $scope.saveAndCommit();
      $scope.$apply();

      expect($uibModalInstance.close).toHaveBeenCalledWith({
        skillLinkageModificationsArray: (
          $scope.getSkillLinkageModificationsArray()),
        commitMessage: commitMessage
      });
    });

    it('should not save and commit when dismissing the add skill modal',
      function() {
        const openModalSpy = spyOn(ngbModal, 'open');
        spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);

        expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);

        openModalSpy.and.returnValue({
          result: $q.reject()
        } as NgbModalRef);

        $scope.saveAndCommit();
        $scope.$apply();

        expect($uibModalInstance.close).not.toHaveBeenCalled();
      });

    it('should dismiss modal when there is no pending changes', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(false);
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should dismiss modal when there are pending changes which won\'t be' +
      ' saved', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(ngbModal, 'open').and.returnValue({
        result: $q.resolve()
      } as NgbModalRef);

      $scope.cancel();
      $scope.$apply();

      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should not dismiss modal when there are pending changes which will be' +
      ' saved', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(ngbModal, 'open').and.returnValue({
        result: $q.reject()
      } as NgbModalRef);

      $scope.cancel();
      $scope.$apply();

      expect($uibModalInstance.dismiss).not.toHaveBeenCalledWith('cancel');
    });
  });

  describe('when question is not valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      ngbModal = TestBed.inject(NgbModal);
      $q = $injector.get('$q');
      const $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      StateEditorService = $injector.get('StateEditorService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      associatedSkillSummaries = associatedSkillSummariesDict.map(a => (
        ShortSkillSummary.create(a.id, a.description)));

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
                feedback: {
                  content_id: 'content_5',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null
              },
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

      spyOn(StateEditorService, 'isCurrentSolutionValid').and.returnValue(
        false);

      $scope = $rootScope.$new();
      $controller('QuestionEditorModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        associatedSkillSummaries: associatedSkillSummaries,
        canEditQuestion: canEditQuestion,
        categorizedSkills: categorizedSkills,
        groupedSkillSummaries: groupedSkillSummaries,
        misconceptionsBySkill: misconceptionsBySkill,
        newQuestionIsBeingCreated: newQuestionIsBeingCreated,
        question: question,
        questionId: questionId,
        questionStateData: questionStateData,
        untriagedSkillSummaries: [],
        rubric: rubric,
        skillName: skillName,
        NgbModal: ngbModal
      });
    }));

    it('should not close modal', function() {
      $scope.done();
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });

    it('should not save and commit changes', function() {
      $scope.saveAndCommit();
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });
  });
});
