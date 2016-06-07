// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the controller of the 'State Editor'. This also
 * includes unit tests for the training data service.
 */

describe('State Editor controller', function() {
  describe('StateEditor', function() {
    var scope, ctrl, ecs, cls, ess;
    var $httpBackend;
    var mockExplorationData;

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
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($rootScope, $controller, $injector) {
      scope = $rootScope.$new();
      $httpBackend = $injector.get('$httpBackend');
      ecs = $injector.get('editorContextService');
      cls = $injector.get('changeListService');
      ess = $injector.get('explorationStatesService');
      IS = $injector.get('INTERACTION_SPECS');

      GLOBALS.INVALID_NAME_CHARS = '#@&^%$';

      ess.init({
        'First State': {
          content: [{
            type: 'text',
            value: 'First State Content'
          }],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [{
                dest: 'Second State'
              }]
            }]
          },
          param_changes: []
        },
        'Second State': {
          content: [{
            type: 'text',
            value: 'Second State Content'
          }],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [{
                dest: 'Second State'
              }]
            }]
          },
          param_changes: []
        },
        'Third State': {
          content: [{
            type: 'text',
            value: 'This is some content.'
          }],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [{
                dest: 'Second State'
              }]
            }]
          },
          param_changes: [{
            name: 'comparison',
            generator_id: 'Copier',
            customization_args: {
              value: 'something clever',
              parse_with_jinja: false
            }
          }]
        }
      });

      scope.getContent = function(contentString) {
        return [{
          type: 'text',
          value: contentString
        }];
      };

      ctrl = $controller('StateEditor', {
        $scope: scope,
        editorContextService: ecs,
        changeListService: cls,
        explorationStatesService: ess,
        editabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: IS
      });
    }));

    it('should initialize the state name and related properties', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      expect(scope.contentEditorIsOpen).toBe(false);
      expect(scope.content[0].value).toEqual('This is some content.');
    });

    it('should correctly handle no-op edits', function() {
      ecs.setActiveStateName('First State');
      scope.initStateEditor();
      expect(scope.contentEditorIsOpen).toBe(false);
      expect(scope.content).toEqual(scope.getContent('First State Content'));
      scope.openStateContentEditor();
      expect(scope.contentEditorIsOpen).toBe(true);
      scope.content = scope.getContent('First State Content');
      scope.saveTextContent();

      expect(scope.contentEditorIsOpen).toBe(false);
      expect(cls.getChangeList()).toEqual([]);
    });

    it('should check that content edits are saved correctly',
       function() {
      ecs.setActiveStateName('Third State');
      expect(cls.getChangeList()).toEqual([]);
      scope.openStateContentEditor();
      scope.content = scope.getContent('babababa');
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(1);
      expect(cls.getChangeList()[0].new_value[0].value).toEqual('babababa');
      expect(cls.getChangeList()[0].old_value[0].value).toEqual(
        'This is some content.');

      scope.openStateContentEditor();
      scope.content = scope.getContent(
        'And now for something completely different.'
      );
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(2);
      expect(cls.getChangeList()[1].new_value[0].value)
        .toEqual('And now for something completely different.');
      expect(cls.getChangeList()[1].old_value[0].value).toEqual('babababa');
    });

    it('should not save any changes to content when an edit is cancelled',
       function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      var contentBeforeEdit = angular.copy(scope.content);
      scope.content = scope.getContent('Test Content');
      scope.cancelEdit();
      expect(scope.contentEditorIsOpen).toBe(false);
      expect(scope.content).toEqual(contentBeforeEdit);
    });
  });

  describe('TrainingDataService', function() {
    var $httpBackend;
    var scope, siis, ecs, cls, rs, tds, ess, IS, FUZZY_RULE_TYPE;
    var mockExplorationData;

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
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($rootScope, $controller, $injector) {
      scope = $rootScope.$new();
      $httpBackend = $injector.get('$httpBackend');
      siis = $injector.get('stateInteractionIdService');
      ecs = $injector.get('editorContextService');
      cls = $injector.get('changeListService');
      ess = $injector.get('explorationStatesService');
      rs = $injector.get('responsesService');
      tds = $injector.get('trainingDataService');
      IS = $injector.get('INTERACTION_SPECS');
      FUZZY_RULE_TYPE = $injector.get('FUZZY_RULE_TYPE');

      // Set the currently loaded interaction ID.
      siis.savedMemento = 'TextInput';

      ess.init({
        State: {
          content: [{
            type: 'text',
            value: 'State Content'
          }],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [{
                rule_type: 'Contains',
                inputs: {
                  x: 'Test'
                }
              }],
              outcome: {
                feedback: 'Feedback',
                dest: 'State'
              }
            }],
            default_outcome: {
              feedback: 'Default',
              dest: 'State'
            },
            confirmed_unclassified_answers: []
          },
          param_changes: []
        }
      });

      var state = ess.getState('State');
      rs.init({
        answerGroups: state.interaction.answer_groups,
        defaultOutcome: state.interaction.default_outcome,
        confirmedUnclassifiedAnswers: (
          state.interaction.confirmed_unclassified_answers)
      });

      ecs.setActiveStateName('State');

      $httpBackend.when('GET', '/createhandler/training_data/0/State').respond({
        unhandled_answers: [{
          value: 'answer1',
          count: 2
        }, {
          value: 'answer2',
          count: 1
        }]
      });
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should call a backend handler to initialize training data', function() {
      // Answers should be in the order sent from the backend.
      $httpBackend.expectGET('/createhandler/training_data/0/State');
      tds.initializeTrainingData('0', 'State');
      $httpBackend.flush();
      expect(tds.getTrainingDataAnswers()).toEqual(['answer1', 'answer2']);
      expect(tds.getTrainingDataCounts()).toEqual([2, 1]);

      // Ensure it handles receiving no unhandled answers correctly.
      $httpBackend.expect(
        'GET', '/createhandler/training_data/0/State').respond({
          unhandled_answers: []
        });

      tds.initializeTrainingData('0', 'State');
      $httpBackend.flush();
      expect(tds.getTrainingDataAnswers()).toEqual([]);
      expect(tds.getTrainingDataCounts()).toEqual([]);
    });

    it('should be able to train answer groups and the default response',
        function() {
      // Training the first answer of a group should add a new fuzzy rule.
      tds.trainAnswerGroup(0, 'text answer');
      var state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer']
        }
      });

      // Training a second answer to the same group should append the answer to
      // the training data.
      tds.trainAnswerGroup(0, 'second answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer', 'second answer']
        }
      });

      // Training the default response should add information to the confirmed
      // unclassified answers.
      tds.trainDefaultResponse('third answer');
      state = ess.getState('State');
      expect(state.interaction.confirmed_unclassified_answers).toEqual([
        'third answer'
      ]);
    });

    it('should be able to retrain answers between answer groups and the ' +
        'default outcome', function() {
      // Retraining an answer from the answer group to the default outcome
      // should remove it from the first, then add it to the second.
      tds.trainAnswerGroup(0, 'text answer');
      tds.trainAnswerGroup(0, 'second answer');
      tds.trainDefaultResponse('third answer');

      // Verify initial state.
      var state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer', 'second answer']
        }
      });
      expect(state.interaction.confirmed_unclassified_answers).toEqual([
        'third answer'
      ]);

      // Try to retrain the second answer (answer group -> default response).
      tds.trainDefaultResponse('second answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer']
        }
      });
      expect(state.interaction.confirmed_unclassified_answers).toEqual([
        'third answer', 'second answer'
      ]);

      // Try to retrain the third answer (default response -> answer group).
      tds.trainAnswerGroup(0, 'third answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer', 'third answer']
        }
      });
      expect(state.interaction.confirmed_unclassified_answers).toEqual([
        'second answer'
      ]);
    });

    it('should properly clear the default answer and remove a fuzzy rule ' +
        'when it is not the last rule left in a group', function() {
      tds.trainAnswerGroup(0, 'text answer');
      tds.trainDefaultResponse('second answer');

      // Verify initial state.
      var state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer']
        }
      });
      expect(state.interaction.confirmed_unclassified_answers).toEqual([
        'second answer'
      ]);

      // Ensure emptying the default unclassified answers is handled properly.
      tds.trainAnswerGroup(0, 'second answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer', 'second answer']
        }
      });
      expect(state.interaction.confirmed_unclassified_answers).toEqual([]);

      // Ensure emptying the answer group's fuzzy rule properly deletes the rule
      // since there is another rule in the group.
      tds.trainDefaultResponse('second answer');
      tds.trainDefaultResponse('text answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs).toEqual([{
        rule_type: 'Contains',
        inputs: {
          x: 'Test'
        }
      }]);
      expect(state.interaction.confirmed_unclassified_answers).toEqual([
        'second answer', 'text answer'
      ]);

      // Training the answer group should add the fuzzy rule back.
      tds.trainAnswerGroup(0, 'second answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs).toEqual([{
          rule_type: 'Contains',
          inputs: {
            x: 'Test'
          }
        }, {
          rule_type: FUZZY_RULE_TYPE,
          inputs: {
            training_data: ['second answer']
          }
        }
      ]);

      // Removing the the 'contains' rule from the group and then removing the
      // training data should not remove the fuzzy rule.
      state.interaction.answer_groups[0].rule_specs.splice(0, 1);
      ess.setState('State', state);
      rs.init({
        answerGroups: state.interaction.answer_groups,
        defaultOutcome: state.interaction.default_outcome,
        confirmedUnclassifiedAnswers: (
          state.interaction.confirmed_unclassified_answers)
      });

      tds.trainDefaultResponse('second answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs).toEqual([{
          rule_type: FUZZY_RULE_TYPE,
          inputs: {
            training_data: []
          }
        }
      ]);
    });

    it('should not be able to train duplicated answers', function() {
      tds.trainAnswerGroup(0, 'text answer');
      tds.trainDefaultResponse('second answer');

      // Verify initial state.
      var state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer']
        }
      });
      expect(state.interaction.confirmed_unclassified_answers).toEqual([
        'second answer'
      ]);

      // Training a duplicate answer for the answer group should change nothing.
      tds.trainAnswerGroup(0, 'text answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer']
        }
      });

      // Training a duplicate answer for the default response should change
      // nothing.
      tds.trainDefaultResponse('second answer');
      state = ess.getState('State');
      expect(state.interaction.answer_groups[0].rule_specs[1]).toEqual({
        rule_type: FUZZY_RULE_TYPE,
        inputs: {
          training_data: ['text answer']
        }
      });
    });

    it('should remove unresolved answers after training', function() {
      tds.initializeTrainingData('0', 'State');
      $httpBackend.flush();

      // Training an answer group should remove an unresolved answer.
      tds.trainAnswerGroup(0, 'answer1');
      expect(tds.getTrainingDataAnswers()).toEqual(['answer2']);
      expect(tds.getTrainingDataCounts()).toEqual([1]);

      // Training the default response should also remove an answer.
      tds.trainDefaultResponse('answer2');
      expect(tds.getTrainingDataAnswers()).toEqual([]);
      expect(tds.getTrainingDataCounts()).toEqual([]);
    });

    it('should get all potential outcomes of an interaction', function() {
      // First the answer group's outcome is listed, then the default.
      expect(tds.getAllPotentialOutcomes(ess.getState('State'))).toEqual([{
          feedback: 'Feedback',
          dest: 'State'
        }, {
          feedback: 'Default',
          dest: 'State'
        }]);
    });
  });
});
