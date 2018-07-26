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

    let scope;
    let rs;

    beforeEach(inject(function($injector, $rootScope) {
      rs = $injector.get('ResponsesService');
      scope = $rootScope.$new();
    }));

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

    it('should be able to change answer group index', function() {
      rs.changeActiveAnswerGroupIndex(5);
      expect(rs.getActiveAnswerGroupIndex()).toEqual(5);
    });

    it('should return 0 for active rule index by default', function() {
      expect(rs.getActiveRuleIndex()).toEqual(0);
    });

    it('should be able to change active rule index', function() {
      rs.changeActiveRuleIndex(5);
      expect(rs.getActiveRuleIndex()).toEqual(5);
    });

    it('should return null if no answer choices provided', function() {
      expect(rs.getAnswerChoices()).toEqual(null)
    });

    it('should update answer group', function() {
/*
      // Initialize exploration states service -
      // required for answer groups to be set
      let ess;

      inject(function($injector) {
        ess = $injector.get('ExplorationStatesService');
      });

      ess.init({
        Test: {
          classifier_model_id: null,
          content: {
            content_id: 'content',
            html: 'Test initialization'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {}
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'Test',
              feedback: {content_id: "default_outcome", html: ""},
              labelled_as_correct: false,
              missing_prerequisite_skill_id: null,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: []
        }
      });
*/

      // Set new answer group object and update
      let updates = {
          rules: [{
            0: {
              inputs: {x: ['<p>Two</p>']},
              type: 'Equals'
            }
          }],
          outcome: {
            dest: 'Test',
            feedback: {
              _contentId: "feedback_2",
              _html: "<p>Correct!</p>↵"
            },
            refresherExplorationId: null,
            missingPrerequisiteSkillId: null,
            labelledAsCorrect: false,
            paramChanges: []
          },
          trainingData: [],
          taggedMisconceptionId: null
        };
      rs.updateAnswerGroup(0, updates);
      expect(rs.getAnswerGroup(0)).toEqual(updates);
    });

    it('should delete answer group', function() {
      let initialLength = rs.getAnswerGroupCount();
      let updates = {
        rules: 'new rules',
        outcome: {
          feedback: 'new feedback',
          dest: 'new dest',
          refresherExplorationId: 2,
          missingPrerequisiteSkillId: 3,
          labelledAsCorrect: false
        },
        trainingData: 'new data'
      };
      rs.updateAnswerGroup(initialLength, updates);
      rs.deleteAnswerGroup(initialLength);
      expect(rs.AnswerGroupCount()).toEqual(initialLength);
    });

    it('should be able to update answer choices', function() {
      rs.updateAnswerChoices('some answer');
      expect(rs.getAnswerChoices()).toEqual('some answer');
    });
  })
})
