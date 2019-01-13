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

describe('PlaythroughService', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.PlaythroughService = $injector.get('PlaythroughService');
    this.LearnerActionObjectFactory =
      $injector.get('LearnerActionObjectFactory');
    this.ExplorationFeaturesService =
      $injector.get('ExplorationFeaturesService');
  }));

  describe('.initSession()', function() {
    it('stores the correct values', function() {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;

      this.PlaythroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);

      var playthrough = this.PlaythroughService.getPlaythrough();
      expect(playthrough.expId).toEqual(this.expId);
      expect(playthrough.expVersion).toEqual(this.expVersion);
      expect(playthrough.actions).toEqual([]);
      expect(playthrough.issueCustomizationArgs).toEqual({});
    });
  });

  describe('recording exploration playthroughs', function() {
    beforeEach(function() {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;

      this.PlaythroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(true);
    });

    describe('.recordExplorationStartAction()', function() {
      it('adds a learner action object to the actions array', function() {
        this.PlaythroughService.recordExplorationStartAction('initStateName1');

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.actions).toEqual([
          this.LearnerActionObjectFactory.createNew('ExplorationStart', {
            state_name: {value: 'initStateName1'},
          }),
        ]);
      });
    });

    describe('.recordAnswerSubmitAction()', function() {
      it('adds a learner action object to the actions array', function() {
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.actions).toEqual([
          this.LearnerActionObjectFactory.createNew('AnswerSubmit', {
            state_name: {value: 'stateName1'},
            dest_state_name: {value: 'stateName2'},
            interaction_id: {value: 'TextInput'},
            submitted_answer: {value: 'Hello'},
            feedback: {value: 'Try again'},
            time_spent_state_in_msecs: {value: 30},
          }),
        ]);
      });
    });

    describe('.recordAnswerSubmitAction()', function() {
      it('adds a learner action object to the actions array', function() {
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.actions).toEqual([
          this.LearnerActionObjectFactory.createNew('ExplorationQuit', {
            state_name: {value: 'stateName1'},
            time_spent_in_state_in_msecs: {value: 120}
          }),
        ]);
      });
    });

    describe('.recordPlaythrough()', function() {
      it('identifies multiple incorrect submissions', function() {
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
          state_name: {value: 'stateName1'},
          num_times_answered_incorrectly: {value: 5}
        });
      });

      it('identifies early quits', function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 60);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('EarlyQuit');
        // We don't check the time spent issue customization arg because it is
        // flaky between tests.
        expect(playthrough.issueCustomizationArgs).toEqual(
          jasmine.objectContaining({state_name: {value: 'stateName1'}}));
      });

      it('identifies cyclic state transitions', function() {
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
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {
            value: ['stateName1', 'stateName2', 'stateName3', 'stateName1']
          },
        });
      });

      it('identifies p-shaped cyclic state transitions', function() {
        // A p-shaped cycle looks like:
        // [1] -> [2] -> [3] -> [4]
        //                ^      v
        //               [6] <- [5]
        // 1, 2, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6...

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
        this.PlaythroughService.recordExplorationQuitAction('stateName2', 60);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        // The cycle is stateName2->stateName3->stateName2.
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['stateName2', 'stateName3', 'stateName2']},
        });
      });
    });
  });

  describe('disabling recording playthroughs for an exploration', function() {
    it('should not record learner actions', function() {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;
      this.PlaythroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(false);

      this.PlaythroughService.recordExplorationStartAction('initStateName1');
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

      var playthrough = this.PlaythroughService.getPlaythrough();
      expect(playthrough.actions).toEqual([]);
    });
  });
});
