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
import { Playthrough } from 'domain/statistics/PlaythroughObjectFactory';
import { PlaythroughService } from 'services/playthrough.service';
import { StopwatchObjectFactory } from
  'domain/utilities/StopwatchObjectFactory';

describe('PlaythroughService', () => {
  let explorationFeaturesService: ExplorationFeaturesService = null;
  let playthroughService: PlaythroughService = null;
  let stopwatchObjectFactory: StopwatchObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    explorationFeaturesService = TestBed.get(ExplorationFeaturesService);
    playthroughService = TestBed.get(PlaythroughService);
    stopwatchObjectFactory = TestBed.get(StopwatchObjectFactory);
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

    it('should return a null playthrough before recording start action', () => {
      expect(playthroughService.getPlaythrough()).toBeNull();
    });

    it('should return a null playthrough if start action is not first action',
      () => {
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        expect(playthroughService.getPlaythrough()).toBeNull();

        playthroughService.recordExplorationQuitAction('End', 13);
        expect(playthroughService.getPlaythrough()).toBeNull();
      });

    it('should return a real playthrough if start action is first action',
      () => {
        playthroughService.recordExplorationStartAction('initStateName1');

        expect(playthroughService.getPlaythrough()).toBeInstanceOf(Playthrough);
      });

    it('should identify multiple incorrect submissions', () => {
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
      playthroughService.recordExplorationQuitAction('stateName1', 60);

      playthroughService.recordPlaythrough(false);

      let playthrough = playthroughService.getPlaythrough();
      expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
      expect(playthrough.issueCustomizationArgs).toEqual({
        state_name: {value: 'stateName1'},
        num_times_answered_incorrectly: {value: 5}
      });
    });

    it('should identify early quits', () => {
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 40, reset: null}));

      playthroughService.recordExplorationStartAction('stateName1');
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
      playthroughService.recordExplorationQuitAction('stateName1', 60);

      playthroughService.recordPlaythrough(false);

      let playthrough = playthroughService.getPlaythrough();
      expect(playthrough.issueType).toEqual('EarlyQuit');
      expect(playthrough.issueCustomizationArgs).toEqual({
        state_name: {value: 'stateName1'},
        time_spent_in_exp_in_secs: {value: 40},
      });
    });

    it('should identify cyclic state transitions', () => {
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

    it('should identify p-shaped cyclic state transitions', () => {
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

  describe('Disabling recording playthroughs for an exploration', () => {
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

      expect(playthroughService.getPlaythrough()).toBeNull();
    });
  });
});
