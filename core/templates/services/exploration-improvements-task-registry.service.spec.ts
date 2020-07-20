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
 * @fileoverview Unit tests for the ExplorationImprovementsTaskRegistryService.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerStatsObjectFactory, AnswerStatsBackendDict } from
  'domain/exploration/AnswerStatsObjectFactory';
import {
  CyclicStateTransitionsPlaythroughIssue,
  EarlyQuitPlaythroughIssue,
  ICyclicStateTransitionsPlaythroughIssueBackendDict,
  IEarlyQuitPlaythroughIssueBackendDict,
  IMultipleIncorrectSubmissionsPlaythroughIssueBackendDict,
  MultipleIncorrectSubmissionsPlaythroughIssue,
  PlaythroughIssueObjectFactory,
} from 'domain/statistics/PlaythroughIssueObjectFactory';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { ExplorationStatsObjectFactory, IExplorationStatsBackendDict } from
  'domain/statistics/ExplorationStatsObjectFactory';
import {
  ExplorationTask,
  ExplorationTaskType,
  ExplorationTaskBackendDict,
  ExplorationTaskObjectFactory,
} from 'domain/improvements/ExplorationTaskObjectFactory';
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
  let explorationImprovementsTaskRegistryService:
    ExplorationImprovementsTaskRegistryService;

  let answerStatsObjectFactory: AnswerStatsObjectFactory;
  let explorationStatsObjectFactory: ExplorationStatsObjectFactory;
  let explorationTaskObjectFactory: ExplorationTaskObjectFactory;
  let playthroughIssueObjectFactory: PlaythroughIssueObjectFactory;
  let statesObjectFactory: StatesObjectFactory;

  let answerStatsBackendDict: AnswerStatsBackendDict;
  let cstPlaythroughIssueBackendDict:
    ICyclicStateTransitionsPlaythroughIssueBackendDict;
  let eqPlaythroughIssueBackendDict:
    IEarlyQuitPlaythroughIssueBackendDict;
  let expStatsBackendDict: IExplorationStatsBackendDict;
  let misPlaythroughIssueBackendDict:
    IMultipleIncorrectSubmissionsPlaythroughIssueBackendDict;
  let stateBackendDict: IStateBackendDict;
  let stateStatsBackendDict: IStateStatsBackendDict;
  let statesBackendDict: {[stateName: string]: IStateBackendDict};
  let taskBackendDict: ExplorationTaskBackendDict;

  const expId = 'eid';
  const expVersion = 1;

  beforeEach(() => {
    explorationImprovementsTaskRegistryService = (
      TestBed.get(ExplorationImprovementsTaskRegistryService));

    answerStatsObjectFactory = TestBed.get(AnswerStatsObjectFactory);
    explorationStatsObjectFactory = TestBed.get(ExplorationStatsObjectFactory);
    explorationTaskObjectFactory = TestBed.get(ExplorationTaskObjectFactory);
    playthroughIssueObjectFactory = TestBed.get(PlaythroughIssueObjectFactory);
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
      next_content_id_index: 0,
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

    cstPlaythroughIssueBackendDict = {
      issue_type: 'CyclicStateTransitions',
      issue_customization_args: {
        state_names: {
          value: ['Middle', 'Introduction']
        }
      },
      playthrough_ids: ['pid'],
      schema_version: 1,
      is_valid: true,
    };

    eqPlaythroughIssueBackendDict = {
      issue_type: 'EarlyQuit',
      issue_customization_args: {
        state_name: {
          value: 'Introduction'
        },
        time_spent_in_exp_in_msecs: {
          value: 1200
        }
      },
      playthrough_ids: ['pid'],
      schema_version: 1,
      is_valid: true,
    };

    misPlaythroughIssueBackendDict = {
      issue_type: 'MultipleIncorrectSubmissions',
      issue_customization_args: {
        state_name: { value: 'Introduction' },
        num_times_answered_incorrectly: { value: 3 },
      },
      playthrough_ids: ['pid'],
      schema_version: 1,
      is_valid: true,
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
  const makeCstPlaythroughIssue = (dict = cstPlaythroughIssueBackendDict) => {
    return <CyclicStateTransitionsPlaythroughIssue> (
      playthroughIssueObjectFactory.createFromBackendDict(dict));
  };
  const makeEqPlaythroughIssue = (dict = eqPlaythroughIssueBackendDict) => {
    return <EarlyQuitPlaythroughIssue> (
      playthroughIssueObjectFactory.createFromBackendDict(dict));
  };
  const makeMisPlaythroughIssue = (dict = misPlaythroughIssueBackendDict) => {
    return <MultipleIncorrectSubmissionsPlaythroughIssue> (
      playthroughIssueObjectFactory.createFromBackendDict(dict));
  };

  it('should initialize successfully using default test values', () => {
    expect(
      () => explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), []))
      .not.toThrowError();
  });

  describe('Validating initialize arguments', () => {
    it('should throw if stats is for wrong exploration', () => {
      const expId = 'eid';
      expStatsBackendDict.exp_id = 'wrong_exp_id';
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), []))
        .toThrowError(
          'Expected stats for exploration "eid", but got stats for ' +
          'exploration "wrong_exp_id"');
    });

    it('should throw if stats is for wrong exploration version', () => {
      const expVersion = 1;
      expStatsBackendDict.exp_version = 2;
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), []))
        .toThrowError(
          'Expected stats for exploration version 1, but got stats for ' +
          'exploration version 2');
    });

    it('should throw if a task targets an unknown state', () => {
      delete statesBackendDict.End;
      taskBackendDict.target_id = 'End';
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          new Map(), new Map(), []))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if a resolved task type targets an unknown state', () => {
      delete statesBackendDict.End;
      const resolvedTaskTypesByStateName = new Map([
        ['End', <ExplorationTaskType[]> ['high_bounce_rate']]
      ]);
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          resolvedTaskTypesByStateName, new Map(), []))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if answer stats maps to an unknown state', () => {
      delete statesBackendDict.End;
      const answerStats = new Map([['End', [makeAnswerStats()]]]);
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), answerStats, []))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if CST playthrough issue maps to an unknown state', () => {
      delete statesBackendDict.End;
      cstPlaythroughIssueBackendDict.issue_customization_args
        .state_names.value = ['Introduction', 'End'];
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), [makeCstPlaythroughIssue()]))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if EQ playthrough issue maps to an unknown state', () => {
      delete statesBackendDict.End;
      eqPlaythroughIssueBackendDict.issue_customization_args
        .state_name.value = 'End';
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), [makeEqPlaythroughIssue()]))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if MIS playthrough issue maps to an unknown state', () => {
      delete statesBackendDict.End;
      misPlaythroughIssueBackendDict.issue_customization_args
        .state_name.value = 'End';
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          new Map(), new Map(), [makeMisPlaythroughIssue()]))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if task targets wrong exploration', () => {
      const expId = 'eid';
      taskBackendDict.entity_id = 'wrong_exp_id';
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          new Map(), new Map(), []))
        .toThrowError(
          'Expected task for exploration "eid", but got task for exploration ' +
          '"wrong_exp_id"');
    });

    it('should throw if task targets wrong exploration version', () => {
      const expVersion = 1;
      taskBackendDict.entity_version = 2;
      expect(
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          new Map(), new Map(), []))
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
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), tasks,
          new Map(), new Map(), []))
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
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [makeTask()],
          resolvedTaskTypesByStateName, new Map(), []))
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
        () => explorationImprovementsTaskRegistryService.initialize(
          expId, expVersion, makeStates(), makeExpStats(), [],
          resolvedTaskTypesByStateName, new Map(), []))
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

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(statesBackendDict), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask],
        new Map(), new Map(), []);

      expect(
        explorationImprovementsTaskRegistryService
          .getHighBounceRateTasks())
        .toEqual([hbrTask]);
      expect(
        explorationImprovementsTaskRegistryService
          .getIneffectiveFeedbackLoopTasks())
        .toEqual([iflTask]);
      expect(
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks())
        .toEqual([ngrTask]);
      expect(
        explorationImprovementsTaskRegistryService
          .getSuccessiveIncorrectAnswersTasks())
        .toEqual([siaTask]);
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

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        resolvedTaskTypesByStateName, new Map(), []);

      expect(
        explorationImprovementsTaskRegistryService
          .getHighBounceRateTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getIneffectiveFeedbackLoopTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getSuccessiveIncorrectAnswersTasks().length)
        .toEqual(1);
    });

    it('should return the supporting stats of a registered task', () => {
      const task = makeTask<HighBounceRateTask>(
        {...taskBackendDict, ...{status: 'open'}});
      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [task],
        new Map(), new Map(), []);

      expect(
        explorationImprovementsTaskRegistryService.getSupportingStateStats(task)
      ).toBeDefined();
    });

    it('should throw an error when fetching the supporting stats of an ' +
      'unregistered task', () => {
      delete statesBackendDict.End;
      const task = makeTask<HighBounceRateTask>(
        {...taskBackendDict, ...{target_id: 'End'}});
      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), []);

      expect(() => (
        explorationImprovementsTaskRegistryService.getSupportingStateStats(task)
      )).toThrowError('Unregistered task has no supporting stats');
    });
  });

  describe('Generating new tasks', () => {
    it('should generate obsolete tasks when no tasks exist yet', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), []);

      expect(
        explorationImprovementsTaskRegistryService
          .getHighBounceRateTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getIneffectiveFeedbackLoopTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getSuccessiveIncorrectAnswersTasks().length)
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

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), [makeEqPlaythroughIssue()]);

      const [hbrTask] = (
        explorationImprovementsTaskRegistryService.getHighBounceRateTasks());
      expect(hbrTask.isOpen()).toBeTrue();
    });

    it('should generate a new ineffective feedback loop task', () => {
      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), [makeCstPlaythroughIssue()]);

      const [iflTask] = (
        explorationImprovementsTaskRegistryService
          .getIneffectiveFeedbackLoopTasks());
      expect(iflTask.isOpen()).toBeTrue();
    });

    it('should generate a new needs guiding responses task', () => {
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), stateAnswerStats, []);

      const [ngrTask] = (
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks());
      expect(ngrTask.isOpen()).toBeTrue();
    });

    it('should generate a new successive incorrect answers task', () => {
      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), [makeMisPlaythroughIssue()]);

      const [siaTask] = (
        explorationImprovementsTaskRegistryService
          .getSuccessiveIncorrectAnswersTasks());
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

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [task],
        new Map(), new Map(), []);

      const [hbrTask] = (
        explorationImprovementsTaskRegistryService.getHighBounceRateTasks());
      expect(hbrTask.isObsolete()).toBeTrue();
    });

    it('should discard an NGR task when all answers are addressed', () => {
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), stateAnswerStats, []);

      const [ngrTask] = (
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks());
      expect(ngrTask.isOpen()).toBeTrue();

      answerStats.isAddressed = true;

      explorationImprovementsTaskRegistryService.onChangeInteraction(
        'Introduction');
      expect(ngrTask.isOpen()).toBeFalse();
    });
  });

  describe('Handling state changes', () => {
    it('should create new obsolete tasks for newly created state', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), new Map(), []);

      expect(
        explorationImprovementsTaskRegistryService
          .getHighBounceRateTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getIneffectiveFeedbackLoopTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks().length)
        .toEqual(1);
      expect(
        explorationImprovementsTaskRegistryService
          .getSuccessiveIncorrectAnswersTasks().length)
        .toEqual(1);

      explorationImprovementsTaskRegistryService.onStateAdd('Middle');

      expect(
        explorationImprovementsTaskRegistryService
          .getHighBounceRateTasks().length)
        .toEqual(2);
      expect(
        explorationImprovementsTaskRegistryService
          .getIneffectiveFeedbackLoopTasks().length)
        .toEqual(2);
      expect(
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks().length)
        .toEqual(2);
      expect(
        explorationImprovementsTaskRegistryService
          .getSuccessiveIncorrectAnswersTasks().length)
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

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask],
        new Map(), stateAnswerStats, [makeEqPlaythroughIssue()]);

      expect(hbrTask.targetId).toEqual('Introduction');
      expect(hbrTask.isOpen()).toBeTrue();
      expect(iflTask.targetId).toEqual('Introduction');
      expect(iflTask.isOpen()).toBeTrue();
      expect(ngrTask.targetId).toEqual('Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
      expect(siaTask.targetId).toEqual('Introduction');
      expect(siaTask.isOpen()).toBeTrue();

      explorationImprovementsTaskRegistryService.onStateRename(
        'Introduction', 'Prologue');

      let [
        [oldHbrTask, newHbrTask],
        [oldIflTask, newIflTask],
        [oldNgrTask, newNgrTask],
        [oldSiaTask, newSiaTask],
      ] = [
        explorationImprovementsTaskRegistryService
          .getHighBounceRateTasks(),
        explorationImprovementsTaskRegistryService
          .getIneffectiveFeedbackLoopTasks(),
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks(),
        explorationImprovementsTaskRegistryService
          .getSuccessiveIncorrectAnswersTasks(),
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

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask],
        new Map(), stateAnswerStats, [makeEqPlaythroughIssue()]);

      expect(hbrTask.targetId).toEqual('Introduction');
      expect(hbrTask.isOpen()).toBeTrue();
      expect(iflTask.targetId).toEqual('Introduction');
      expect(iflTask.isOpen()).toBeTrue();
      expect(ngrTask.targetId).toEqual('Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
      expect(siaTask.targetId).toEqual('Introduction');
      expect(siaTask.isOpen()).toBeTrue();

      explorationImprovementsTaskRegistryService.onStateDelete('Introduction');

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

      explorationImprovementsTaskRegistryService.initialize(
        expId, expVersion, makeStates(), makeExpStats(), [],
        new Map(), stateAnswerStats, []);

      const [ngrTask] = (
        explorationImprovementsTaskRegistryService
          .getNeedsGuidingResponsesTasks());
      expect(ngrTask.isOpen()).toBeFalse();

      answerStats.isAddressed = false;

      explorationImprovementsTaskRegistryService.onChangeInteraction(
        'Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
    });
  });
});
