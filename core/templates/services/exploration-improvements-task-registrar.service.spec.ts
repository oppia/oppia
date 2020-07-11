// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ExplorationImprovementsTaskRegistrarService.
 */

import { TestBed } from '@angular/core/testing';

import { ExplorationImprovementsTaskRegistrarService } from
  'services/exploration-improvements-task-registrar.service';

import { AnswerStatsObjectFactory, IAnswerStatsBackendDict } from
  'domain/exploration/AnswerStatsObjectFactory';
import { ExplorationStatsObjectFactory, IExplorationStatsBackendDict } from
  'domain/statistics/ExplorationStatsObjectFactory';
import {
  ExplorationTaskObjectFactory,
  ExplorationTaskType,
  ExplorationTask,
  IExplorationTaskBackendDict,
} from 'domain/improvements/ExplorationTaskObjectFactory';
import {
  CyclicStateTransitionsPlaythrough,
  EarlyQuitPlaythrough,
  ICyclicStateTransitionsPlaythroughBackendDict,
  IEarlyQuitPlaythroughBackendDict,
  IMultipleIncorrectSubmissionsPlaythroughBackendDict,
  MultipleIncorrectSubmissionsPlaythrough,
  PlaythroughObjectFactory,
} from 'domain/statistics/PlaythroughObjectFactory';
import { HighBounceRateTask } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import { IStateBackendDict } from
  'domain/state/StateObjectFactory';
import { IStateStatsBackendDict } from
  'domain/statistics/StateStatsObjectFactory';
import { IneffectiveFeedbackLoopTask } from
  'domain/improvements/IneffectiveFeedbackLoopTaskObjectFactory';
import { NeedsGuidingResponsesTask } from
  'domain/improvements/NeedsGuidingResponsesTaskObjectFactory';
import { StatesObjectFactory } from
  'domain/exploration/StatesObjectFactory';
import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/SuccessiveIncorrectAnswersTaskObjectFactory';

describe('Exploration improvements task registrar service', () => {
  let taskRegistrarService:
    ExplorationImprovementsTaskRegistrarService;

  let answerStatsObjectFactory: AnswerStatsObjectFactory;
  let explorationStatsObjectFactory: ExplorationStatsObjectFactory;
  let explorationTaskObjectFactory: ExplorationTaskObjectFactory;
  let playthroughObjectFactory: PlaythroughObjectFactory;
  let statesObjectFactory: StatesObjectFactory;

  let answerStatsBackendDict: IAnswerStatsBackendDict;
  let cstPlaythroughBackendDict: ICyclicStateTransitionsPlaythroughBackendDict;
  let eqPlaythroughBackendDict: IEarlyQuitPlaythroughBackendDict;
  let expStatsBackendDict: IExplorationStatsBackendDict;
  let misPlaythroughBackendDict:
    IMultipleIncorrectSubmissionsPlaythroughBackendDict;
  let stateBackendDict: IStateBackendDict;
  let stateStatsBackendDict: IStateStatsBackendDict;
  let statesBackendDict: {[stateName: string]: IStateBackendDict};
  let taskBackendDict: IExplorationTaskBackendDict;

  const expId = 'eid';
  const expVersion = 1;

  beforeEach(() => {
    taskRegistrarService = (
      TestBed.get(ExplorationImprovementsTaskRegistrarService));

    answerStatsObjectFactory = TestBed.get(AnswerStatsObjectFactory);
    explorationStatsObjectFactory = TestBed.get(ExplorationStatsObjectFactory);
    explorationTaskObjectFactory = TestBed.get(ExplorationTaskObjectFactory);
    playthroughObjectFactory = TestBed.get(PlaythroughObjectFactory);
    statesObjectFactory = TestBed.get(StatesObjectFactory);

    stateBackendDict = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {},
        default_outcome: {
          dest: 'new state',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: {
          answer_is_exclusive: false,
          correct_answer: 'answer',
          explanation: {
            content_id: 'solution',
            html: '<p>This is an explanation.</p>'
          }
        },
        id: 'TextInput'
      },
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      },
    };

    stateStatsBackendDict = {
      total_hit_count: 100,
      total_answers_count: 100,
      num_completions: 100,
      num_times_solution_viewed: 5,
      first_hit_count: 100,
      useful_feedback_count: 8,
    };

    expStatsBackendDict = {
      exp_id: expId,
      exp_version: expVersion,
      num_starts: 1,
      num_actual_starts: 10,
      num_completions: 100,
      state_stats_mapping: {
        Introduction: stateStatsBackendDict,
        Middle: stateStatsBackendDict,
        End: stateStatsBackendDict,
      },
    };

    answerStatsBackendDict = {
      answer: 'foo',
      frequency: 5,
    };

    cstPlaythroughBackendDict = {
      exp_id: expId,
      exp_version: expVersion,
      issue_type: 'CyclicStateTransitions',
      issue_customization_args: {
        state_names: {
          value: ['Middle', 'Introduction']
        }
      },
      actions: []
    };

    eqPlaythroughBackendDict = {
      exp_id: expId,
      exp_version: expVersion,
      issue_type: 'EarlyQuit',
      issue_customization_args: {
        state_name: {
          value: 'Introduction'
        },
        time_spent_in_exp_in_msecs: {
          value: 1200
        }
      },
      actions: [{
        action_type: 'AnswerSubmit',
        action_customization_args: {
          state_name: {
            value: 'Inroduction'
          },
          dest_state_name: {
            value: 'Middle'
          },
          interaction_id: {
            value: 'TextInput'
          },
          submitted_answer: {
            value: 'answer'
          },
          feedback: {
            value: 'feedback'
          },
          time_spent_state_in_msecs: {
            value: 2000
          }
        },
        schema_version: 1
      }]
    };

    misPlaythroughBackendDict = {
      exp_id: expId,
      exp_version: expVersion,
      issue_type: 'MultipleIncorrectSubmissions',
      issue_customization_args: {
        state_name: { value: 'Introduction' },
        num_times_answered_incorrectly: { value: 3 },
      },
      actions: []
    };

    taskBackendDict = {
      entity_type: 'exploration',
      entity_id: expId,
      entity_version: expVersion,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'open',
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    };

    statesBackendDict = {
      Introduction: stateBackendDict,
      Middle: stateBackendDict,
      End: stateBackendDict,
    };
  });

  const makeTask = (
    <T extends ExplorationTask = ExplorationTask>(dict = taskBackendDict) => {
      return <T> explorationTaskObjectFactory.createFromBackendDict(dict);
    });
  const makeStates = (map = statesBackendDict) => {
    return statesObjectFactory.createFromBackendDict(map);
  };
  const makeExpStats = (dict = expStatsBackendDict) => {
    return explorationStatsObjectFactory.createFromBackendDict(dict);
  };
  const makeAnswerStats = (dict = answerStatsBackendDict) => {
    return answerStatsObjectFactory.createFromBackendDict(dict);
  };
  const makeCstPlaythrough = (dict = cstPlaythroughBackendDict) => {
    return <CyclicStateTransitionsPlaythrough> (
      playthroughObjectFactory.createFromBackendDict(dict));
  };
  const makeEqPlaythrough = (dict = eqPlaythroughBackendDict) => {
    return <EarlyQuitPlaythrough> (
      playthroughObjectFactory.createFromBackendDict(dict));
  };
  const makeMisPlaythrough = (dict = misPlaythroughBackendDict) => {
    return <MultipleIncorrectSubmissionsPlaythrough> (
      playthroughObjectFactory.createFromBackendDict(dict));
  };

  it('should initialize successfully using default test values', () => {
    expect(
      () => taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), new Map(), new Map(), new Map()))
      .not.toThrowError();
  });

  describe('Validating initialize arguments', () => {
    it('should throw if stats is for wrong exploration', () => {
      const expId = 'eid';
      expStatsBackendDict.exp_id = 'wrong_exp_id';
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), new Map(), new Map(), new Map()))
        .toThrowError(
          'Expected stats for exploration "eid", but got stats for ' +
          'exploration "wrong_exp_id"');
    });

    it('should throw if stats is for wrong exploration version', () => {
      const expVersion = 1;
      expStatsBackendDict.exp_version = 2;
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), new Map(), new Map(), new Map()))
        .toThrowError(
          'Expected stats for exploration version 1, but got stats for ' +
          'exploration version 2');
    });

    it('should throw if a task targets an unknown state', () => {
      delete statesBackendDict.End;
      taskBackendDict.target_id = 'End';
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          new Map(), new Map(), new Map(), new Map(), new Map()))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if a resolved task type targets an unknown state', () => {
      delete statesBackendDict.End;
      const resolvedTaskTypesByStateName = (
        new Map<string, ExplorationTaskType[]>([
          ['End', <ExplorationTaskType[]> ['high_bounce_rate']]
        ]));
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          resolvedTaskTypesByStateName, new Map(), new Map(), new Map(),
          new Map()))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if answer stats maps to an unknown state', () => {
      delete statesBackendDict.End;
      const answerStats = new Map([['End', [makeAnswerStats()]]]);
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), answerStats, new Map(), new Map(), new Map()))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if CST playthrough maps to an unknown state', () => {
      delete statesBackendDict.End;
      const cstPlaythroughsByStateName = new Map([
        ['End', [makeCstPlaythrough()]],
      ]);
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), cstPlaythroughsByStateName, new Map(),
          new Map()))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if EQ playthrough maps to an unknown state', () => {
      delete statesBackendDict.End;
      const eqPlaythroughsByStateName = new Map([
        ['End', [makeEqPlaythrough()]],
      ]);
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), new Map(), eqPlaythroughsByStateName,
          new Map()))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if MIS playthrough maps to an unknown state', () => {
      delete statesBackendDict.End;
      const misPlaythroughsByStateName = new Map([
        ['End', [makeMisPlaythrough()]],
      ]);
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), new Map(), new Map(),
          misPlaythroughsByStateName))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if CST playthrough targets wrong exploration', () => {
      const expId = 'eid';
      cstPlaythroughBackendDict.exp_id = 'wrong_exp_id';
      const cstPlaythroughsByStateName = (
        new Map([['Introduction', [makeCstPlaythrough()]]]));
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), cstPlaythroughsByStateName, new Map(),
          new Map()))
        .toThrowError(
          'Expected playthrough for exploration "eid", but got playthrough ' +
          'for exploration "wrong_exp_id"');
    });

    it('should throw if EQ playthrough targets wrong exploration', () => {
      const expId = 'eid';
      eqPlaythroughBackendDict.exp_id = 'wrong_exp_id';
      const eqPlaythroughsByStateName = (
        new Map([['Introduction', [makeEqPlaythrough()]]]));
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), new Map(), eqPlaythroughsByStateName,
          new Map()))
        .toThrowError(
          'Expected playthrough for exploration "eid", but got playthrough ' +
          'for exploration "wrong_exp_id"');
    });

    it('should throw if MIS playthrough targets wrong exploration', () => {
      const expId = 'eid';
      misPlaythroughBackendDict.exp_id = 'wrong_exp_id';
      const misPlaythroughsByStateName = (
        new Map([['Introduction', [makeMisPlaythrough()]]]));
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), new Map(), new Map(),
          misPlaythroughsByStateName))
        .toThrowError(
          'Expected playthrough for exploration "eid", but got playthrough ' +
          'for exploration "wrong_exp_id"');
    });

    it('should throw if CST playthrough targets wrong exploration version',
      () => {
        const expVersion = 1;
        cstPlaythroughBackendDict.exp_version = 2;
        const cstPlaythroughsByStateName = (
          new Map([['Introduction', [makeCstPlaythrough()]]]));
        expect(
          () => taskRegistrarService.initialize(
            expId, expVersion, makeStates(), makeExpStats(), [],
            new Map(), new Map(), cstPlaythroughsByStateName, new Map(),
            new Map()))
          .toThrowError(
            'Expected playthrough for exploration version 1, but got ' +
            'playthrough for exploration version 2');
      });

    it('should throw if EQ playthrough targets wrong exploration version',
      () => {
        const expVersion = 1;
        eqPlaythroughBackendDict.exp_version = 2;
        const eqPlaythroughsByStateName = (
          new Map([['Introduction', [makeEqPlaythrough()]]]));
        expect(
          () => taskRegistrarService.initialize(
            expId, expVersion, makeStates(), makeExpStats(), [],
            new Map(), new Map(), new Map(), eqPlaythroughsByStateName,
            new Map()))
          .toThrowError(
            'Expected playthrough for exploration version 1, but got ' +
            'playthrough for exploration version 2');
      });

    it('should throw if MIS playthrough targets wrong exploration version',
      () => {
        const expVersion = 1;
        misPlaythroughBackendDict.exp_version = 2;
        const misPlaythroughsByStateName = (
          new Map([['Introduction', [makeMisPlaythrough()]]]));
        expect(
          () => taskRegistrarService.initialize(
            expId, expVersion, makeStates(), makeExpStats(), [],
            new Map(), new Map(), new Map(), new Map(),
            misPlaythroughsByStateName))
          .toThrowError(
            'Expected playthrough for exploration version 1, but got ' +
            'playthrough for exploration version 2');
      });

    it('should throw if task targets wrong exploration', () => {
      const expId = 'eid';
      taskBackendDict.entity_id = 'wrong_exp_id';
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          new Map(), new Map(), new Map(), new Map(), new Map()))
        .toThrowError(
          'Expected task for exploration "eid", but got task for exploration ' +
          '"wrong_exp_id"');
    });

    it('should throw if task targets wrong exploration version', () => {
      const expVersion = 1;
      taskBackendDict.entity_version = 2;
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          new Map(), new Map(), new Map(), new Map(), new Map()))
        .toThrowError(
          'Expected task for exploration version 1, but got task for ' +
          'exploration version 2');
    });

    it('should throw if open tasks with the same type are targeting the same ' +
      'state', () => {
      taskBackendDict.target_id = 'Introduction';
      taskBackendDict.task_type = 'high_bounce_rate';
      const tasks = [makeTask(), makeTask()];
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), tasks,
          new Map(), new Map(), new Map(), new Map(), new Map()))
        .toThrowError(
          'Found duplicate task of type "high_bounce_rate" targeting state ' +
          '"Introduction"');
    });

    it('should throw if open and resolved tasks with the same type are ' +
      'targeting the same state', () => {
      taskBackendDict.target_id = 'Introduction';
      taskBackendDict.task_type = 'high_bounce_rate';
      const resolvedTaskTypesByStateName = new Map([
        ['Introduction', <ExplorationTaskType[]> ['high_bounce_rate']]
      ]);
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          resolvedTaskTypesByStateName, new Map(), new Map(), new Map(),
          new Map()))
        .toThrowError(
          'Found duplicate task of type "high_bounce_rate" targeting state ' +
          '"Introduction"');
    });

    it('should throw if resolved tasks with the same type are targeting the ' +
      'same state', () => {
      const resolvedTaskTypesByStateName = new Map([
        ['Introduction',
          <ExplorationTaskType[]> ['high_bounce_rate', 'high_bounce_rate']],
      ]);
      expect(
        () => taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          resolvedTaskTypesByStateName, new Map(), new Map(), new Map(),
          new Map()))
        .toThrowError(
          'Found duplicate task of type "high_bounce_rate" targeting state ' +
          '"Introduction"');
    });
  });

  describe('Post-initialization', () => {
    it('should have a task for each open task', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      const hbrTask = makeTask<HighBounceRateTask>(
        {...taskBackendDict, ...{task_type: 'high_bounce_rate'}});
      const iflTask = makeTask<IneffectiveFeedbackLoopTask>(
        {...taskBackendDict, ...{task_type: 'ineffective_feedback_loop'}});
      const ngrTask = makeTask<NeedsGuidingResponsesTask>(
        {...taskBackendDict, ...{task_type: 'needs_guiding_responses'}});
      const siaTask = makeTask<SuccessiveIncorrectAnswersTask>(
        {...taskBackendDict, ...{task_type: 'successive_incorrect_answers'}});

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(statesBackendDict), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask],
        new Map(), new Map(), new Map(), new Map(), new Map());

      expect(taskRegistrarService.getHighBounceRateTasks()).toEqual(
        [hbrTask]);
      expect(taskRegistrarService.getIneffectiveFeedbackLoopTasks()).toEqual(
        [iflTask]);
      expect(taskRegistrarService.getNeedsGuidingResponsesTasks()).toEqual(
        [ngrTask]);
      expect(taskRegistrarService.getSuccessiveIncorrectAnswersTasks()).toEqual(
        [siaTask]);
    });

    it('should have a task for each resolved task type', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      const resolvedTaskTypesByStateName = (
        new Map<string, ExplorationTaskType[]>([
          ['Introduction', [
            'high_bounce_rate', 'ineffective_feedback_loop',
            'needs_guiding_responses', 'successive_incorrect_answers',
          ]],
        ]));

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        resolvedTaskTypesByStateName, new Map(), new Map(), new Map(),
        new Map());

      expect(taskRegistrarService.getHighBounceRateTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getIneffectiveFeedbackLoopTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getNeedsGuidingResponsesTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getSuccessiveIncorrectAnswersTasks().length)
        .toEqual(1);
    });
  });

  describe('Generating new tasks', () => {
    it('should generate obsolete tasks when no tasks exist yet', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), new Map(), new Map(), new Map());

      expect(taskRegistrarService.getHighBounceRateTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getIneffectiveFeedbackLoopTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getNeedsGuidingResponsesTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getSuccessiveIncorrectAnswersTasks().length)
        .toEqual(1);
    });

    it('should generate a new high bounce rate task', () => {
      statesBackendDict = {
        Introduction: stateBackendDict,
      };
      expStatsBackendDict.num_starts = 500;
      expStatsBackendDict.state_stats_mapping = {
        Introduction: {
          ...stateStatsBackendDict,
          ...{total_hit_count: 500, num_completions: 350},
        },
      };
      const eqPlaythroughsByStateName = (
        new Map([['Introduction', [makeEqPlaythrough()]]]));

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), new Map(), eqPlaythroughsByStateName, new Map());

      const [hbrTask] = taskRegistrarService.getHighBounceRateTasks();
      expect(hbrTask.isOpen()).toBeTrue();
    });

    it('should generate a new ineffective feedback loop task', () => {
      const cstPlaythroughsByStateName = (
        new Map([['Introduction', [makeCstPlaythrough()]]]));

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), cstPlaythroughsByStateName, new Map(), new Map());

      const [iflTask] = taskRegistrarService.getIneffectiveFeedbackLoopTasks();
      expect(iflTask.isOpen()).toBeTrue();
    });

    it('should generate a new needs guiding responses task', () => {
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), stateAnswerStats, new Map(), new Map(), new Map());

      const [ngrTask] = taskRegistrarService.getNeedsGuidingResponsesTasks();
      expect(ngrTask.isOpen()).toBeTrue();
    });

    it('should generate a new successive incorrect answers task', () => {
      const misPlaythroughsByStateName = new Map([
        ['Introduction', [makeMisPlaythrough()]]
      ]);

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), new Map(), new Map(), misPlaythroughsByStateName);

      const [siaTask] = (
        taskRegistrarService.getSuccessiveIncorrectAnswersTasks());
      expect(siaTask.isOpen()).toBeTrue();
    });
  });

  describe('Discarding open tasks', () => {
    it('should discard an HBR task when bounce rate is too low', () => {
      const task = makeTask<HighBounceRateTask>(
        {...taskBackendDict, ...{status: 'open'}});
      statesBackendDict = {
        Introduction: stateBackendDict,
      };
      expStatsBackendDict.num_starts = 500;
      expStatsBackendDict.state_stats_mapping = {
        Introduction: {
          ...stateStatsBackendDict,
          ...{total_hit_count: 500, num_completions: 450},
        },
      };

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [task],
        new Map(), new Map(), new Map(), new Map(), new Map());

      const [hbrTask] = taskRegistrarService.getHighBounceRateTasks();
      expect(hbrTask.isObsolete()).toBeTrue();
    });

    it('should discard an NGR task when all answers are addressed', () => {
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), stateAnswerStats, new Map(), new Map(), new Map());

      const [ngrTask] = taskRegistrarService.getNeedsGuidingResponsesTasks();
      expect(ngrTask.isOpen()).toBeTrue();

      answerStats.isAddressed = true;

      taskRegistrarService.onChangeAnswerGroups('Introduction');
      expect(ngrTask.isOpen()).toBeFalse();
    });
  });

  describe('Handling state changes', () => {
    it('should create new obsolete tasks for newly created state', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), new Map(), new Map(), new Map());

      expect(taskRegistrarService.getHighBounceRateTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getIneffectiveFeedbackLoopTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getNeedsGuidingResponsesTasks().length)
        .toEqual(1);
      expect(taskRegistrarService.getSuccessiveIncorrectAnswersTasks().length)
        .toEqual(1);

      taskRegistrarService.onStateAdd('Middle');

      expect(taskRegistrarService.getHighBounceRateTasks().length)
        .toEqual(2);
      expect(taskRegistrarService.getIneffectiveFeedbackLoopTasks().length)
        .toEqual(2);
      expect(taskRegistrarService.getNeedsGuidingResponsesTasks().length)
        .toEqual(2);
      expect(taskRegistrarService.getSuccessiveIncorrectAnswersTasks().length)
        .toEqual(2);
    });

    it('should have an obsolete and retargeted task for states that are ' +
      'renamed', () => {
      statesBackendDict = {
        Introduction: stateBackendDict,
      };
      expStatsBackendDict.num_starts = 500;
      expStatsBackendDict.state_stats_mapping = {
        Introduction: {
          ...stateStatsBackendDict,
          ...{total_hit_count: 500, num_completions: 350},
        },
      };
      const eqPlaythroughsByStateName = (
        new Map([['Introduction', [makeEqPlaythrough()]]]));
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskBackendDict.status = 'open';
      let [hbrTask, iflTask, ngrTask, siaTask] = [
        makeTask<HighBounceRateTask>(
          {...taskBackendDict, ...{task_type: 'high_bounce_rate'}}),
        makeTask<IneffectiveFeedbackLoopTask>(
          {...taskBackendDict, ...{task_type: 'ineffective_feedback_loop'}}),
        makeTask<NeedsGuidingResponsesTask>(
          {...taskBackendDict, ...{task_type: 'needs_guiding_responses'}}),
        makeTask<SuccessiveIncorrectAnswersTask>(
          {...taskBackendDict, ...{task_type: 'successive_incorrect_answers'}}),
      ];
      statesBackendDict = {Introduction: stateBackendDict};

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask],
        new Map(), stateAnswerStats, new Map(), eqPlaythroughsByStateName,
        new Map());

      expect(hbrTask.targetId).toEqual('Introduction');
      expect(hbrTask.isOpen()).toBeTrue();
      expect(iflTask.targetId).toEqual('Introduction');
      expect(iflTask.isOpen()).toBeTrue();
      expect(ngrTask.targetId).toEqual('Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
      expect(siaTask.targetId).toEqual('Introduction');
      expect(siaTask.isOpen()).toBeTrue();

      taskRegistrarService.onStateRename('Introduction', 'Prologue');

      let [
        [oldHbrTask, newHbrTask],
        [oldIflTask, newIflTask],
        [oldNgrTask, newNgrTask],
        [oldSiaTask, newSiaTask],
      ] = [
        taskRegistrarService.getHighBounceRateTasks(),
        taskRegistrarService.getIneffectiveFeedbackLoopTasks(),
        taskRegistrarService.getNeedsGuidingResponsesTasks(),
        taskRegistrarService.getSuccessiveIncorrectAnswersTasks(),
      ];

      expect(oldHbrTask.isObsolete()).toBeTrue();
      expect(oldHbrTask.targetId).toEqual('Introduction');
      expect(oldIflTask.isObsolete()).toBeTrue();
      expect(oldIflTask.targetId).toEqual('Introduction');
      expect(oldNgrTask.isObsolete()).toBeTrue();
      expect(oldNgrTask.targetId).toEqual('Introduction');
      expect(oldSiaTask.isObsolete()).toBeTrue();
      expect(oldSiaTask.targetId).toEqual('Introduction');

      expect(newHbrTask.isOpen()).toBeTrue();
      expect(newHbrTask.targetId).toEqual('Prologue');
      expect(newIflTask.isOpen()).toBeTrue();
      expect(newIflTask.targetId).toEqual('Prologue');
      expect(newNgrTask.isOpen()).toBeTrue();
      expect(newNgrTask.targetId).toEqual('Prologue');
      expect(newSiaTask.isOpen()).toBeTrue();
      expect(newSiaTask.targetId).toEqual('Prologue');
    });

    it('should discard tasks targeting a state that is newly deleted', () => {
      statesBackendDict = {
        Introduction: stateBackendDict,
      };
      expStatsBackendDict.num_starts = 500;
      expStatsBackendDict.state_stats_mapping = {
        Introduction: {
          ...stateStatsBackendDict,
          ...{total_hit_count: 500, num_completions: 350},
        },
      };
      const eqPlaythroughsByStateName = (
        new Map([['Introduction', [makeEqPlaythrough()]]]));
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskBackendDict.status = 'open';
      let [hbrTask, iflTask, ngrTask, siaTask] = [
        makeTask<HighBounceRateTask>(
          {...taskBackendDict, ...{task_type: 'high_bounce_rate'}}),
        makeTask<IneffectiveFeedbackLoopTask>(
          {...taskBackendDict, ...{task_type: 'ineffective_feedback_loop'}}),
        makeTask<NeedsGuidingResponsesTask>(
          {...taskBackendDict, ...{task_type: 'needs_guiding_responses'}}),
        makeTask<SuccessiveIncorrectAnswersTask>(
          {...taskBackendDict, ...{task_type: 'successive_incorrect_answers'}}),
      ];
      statesBackendDict = {Introduction: stateBackendDict};

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask],
        new Map(), stateAnswerStats, new Map(), eqPlaythroughsByStateName,
        new Map());

      expect(hbrTask.targetId).toEqual('Introduction');
      expect(hbrTask.isOpen()).toBeTrue();
      expect(iflTask.targetId).toEqual('Introduction');
      expect(iflTask.isOpen()).toBeTrue();
      expect(ngrTask.targetId).toEqual('Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
      expect(siaTask.targetId).toEqual('Introduction');
      expect(siaTask.isOpen()).toBeTrue();

      taskRegistrarService.onStateDelete('Introduction');

      expect(hbrTask.isOpen()).toBeFalse();
      expect(iflTask.isOpen()).toBeFalse();
      expect(ngrTask.isOpen()).toBeFalse();
      expect(siaTask.isOpen()).toBeFalse();
    });

    it('should open a new NGR task after initialization if an answer becomes ' +
      'unaddressed', () => {
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = true;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), stateAnswerStats, new Map(), new Map(), new Map());

      const [ngrTask] = taskRegistrarService.getNeedsGuidingResponsesTasks();
      expect(ngrTask.isOpen()).toBeFalse();

      answerStats.isAddressed = false;

      taskRegistrarService.onChangeAnswerGroups('Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
    });
  });

  describe('Flushing post-initialization changes', () => {
    it('should return payload of newly created HBR task only after first call',
      () => {
        statesBackendDict = {
          Introduction: stateBackendDict,
        };
        expStatsBackendDict.num_starts = 500;
        expStatsBackendDict.state_stats_mapping = {
          Introduction: {
            ...stateStatsBackendDict,
            ...{total_hit_count: 500, num_completions: 350},
          },
        };
        const eqPlaythroughsByStateName = (
          new Map([['Introduction', [makeEqPlaythrough()]]]));

        taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), new Map(), eqPlaythroughsByStateName,
          new Map());

        expect(taskRegistrarService.flushInitializationChanges().length)
          .toEqual(1);
        expect(taskRegistrarService.flushInitializationChanges().length)
          .toEqual(0);
      });

    it('should return payload of newly discarded HBR task only on first call',
      () => {
        const task = makeTask<HighBounceRateTask>(
          {...taskBackendDict, ...{status: 'open'}});
        statesBackendDict = {
          Introduction: stateBackendDict,
        };
        expStatsBackendDict.num_starts = 500;
        expStatsBackendDict.state_stats_mapping = {
          Introduction: {
            ...stateStatsBackendDict,
            ...{total_hit_count: 500, num_completions: 450},
          },
        };

        taskRegistrarService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [task],
          new Map(), new Map(), new Map(), new Map(), new Map());

        const [hbrTask] = taskRegistrarService.getHighBounceRateTasks();
        expect(hbrTask.isObsolete()).toBeTrue();
        expect(taskRegistrarService.flushInitializationChanges().length)
          .toEqual(1);
        expect(taskRegistrarService.flushInitializationChanges().length)
          .toEqual(0);
      });

    it('should return empty payload when HBR task does not change', () => {
      const task = makeTask<HighBounceRateTask>(
        {...taskBackendDict, ...{status: 'open'}});
      statesBackendDict = {
        Introduction: stateBackendDict,
      };
      expStatsBackendDict.num_starts = 500;
      expStatsBackendDict.state_stats_mapping = {
        Introduction: {
          ...stateStatsBackendDict,
          ...{total_hit_count: 500, num_completions: 350},
        },
      };

      taskRegistrarService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [task],
        new Map(), new Map(), new Map(), new Map(), new Map());

      const [hbrTask] = taskRegistrarService.getHighBounceRateTasks();
      expect(hbrTask.isOpen()).toBeTrue();
      expect(taskRegistrarService.flushInitializationChanges().length)
        .toEqual(0);
    });
  });
});
