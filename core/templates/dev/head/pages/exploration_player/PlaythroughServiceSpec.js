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
  beforeEach(inject(function($injector) {
    this.PlaythroughService = $injector.get('PlaythroughService');
    this.PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');
    this.LearnerActionObjectFactory =
      $injector.get('LearnerActionObjectFactory');

    this.whitelistedExpId = 'expId1';
    this.blacklistedExpId = 'expId2';
    this.expVersion = 1;
  }));

  describe('Test playthrough service functions', function() {
    beforeEach(function() {
      this.PlaythroughIssuesService.initSession(
        this.whitelistedExpId, this.expVersion, [this.whitelistedExpId]);
      this.PlaythroughService.initSession(
        this.whitelistedExpId, this.expVersion, 1.0);
    });

    it('should initialize a session with correct values.', function() {
      var playthrough = this.PlaythroughService.getPlaythrough();

      expect(playthrough.whitelistedExpId, this.whitelistedExpId);
      expect(playthrough.expVersion, this.expVersion);
    });

    it('should record exploration start action.', function() {
      this.PlaythroughService.recordExplorationStartAction('initStateName1');
      var playthrough = this.PlaythroughService.getPlaythrough();

      expect(playthrough.actions).toEqual(
        [this.LearnerActionObjectFactory.createNew(
          'ExplorationStart', {
            state_name: {
              value: 'initStateName1'
            }
          }, 1
        )]);
    });

    it('should record answer submit action.', function() {
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      var playthrough = this.PlaythroughService.getPlaythrough();

      expect(playthrough.actions).toEqual(
        [this.LearnerActionObjectFactory.createNew(
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
            submitted_answer: {
              value: 'Hello'
            },
            feedback: {
              value: 'Try again'
            },
            time_spent_state_in_msecs: {
              value: 30
            }
          }, 1
        )]);
    });

    it('should record exploration quit action.', function() {
      this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);
      var playthrough = this.PlaythroughService.getPlaythrough();

      expect(playthrough.actions).toEqual(
        [this.LearnerActionObjectFactory.createNew(
          'ExplorationQuit', {
            state_name: {
              value: 'stateName1'
            },
            time_spent_in_state_in_msecs: {
              value: 120
            }
          }, 1
        )]);
    });

    it(
      'should analyze a playthrough for multiple incorrect submissions issue',
      function() {
        var playthrough = this.PlaythroughService.getPlaythrough();

        expect(playthrough.playthroughId).toEqual(null);
        expect(playthrough.issueType).toEqual(null);
        expect(playthrough.issueCustomizationArgs).toEqual({});

        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();

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
      var playthrough = this.PlaythroughService.getPlaythrough();

      expect(playthrough.playthroughId).toEqual(null);
      expect(playthrough.issueType).toEqual(null);
      expect(playthrough.issueCustomizationArgs).toEqual({});

      this.PlaythroughService.recordExplorationStartAction('stateName1');
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
      this.PlaythroughService.recordExplorationQuitAction('stateName1', 60);

      this.PlaythroughService.recordPlaythrough();

      var playthrough = this.PlaythroughService.getPlaythrough();

      expect(playthrough.issueType).toEqual('EarlyQuit');
      // We don't check the time spent issue customization arg because it is
      // flaky between tests.
      expect(playthrough.issueCustomizationArgs.state_name).toEqual({
        value: 'stateName1'
      });
    });

    it(
      'should analyze a playthrough for cyclic state transitions issue',
      function() {
        var playthrough = this.PlaythroughService.getPlaythrough();

        expect(playthrough.playthroughId).toEqual(null);
        expect(playthrough.issueType).toEqual(null);
        expect(playthrough.issueCustomizationArgs).toEqual({});

        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 30);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();

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
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);

        var playthrough = this.PlaythroughService.getPlaythrough();

        expect(playthrough.playthroughId).toEqual(null);
        expect(playthrough.issueType).toEqual(null);
        expect(playthrough.issueCustomizationArgs).toEqual({});

        this.PlaythroughService.recordExplorationQuitAction('stateName2', 60);
        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();

        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        // The cycle is stateName2->stateName3->stateName2.
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {
            value: ['stateName2', 'stateName3', 'stateName2']
          },
        });
      });
  });

  describe('Test whitelisting functions', function() {
    it('should not record learner actions for blacklisted exps', function() {
      this.PlaythroughIssuesService.initSession(
        this.blacklistedExpId, this.expVersion, [this.whitelistedExpId]);
      this.PlaythroughService.initSession(
        this.blacklistedExpId, this.expVersion, 1.0);

      this.PlaythroughService.recordExplorationStartAction('initStateName1');
      var playthrough = this.PlaythroughService.getPlaythrough();

      expect(playthrough.actions).toEqual([]);
    });
  });
});
