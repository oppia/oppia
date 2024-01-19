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

import { AnswerStats, AnswerStatsBackendDict } from
  'domain/exploration/answer-stats.model';
import {
  ExplorationTask,
  ExplorationTaskType,
  ExplorationTaskBackendDict,
  ExplorationTaskModel
} from 'domain/improvements/exploration-task.model';
import { HighBounceRateTask } from
  'domain/improvements/high-bounce-rate-task.model';
import { StateStatsBackendDict } from
  'domain/statistics/state-stats-model';
import { IneffectiveFeedbackLoopTask } from
  'domain/improvements/ineffective-feedback-loop-task.model';
import { NeedsGuidingResponsesTask } from
  'domain/improvements/needs-guiding-response-task.model';
import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/successive-incorrect-answers-task.model';
import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config.model';
import { StateBackendDict } from 'domain/state/StateObjectFactory';
import { ExplorationStats, ExplorationStatsBackendDict } from
  'domain/statistics/exploration-stats.model';
import {
  PlaythroughIssue,
  PlaythroughIssueType,
  PlaythroughIssueBackendDict,
  EarlyQuitCustomizationArgs,
  CyclicStateTransitionsCustomizationArgs,
  MultipleIncorrectSubmissionsCustomizationArgs,
} from 'domain/statistics/playthrough-issue.model';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';


describe('Exploration improvements task registrar service', () => {
  let taskRegistryService: ExplorationImprovementsTaskRegistryService;

  let statesObjectFactory: StatesObjectFactory;

  let answerStatsBackendDict: AnswerStatsBackendDict;
  let cstPlaythroughIssueBackendDict:
    PlaythroughIssueBackendDict;
  let eqPlaythroughIssueBackendDict:
    PlaythroughIssueBackendDict;
  let expStatsBackendDict: ExplorationStatsBackendDict;
  let misPlaythroughIssueBackendDict:
    PlaythroughIssueBackendDict;
  let stateBackendDict: StateBackendDict;
  let stateStatsBackendDict: StateStatsBackendDict;
  let statesBackendDict: {[stateName: string]: StateBackendDict};
  let taskBackendDict: ExplorationTaskBackendDict;
  let config: ExplorationImprovementsConfig;

  const expId = 'eid';
  const expVersion = 1;

  beforeEach(() => {
    taskRegistryService = (
      TestBed.get(ExplorationImprovementsTaskRegistryService));

    statesObjectFactory = TestBed.get(StatesObjectFactory);

    config = new ExplorationImprovementsConfig(
      expId, expVersion, true, 0.25, 0.20, 100);

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
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 },
          catchMisspellings: {
            value: false
          }
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
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
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false
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
      issue_type: PlaythroughIssueType.CyclicStateTransitions,
      issue_customization_args: {
        state_names: {
          value: ['Middle', 'Introduction'],
        },
      } as CyclicStateTransitionsCustomizationArgs,
      playthrough_ids: ['pid'],
      schema_version: 1,
      is_valid: true,
    };

    eqPlaythroughIssueBackendDict = {
      issue_type: PlaythroughIssueType.EarlyQuit,
      issue_customization_args: {
        state_name: {
          value: 'Introduction',
        },
        time_spent_in_exp_in_msecs: {
          value: 1200,
        },
      } as EarlyQuitCustomizationArgs,
      playthrough_ids: ['pid'],
      schema_version: 1,
      is_valid: true,
    };

    misPlaythroughIssueBackendDict = {
      issue_type: PlaythroughIssueType.MultipleIncorrectSubmissions,
      issue_customization_args: {
        state_name: { value: 'Introduction' },
        num_times_answered_incorrectly: {
          value: 3,
        },
      } as MultipleIncorrectSubmissionsCustomizationArgs,
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
      return ExplorationTaskModel.createFromBackendDict(dict) as T;
    });
  const makeStates = (map = statesBackendDict) => {
    return statesObjectFactory.createFromBackendDict(map);
  };
  const makeExpStats = (dict = expStatsBackendDict) => {
    return ExplorationStats.createFromBackendDict(dict);
  };
  const makeAnswerStats = (dict = answerStatsBackendDict) => {
    return AnswerStats.createFromBackendDict(dict);
  };
  const makeCstPlaythroughIssue = (dict = cstPlaythroughIssueBackendDict) => {
    return (
      PlaythroughIssue.createFromBackendDict(dict)
    );
  };
  const makeEqPlaythroughIssue = (dict = eqPlaythroughIssueBackendDict) => {
    return (
      PlaythroughIssue.createFromBackendDict(dict)
    );
  };
  const makeMisPlaythroughIssue = (dict = misPlaythroughIssueBackendDict) => {
    return (
      PlaythroughIssue.createFromBackendDict(dict));
  };

  it('should initialize successfully using default test values', () => {
    expect(
      () => taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(), []))
      .not.toThrowError();
  });

  it('should return exp stats passed to initialization', () => {
    const expStats = makeExpStats();

    taskRegistryService.initialize(
      config, makeStates(), expStats, [], new Map(), new Map(), []);

    expect(taskRegistryService.getExplorationStats()).toBe(expStats);
  });

  describe('Validating initialize arguments', () => {
    it('should throw if stats is for wrong exploration', () => {
      expStatsBackendDict.exp_id = 'wrong_exp_id';
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [], new Map(), new Map(), []))
        .toThrowError(
          'Expected stats for exploration "eid", but got stats for ' +
          'exploration "wrong_exp_id"');
    });

    it('should throw if stats is for wrong exploration version', () => {
      expStatsBackendDict.exp_version = 2;
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [], new Map(), new Map(), []))
        .toThrowError(
          'Expected stats for exploration version 1, but got stats for ' +
          'exploration version 2');
    });

    it('should throw if a task targets an unknown state', () => {
      delete statesBackendDict.End;
      taskBackendDict.target_id = 'End';
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [makeTask()], new Map(),
          new Map(), []))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if a resolved task type targets an unknown state', () => {
      delete statesBackendDict.End;
      const resolvedTaskTypesByStateName = new Map([
        ['End', ['high_bounce_rate'] as ExplorationTaskType[]]
      ]);
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [],
          resolvedTaskTypesByStateName, new Map(), []))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if answer stats maps to an unknown state', () => {
      delete statesBackendDict.End;
      const answerStats = new Map([['End', [makeAnswerStats()]]]);
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [], new Map(), answerStats, []))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if CST playthrough issue maps to an unknown state', () => {
      delete statesBackendDict.End;
      (
        cstPlaythroughIssueBackendDict.issue_customization_args as
         CyclicStateTransitionsCustomizationArgs
      ).state_names.value = ['Introduction', 'End'];
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [], new Map(), new Map(),
          [makeCstPlaythroughIssue()]))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if EQ playthrough issue maps to an unknown state', () => {
      delete statesBackendDict.End;
      (
        eqPlaythroughIssueBackendDict.issue_customization_args as
         EarlyQuitCustomizationArgs
      ).state_name.value = 'End';
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [], new Map(), new Map(),
          [makeEqPlaythroughIssue()]))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if MIS playthrough issue maps to an unknown state', () => {
      delete statesBackendDict.End;
      (
        misPlaythroughIssueBackendDict.issue_customization_args as
        MultipleIncorrectSubmissionsCustomizationArgs
      ).state_name.value = 'End';
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [], new Map(), new Map(),
          [makeMisPlaythroughIssue()]))
        .toThrowError(
          'Unexpected reference to state "End", which does not exist');
    });

    it('should throw if task targets wrong exploration', () => {
      taskBackendDict.entity_id = 'wrong_exp_id';
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [makeTask()], new Map(),
          new Map(), []))
        .toThrowError(
          'Expected task for exploration "eid", but got task for exploration ' +
          '"wrong_exp_id"');
    });

    it('should throw if task targets wrong exploration version', () => {
      taskBackendDict.entity_version = 2;
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [makeTask()], new Map(),
          new Map(), []))
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
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), tasks, new Map(), new Map(),
          []))
        .toThrowError(
          'Found duplicate task of type "high_bounce_rate" targeting state ' +
          '"Introduction"');
    });

    it('should throw if open and resolved tasks with the same type are ' +
      'targeting the same state', () => {
      taskBackendDict.target_id = 'Introduction';
      taskBackendDict.task_type = 'high_bounce_rate';
      const resolvedTaskTypesByStateName = new Map([
        ['Introduction', ['high_bounce_rate'] as ExplorationTaskType[]]
      ]);
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [makeTask()],
          resolvedTaskTypesByStateName, new Map(), []))
        .toThrowError(
          'Found duplicate task of type "high_bounce_rate" targeting state ' +
          '"Introduction"');
    });

    it('should throw if resolved tasks with the same type are targeting the ' +
      'same state', () => {
      const resolvedTaskTypesByStateName = new Map([
        ['Introduction',
          ['high_bounce_rate', 'high_bounce_rate'] as ExplorationTaskType[]
        ],
      ]);
      expect(
        () => taskRegistryService.initialize(
          config, makeStates(), makeExpStats(), [],
          resolvedTaskTypesByStateName, new Map(), []))
        .toThrowError(
          'Found duplicate task of type "high_bounce_rate" targeting state ' +
          '"Introduction"');
    });
  });

  describe('Post-initialization', () => {
    it('should not return a resolved task from the open tasks API', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      const resolvedTaskTypesByStateName = (
        new Map<string, ExplorationTaskType[]>([
          ['Introduction', [
            'high_bounce_rate', 'ineffective_feedback_loop',
            'needs_guiding_responses', 'successive_incorrect_answers',
          ]],
        ]));

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], resolvedTaskTypesByStateName,
        new Map(), []);

      expect(taskRegistryService.getOpenHighBounceRateTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenIneffectiveFeedbackLoopTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenNeedsGuidingResponsesTasks().length)
        .toEqual(0);
      expect(
        taskRegistryService.getOpenSuccessiveIncorrectAnswersTasks().length
      ).toEqual(0);
    });

    it('should return tasks for each state as an array', () => {
      statesBackendDict = {
        Introduction: stateBackendDict,
        Middle: stateBackendDict,
        End: stateBackendDict,
      };

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(), []);

      expect(taskRegistryService.getAllStateTasks().map(st => st.stateName))
        .toEqual(jasmine.arrayContaining(['Introduction', 'Middle', 'End']));
    });

    it('should throw an error when state does not exist', () => {
      statesBackendDict = {
        Introduction: stateBackendDict,
        Middle: stateBackendDict,
        End: stateBackendDict,
      };

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(), []);

      expect(() => taskRegistryService.getStateTasks('Epilogue'))
        .toThrowError('Unknown state with name: Epilogue');
    });

    it('should return tasks for a specific state', () => {
      statesBackendDict = {
        Introduction: stateBackendDict,
        Middle: stateBackendDict,
        End: stateBackendDict,
      };

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(), []);

      expect(taskRegistryService.getStateTasks('Introduction').stateName)
        .toEqual('Introduction');
    });
  });

  describe('Generating new tasks', () => {
    it('should not generate open tasks when they do not exist', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(), []);

      expect(taskRegistryService.getOpenHighBounceRateTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenIneffectiveFeedbackLoopTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenNeedsGuidingResponsesTasks().length)
        .toEqual(0);
      expect(
        taskRegistryService.getOpenSuccessiveIncorrectAnswersTasks().length
      ).toEqual(0);
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

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(),
        [makeEqPlaythroughIssue()]);

      const [hbrTask] = taskRegistryService.getOpenHighBounceRateTasks();
      expect(hbrTask.isOpen()).toBeTrue();
    });

    it('should generate a new ineffective feedback loop task', () => {
      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(),
        [makeCstPlaythroughIssue()]);

      const [iflTask] = (
        taskRegistryService.getOpenIneffectiveFeedbackLoopTasks());
      expect(iflTask.isOpen()).toBeTrue();
    });

    it('should generate a new needs guiding responses task', () => {
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), stateAnswerStats,
        []);

      const [ngrTask] = taskRegistryService.getOpenNeedsGuidingResponsesTasks();
      expect(ngrTask.isOpen()).toBeTrue();
    });

    it('should generate a new successive incorrect answers task', () => {
      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(),
        [makeMisPlaythroughIssue()]);

      const [siaTask] = (
        taskRegistryService.getOpenSuccessiveIncorrectAnswersTasks());
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

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [task], new Map(), new Map(), []);

      expect(taskRegistryService.getOpenHighBounceRateTasks().length)
        .toEqual(0);
    });

    it('should discard an NGR task when all answers are addressed', () => {
      const states = makeStates();
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = false;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskRegistryService.initialize(
        config, states, makeExpStats(), [], new Map(), stateAnswerStats, []);

      const [ngrTask] = taskRegistryService.getOpenNeedsGuidingResponsesTasks();
      expect(ngrTask.isOpen()).toBeTrue();

      answerStats.isAddressed = true;

      taskRegistryService.onStateInteractionSaved(
        states.getState('Introduction'));
      expect(ngrTask.isOpen()).toBeFalse();
    });
  });

  describe('Handling state changes', () => {
    it('should create new obsolete tasks for newly created state', () => {
      statesBackendDict = {Introduction: stateBackendDict};
      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(), [], new Map(), new Map(), []);

      expect(taskRegistryService.getOpenHighBounceRateTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenIneffectiveFeedbackLoopTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenNeedsGuidingResponsesTasks().length)
        .toEqual(0);
      expect(
        taskRegistryService.getOpenSuccessiveIncorrectAnswersTasks().length
      ).toEqual(0);

      taskRegistryService.onStateAdded('Middle');

      expect(taskRegistryService.getOpenHighBounceRateTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenIneffectiveFeedbackLoopTasks().length)
        .toEqual(0);
      expect(taskRegistryService.getOpenNeedsGuidingResponsesTasks().length)
        .toEqual(0);
      expect(
        taskRegistryService.getOpenSuccessiveIncorrectAnswersTasks().length
      ).toEqual(0);
    });

    it('should have an obsolete and re-targeted task for states that are ' +
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

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask], new Map(), stateAnswerStats,
        [makeEqPlaythroughIssue()]);

      expect(hbrTask.targetId).toEqual('Introduction');
      expect(hbrTask.isOpen()).toBeTrue();
      expect(iflTask.targetId).toEqual('Introduction');
      expect(iflTask.isOpen()).toBeTrue();
      expect(ngrTask.targetId).toEqual('Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
      expect(siaTask.targetId).toEqual('Introduction');
      expect(siaTask.isOpen()).toBeTrue();

      taskRegistryService.onStateRenamed('Introduction', 'Prologue');

      let [[newHbrTask], [newIflTask], [newNgrTask], [newSiaTask]] = [
        taskRegistryService.getOpenHighBounceRateTasks(),
        taskRegistryService.getOpenIneffectiveFeedbackLoopTasks(),
        taskRegistryService.getOpenNeedsGuidingResponsesTasks(),
        taskRegistryService.getOpenSuccessiveIncorrectAnswersTasks(),
      ];

      expect(hbrTask.isObsolete()).toBeTrue();
      expect(hbrTask.targetId).toEqual('Introduction');
      expect(iflTask.isObsolete()).toBeTrue();
      expect(iflTask.targetId).toEqual('Introduction');
      expect(ngrTask.isObsolete()).toBeTrue();
      expect(ngrTask.targetId).toEqual('Introduction');
      expect(siaTask.isObsolete()).toBeTrue();
      expect(siaTask.targetId).toEqual('Introduction');

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

      taskRegistryService.initialize(
        config, makeStates(), makeExpStats(),
        [hbrTask, iflTask, ngrTask, siaTask], new Map(), stateAnswerStats,
        [makeEqPlaythroughIssue()]);

      expect(hbrTask.targetId).toEqual('Introduction');
      expect(hbrTask.isOpen()).toBeTrue();
      expect(iflTask.targetId).toEqual('Introduction');
      expect(iflTask.isOpen()).toBeTrue();
      expect(ngrTask.targetId).toEqual('Introduction');
      expect(ngrTask.isOpen()).toBeTrue();
      expect(siaTask.targetId).toEqual('Introduction');
      expect(siaTask.isOpen()).toBeTrue();

      taskRegistryService.onStateDeleted('Introduction');

      expect(hbrTask.isOpen()).toBeFalse();
      expect(iflTask.isOpen()).toBeFalse();
      expect(ngrTask.isOpen()).toBeFalse();
      expect(siaTask.isOpen()).toBeFalse();
    });

    it('should open a new NGR task after initialization if an answer becomes ' +
      'unaddressed', () => {
      const states = makeStates();
      const answerStats = makeAnswerStats();
      answerStats.isAddressed = true;
      const stateAnswerStats = new Map([['Introduction', [answerStats]]]);

      taskRegistryService.initialize(
        config, states, makeExpStats(), [], new Map(), stateAnswerStats, []);

      expect(taskRegistryService.getOpenNeedsGuidingResponsesTasks().length)
        .toEqual(0);

      answerStats.isAddressed = false;

      taskRegistryService.onStateInteractionSaved(
        states.getState('Introduction'));
      expect(taskRegistryService.getOpenNeedsGuidingResponsesTasks().length)
        .toEqual(1);
    });
  });
});
