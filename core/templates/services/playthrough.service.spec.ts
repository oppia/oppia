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

  beforeEach(() => {
    this.recordStateTransitions = (stateNames: string) => {
      for (let i = 0; i < stateNames.length - 1; ++i) {
        playthroughService.recordAnswerSubmitAction(
          stateNames[i], stateNames[i + 1],
          'TextInput', 'Hello', 'Correct', 30);
      }
    };

    this.recordIncorrectAnswers = (stateName: string, times: number) => {
      for (let i = 0; i < times; ++i) {
        playthroughService.recordAnswerSubmitAction(
          stateName, stateName, 'TextInput', 'Hello', 'Wrong', 30);
      }
    };

    this.recordCycle = (stateNames: string, times: number) => {
      for (let i = 0; i < times; ++i) {
        for (let j = 0; j < stateNames.length; ++j) {
          playthroughService.recordAnswerSubmitAction(
            stateNames[j], stateNames[(j + 1) % stateNames.length],
            'TextInput', 'Hello', 'Correct', 30);
        }
      }
    };

    this.mockExplorationTimer = (durationInSecs: number) => {
      const mockStopwatch = jasmine.createSpyObj('Stopwatch', {
        getTimeInSecs: durationInSecs,
        reset: null,
      });
      spyOn(stopwatchObjectFactory, 'create').and.returnValue(mockStopwatch);
    };
  });

  describe('Recording playthroughs', () => {
    beforeEach(() => {
      playthroughService.initSession('expId', 1, 1.0);
      spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(true);
    });

    describe('Managing playthroughs', () => {
      it('should return null playthrough just after initialization', () => {
        expect(playthroughService.getPlaythrough()).toBeNull();
      });

      it('should return null playthrough before exploration start', () => {
        playthroughService.recordAnswerSubmitAction(
          'A', 'B', 'TextInput', 'Hello', 'Try again', 30);
        expect(playthroughService.getPlaythrough()).toBeNull();

        playthroughService.recordExplorationQuitAction('End', 13);
        expect(playthroughService.getPlaythrough()).toBeNull();

        playthroughService.recordExplorationStartAction('A');
        expect(playthroughService.getPlaythrough()).toBeInstanceOf(Playthrough);
      });

      it('should stop recording actions after exploration quit', () => {
        this.mockExplorationTimer(70);
        playthroughService.recordExplorationStartAction('A');
        playthroughService.recordAnswerSubmitAction(
          'A', 'B', 'TextInput', 'Hello', 'Wrong!', 30);
        playthroughService.recordExplorationQuitAction('B', 40);

        // Extra actions which should be ignored.
        playthroughService.recordExplorationStartAction('A');
        playthroughService.recordExplorationStartAction('B');
        playthroughService.recordAnswerSubmitAction(
          'A', 'B', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordAnswerSubmitAction(
          'A', 'B', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.recordExplorationQuitAction('B', 13);
        playthroughService.recordExplorationQuitAction('C', 13);

        expect(playthroughService.getPlaythrough()).not.toBeNull();
        expect(playthroughService.getPlaythrough().actions).toEqual([
          learnerActionObjectFactory.createExplorationStartAction({
            state_name: {value: 'A'}
          }),
          learnerActionObjectFactory.createAnswerSubmitAction({
            state_name: {value: 'A'},
            dest_state_name: {value: 'B'},
            interaction_id: {value: 'TextInput'},
            submitted_answer: {value: 'Hello'},
            feedback: {value: 'Wrong!'},
            time_spent_state_in_msecs: {value: 30000},
          }),
          learnerActionObjectFactory.createExplorationQuitAction({
            state_name: {value: 'B'},
            time_spent_in_state_in_msecs: {value: 40000},
          }),
        ]);
      });

      it('should only store playthroughs after an exploration quit', () => {
        const backendApiStorePlaythroughSpy = (
          spyOn(playthroughBackendApiService, 'storePlaythrough'));

        this.mockExplorationTimer(60);
        playthroughService.recordExplorationStartAction('A');
        playthroughService.storePlaythrough();

        expect(playthroughService.getPlaythrough()).not.toBeNull();
        expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();

        playthroughService.recordAnswerSubmitAction(
          'A', 'A', 'TextInput', 'Hello', 'Try again', 30);
        playthroughService.storePlaythrough();

        expect(playthroughService.getPlaythrough().issueType).toBeNull();
        expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();

        playthroughService.recordExplorationQuitAction('End', 30);
        playthroughService.storePlaythrough();

        expect(playthroughService.getPlaythrough().issueType)
          .toEqual('EarlyQuit');
        expect(backendApiStorePlaythroughSpy).toHaveBeenCalled();
      });
    });

    describe('Issue identification', () => {
      it('should return null issue if playthrough has no problems', () => {
        this.mockExplorationTimer(400);
        playthroughService.recordExplorationStartAction('A');
        this.recordStateTransitions('ABC');
        playthroughService.recordExplorationQuitAction('C', 60);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough).not.toBeNull();
        expect(playthrough.issueType).toBeNull();
        expect(playthrough.issueCustomizationArgs).toBeNull();
      });

      it('should identify multiple incorrect submissions', () => {
        this.mockExplorationTimer(400);
        playthroughService.recordExplorationStartAction('A');
        this.recordIncorrectAnswers('A', 5);
        playthroughService.recordExplorationQuitAction('A', 60);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_name: {value: 'A'},
          num_times_answered_incorrectly: {value: 5},
        });
      });

      it('should return null if state with multiple incorrect submissions is ' +
        'eventually completed', () => {
        this.mockExplorationTimer(400);
        playthroughService.recordExplorationStartAction('A');
        this.recordIncorrectAnswers('A', 5);
        this.recordStateTransitions('ABC');
        playthroughService.recordExplorationQuitAction('C', 60);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toBeNull();
        expect(playthrough.issueCustomizationArgs).toBeNull();
      });

      it('should identify cyclic state transitions', () => {
        this.mockExplorationTimer(400);
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('ABC', 3);
        playthroughService.recordExplorationQuitAction('A', 30);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['C', 'A']},
        });
      });

      it('should identify early quits', () => {
        this.mockExplorationTimer(60);
        playthroughService.recordExplorationStartAction('A');
        this.recordIncorrectAnswers('A', 1);
        playthroughService.recordExplorationQuitAction('A', 20);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('EarlyQuit');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_name: {value: 'A'},
          time_spent_in_exp_in_msecs: {value: 60000},
        });
      });
    });

    describe('Types of cycles', () => {
      beforeEach(() => {
        this.mockExplorationTimer(400);
      });

      it('should identify p-head cyclic state transitions', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordStateTransitions('ABC');
        this.recordCycle('CDE', 3);
        playthroughService.recordExplorationQuitAction('C', 60);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['E', 'C']},
        });
      });

      it('should identify p-tail cyclic state transitions', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('ABC', 3);
        this.recordStateTransitions('ADE');
        playthroughService.recordExplorationQuitAction('F', 60);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['C', 'A']},
        });
      });

      it('should identify cycle within an otherwise linear path', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordStateTransitions('ABC');
        this.recordCycle('CDE', 3);
        this.recordStateTransitions('CFG');
        playthroughService.recordExplorationQuitAction('G', 60);

        let playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['E', 'C']},
        });
      });

      it('should identify cycle with nested 1-cycles', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('ABC', 2);
        this.recordIncorrectAnswers('A', 2);
        this.recordCycle('ABC', 2);
        playthroughService.recordExplorationQuitAction('A', 60);

        const playthrough = playthroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['C', 'A']},
        });
      });

      it('should identify rotations of cycles', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('ABC', 1);
        this.recordStateTransitions('ADB');
        this.recordCycle('BCA', 1);
        this.recordStateTransitions('BEC');
        this.recordCycle('CAB', 1);
        playthroughService.recordExplorationQuitAction('C', 10);

        const playthrough = playthroughService.getPlaythrough();
        expect(playthrough).not.toBeNull();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['C', 'A']},
        });
      });

      it('should be able to identify the outer-cycle of nested cycles', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('AB', 2);
        this.recordCycle('A' + 'CDC' + 'B', 1);
        playthroughService.recordExplorationQuitAction('A', 60);

        const playthrough = playthroughService.getPlaythrough();
        expect(playthrough).not.toBeNull();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['B', 'A']},
        });
      });

      it('should return most recent cycle when there are many with same ' +
        'number of occurrences', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('AB', 3); this.recordStateTransitions('AC');
        this.recordCycle('CD', 3); this.recordStateTransitions('CE');
        this.recordCycle('EF', 3); this.recordStateTransitions('EG');
        this.recordCycle('GH', 3); this.recordStateTransitions('GI');
        this.recordCycle('IJ', 3); this.recordStateTransitions('IK');
        this.recordCycle('KL', 3); this.recordStateTransitions('KM');
        this.recordCycle('MN', 3); this.recordStateTransitions('MO');
        this.recordCycle('OP', 3); this.recordStateTransitions('OQ');
        this.recordCycle('QR', 3); this.recordStateTransitions('QS');
        this.recordCycle('ST', 3); this.recordStateTransitions('SU');
        playthroughService.recordExplorationQuitAction('U', 30);

        const playthrough = playthroughService.getPlaythrough();
        expect(playthrough).not.toBeNull();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['T', 'S']},
        });
      });

      it('should not report issue if state is not visited from the same card ' +
        'enough times', () => {
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('AB', 1);
        this.recordCycle('AC', 1);
        this.recordCycle('AD', 1);
        playthroughService.recordExplorationQuitAction('A', 60);

        const playthrough = playthroughService.getPlaythrough();
        expect(playthrough).not.toBeNull();
        expect(playthrough.issueType).toBeNull();
        expect(playthrough.issueCustomizationArgs).toBeNull();
      });
    });

    describe('Issue prioritization', () => {
      it('should prioritize multiple incorrect submissions over cyclic state ' +
        'transitions and early quit', () => {
        this.mockExplorationTimer(50);
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('AB', 3);
        this.recordIncorrectAnswers('A', 5);
        playthroughService.recordExplorationQuitAction('A', 10);

        expect(playthroughService.getPlaythrough().issueType)
          .toEqual('MultipleIncorrectSubmissions');
      });

      it('should prioritize multiple incorrect submissions over early quit',
        () => {
          this.mockExplorationTimer(50);
          playthroughService.recordExplorationStartAction('A');
          this.recordIncorrectAnswers('A', 5);
          playthroughService.recordExplorationQuitAction('A', 10);

          expect(playthroughService.getPlaythrough().issueType)
            .toEqual('MultipleIncorrectSubmissions');
        });

      it('should prioritize cyclic state transitions over early quit', () => {
        this.mockExplorationTimer(50);
        playthroughService.recordExplorationStartAction('A');
        this.recordCycle('AB', 3);
        playthroughService.recordExplorationQuitAction('A', 10);

        expect(playthroughService.getPlaythrough().issueType)
          .toEqual('CyclicStateTransitions');
      });
    });

    describe('Identifying learners who are just browsing', () => {
      it('should not store playthrough if learner quits too early', () => {
        const backendApiStorePlaythroughSpy = (
          spyOn(playthroughBackendApiService, 'storePlaythrough'));

        this.mockExplorationTimer(40);
        playthroughService.recordExplorationStartAction('A');
        this.recordIncorrectAnswers('A', 5);
        playthroughService.recordExplorationQuitAction('A', 10);

        expect(playthroughService.getPlaythrough().issueType)
          .toEqual('MultipleIncorrectSubmissions');
        playthroughService.storePlaythrough();
        expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
      });

      it('should not store playthrough if learner did not submit any answers',
        () => {
          const backendApiStorePlaythroughSpy = (
            spyOn(playthroughBackendApiService, 'storePlaythrough'));

          this.mockExplorationTimer(60);
          playthroughService.recordExplorationStartAction('A');
          playthroughService.recordExplorationQuitAction('A', 60);
          playthroughService.storePlaythrough();

          const playthrough = playthroughService.getPlaythrough();
          expect(playthrough).not.toBeNull();
          expect(playthrough.issueType).toEqual('EarlyQuit');
          expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
        });
    });
  });

  describe('Disabling playthrough recordings', () => {
    it('should not record learner actions when recording is disabled', () => {
      const backendApiStorePlaythroughSpy = (
        spyOn(playthroughBackendApiService, 'storePlaythrough'));
      spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(false);

      playthroughService.initSession('expId', 1, 1.0);

      this.mockExplorationTimer(400);
      playthroughService.recordExplorationStartAction('A');
      this.recordIncorrectAnswers('A', 5);
      playthroughService.recordExplorationQuitAction('A', 10);
      playthroughService.storePlaythrough();

      expect(playthroughService.getPlaythrough()).toBeNull();
      expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
    });

    it('should not record learner that is not in sample population', () => {
      spyOn(explorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(false);
      const backendApiStorePlaythroughSpy = (
        spyOn(playthroughBackendApiService, 'storePlaythrough'));

      const sampleSizePopulationProportion = 0.6;
      spyOn(Math, 'random').and.returnValue(0.9); // Not in sample population.

      this.mockExplorationTimer(400);
      playthroughService.initSession(
        'expId', 1, sampleSizePopulationProportion);
      playthroughService.recordExplorationStartAction('A');
      this.recordIncorrectAnswers('A', 5);
      playthroughService.recordExplorationQuitAction('A', 10);
      playthroughService.storePlaythrough();

      expect(playthroughService.getPlaythrough()).toBeNull();
      expect(backendApiStorePlaythroughSpy).not.toHaveBeenCalled();
    });
  });
});
