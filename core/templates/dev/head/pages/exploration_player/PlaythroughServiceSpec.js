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
 * @fileoverview Unit tests for the playthrough service.
 */

describe('Playthrough service', function() {
  beforeEach(module('oppia'));

  describe('Test playthrough service functions', function() {
    beforeEach(inject(function($injector) {
      this.expId = 'expId1';
      this.expVersion = 1;
      this.ps = $injector.get('PlaythroughService');
      this.laof = $injector.get('LearnerActionObjectFactory');
      this.ps.initSession(this.expId, this.expVersion);
    }));

    it('should initialize a session with correct values.', function() {
      var playthrough = this.ps.getPlaythrough();

      expect(playthrough.expId, this.expId);
      expect(playthrough.expVersion, this.expVersion);
    });

    it('should record exploration start action.', function() {
      this.ps.recordExplorationStartAction('initStateName1');
      var playthrough = this.ps.getPlaythrough();

      expect(playthrough.actions).toEqual(
        [this.laof.createFromBackendDict({
          action_type: 'ExplorationStart',
          action_customization_args: {
            state_name: {
              value: 'initStateName1'
            }
          },
          schema_version: 1
        })]);
    });

    it('should record answer submit action.', function() {
      this.ps.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
      var playthrough = this.ps.getPlaythrough();

      expect(playthrough.actions).toEqual(
        [this.laof.createNew(
          'AnswerSubmit', {
            state_name: {
              value: 'stateName1'
            },
            dest_state_name: {
              value: 'stateName2'
            },
            interaction_id: {
              value: 'TextInput'
            },
            answer: {
              value: 'Hello'
            },
            feedback: {
              value: 'Try again'
            },
            time_spent_in_state_secs: {
              value: '30'
            }
          }, 1
        )]);
    });

    it('should record exploration quit action.', function() {
      this.ps.recordExplorationQuitAction('stateName1', '120');
      var playthrough = this.ps.getPlaythrough();

      expect(playthrough.actions).toEqual(
        [this.laof.createNew(
          'ExplorationQuit', {
            state_name: {
              value: 'stateName1'
            },
            time_spent_in_state_secs: {
              value: '120'
            }
          }, 1
        )]);
    });

    it(
      'should analyze a playthrough for multiple incorrect submissions issue',
      function() {
        this.ps.recordExplorationStartAction('stateName1');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');

        var playthrough = this.ps.getPlaythrough();

        expect(playthrough.playthroughId).toEqual(null);
        expect(playthrough.issueType).toEqual(null);
        expect(playthrough.issueCustomizationArgs).toEqual({});

        this.ps.recordPlaythrough();

        var playthrough = this.ps.getPlaythrough();

        expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_name: {
            value: 'stateName1'
          },
          num_times_answered_incorrectly: {
            value: 5
          }
        });
      });

    it('should analyze a playthrough for early quit issue', function() {
      this.ps.recordExplorationStartAction('stateName1');
      this.ps.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
      this.ps.recordExplorationQuitAction('stateName1', '60');

      var playthrough = this.ps.getPlaythrough();

      expect(playthrough.playthroughId).toEqual(null);
      expect(playthrough.issueType).toEqual(null);
      expect(playthrough.issueCustomizationArgs).toEqual({});

      this.ps.recordPlaythrough();

      var playthrough = this.ps.getPlaythrough();

      expect(playthrough.issueType).toEqual('EarlyQuit');
      expect(playthrough.issueCustomizationArgs).toEqual({
        state_name: {
          value: 'stateName1'
        },
        time_spent_in_exp_in_secs: {
          // Karma tests don't seem to be recording stopwatch time.
          value: null
        }
      });
    });

    it(
      'should analyze a playthrough for cyclic state transitions issue',
      function() {
        this.ps.recordExplorationStartAction('stateName1');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordExplorationQuitAction('stateName1', '30');

        var playthrough = this.ps.getPlaythrough();

        expect(playthrough.playthroughId).toEqual(null);
        expect(playthrough.issueType).toEqual(null);
        expect(playthrough.issueCustomizationArgs).toEqual({});

        this.ps.recordPlaythrough();

        var playthrough = this.ps.getPlaythrough();

        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        // The cycle is stateName1->stateName2->stateName3->stateName1.
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {
            value: ['stateName1', 'stateName2', 'stateName3', 'stateName1']
          },
        });
      });

    it(
      'should analyze a playthrough for cyclic state transitions issue for a ' +
        'cycle starting at a later point in the playthrough.',
      function() {
        this.ps.recordExplorationStartAction('stateName1');
        this.ps.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', '30');
        this.ps.recordExplorationQuitAction('stateName2', '60');

        var playthrough = this.ps.getPlaythrough();

        expect(playthrough.playthroughId).toEqual(null);
        expect(playthrough.issueType).toEqual(null);
        expect(playthrough.issueCustomizationArgs).toEqual({});

        this.ps.recordPlaythrough();

        var playthrough = this.ps.getPlaythrough();

        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        // The cycle is stateName2->stateName3->stateName2.
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {
            value: ['stateName2', 'stateName3', 'stateName2']
          },
        });
      });
  });
});
