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
    let httpBackend;
    let scope;
    let siis, ecs, rs, ess, rof, shtml;
    let mockExplorationData;

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(function() {
      module('oppia');
      // Set a global value for INTERACTION_SPECS that will be used by all the
      // descendant dependencies.
      module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          TextInput: {
            display_mode: 'inline',
            is_terminal: false
          }
        });
      });
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };

      module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
      });

      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      httpBackend = $injector.get('$httpBackend');
      siis = $injector.get('stateInteractionIdService');
      ecs = $injector.get('EditorStateService');
      ess = $injector.get('ExplorationStatesService');
      rs = $injector.get('ResponsesService');
      rof = $injector.get('RuleObjectFactory');
      shtml = $injector.get('SubtitledHtmlObjectFactory');

      // Set the currently loaded interaction ID.
      siis.savedMemento = 'TextInput';

      ess.init({
        Test: {
          content: {
            content_id: 'content',
            html: 'Sample'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [{
                rule_type: 'Equals',
                inputs: {
                  x: 'Answer'
                }
              }],
              outcome: {
                dest: 'Test',
                feedback: {
                  content_id: 'feedback_1',
                  html: 'Feedback'
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null
              },
              training_data: [],
              tagged_misconception_id: null
            }],
            default_outcome: {
              dest: 'Test',
              feedback: {
                content_id: 'default_outcome',
                html: 'Default outcome'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            hints: [],
            confirmed_unclassified_answers: []
          },
          param_changes: []
        }
      });

      let state = ess.getState('Test');

      rs.init({
        answerGroups: state.interaction.answerGroups,
        defaultOutcome: state.interaction.defaultOutcome,
        confirmedUnclassifiedAnswers: (
          state.interaction.confirmedUnclassifiedAnswers)
      });

      ecs.setActiveStateName('Test');
    }));

    it('should return -1 if no answer group is active', function() {
      expect(rs.getActiveAnswerGroupIndex()).toEqual(-1);
    });

    it('should change the answer group index', function() {
      rs.changeActiveAnswerGroupIndex(5);
      expect(rs.getActiveAnswerGroupIndex()).toEqual(5);
    });

    it('should return 0 for the active rule index by default', function() {
      expect(rs.getActiveRuleIndex()).toEqual(0);
    });

    it('should change the active rule index', function() {
      rs.changeActiveRuleIndex(5);
      expect(rs.getActiveRuleIndex()).toEqual(5);
    });

    it('should return null if no answer choices provided', function() {
      expect(rs.getAnswerChoices()).toEqual(null)
    });
/*
      destUpdates = {
        dest: 'Test',
        refresherExplorationId: null,
        missingPrerequisiteSkillId: null
      }
*/
    it('should update the rules', function() {
      let rule = rof.createNew('Equals', {x: 'New answer'});
      let ruleUpdates = {
        rules: [rule]
      };

      rs.updateAnswerGroup(0, ruleUpdates);
      expect(rs.getAnswerGroup(0).rules[0]).toEqual(rule);
    });

    it('should update the feedback', function() {
      let feedback = shtml.createDefault('New feedback', 'feedback_1');
      let feedbackUpdates = {feedback}

      rs.updateAnswerGroup(0, feedbackUpdates);
      expect(rs.getAnswerGroup(0).outcome.feedback).toEqual(feedback);
    });
/*

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

    it('should update answer choices', function() {
      rs.updateAnswerChoices('some answer');
      expect(rs.getAnswerChoices()).toEqual('some answer');
    });
  })
})
