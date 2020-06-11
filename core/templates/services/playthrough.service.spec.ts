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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { Playthrough } from 'domain/statistics/PlaythroughObjectFactory';
import { PlaythroughService } from 'services/playthrough.service';
import { PlaythroughBackendApiService } from
  'services/playthrough-backend-api.service';
import { StopwatchObjectFactory } from
  'domain/utilities/StopwatchObjectFactory';

describe('PlaythroughService', () => {
  let explorationFeaturesService: ExplorationFeaturesService = null;
  let learnerActionObjectFactory: LearnerActionObjectFactory = null;
  let playthroughBackendApiService: PlaythroughBackendApiService = null;
  let playthroughService: PlaythroughService = null;
  let stopwatchObjectFactory: StopwatchObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    explorationFeaturesService = TestBed.get(ExplorationFeaturesService);
    learnerActionObjectFactory = TestBed.get(LearnerActionObjectFactory);
    playthroughBackendApiService = TestBed.get(PlaythroughBackendApiService);
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

    it('should return null playthrough just after initialization', () => {
      expect(playthroughService.getPlaythrough()).toBeNull();
    });

    it('should return null playthrough until exploration start action', () => {
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      expect(playthroughService.getPlaythrough()).toBeNull();

      playthroughService.recordExplorationQuitAction('End', 13);
      expect(playthroughService.getPlaythrough()).toBeNull();

      playthroughService.recordExplorationStartAction('initStateName1');
      expect(playthroughService.getPlaythrough()).toBeInstanceOf(Playthrough);
    });

    it('should stop recording actions after exploration quit', () => {
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 70, reset: null}));

      playthroughService.recordExplorationStartAction('stateName1');
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Wrong!', 30);
      playthroughService.recordExplorationQuitAction('stateName2', 40);

      // Extra actions that should be ignored.
      playthroughService.recordExplorationStartAction('stateName1');
      playthroughService.recordExplorationStartAction('stateName2');
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      playthroughService.recordExplorationQuitAction('stateName2', 13);
      playthroughService.recordExplorationQuitAction('stateName3', 13);

      expect(playthroughService.getPlaythrough().actions).toEqual([
        learnerActionObjectFactory.createExplorationStartAction({
          state_name: {value: 'stateName1'}
        }),
        learnerActionObjectFactory.createAnswerSubmitAction({
          state_name: {value: 'stateName1'},
          dest_state_name: {value: 'stateName2'},
          interaction_id: {value: 'TextInput'},
          submitted_answer: {value: 'Hello'},
          feedback: {value: 'Wrong!'},
          time_spent_state_in_msecs: {value: 30000},
        }),
        learnerActionObjectFactory.createExplorationQuitAction({
          state_name: {value: 'stateName2'},
          time_spent_in_state_in_msecs: {value: 40000},
        }),
      ]);
    });

    it('should only store playthroughs after an exploration quit', () => {
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 60, reset: null}));
      const backendApiStorePlaythroughSpy = (
        spyOn(playthroughBackendApiService, 'storePlaythrough'));

      playthroughService.recordExplorationStartAction('initStateName1');
      expect(playthroughService.getPlaythrough()).not.toBeNull();

      playthroughService.storePlaythrough();
      expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();

      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
      expect(playthroughService.getPlaythrough().issueType).toBeNull();

      playthroughService.storePlaythrough();
      expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();

      playthroughService.recordExplorationQuitAction('End', 30);
      expect(playthroughService.getPlaythrough().issueType).not.toBeNull();

      playthroughService.storePlaythrough();
      expect(backendApiStorePlaythroughSpy).toHaveBeenCalled();
    });

    it('should identify multiple incorrect submissions', () => {
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 240, reset: null}));

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

      let playthrough = playthroughService.getPlaythrough();
      expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
      expect(playthrough.issueCustomizationArgs).toEqual({
        state_name: {value: 'stateName1'},
        num_times_answered_incorrectly: {value: 5}
      });
    });

    it('should identify early quits', () => {
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 50, reset: null}));

      playthroughService.recordExplorationStartAction('stateName1');
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
      playthroughService.recordExplorationQuitAction('stateName1', 20);

      let playthrough = playthroughService.getPlaythrough();
      expect(playthrough.issueType).toEqual('EarlyQuit');
      expect(playthrough.issueCustomizationArgs).toEqual({
        state_name: {value: 'stateName1'},
        time_spent_in_exp_in_secs: {value: 50},
      });
    });

    it('should identify cyclic state transitions', () => {
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 300, reset: null}));

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
      //
      // or
      // [1] -> [2] <-> [3]
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 270, reset: null}));

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

      let playthrough = playthroughService.getPlaythrough();
      expect(playthrough.issueType).toEqual('CyclicStateTransitions');
      expect(playthrough.issueCustomizationArgs).toEqual({
        state_names: {value: ['stateName2', 'stateName3', 'stateName2']},
      });
    });

    it('should prioritize multiple incorrect answers issue types over cyclic ' +
      'state transitions and early quit', () => {
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(
        jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 60, reset: null}));

      playthroughService.recordExplorationStartAction('stateName1');
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 5);
      playthroughService.recordAnswerSubmitAction(
        'stateName2', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 5);
      playthroughService.recordAnswerSubmitAction(
        'stateName2', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 5);
      // Eligible for CyclicStateTransitions.
      playthroughService.recordAnswerSubmitAction(
        'stateName2', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hola', 'Try again', 5);
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hola', 'Try again', 5);
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hola', 'Try again', 5);
      // Eligible for MultipleIncorrectSubmissions.
      playthroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName1', 'TextInput', 'Hola', 'Try again', 5);
      // Eligible for EarlyQuit.
      playthroughService.recordExplorationQuitAction('stateName1', 10);

      expect(playthroughService.getPlaythrough().issueType)
        .toEqual('MultipleIncorrectSubmissions');
    });

    it('should prioritize cyclic state transitions issue types over early quit',
      () => {
        spyOn(stopwatchObjectFactory, 'create').and.returnValue(
          jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 65, reset: null}));

        playthroughService.recordExplorationStartAction('stateName1');
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 10);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName1', 'TextInput', 'Hello', 'Try again', 10);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 10);
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName1', 'TextInput', 'Hello', 'Try again', 10);
        playthroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 10);
        // Eligible for CyclicStateTransitions.
        playthroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
        // Eligible for EarlyQuit.
        playthroughService.recordExplorationQuitAction('stateName1', 10);

        expect(playthroughService.getPlaythrough().issueType)
          .toEqual('CyclicStateTransitions');
      });

    describe('Skipping playthroughs when learners are just browsing', () => {
      it('should not store playthroughs if its duration is too short', () => {
        const backendApiStorePlaythroughSpy = (
          spyOn(playthroughBackendApiService, 'storePlaythrough'));
        spyOn(stopwatchObjectFactory, 'create').and.returnValue(
          jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 35, reset: null}));

        playthroughService.recordExplorationStartAction('stateName1');
          playthroughService.recordAnswerSubmitAction(
            'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
          playthroughService.recordAnswerSubmitAction(
            'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
          playthroughService.recordAnswerSubmitAction(
            'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
          playthroughService.recordAnswerSubmitAction(
            'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
          playthroughService.recordAnswerSubmitAction(
            'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 5);
        playthroughService.recordExplorationQuitAction('stateName1', 10);

        expect(playthroughService.getPlaythrough().issueType)
          .toEqual('MultipleIncorrectSubmissions');
        playthroughService.storePlaythrough();
        expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
      });

      it('should not store playthroughs with no answer submissions', () => {
        const backendApiStorePlaythroughSpy = (
          spyOn(playthroughBackendApiService, 'storePlaythrough'));
        spyOn(stopwatchObjectFactory, 'create').and.returnValue(
          // NOTE TO DEVELOPERS: Time intentionally wrong here to check that the
          // lack of submissions is why the playthrough fails to be stored,
          // rather than the short time necessary for EarlyQuit issues.
          jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 80, reset: null}));

        playthroughService.recordExplorationStartAction('stateName1');
        playthroughService.recordExplorationQuitAction('stateName1', 40);

        expect(playthroughService.getPlaythrough().issueType)
          .toEqual('EarlyQuit');
        playthroughService.storePlaythrough();
        expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
      });
    });
  });

  it('should not record learner actions when recording is disabled', () => {
    spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
      .and.returnValue(false);
    spyOn(stopwatchObjectFactory, 'create').and.returnValue(
      jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 50, reset: null}));
    const backendApiStorePlaythroughSpy = (
      spyOn(playthroughBackendApiService, 'storePlaythrough'));

    this.expId = 'expId';
    this.expVersion = 1;
    this.playthroughRecordingProbability = 1.0;

    playthroughService.initSession(
      this.expId, this.expVersion, this.playthroughRecordingProbability);

    playthroughService.recordExplorationStartAction('initStateName1');
    playthroughService.recordAnswerSubmitAction(
      'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 40);
    playthroughService.recordExplorationQuitAction('stateName1', 10);
    playthroughService.storePlaythrough();

    expect(playthroughService.getPlaythrough()).toBeNull();
    expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
  });

  it('should not record learner actions when not in sample population', () => {
    spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
      .and.returnValue(false);
    spyOn(stopwatchObjectFactory, 'create').and.returnValue(
      jasmine.createSpyObj('Stopwatch', {getTimeInSecs: 50, reset: null}));
    const backendApiStorePlaythroughSpy = (
      spyOn(playthroughBackendApiService, 'storePlaythrough'));

    this.expId = 'expId';
    this.expVersion = 1;
    this.playthroughRecordingProbability = 0.6;
    spyOn(Math, 'random').and.returnValue(0.9); // Outside of probability.

    playthroughService.initSession(
      this.expId, this.expVersion, this.playthroughRecordingProbability);
    playthroughService.recordExplorationStartAction('initStateName1');
    playthroughService.recordAnswerSubmitAction(
      'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 40);
    playthroughService.recordExplorationQuitAction('stateName1', 10);
    playthroughService.storePlaythrough();

    expect(playthroughService.getPlaythrough()).toBeNull();
    expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
  });
});
