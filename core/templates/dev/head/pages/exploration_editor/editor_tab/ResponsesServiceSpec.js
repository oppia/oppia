// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Responses Service.
 */

describe('Responses Service', function() {
  describe('ResponsesService', function() {
    beforeEach(function() {
      module('oppia');
    });

    let ess;
    let scope;
    let rs;

    beforeEach(inject(function($injector, $rootScope) {
      rs = $injector.get('ResponsesService');
      ess = $injector.get('ExplorationStatesService');
      scope = $rootScope.$new();
    }));

    // Since Exploration States Service required for Responses Service to work,
    // it needs to be initialized prior
    beforeEach(inject(function($injector) {
      ess = $injector.get('ExplorationStatesService');
    }));

    beforeEach(function() {
      ess.init({
        Test: {
          classifier_model_id: null,
          content: {
            content_id: 'content',
            html: '<p>Sample test</p>'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          },
          param_changes: [],
          interaction: {
            answer_groups: [{
              rule_specs: [{rule_type: 'Equals', inputs: {x: '<p>One</p>'}}],
              outcome: {
                dest: 'Test',
                feedback: {
                  content_id: 'feedback_1',
                  html: '<p>Correct</p>'
                },
                labelled_as_correct: false,
                missing_prerequisite_skill_id: null,
                param_changes: [],
                refresher_exploration_id: null
              },
              tagged_misconception_id: null,
              training_data: []
            }],
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                value: ['<p>One</p>', '<p>Two</p>']
              },
              maxAllowableSelectionCount: {value: 1},
              minAllowableSelectionCount: {value: 1}
            },
            default_outcome: {
              dest: 'Test',
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again</p>'
              },
              labelled_as_correct: false,
              missing_prerequisite_skill_id: null,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: [],
            id: 'ItemSelectionInput',
            solution: null
          }
        }
      })
    });

    // Initialize Responses Service
    beforeEach(function() {
      rs.init({
        answerGroups: [{
          rules: [{
            inputs: {x: ['<p>One</p>']},
            type: 'Equals'
          }],
          outcome: {
            dest: 'Test',
            feedback: {
              _contentId: "feedback_1",
              _html: "<p>True!</p>↵"
            },
            refresherExplorationId: null,
            missingPrerequisiteSkillId: null,
            labelledAsCorrect: false,
            paramChanges: []
          },
          trainingData: [],
          taggedMisconceptionId: null
        }],
        defaultOutcome: {
          dest: 'Test',
          feedback: {
            _contentId: 'default_outcome',
            _html: ''
          },
          refresherExplorationId: null,
          missingPrerequisiteSkillId: null,
          labelledAsCorrect: false,
          paramChanges: []
        },
        confirmedUnclassifiedAnswers: [],
        interactionId: "ItemSelectionInput"
      })
    });

    it('should return -1 if no answer group is active', function() {
      expect(rs.getActiveAnswerGroupIndex()).toEqual(-1);
    });

    it('should be able to change the answer group index', function() {
      rs.changeActiveAnswerGroupIndex(5);
      expect(rs.getActiveAnswerGroupIndex()).toEqual(5);
    });

    it('should return 0 for the active rule index by default', function() {
      expect(rs.getActiveRuleIndex()).toEqual(0);
    });

    it('should be able to change the active rule index', function() {
      rs.changeActiveRuleIndex(5);
      expect(rs.getActiveRuleIndex()).toEqual(5);
    });

    it('should return null if no answer choices provided', function() {
      expect(rs.getAnswerChoices()).toEqual(null)
    });

    describe('Manipulate answer group', function() {

      let ruleUpdates;
      let feedbackUpdates;
      let destUpdates;

      beforeEach(function() {
        ruleUpdates = {
          rules: [{
            inputs: {x: ['<p>Two</p>']},
            type: 'Equals'
          }],
        };

        feedbackUpdates = {
          feedback: {
            _contentId: "feedback_1",
            _html: "<p>Correct!</p>↵"
          }
        };

        destUpdates = {
          dest: 'Test',
          refresherExplorationId: null,
          missingPrerequisiteSkillId: null
        }
      });

      it('should update rules', function() {
        rs.updateAnswerGroup(0, ruleUpdates);
        expect(rs.getAnswerGroup(0).rules).toEqual(ruleUpdates.rules)
      })
/*
      it('should update the answer group', function() {
        rs.updateAnswerGroup(0, updates);
        expect(rs.getAnswerGroup(0)).toEqual(updates);
      });

      it('should delete the answer group', function() {
        let initialLength = rs.getAnswerGroupCount();
        rs.updateAnswerGroup(0, updates);
        rs.deleteAnswerGroup(initialLength);
        expect(rs.AnswerGroupCount()).toEqual(initialLength);
      });

      it('should update active answer group', function() {
        rs.updateActiveAnswerGroup(updates);
        let activeIndex = rs.getActiveAnswerGroupIndex();
        expect(rs.getAnswerGroup(activeIndex)).toEqual(updates);
      })
*/
    });

    it('should be able to update answer choices', function() {
      rs.updateAnswerChoices('some answer');
      expect(rs.getAnswerChoices()).toEqual('some answer');
    });
  })
})
