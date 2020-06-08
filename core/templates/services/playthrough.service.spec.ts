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

import { HttpClientTestingModule }
  from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { PlaythroughService } from 'services/playthrough.service';

describe('PlaythroughService', () => {
  let playthroughService: PlaythroughService = null;
  let learnerActionObjectFactory: LearnerActionObjectFactory = null;
  let explorationFeaturesService: ExplorationFeaturesService = null;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    playthroughService = TestBed.get(PlaythroughService);
    learnerActionObjectFactory =
      TestBed.get(LearnerActionObjectFactory);
    explorationFeaturesService =
      TestBed.get(ExplorationFeaturesService);
  });

  describe('.initSession()', () => {
    it('stores the correct values', () => {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;

      playthroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);

      let playthrough = playthroughService.getPlaythrough();
      expect(playthrough.expId).toEqual(this.expId);
      expect(playthrough.expVersion).toEqual(this.expVersion);
      expect(playthrough.actions).toEqual([]);
      expect(playthrough.issueCustomizationArgs).toEqual({});
    });
  });

  describe('recording exploration playthroughs', () => {
    beforeEach(() => {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;

      playthroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);
      spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(true);
    });

    describe('.recordExplorationStartAction()', () => {
      it('adds a learner action object to the actions array', () => {
        playthroughService.recordExplorationStartAction('initStateName1');

        let playthrough = playthroughService.getPlaythrough();
        let actionSchemaVersion = 1;
        expect(playthrough.actions).toEqual([
          learnerActionObjectFactory.createNew('ExplorationStart', {
            state_name: {value: 'initStateName1'},
          }, actionSchemaVersion),
        ]);
      });
    });

    describe('.recordAnswerSubmitAction()', () => {
      it('adds a learner action object to the actions array', () => {
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);

        let playthrough = playthroughService.getPlaythrough();
        let actionSchemaVersion = 1;
        expect(playthrough.actions).toEqual([
          learnerActionObjectFactory.createNew('AnswerSubmit', {
            state_name: {value: 'stateName1'},
            dest_state_name: {value: 'stateName2'},
            interaction_id: {value: 'TextInput'},
            submitted_answer: {value: 'Hello'},
            feedback: {value: 'Try again'},
            time_spent_state_in_msecs: {value: 30},
          }, actionSchemaVersion),
        ]);
      });
    });

    describe('.recordAnswerSubmitAction()', () => {
      it('adds a learner action object to the actions array', () => {
        playthroughService.recordExplorationQuitAction('stateName1', 120);

        let playthrough = playthroughService.getPlaythrough();
        let actionSchemaVersion = 1;
        expect(playthrough.actions).toEqual([
          learnerActionObjectFactory.createNew('ExplorationQuit', {
            state_name: {value: 'stateName1'},
            time_spent_in_state_in_msecs: {value: 120}
          }, actionSchemaVersion),
        ]);
      });
    });

    describe('.recordPlaythrough()', () => {
      it('identifies multiple incorrect submissions', () => {
        playthroughService.recordExplorationStartAction('stateName1');
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);

        playthroughService.recordPlaythrough(false);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_name: {value: 'stateName1'},
          num_times_answered_incorrectly: {value: 5}
        });
      });

      it('identifies early quits', () => {
        playthroughService.recordExplorationStartAction('stateName1');
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordExplorationQuitAction('stateName1', 60);

        playthroughService.recordPlaythrough(false);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('EarlyQuit');
        // We don't check the time spent issue customization arg because it is
        // flaky between tests.
        expect(playthrough.issueCustomizationArgs).toEqual(
          jasmine.objectContaining({state_name: {value: 'stateName1'}}));
      });

      it('identifies cyclic state transitions', () => {
        playthroughService.recordExplorationStartAction('stateName1');
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordExplorationQuitAction('stateName1', 30);

        playthroughService.recordPlaythrough(false);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {
            value: ['stateName1', 'stateName2', 'stateName3', 'stateName1']
          },
        });
      });

      it('identifies p-shaped cyclic state transitions', () => {
        // A p-shaped cycle looks like:
        // [1] -> [2] -> [3] -> [4]
        //                ^      v
        //               [6] <- [5]
        // 1, 2, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6...

        playthroughService.recordExplorationStartAction('stateName1');
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordExplorationQuitAction('stateName2', 60);

        playthroughService.recordPlaythrough(false);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        // The cycle is stateName2->stateName3->stateName2.
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['stateName2', 'stateName3', 'stateName2']},
        });
      });
    });
  });

  describe('disabling recording playthroughs for an exploration', () => {
    it('should not record learner actions', () => {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;
      playthroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);
      spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(false);

      playthroughService.recordExplorationStartAction('initStateName1');
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      playthroughService.recordExplorationQuitAction('stateName1', 120);

      let playthrough = playthroughService.getPlaythrough();
      expect(playthrough.actions).toEqual([]);
    });
  });
});
