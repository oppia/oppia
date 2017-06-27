// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for statistics services.
 */

describe('StateImprovementSuggestionService', function() {
  beforeEach(module('oppia'));

  // TODO(bhenning): These tests were ported from the backend tests. More tests
  // should be added to make sure getStateImprovements() is thoroughly tested.

  describe('getStateImprovements', function() {
    var IMPROVE_TYPE_INCOMPLETE = 'incomplete';

    var siss;
    var ssof;

    //A self-looping state
    var statesDict1 = {
      state: {
        content: [{
          type: 'text',
          value: 'content'
        }],
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'unused',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }],
          default_outcome: {
            dest: 'state',
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      }
    };

    // A non-looping state
    var statesDict2 = {
      initial: {
        content: [{
          type: 'text',
          value: 'content'
        }],
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'unused',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }],
          default_outcome: {
            dest: 'end',
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      },
      end: {
        content: [{
          type: 'text',
          value: 'content'
        }],
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'unused',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }],
          default_outcome: {
            dest: null,
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      }
    };

    // 2 states that are both self-looping
    var statesDict3 = {
      'State 1': {
        content: [{
          type: 'text',
          value: 'content'
        }],
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'next state',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }],
          default_outcome: {
            dest: 'State 1',
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      },
      'State 2': {
        content: [{
          type: 'text',
          value: 'content'
        }],
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'next state',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }],
          default_outcome: {
            dest: 'State 2',
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      }
    }

    var _createState = function(destStateName) {
      // Only a partial state definition is needed for these tests.
      if (destStateName) {
        return {
          interaction: {
            default_outcome: {
              dest: destStateName
            }
          }
        };
      } else {
        // Create an end state, which has no default_outcome.
        return {
          interaction: { }
        };
      }
    };

    var _createDefaultStateStats = function() {
      return {
        total_entry_count: 0,
        no_submitted_answer_count: 0
      };
    };

    var _enterStateWithoutAnswer = function(stateStats) {
      stateStats.total_entry_count++;
    };
    var _answerIncorrectly = function(stateStats) {
      stateStats.total_entry_count++;
      stateStats.no_submitted_answer_count++;
    };
    var _answerDefaultOutcome = function(stateStats) {
      stateStats.total_entry_count++;
    };

    beforeEach(inject(function($injector) {
      siss = $injector.get('StateImprovementSuggestionService');
      ssof = $injector.get('StatesObjectFactory');
    }));

    it('should not suggest improvements for non-default answers', function() {
      // Create a non-looping state for testing, similar to
      // save_new_valid_exploration.
      var states = ssof.createFromBackendDict(statesDict2);

      // Submit an answer to an answer group rather than the default answer.
      // The end state does not have any relevant stats, either.
      var stateStats = {
        initial: _createDefaultStateStats(),
        end: _createDefaultStateStats()
      };
      _enterStateWithoutAnswer(stateStats.initial);

      // No improvements should be suggested for this situation.
      var improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([]);
    });

    it('should suggest incomplete improvements depending on unsubmitted ' +
       'answer counts', function() {
      // Create a looping state, similar to create_default_exploration.
      var states = ssof.createFromBackendDict(statesDict1);

      // These stats represent failing to answer something twice and hitting the
      // default outcome once.
      var stateStats = {
        state: _createDefaultStateStats(),
      };
      _answerIncorrectly(stateStats.state);
      _answerIncorrectly(stateStats.state);
      _answerDefaultOutcome(stateStats.state);

      // The result should be an improvement recommendation due to the state
      // being potentially confusing.
      var improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([{
        rank: 2,
        stateName: 'state',
        type: IMPROVE_TYPE_INCOMPLETE
      }]);
    });
  });
});
