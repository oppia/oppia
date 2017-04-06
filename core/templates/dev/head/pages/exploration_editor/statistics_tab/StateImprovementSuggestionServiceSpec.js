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
    var IMPROVE_TYPE_DEFAULT = 'default';
    var IMPROVE_TYPE_INCOMPLETE = 'incomplete';

    var siss;
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
        no_submitted_answer_count: 0,
        num_default_answers: 0
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
      stateStats.num_default_answers++;
    };

    beforeEach(inject(function($injector) {
      siss = $injector.get('StateImprovementSuggestionService');
    }));

    it('should produce default improvement suggestions for a typical ' +
        'state-user scenario with 5 exploration visits and 3 default answer ' +
        'submissions', function() {
      // Create a looping state, similar to create_default_exploration.
      var states = {
        state: _createState('state')
      };

      // These stats represent entering the state 5 times and submitting a
      // default answer three times.
      var stateStats = {
        state: _createDefaultStateStats()
      };
      _enterStateWithoutAnswer(stateStats.state);
      _enterStateWithoutAnswer(stateStats.state);
      _answerDefaultOutcome(stateStats.state);
      _answerDefaultOutcome(stateStats.state);
      _answerDefaultOutcome(stateStats.state);

      // Expect a single improvement recommendation for the state due to the
      // high number of default hits.
      var improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([{
        rank: 3,
        stateName: 'state',
        type: IMPROVE_TYPE_DEFAULT
      }]);
    });

    it('should produce improvement suggestions for a single default rule hit',
        function() {
      // Create a looping state, similar to create_default_exploration.
      var states = {
        state: _createState('state')
      };

      // Enter the state, then submit an answer to its default outcome.
      var stateStats = {
        state: _createDefaultStateStats()
      };
      _answerDefaultOutcome(stateStats.state);

      var improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([{
        rank: 1,
        stateName: 'state',
        type: IMPROVE_TYPE_DEFAULT
      }]);
    });

    it('should not suggest improvements for non-default answer submissions',
        function() {
      // Create a non-looping state for testing, similar to
      // save_new_valid_exploration.
      var states = {
        initial: _createState('end'),
        end: _createState(null)
      };

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

    it('should suggest default and incomplete improvements depending on both ' +
        'unsubmitted and default answer counts', function() {
      // Create a looping state, similar to create_default_exploration.
      var states = {
        state: _createState('state')
      };

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

      // Now hit the default outcome two more times.
      _answerDefaultOutcome(stateStats.state);
      _answerDefaultOutcome(stateStats.state);

      // The improvement will now be default.
      improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([{
        rank: 3,
        stateName: 'state',
        type: IMPROVE_TYPE_DEFAULT
      }]);
    });

    it('should rank across multiple states according to default hits and ' +
        'properly sort the returned list of improvements by rank', function() {
      // Create an 'exploration' with 2 states. Both are self-loops.
      var states = {
        'State 1': _createState('State 1'),
        'State 2': _createState('State 2')
      };

      // These stats represent hitting the default outcomes of state 1 once and
      // state 2 twice.
      var stateStats = {
        'State 1': _createDefaultStateStats(),
        'State 2': _createDefaultStateStats()
      };
      _answerDefaultOutcome(stateStats['State 1']);
      _answerDefaultOutcome(stateStats['State 2']);
      _answerDefaultOutcome(stateStats['State 2']);

      // The result should be default improvements.
      var improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([{
        rank: 2,
        stateName: 'State 2',
        type: IMPROVE_TYPE_DEFAULT
      }, {
        rank: 1,
        stateName: 'State 1',
        type: IMPROVE_TYPE_DEFAULT
      }]);

      // Hit the default rule of state 1 two more times.
      _answerDefaultOutcome(stateStats['State 1']);
      _answerDefaultOutcome(stateStats['State 1']);

      // The second state will now have a lower rank and should appear second in
      // the returned improvements list.
      improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([{
        rank: 3,
        stateName: 'State 1',
        type: IMPROVE_TYPE_DEFAULT
      }, {
        rank: 2,
        stateName: 'State 2',
        type: IMPROVE_TYPE_DEFAULT
      }]);
    });
  });
});
