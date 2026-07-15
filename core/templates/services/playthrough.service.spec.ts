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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {LearnerAction} from 'domain/statistics/learner-action.model';
import {Playthrough} from 'domain/statistics/playthrough.model';
import {PlaythroughService} from 'services/playthrough.service';
import {PlaythroughBackendApiService} from 'domain/statistics/playthrough-backend-api.service';
import {Stopwatch} from 'domain/utilities/stopwatch.model';

describe('PlaythroughService', () => {
  let explorationFeaturesService: ExplorationFeaturesService;
  let playthroughBackendApiService: PlaythroughBackendApiService;
  let playthroughService: PlaythroughService;

  // NOTE TO DEVELOPERS: For the following 3 "record" functions, it is the test
  // writer's responsibility to create a "sensible" set of transitions.
  // Specifically, avoid adding holes and otherwise impossible transitions
  // unless that is being explicitly tested. For example:
  //
  //      recordStateTransitions(['A', 'B']);
  //      recordStateTransitions(['F', 'G']); // Wrong, next should be 'B'.
  //
  //      recordCycle(['A', 'B', 'C'], 3); // Final position is at 'A'.
  //      recordStateTransitions(['C', 'D', 'E']); // Wrong, next should be 'A'.
  //
  //      recordIncorrectAnswers('A', 3); // Final position is at 'A'.
  //      recordStateTransitions(['C', 'D', 'E']); // Wrong, next should be 'A'.

  const recordStateTransitions = (stateNames: string[]) => {
    for (let i = 0; i < stateNames.length - 1; ++i) {
      playthroughService.recordAnswerSubmitAction(
        stateNames[i],
        stateNames[i + 1],
        'TextInput',
        'Hello',
        'Correct',
        30
      );
    }
  };

  const recordIncorrectAnswers = (stateName: string, times: number) => {
    for (let i = 0; i < times; ++i) {
      playthroughService.recordAnswerSubmitAction(
        stateName,
        stateName,
        'TextInput',
        'Hello',
        'Wrong',
        30
      );
    }
  };

  const recordCycle = (stateNames: string[], times: number) => {
    const numAnswerSubmitActions = stateNames.length * times;
    for (let i = 0; i < numAnswerSubmitActions; ++i) {
      const fromState = stateNames[i % stateNames.length];
      const destState = stateNames[(i + 1) % stateNames.length];
      playthroughService.recordAnswerSubmitAction(
        fromState,
        destState,
        'TextInput',
        'Hello',
        'Correct',
        30
      );
    }
  };

  const mockTimedExplorationDurationInSecs = (durationInSecs: number) => {
    const mockStopwatch = jasmine.createSpyObj('Stopwatch', {
      getTimeInSecs: durationInSecs,
      reset: null,
    });
    spyOn(Stopwatch, 'create').and.returnValue(mockStopwatch);
  };

  const spyOnStorePlaythrough = (
    callback: ((p: Playthrough) => void) | null = null
  ) => {
    if (callback) {
      return spyOn(
        playthroughBackendApiService,
        'storePlaythroughAsync'
      ).and.callFake(async (p: Playthrough, _: number) => callback(p));
    } else {
      return spyOn(
        playthroughBackendApiService,
        'storePlaythroughAsync'
      ).and.stub();
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    explorationFeaturesService = TestBed.get(ExplorationFeaturesService);
    playthroughBackendApiService = TestBed.get(PlaythroughBackendApiService);
    playthroughService = TestBed.get(PlaythroughService);
  });

  describe('Recording playthroughs', () => {
    beforeEach(() => {
      playthroughService.initSession('expId', 1, 1.0);
      spyOn(
        explorationFeaturesService,
        'isPlaythroughRecordingEnabled'
      ).and.returnValue(true);
    });

    describe('Managing playthroughs', () => {
      it('should record actions', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.actions).toEqual([
            LearnerAction.createNewExplorationStartAction({
              state_name: {value: 'A'},
            }),
            LearnerAction.createNewAnswerSubmitAction({
              state_name: {value: 'A'},
              dest_state_name: {value: 'B'},
              interaction_id: {value: 'TextInput'},
              submitted_answer: {value: 'Hello'},
              feedback: {value: 'Wrong!'},
              time_spent_state_in_msecs: {value: 30000},
            }),
            LearnerAction.createNewExplorationQuitAction({
              state_name: {value: 'B'},
              time_spent_in_state_in_msecs: {value: 40000},
            }),
          ]);
        });

        mockTimedExplorationDurationInSecs(70);
        playthroughService.recordExplorationStartAction('A');
        playthroughService.recordAnswerSubmitAction(
          'A',
          'B',
          'TextInput',
          'Hello',
          'Wrong!',
          30
        );
        playthroughService.recordExplorationQuitAction('B', 40);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });

      it('should ignore extraneous actions', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.actions).toEqual([
            LearnerAction.createNewExplorationStartAction({
              state_name: {value: 'A'},
            }),
            LearnerAction.createNewAnswerSubmitAction({
              state_name: {value: 'A'},
              dest_state_name: {value: 'B'},
              interaction_id: {value: 'TextInput'},
              submitted_answer: {value: 'Hello'},
              feedback: {value: 'Wrong!'},
              time_spent_state_in_msecs: {value: 30000},
            }),
            LearnerAction.createNewExplorationQuitAction({
              state_name: {value: 'B'},
              time_spent_in_state_in_msecs: {value: 40000},
            }),
          ]);
        });

        mockTimedExplorationDurationInSecs(70);

        // Actions which should be recorded (everything before quit).
        playthroughService.recordExplorationStartAction('A');
        playthroughService.recordAnswerSubmitAction(
          'A',
          'B',
          'TextInput',
          'Hello',
          'Wrong!',
          30
        );
        playthroughService.recordExplorationQuitAction('B', 40);

        // Extraneous actions which should be ignored.
        playthroughService.recordExplorationStartAction('A');
        playthroughService.recordExplorationStartAction('B');
        playthroughService.recordAnswerSubmitAction(
          'A',
          'B',
          'TextInput',
          'Hello',
          'Try again',
          30
        );
        playthroughService.recordAnswerSubmitAction(
          'A',
          'B',
          'TextInput',
          'Hello',
          'Try again',
          30
        );
        playthroughService.recordExplorationQuitAction('B', 13);
        playthroughService.recordExplorationQuitAction('C', 13);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });

      it('should only store playthroughs after an exploration quit', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough();

        mockTimedExplorationDurationInSecs(60);
        playthroughService.recordExplorationStartAction('A');
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).not.toHaveBeenCalled();

        playthroughService.recordAnswerSubmitAction(
          'A',
          'A',
          'TextInput',
          'Hello',
          'Try again',
          30
        );
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).not.toHaveBeenCalled();

        playthroughService.recordExplorationQuitAction('End', 30);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });
    });

    describe('Issue identification', () => {
      it('should return null issue if playthrough has no problems', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough();
        mockTimedExplorationDurationInSecs(400);
        playthroughService.recordExplorationStartAction('A');
        recordStateTransitions(['A', 'B', 'C']);
        playthroughService.recordExplorationQuitAction('C', 60);

        expect(storePlaythroughSpy).not.toHaveBeenCalled();
      });

      it('should identify multiple incorrect submissions', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
        });

        mockTimedExplorationDurationInSecs(400);
        playthroughService.recordExplorationStartAction('A');
        recordIncorrectAnswers('A', 5);
        playthroughService.recordExplorationQuitAction('A', 60);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });

      it(
        'should return null if state with multiple incorrect submissions is ' +
          'eventually completed',
        () => {
          const storePlaythroughSpy = spyOnStorePlaythrough();
          mockTimedExplorationDurationInSecs(400);
          playthroughService.recordExplorationStartAction('A');
          recordIncorrectAnswers('A', 5);
          recordStateTransitions(['A', 'B', 'C']);
          playthroughService.recordExplorationQuitAction('C', 60);
          playthroughService.storePlaythrough();

          expect(storePlaythroughSpy).not.toHaveBeenCalled();
        }
      );

      it('should identify cyclic state transitions', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.issueType).toEqual('CyclicStateTransitions');
          expect(playthrough.issueCustomizationArgs).toEqual({
            state_names: {value: ['A', 'B', 'C', 'A']},
          });
        });

        mockTimedExplorationDurationInSecs(400);
        playthroughService.recordExplorationStartAction('A');
        recordCycle(['A', 'B', 'C'], 3);
        playthroughService.recordExplorationQuitAction('A', 30);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });

      it('should identify early quits', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.issueType).toEqual('EarlyQuit');
          expect(playthrough.issueCustomizationArgs).toEqual({
            state_name: {value: 'A'},
            time_spent_in_exp_in_msecs: {value: 60000},
          });
        });

        mockTimedExplorationDurationInSecs(60);
        playthroughService.recordExplorationStartAction('A');
        recordIncorrectAnswers('A', 1);
        playthroughService.recordExplorationQuitAction('A', 20);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });
    });

    describe('Types of cycles', () => {
      beforeEach(() => {
        mockTimedExplorationDurationInSecs(400);
      });

      it(
        'should identify p-shaped cyclic state transitions with cyclic ' +
          'portion at the tail',
        () => {
          // P-shaped cycles look like:
          // A - B - C - D
          //         |   |
          //         F - E
          //
          // For this test, we check when the cyclic portion appears at the end
          // (tail) of the playthrough.
          const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
            expect(playthrough.issueType).toEqual('CyclicStateTransitions');
            expect(playthrough.issueCustomizationArgs).toEqual({
              state_names: {value: ['C', 'D', 'E', 'C']},
            });
          });

          playthroughService.recordExplorationStartAction('A');
          recordStateTransitions(['A', 'B', 'C']);
          recordCycle(['C', 'D', 'E'], 3);
          playthroughService.recordExplorationQuitAction('C', 60);
          playthroughService.storePlaythrough();

          expect(storePlaythroughSpy).toHaveBeenCalled();
        }
      );

      it(
        'should identify p-shaped cyclic state transitions with cyclic ' +
          'portion at the head',
        () => {
          // P-shaped cycles look like:
          // D - A - E - F
          // |   |
          // C - B
          //
          // For this test, we check when the cyclic portion appears at the start
          // (head) of the playthrough.
          const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
            expect(playthrough.issueType).toEqual('CyclicStateTransitions');
            expect(playthrough.issueCustomizationArgs).toEqual({
              state_names: {value: ['A', 'B', 'C', 'A']},
            });
          });
          playthroughService.recordExplorationStartAction('A');
          recordCycle(['A', 'B', 'C'], 3);
          recordStateTransitions(['A', 'D', 'E']);
          playthroughService.recordExplorationQuitAction('F', 60);
          playthroughService.storePlaythrough();

          expect(storePlaythroughSpy).toHaveBeenCalled();
        }
      );

      it('should identify cycle within an otherwise linear path', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.issueType).toEqual('CyclicStateTransitions');
          expect(playthrough.issueCustomizationArgs).toEqual({
            state_names: {value: ['C', 'D', 'E', 'C']},
          });
        });

        playthroughService.recordExplorationStartAction('A');
        recordStateTransitions(['A', 'B', 'C']);
        recordCycle(['C', 'D', 'E'], 3);
        recordStateTransitions(['C', 'F', 'G']);
        playthroughService.recordExplorationQuitAction('G', 60);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });

      it('should identify cycle with nested 1-cycles', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.issueType).toEqual('CyclicStateTransitions');
          expect(playthrough.issueCustomizationArgs).toEqual({
            state_names: {value: ['A', 'B', 'C', 'A']},
          });
        });

        playthroughService.recordExplorationStartAction('A');
        recordCycle(['A', 'B', 'C'], 2);
        recordIncorrectAnswers('A', 2);
        recordCycle(['A', 'B', 'C'], 2);
        playthroughService.recordExplorationQuitAction('A', 60);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });

      it('should not group rotations of cycles together', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough).not.toBeNull();
          expect(playthrough.issueType).toEqual('CyclicStateTransitions');
          expect(playthrough.issueCustomizationArgs).toEqual({
            state_names: {value: ['C', 'A']},
          });
        });

        playthroughService.recordExplorationStartAction('A');
        recordCycle(['A', 'B', 'C'], 1);
        recordStateTransitions(['A', 'D', 'B']);
        recordCycle(['B', 'C', 'A'], 1);
        recordStateTransitions(['B', 'E', 'C']);
        recordCycle(['C', 'A', 'B'], 1);
        playthroughService.recordExplorationQuitAction('C', 10);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).not.toHaveBeenCalled();
      });

      it('should fail to find a large cycle if a smaller one is nested', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough).not.toBeNull();
          expect(playthrough.issueType).toBeNull();
          expect(playthrough.issueCustomizationArgs).toBeNull();
        });

        playthroughService.recordExplorationStartAction('A');
        recordCycle(['A', 'B'], 2);
        recordCycle(['A', /* Inner-cycle: CDC. */ 'C', 'D', 'C', 'B'], 1);
        playthroughService.recordExplorationQuitAction('A', 60);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).not.toHaveBeenCalled();
      });

      it(
        'should return most recent cycle when there are many with same ' +
          'number of occurrences',
        () => {
          const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
            expect(playthrough).not.toBeNull();
            expect(playthrough.issueType).toEqual('CyclicStateTransitions');
            expect(playthrough.issueCustomizationArgs).toEqual({
              state_names: {value: ['S', 'T', 'S']},
            });
          });

          playthroughService.recordExplorationStartAction('A');
          recordCycle(['A', 'B'], 3);
          recordStateTransitions(['A', 'C']);
          recordCycle(['C', 'D'], 3);
          recordStateTransitions(['C', 'E']);
          recordCycle(['E', 'F'], 3);
          recordStateTransitions(['E', 'G']);
          recordCycle(['G', 'H'], 3);
          recordStateTransitions(['G', 'I']);
          recordCycle(['I', 'J'], 3);
          recordStateTransitions(['I', 'K']);
          recordCycle(['K', 'L'], 3);
          recordStateTransitions(['K', 'M']);
          recordCycle(['M', 'N'], 3);
          recordStateTransitions(['M', 'O']);
          recordCycle(['O', 'P'], 3);
          recordStateTransitions(['O', 'Q']);
          recordCycle(['Q', 'R'], 3);
          recordStateTransitions(['Q', 'S']);
          recordCycle(['S', 'T'], 3);
          recordStateTransitions(['S', 'U']);
          playthroughService.recordExplorationQuitAction('U', 30);
          playthroughService.storePlaythrough();

          expect(storePlaythroughSpy).toHaveBeenCalled();
        }
      );

      it(
        'should not report issue if state is not visited from the same card ' +
          'enough times',
        () => {
          const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
            expect(playthrough).not.toBeNull();
            expect(playthrough.issueType).toBeNull();
            expect(playthrough.issueCustomizationArgs).toBeNull();
          });

          playthroughService.recordExplorationStartAction('A');
          recordCycle(['A', 'B'], 1);
          recordCycle(['A', 'C'], 1);
          recordCycle(['A', 'D'], 1);
          playthroughService.recordExplorationQuitAction('A', 60);
          playthroughService.storePlaythrough();

          expect(storePlaythroughSpy).not.toHaveBeenCalled();
        }
      );
    });

    describe('Issue prioritization', () => {
      it(
        'should prioritize multiple incorrect submissions over cyclic state ' +
          'transitions and early quit',
        () => {
          const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
            expect(playthrough.issueType).toEqual(
              'MultipleIncorrectSubmissions'
            );
          });

          mockTimedExplorationDurationInSecs(50);
          playthroughService.recordExplorationStartAction('A');
          recordCycle(['A', 'B'], 3);
          recordIncorrectAnswers('A', 5);
          playthroughService.recordExplorationQuitAction('A', 10);
          playthroughService.storePlaythrough();

          expect(storePlaythroughSpy).toHaveBeenCalled();
        }
      );

      it('should prioritize multiple incorrect submissions over early quit', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
        });

        mockTimedExplorationDurationInSecs(50);
        playthroughService.recordExplorationStartAction('A');
        recordIncorrectAnswers('A', 5);
        playthroughService.recordExplorationQuitAction('A', 10);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });

      it('should prioritize cyclic state transitions over early quit', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough(playthrough => {
          expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        });

        mockTimedExplorationDurationInSecs(50);
        playthroughService.recordExplorationStartAction('A');
        recordCycle(['A', 'B'], 3);
        playthroughService.recordExplorationQuitAction('A', 10);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).toHaveBeenCalled();
      });
    });

    describe('Identifying learners who are just browsing', () => {
      it('should not store playthrough if learner quits too early', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough();

        mockTimedExplorationDurationInSecs(40);
        playthroughService.recordExplorationStartAction('A');
        recordIncorrectAnswers('A', 5);
        playthroughService.recordExplorationQuitAction('A', 10);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).not.toHaveBeenCalled();
      });

      it('should not store playthrough if learner did not submit any answers', () => {
        const storePlaythroughSpy = spyOnStorePlaythrough();

        mockTimedExplorationDurationInSecs(60);
        playthroughService.recordExplorationStartAction('A');
        playthroughService.recordExplorationQuitAction('A', 60);
        playthroughService.storePlaythrough();

        expect(storePlaythroughSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Disabling playthrough recordings', () => {
    it('should not record learner actions when recording is disabled', () => {
      const storePlaythroughSpy = spyOnStorePlaythrough();
      spyOn(
        explorationFeaturesService,
        'isPlaythroughRecordingEnabled'
      ).and.returnValue(false);

      playthroughService.initSession('expId', 1, 1.0);

      mockTimedExplorationDurationInSecs(400);
      playthroughService.recordExplorationStartAction('A');
      recordIncorrectAnswers('A', 5);
      playthroughService.recordExplorationQuitAction('A', 10);
      playthroughService.storePlaythrough();

      expect(storePlaythroughSpy).not.toHaveBeenCalled();
    });

    it('should not record learner that is not in sample population', () => {
      spyOn(
        explorationFeaturesService,
        'isPlaythroughRecordingEnabled'
      ).and.returnValue(false);
      const storePlaythroughSpy = spyOnStorePlaythrough();

      const sampleSizePopulationProportion = 0.6;
      spyOn(Math, 'random').and.returnValue(0.9); // Not in sample population.

      mockTimedExplorationDurationInSecs(400);
      playthroughService.initSession(
        'expId',
        1,
        sampleSizePopulationProportion
      );
      playthroughService.recordExplorationStartAction('A');
      recordIncorrectAnswers('A', 5);
      playthroughService.recordExplorationQuitAction('A', 10);
      playthroughService.storePlaythrough();

      expect(storePlaythroughSpy).not.toHaveBeenCalled();
    });
  });
});
