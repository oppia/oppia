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
    let $httpBackend;
    let scope;
    let siis, ecs, rs, ess, rof, shtml;
    let mockExplorationData;
    let state;

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
      $httpBackend = $injector.get('$httpBackend');
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

      state = ess.getState('Test');

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

    it('should update the rules of the answer group', function() {
      const rule = rof.createNew('Equals', {x: 'New answer'});
      const ruleUpdates = {
        rules: [rule]
      };

      rs.updateAnswerGroup(0, ruleUpdates);
      expect(rs.getAnswerGroup(0).rules[0]).toEqual(rule);
    });

    it('should update the feedback of the answer group', function() {
      const feedback = shtml.createDefault('New feedback', 'feedback_1');
      const feedbackUpdates = {feedback};

      rs.updateAnswerGroup(0, feedbackUpdates);
      expect(rs.getAnswerGroup(0).outcome.feedback).toEqual(feedback);
    });

    it('should update the destination of the answer group', function() {
      const destUpdates = {
        dest: 'New dest',
        refresherExplorationId: null,
        missingPrerequisiteSkillId: null
      };

      rs.updateAnswerGroup(0, destUpdates);
      expect(rs.getAnswerGroup(0).outcome.dest).toEqual(destUpdates.dest);
    });

    it('should delete the answer group', function() {
      rs.deleteAnswerGroup(0);
      expect(rs.getAnswerGroupCount()).toEqual(0);
    });

    it('should update the rules of active answer group', function() {
      const rule = rof.createNew('Equals', {x: 'New answer'});
      const ruleUpdates = {
        rules: [rule]
      };

      rs.changeActiveAnswerGroupIndex(0);
      rs.updateActiveAnswerGroup(ruleUpdates);
      expect(rs.getAnswerGroup(0).rules[0]).toEqual(rule);
    });

    it('should update answer choices', function() {
      rs.updateAnswerChoices('some answer');
      expect(rs.getAnswerChoices()).toEqual('some answer');
    });

    it('should update the feedback of the default outcome', function() {
      const feedback = shtml.createDefault('New feedback', 'feedback_1');
      const feedbackUpdates = {feedback};

      rs.updateDefaultOutcome(feedbackUpdates);
      expect(rs.getDefaultOutcome().feedback).toEqual(feedback);
    });

    it('should update the destination of the default outcome', function() {
      const destUpdates = {
        dest: 'New dest',
        refresherExplorationId: null,
        missingPrerequisiteSkillId: null
      };

      rs.updateDefaultOutcome(destUpdates);
      expect(rs.getDefaultOutcome().dest).toEqual(destUpdates.dest);
    });

    //updateConfirmedUnclassifiedAnswers

    it('should update the answer choices', function() {
      const updates = [{
        label: '<p>Label_1</p>',
        val: 'value_1'
      }, {
        label: '<p>Label_2</p>',
        val: 'value_2'
      }];

      rs.updateAnswerChoices(updates);
      expect(rs.getAnswerChoices()).toEqual(updates);
    });

    it('should get the answer groups', function() {
      const answerGroups = state.interaction.answerGroups;

      expect(rs.getAnswerGroups()).toEqual(answerGroups);
    });

    it('should get the answer group', function() {
      const answerGroup = state.interaction.answerGroups[0];

      expect(rs.getAnswerGroup(0)).toEqual(answerGroup);
    });

    it('should count the answer groups', function() {
      expect(rs.getAnswerGroupCount()).toEqual(1)
    });

    it('should get the default outcome', function() {
      const defaultOutcome = state.interaction.defaultOutcome;

      expect(rs.getDefaultOutcome()).toEqual(defaultOutcome);
    });

    it('should get the confirmed unclassified answers', function() {
      const confirmedUnclassifiedAnswers = (
        state.interaction.confirmedUnclassifiedAnswers);

      expect(rs.getConfirmedUnclassifiedAnswers()).toEqual(
        confirmedUnclassifiedAnswers);
    });
  })
})
