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
 * @fileoverview Unit tests for QuestionCreationService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fakeAsync, tick } from '@angular/core/testing';

class MockNgbModalRef {
  componentInstance: {
    allSkillSummaries: null;
    countOfSkillsToPrioritize: null;
    currentMode: null;
    linkedSkillsWithDifficulty: null;
    skillIdToRubricsObject: null;
  };
}

describe('Question Creation Service', function() {
  var $rootScope = null;
  var qcs = null;
  var SkillEditorStateService = null;
  var $q = null;
  var QuestionObjectFactory = null;
  var EditableQuestionBackendApiService = null;
  var SkillBackendApiService = null;
  var $uibModal = null;
  let ngbModal: NgbModal;
  var linkedSkillsWithDifficulty = null;

  var SkillObjectFactory = null;
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

  describe('when fetching skills is successful', function() {
    beforeEach(angular.mock.inject(function($injector) {
      qcs = $injector.get('QuestionCreationService');
      SkillEditorStateService = $injector.get('SkillEditorStateService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      $q = $injector.get('$q');
      ngbModal = $injector.get('NgbModal');
      SkillBackendApiService = $injector.get('SkillBackendApiService');
      EditableQuestionBackendApiService = $injector.get(
        'EditableQuestionBackendApiService');
      $uibModal = $injector.get('$uibModal');
      var misconceptionDict = {
        feedback: 'feedback',
        id: 'id1',
        must_be_addressed: false,
        name: 'name1',
        notes: 'notes1'
      };
      var rubricDict1 = {
        difficulty: 'Easy',
        explanations: ['Easy']
      };
      var rubricDict2 = {
        difficulty: 'Medium',
        explanations: ['Medium 1', 'Medium 2']
      };
      var conceptCardDict = {
        explanation: {content_id: 'content',
          html: 'html_data'},
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            explanation: {},
            worked_example_1: {},
            worked_example_2: {}
          }
        } };
      var skillBackendDict = {
        all_questions_merged: true,
        description: 'description1',
        id: 'skillId1',
        language_code: 'en',
        misconceptions: [misconceptionDict],
        next_misconception_id: '2',
        prerequisite_skill_ids: [],
        rubrics: [rubricDict1, rubricDict2],
        skill_contents: conceptCardDict,
        superseding_skill_id: 'skillId2',
        version: 2,
      };

      spyOn(SkillBackendApiService, 'fetchSkillAsync').and.returnValue({
        skill: skillBackendDict,
        topicName: 'topic1',
        subtopicName: 'subtopic2',
      });
      var deferred = $q.defer();
      deferred.resolve([skillBackendDict]);
      spyOn(SkillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
        deferred.promise);
      spyOn(
        SkillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
        current: [],
        others: [skillSummaryDict]
      });
      var skillObject = SkillObjectFactory.createFromBackendDict(
        skillBackendDict);
      spyOn(SkillEditorStateService, 'getSkill').and.returnValue(skillObject);

      QuestionObjectFactory = $injector.get('QuestionObjectFactory');

      var sampleQuestionBackendDict = {
        id: 'question_id',
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
              rule_specs: [{
                rule_type: 'Equals',
                inputs: {x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['10']
                }}
              }],
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
              labelled_as_correct: false
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1',
                  content_id: 'content_3'
                }
              }
            ],
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
            voiceovers_mapping: {
              content_1: {}
            }
          },
          written_translations: {
            translations_mapping: {
              content_1: {}
            }
          },
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1,
        inapplicable_skill_misconception_ids: ['skillId1-Id1']
      };
      linkedSkillsWithDifficulty = [
        {
          getId(): string {
            return 'skill 1';
          },
          getDifficulty(): string {
            return 'easy';
          }
        },
        {
          getId(): string {
            return 'skill 2';
          },
          getDifficulty(): string {
            return 'medium';
          }
        }
      ];
      var sampleQuestion = QuestionObjectFactory.createFromBackendDict(
        sampleQuestionBackendDict);
      spyOn(QuestionObjectFactory, 'createDefaultQuestion').and.returnValue(
        sampleQuestion);
      $rootScope = $injector.get('$rootScope');
    }));

    it('should create question', fakeAsync(() => {
      var skillDiff = SkillDifficulty.create(
        'skillId1', 'description', 0.3);
      var modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve([skillDiff])
      } as NgbModalRef);
      qcs.createQuestion();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));

    it('should open question editor modal', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(linkedSkillsWithDifficulty)
      } as NgbModalRef);

      qcs.createQuestion();
      qcs.initializeNewQuestionCreation();

      var modalSpy = spyOn($uibModal, 'open').and.returnValue({
        result: Promise.resolve()});
      qcs.openQuestionEditor(0.3);
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));

    it('should call question backend api service to create the question',
      fakeAsync(() => {
        var modalSpy = spyOn(ngbModal, 'open').and.returnValue({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(linkedSkillsWithDifficulty)
        } as NgbModalRef);

        qcs.createQuestion();
        qcs.initializeNewQuestionCreation();
        qcs.populateMisconceptions();

        var questionSpy = (
          spyOn(EditableQuestionBackendApiService, 'createQuestionAsync'));
        qcs.saveAndPublishQuestion();
        tick();

        expect(questionSpy).toHaveBeenCalled();
        expect(modalSpy).toHaveBeenCalled();
      }));
  });

  describe('when question interaction validation fails', function() {
    var AlertsService = null;
    beforeEach(angular.mock.inject(function($injector) {
      qcs = $injector.get('QuestionCreationService');
      SkillEditorStateService = $injector.get('SkillEditorStateService');
      AlertsService = $injector.get('AlertsService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      SkillBackendApiService = $injector.get('SkillBackendApiService');
      EditableQuestionBackendApiService = $injector.get(
        'EditableQuestionBackendApiService');
      $uibModal = $injector.get('$uibModal');
      var misconceptionDict = {
        feedback: 'feedback',
        id: 'id1',
        must_be_addressed: false,
        name: 'name1',
        notes: 'notes1'
      };
      var rubricDict = {
        difficulty: 'Easy',
        explanations: ['Easy']
      };
      var conceptCardDict = {
        explanation: {content_id: 'content',
          html: 'html_data'},
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            explanation: {},
            worked_example_1: {},
            worked_example_2: {}
          }
        } };
      var skillBackendDict = {
        all_questions_merged: true,
        description: 'description1',
        id: 'skillId1',
        language_code: 'en',
        misconceptions: [misconceptionDict],
        next_misconception_id: '2',
        prerequisite_skill_ids: [],
        rubrics: [rubricDict],
        skill_contents: conceptCardDict,
        superseding_skill_id: 'skillId2',
        version: 2,
      };

      spyOn(SkillBackendApiService, 'fetchSkillAsync').and.returnValue({
        skill: skillBackendDict,
        topicName: 'topic1',
        subtopicName: 'subtopic2',
      });
      spyOn(SkillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
        Promise.reject());
      spyOn(
        SkillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
        current: [],
        others: [skillSummaryDict]
      });
      var skillObject = SkillObjectFactory.createFromBackendDict(
        skillBackendDict);
      spyOn(
        SkillEditorStateService, 'getSkill').and.returnValue(skillObject);

      QuestionObjectFactory = $injector.get('QuestionObjectFactory');

      var sampleQuestionBackendDict = {
        id: 'question_id',
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
              labelled_as_correct: false
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1',
                  content_id: 'content_3'
                }
              }
            ],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation',
                content_id: 'content_4'
              }
            },
            id: null
          },
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {
              content_1: {}
            }
          },
          written_translations: {
            translations_mapping: {
              content_1: {}
            }
          },
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1
      };
      var sampleQuestion = QuestionObjectFactory.createFromBackendDict(
        sampleQuestionBackendDict);
      spyOn(QuestionObjectFactory, 'createDefaultQuestion').and.returnValue(
        sampleQuestion);
      $rootScope = $injector.get('$rootScope');
    }));

    it('should Alerts Service if populating misconceptions fails', function() {
      var alertsSpy = spyOn(AlertsService, 'addWarning').and.callThrough();
      qcs.populateMisconceptions();
      $rootScope.$apply();
      expect(alertsSpy).toHaveBeenCalled();
    });

    it('should not call question backend api service to create the question',
      function() {
        qcs.createQuestion();
        qcs.initializeNewQuestionCreation();
        qcs.populateMisconceptions();
        var questionSpy = (
          spyOn(EditableQuestionBackendApiService, 'createQuestionAsync'));
        qcs.saveAndPublishQuestion();
        expect(questionSpy).not.toHaveBeenCalled();
      });
  });

  describe('when question misconceptions validation fails', function() {
    var $q = null;
    beforeEach(angular.mock.inject(function($injector) {
      qcs = $injector.get('QuestionCreationService');
      $q = $injector.get('$q');
      SkillEditorStateService = $injector.get('SkillEditorStateService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      SkillBackendApiService = $injector.get('SkillBackendApiService');
      EditableQuestionBackendApiService = $injector.get(
        'EditableQuestionBackendApiService');
      $uibModal = $injector.get('$uibModal');
      var misconceptionDict = {
        feedback: 'feedback',
        id: 'id1',
        must_be_addressed: true,
        name: 'name1',
        notes: 'notes1'
      };
      var rubricDict = {
        difficulty: 'Easy',
        explanations: ['Easy']
      };
      var conceptCardDict = {
        explanation: {content_id: 'content',
          html: 'html_data'},
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            explanation: {},
            worked_example_1: {},
            worked_example_2: {}
          }
        } };
      var skillBackendDict = {
        all_questions_merged: true,
        description: 'description1',
        id: 'skillId1',
        language_code: 'en',
        misconceptions: [misconceptionDict],
        next_misconception_id: '2',
        prerequisite_skill_ids: [],
        rubrics: [rubricDict],
        skill_contents: conceptCardDict,
        superseding_skill_id: 'skillId2',
        version: 2,
      };

      spyOn(SkillBackendApiService, 'fetchSkillAsync').and.returnValue({
        skill: SkillObjectFactory.createFromBackendDict(skillBackendDict),
        topicName: 'topic1',
        subtopicName: 'subtopic2',
      });
      var deferred = $q.defer();
      deferred.resolve(
        [SkillObjectFactory.createFromBackendDict(skillBackendDict)]
      );
      spyOn(SkillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
        deferred.promise);
      spyOn(
        SkillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
        current: [],
        others: [skillSummaryDict]
      });
      var skillObject = SkillObjectFactory.createFromBackendDict(
        skillBackendDict);
      spyOn(
        SkillEditorStateService, 'getSkill').and.returnValue(skillObject);

      QuestionObjectFactory = $injector.get('QuestionObjectFactory');

      var sampleQuestionBackendDict = {
        id: 'question_id',
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
              rule_specs: [{
                rule_type: 'Equals',
                inputs: {x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['10']
                }}
              }],
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
              labelled_as_correct: false
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1',
                  content_id: 'content_3'
                }
              }
            ],
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
            voiceovers_mapping: {
              content_1: {}
            }
          },
          written_translations: {
            translations_mapping: {
              content_1: {}
            }
          },
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1,
        inapplicable_skill_misconception_ids: []
      };

      var sampleQuestion = QuestionObjectFactory.createFromBackendDict(
        sampleQuestionBackendDict);
      spyOn(QuestionObjectFactory, 'createDefaultQuestion').and.returnValue(
        sampleQuestion);
      $rootScope = $injector.get('$rootScope');
    }));

    it('should not call question backend api service to create the question',
      function() {
        qcs.createQuestion();
        qcs.initializeNewQuestionCreation();
        qcs.populateMisconceptions();
        $rootScope.$apply();
        var questionSpy = (
          spyOn(EditableQuestionBackendApiService, 'createQuestionAsync'));
        qcs.saveAndPublishQuestion();
        expect(questionSpy).not.toHaveBeenCalled();
      });
  });
});
