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
  var $q = null;
  var $scope = null;
  var $uibModal = null;
  var $uibModalInstance = null;
  var AlertsService = null;
  var QuestionObjectFactory = null;
  var QuestionUndoRedoService = null;
  var SkillSummaryObjectFactory = null;
  var StateEditorService = null;

  var associatedSkillSummariesDict = [{
    id: '1',
    description: 'Description 1'
  }, {
    id: '2',
    description: 'Description 2'
  }, {
    id: '3',
    description: 'Description 3'
  }];
  var canEditQuestion = true;
  var categorizedSkills = [];
  var groupedSkillSummaries = {
    current: [],
    others: []
  };
  var misconceptionsBySkill = [];
  var newQuestionIsBeingCreated = true;
  var question = null;
  var questionId = null;
  var questionStateData = null;
  var associatedSkillSummaries = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when question is valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');
      StateEditorService = $injector.get('StateEditorService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      associatedSkillSummaries = associatedSkillSummariesDict.map(a => (
        SkillSummaryObjectFactory.create(a.id, a.description)));

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
            customization_args: {},
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
        questionStateData: questionStateData
      });
    }));

    it('should init the variables', function() {
      expect($scope.question).toEqual(question);
      expect($scope.questionStateData).toBe(questionStateData);
      expect($scope.associatedSkillSummaries).toEqual(associatedSkillSummaries);
      expect($scope.questionId).toBe(questionId);
      expect($scope.misconceptionsBySkill).toEqual(misconceptionsBySkill);
      expect($scope.canEditQuestion).toBe(canEditQuestion);
      expect($scope.newQuestionIsBeingCreated).toBe(newQuestionIsBeingCreated);
    });

    it('should get skill editor url', function() {
      expect($scope.getSkillEditorUrl('1')).toBe('/skill_editor/1');
      expect($scope.getSkillEditorUrl('undefined')).toBe(
        '/skill_editor/undefined');
    });

    it('should try to remove all skill successfully and then undo changes',
      function() {
        var skillId = '3';
        $scope.removeSkill(skillId);

        expect($scope.getSkillLinkageModificationsArray().length).toBe(1);
        expect($scope.associatedSkillSummaries[0].getId()).toBe('1');
        expect($scope.associatedSkillSummaries[0].getDescription()).toBe(
          'Description 1');
        expect($scope.associatedSkillSummaries[1].getId()).toBe('2');
        expect($scope.associatedSkillSummaries[1].getDescription()).toBe(
          'Description 2');
        expect($scope.associatedSkillSummaries[2]).toBe(undefined);

        var skillId = '2';
        $scope.removeSkill(skillId);

        expect($scope.getSkillLinkageModificationsArray().length).toBe(2);
        expect($scope.associatedSkillSummaries[0].getId()).toBe('1');
        expect($scope.associatedSkillSummaries[0].getDescription()).toBe(
          'Description 1');
        expect($scope.associatedSkillSummaries[1]).toBe(undefined);

        spyOn(AlertsService, 'addInfoMessage').and.callThrough();

        var skillId = '1';
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

    it('should not add a new skill if it\'s already exists', function() {
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
      spyOn(AlertsService, 'addInfoMessage').and.callThrough();
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          id: '4',
          description: 'Description 4'
        })
      });

      expect($scope.associatedSkillSummaries.length).toEqual(3);
      expect($scope.getSkillLinkageModificationsArray().length).toBe(0);
      $scope.addSkill();
      $scope.$apply();

      expect($scope.associatedSkillSummaries.length).toEqual(4);
      expect($scope.getSkillLinkageModificationsArray().length).toBe(1);
    });

    it('should not add skill if dismissing the add skill modal', function() {
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

    it('should save and commit if there is no pending changes', function() {
      var openModalSpy = spyOn($uibModal, 'open');
      openModalSpy.and.returnValue({
        result: $q.resolve({
          id: '4',
          description: 'Description 4'
        })
      });

      $scope.addSkill();
      $scope.$apply();

      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(false);
      expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);
      $scope.saveAndCommit();

      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should save and commit after modifying skills', function() {
      var openModalSpy = spyOn($uibModal, 'open');
      openModalSpy.and.returnValue({
        result: $q.resolve({
          id: '4',
          description: 'Description 4'
        })
      });

      $scope.addSkill();
      $scope.$apply();

      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);
      var commitMessage = 'Commiting skills';
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

    it('should not save and commit if dismissing the add skill modal',
      function() {
        var openModalSpy = spyOn($uibModal, 'open');
        openModalSpy.and.returnValue({
          result: $q.resolve({
            id: '4',
            description: 'Description 4'
          })
        });

        $scope.addSkill();
        $scope.$apply();

        spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
        expect($scope.isSaveAndCommitButtonDisabled()).toBe(false);
        openModalSpy.and.returnValue({
          result: $q.reject()
        });
        $scope.saveAndCommit();
        $scope.$apply();

        expect($uibModalInstance.close).not.toHaveBeenCalled();
      });

    it('should dismiss modal if there is no pendent changes', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(false);
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should dismiss modal if there is pendent changes which won\'t be' +
      ' saved', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      $scope.cancel();
      $scope.$apply();

      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should not dismiss modal if there is pendent changes which will be' +
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
      var $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');
      StateEditorService = $injector.get('StateEditorService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      associatedSkillSummaries = associatedSkillSummariesDict.map(a => (
        SkillSummaryObjectFactory.create(a.id, a.description)));

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
            customization_args: {},
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
        questionStateData: questionStateData
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
