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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Question Editor Modal Controller', function() {
  let $q = null;
  let $scope = null;
  let $uibModal = null;
  let $uibModalInstance = null;
  let AlertsService = null;
  let QuestionObjectFactory = null;
  let QuestionUndoRedoService = null;
  let ShortSkillSummaryObjectFactory = null;
  let StateEditorService = null;

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
  const rubrics = [];
  const skillNames = [];
  let associatedSkillSummaries = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when question is valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      const $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      ShortSkillSummaryObjectFactory = $injector.get(
        'ShortSkillSummaryObjectFactory');
      StateEditorService = $injector.get('StateEditorService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      associatedSkillSummaries = associatedSkillSummariesDict.map(a => (
        ShortSkillSummaryObjectFactory.create(a.id, a.description)));

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
              rule_specs: [],
            }],
            confirmed_unclassified_answers: [],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'custarg_placeholder_0',
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
        rubrics: rubrics,
        skillNames: skillNames
      });
    }));

    it('should init the constiables', function() {
      expect($scope.question).toEqual(question);
      expect($scope.questionStateData).toBe(questionStateData);
      expect($scope.associatedSkillSummaries).toEqual(associatedSkillSummaries);
      expect($scope.questionId).toBe(questionId);
      expect($scope.misconceptionsBySkill).toEqual(misconceptionsBySkill);
      expect($scope.canEditQuestion).toBe(canEditQuestion);
      expect($scope.newQuestionIsBeingCreated).toBe(newQuestionIsBeingCreated);
      expect($scope.rubrics).toEqual(rubrics);
      expect($scope.skillNames).toEqual(skillNames);
    });

    it('should get skill editor url', function() {
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

    it('should open a modal when adding a new skill', function() {
      spyOn($uibModal, 'open').and.callThrough();

      $scope.addSkill();

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should not add a new skill when it\'s already exists', function() {
      spyOn(AlertsService, 'addInfoMessage').and.callThrough();
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          id: '1'
        })
      });
      $scope.addSkill();
      $scope.$apply();

      expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
        'Skill already linked to question');
      expect($scope.associatedSkillSummaries).toEqual(associatedSkillSummaries);
    });

    it('should add a new skill successfully', function() {
      const skillSummaryDict = {
        id: '4',
        description: 'Description 4'
      };
      const openModalSpy = spyOn($uibModal, 'open');
      openModalSpy.and.returnValue({
        result: $q.resolve(skillSummaryDict)
      });
      expect($scope.associatedSkillSummaries.length).toEqual(3);
      expect($scope.getSkillLinkageModificationsArray().length).toBe(0);
      $scope.addSkill();
      $scope.$apply();

      expect($scope.associatedSkillSummaries).toContain(
        ShortSkillSummaryObjectFactory.create(
          skillSummaryDict.id, skillSummaryDict.description));
      expect($scope.associatedSkillSummaries.length).toEqual(4);
      expect($scope.getSkillLinkageModificationsArray().length).toBe(1);
    });

    it('should not add skill when dismissing the add skill modal', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      expect($scope.associatedSkillSummaries.length).toEqual(3);
      expect($scope.getSkillLinkageModificationsArray().length).toBe(0);
      $scope.addSkill();
      $scope.$apply();

      expect($scope.associatedSkillSummaries.length).toEqual(3);
      expect($scope.getSkillLinkageModificationsArray().length).toBe(0);
    });

    it('should save and commit when there is no pending changes', function() {
      const skillSummaryDict = {
        id: '4',
        description: 'Description 4'
      };
      const openModalSpy = spyOn($uibModal, 'open');
      openModalSpy.and.returnValue({
        result: $q.resolve(skillSummaryDict)
      });

      $scope.addSkill();
      $scope.$apply();

      expect($scope.associatedSkillSummaries).toContain(
        ShortSkillSummaryObjectFactory.create(
          skillSummaryDict.id, skillSummaryDict.description));

      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(false);
      expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);
      $scope.saveAndCommit();

      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should save and commit after modifying skills', function() {
      const skillSummaryDict = {
        id: '4',
        description: 'Description 4'
      };
      const openModalSpy = spyOn($uibModal, 'open');
      openModalSpy.and.returnValue({
        result: $q.resolve(skillSummaryDict)
      });

      $scope.addSkill();
      $scope.$apply();

      expect($scope.associatedSkillSummaries).toContain(
        ShortSkillSummaryObjectFactory.create(
          skillSummaryDict.id, skillSummaryDict.description));

      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);
      const commitMessage = 'Commiting skills';
      openModalSpy.and.returnValue({
        result: $q.resolve(commitMessage)
      });
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
        const skillSummaryDict = {
          id: '4',
          description: 'Description 4'
        };
        const openModalSpy = spyOn($uibModal, 'open');
        openModalSpy.and.returnValue({
          result: $q.resolve(skillSummaryDict)
        });

        $scope.addSkill();
        $scope.$apply();

        expect($scope.associatedSkillSummaries).toContain(
          ShortSkillSummaryObjectFactory.create(
            skillSummaryDict.id, skillSummaryDict.description));

        spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
        expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);
        openModalSpy.and.returnValue({
          result: $q.reject()
        });
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
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      $scope.cancel();
      $scope.$apply();

      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should not dismiss modal when there are pending changes which will be' +
      ' saved', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      $scope.cancel();
      $scope.$apply();

      expect($uibModalInstance.dismiss).not.toHaveBeenCalledWith('cancel');
    });
  });

  describe('when question is not valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      const $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      ShortSkillSummaryObjectFactory = $injector.get(
        'ShortSkillSummaryObjectFactory');
      StateEditorService = $injector.get('StateEditorService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      associatedSkillSummaries = associatedSkillSummariesDict.map(a => (
        ShortSkillSummaryObjectFactory.create(a.id, a.description)));

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
              rule_specs: [],
            }],
            confirmed_unclassified_answers: [],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'custarg_placeholder_0',
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
        rubrics: rubrics,
        skillNames: skillNames
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
