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
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Question Creation Service', function() {
  var $rootScope = null;
  var qcs = null;
  var SkillEditorStateService = null;
  var $httpBackend = null;
  var $q = null;
  var SkillDifficultyObjectFactory = null;
  var QuestionObjectFactory = null;
  var EditableQuestionBackendApiService = null;
  var SkillBackendApiService = null;
  var $uibModal = null;

  var SkillObjectFactory = null;
  var $location = null;
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

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when fetching skills is successful', function() {
    beforeEach(angular.mock.inject(function($injector) {
      qcs = $injector.get('QuestionCreationService');
      SkillEditorStateService = $injector.get('SkillEditorStateService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      $q = $injector.get('$q');
      SkillDifficultyObjectFactory = $injector.get(
        'SkillDifficultyObjectFactory');
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

      spyOn(SkillBackendApiService, 'fetchSkill').and.returnValue({
        skill: skillBackendDict,
        topicName: 'topic1',
        subtopicName: 'subtopic2',
      });
      var deferred = $q.defer();
      deferred.resolve([skillBackendDict]);
      spyOn(SkillBackendApiService, 'fetchMultiSkills').and.returnValue(
        deferred.promise);
      spyOn(
        SkillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
        current: [],
        others: [skillSummaryDict]
      });

      $httpBackend = $injector.get('$httpBackend');
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
                inputs: {
                  x: 10
                },
                rule_type: 'Equals'
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
        version: 1
      };
      var sampleQuestion = QuestionObjectFactory.createFromBackendDict(
        sampleQuestionBackendDict);
      spyOn(QuestionObjectFactory, 'createDefaultQuestion').and.returnValue(
        sampleQuestion);
      $rootScope = $injector.get('$rootScope');
      $location = $injector.get('$location');
    }));

    it('should create question', function() {
      var skillDiff = SkillDifficultyObjectFactory.create(
        'skillId1', 'description', 'Easy');
      var modalSpy = spyOn($uibModal, 'open').and.returnValue(
        {result: Promise.resolve([skillDiff])});
      qcs.createQuestion();
      expect(modalSpy).toHaveBeenCalled();
    });

    it('should return difficulty strings', function() {
      expect(qcs.getDifficultyString(0.3)).toEqual('Easy');
      expect(qcs.getDifficultyString(0.6)).toEqual('Medium');
      expect(qcs.getDifficultyString(1)).toEqual('Hard');
      expect(qcs.getDifficultyString(10)).toEqual('Hard');
      expect(qcs.getDifficultyString(2)).toEqual('Hard');
      expect(qcs.getDifficultyString(1.5)).toEqual('Hard');
    });

    it('should open question editor modal', function() {
      qcs.createQuestion();
      qcs.initializeNewQuestionCreation();

      var modalSpy = spyOn($uibModal, 'open').and.returnValue({
        result: Promise.resolve()});
      qcs.openQuestionEditor(0.3);
      expect(modalSpy).toHaveBeenCalled();
    });

    it('should call question backend api service to create the question',
      function() {
        qcs.createQuestion();
        qcs.initializeNewQuestionCreation();
        qcs.populateMisconceptions();

        var questionSpy = (
          spyOn(EditableQuestionBackendApiService, 'createQuestion'));
        qcs.saveAndPublishQuestion();
        expect(questionSpy).toHaveBeenCalled();
      });
  });

  describe('when question interaction validation fails', function() {
    var AlertsService = null;
    beforeEach(angular.mock.inject(function($injector) {
      qcs = $injector.get('QuestionCreationService');
      SkillEditorStateService = $injector.get('SkillEditorStateService');
      AlertsService = $injector.get('AlertsService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      SkillDifficultyObjectFactory = $injector.get(
        'SkillDifficultyObjectFactory');
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

      spyOn(SkillBackendApiService, 'fetchSkill').and.returnValue({
        skill: skillBackendDict,
        topicName: 'topic1',
        subtopicName: 'subtopic2',
      });
      spyOn(SkillBackendApiService, 'fetchMultiSkills').and.returnValue(
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

      $httpBackend = $injector.get('$httpBackend');
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
                inputs: {
                  x: 10
                },
                rule_type: 'Equals'
              }],
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
      $location = $injector.get('$location');
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
          spyOn(EditableQuestionBackendApiService, 'createQuestion'));
        qcs.saveAndPublishQuestion();
        expect(questionSpy).not.toHaveBeenCalled();
      });
  });

  describe('when question misconceptions validation fails', function() {
    var AlertsService = null;
    var $q = null;
    beforeEach(angular.mock.inject(function($injector) {
      qcs = $injector.get('QuestionCreationService');
      $q = $injector.get('$q');
      SkillEditorStateService = $injector.get('SkillEditorStateService');
      AlertsService = $injector.get('AlertsService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      SkillDifficultyObjectFactory = $injector.get(
        'SkillDifficultyObjectFactory');
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

      spyOn(SkillBackendApiService, 'fetchSkill').and.returnValue({
        skill: skillBackendDict,
        topicName: 'topic1',
        subtopicName: 'subtopic2',
      });
      var deferred = $q.defer();
      deferred.resolve([skillBackendDict]);
      spyOn(SkillBackendApiService, 'fetchMultiSkills').and.returnValue(
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

      $httpBackend = $injector.get('$httpBackend');
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
                inputs: {
                  x: 10
                },
                rule_type: 'Equals'
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
        version: 1
      };

      var sampleQuestion = QuestionObjectFactory.createFromBackendDict(
        sampleQuestionBackendDict);
      spyOn(QuestionObjectFactory, 'createDefaultQuestion').and.returnValue(
        sampleQuestion);
      $rootScope = $injector.get('$rootScope');
      $location = $injector.get('$location');
    }));

    it('should not call question backend api service to create the question',
      function() {
        qcs.createQuestion();
        qcs.initializeNewQuestionCreation();
        qcs.populateMisconceptions();
        $rootScope.$apply();
        var questionSpy = (
          spyOn(EditableQuestionBackendApiService, 'createQuestion'));
        qcs.saveAndPublishQuestion();
        expect(questionSpy).not.toHaveBeenCalled();
      });
  });
});
