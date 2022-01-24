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

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { AnswerStats } from 'domain/exploration/answer-stats.model';
import { StateObjectsBackendDict } from
  'domain/exploration/StatesObjectFactory';
import { ExplorationPermissions } from
  'domain/exploration/exploration-permissions.model';
import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config.model';
import { HighBounceRateTask } from
  'domain/improvements/high-bounce-rate-task.model';
import { StateBackendDict } from 'domain/state/StateObjectFactory';
import { ExplorationStats } from
  'domain/statistics/exploration-stats.model';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { StateStats } from 'domain/statistics/state-stats-model';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { ContextService } from 'services/context.service';
import {
  ExplorationImprovementsBackendApiService, ExplorationImprovementsResponse
} from 'services/exploration-improvements-backend-api.service';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { PlaythroughIssuesBackendApiService } from
  'services/playthrough-issues-backend-api.service';
import { StateTopAnswersStatsService } from
  'services/state-top-answers-stats.service';

// TODO(#7222): Remove usage of UpgradedServices once upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ChangeListService } from 'pages/exploration-editor-page/services/change-list.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

/**
 * @fileoverview Tests for ExplorationImprovementsService.
 */

describe('ExplorationImprovementsService', function() {
  let explorationImprovementsService;

  let $uibModal;
  let ngbModal: NgbModal = null;
  let changeListService: ChangeListService;
  let explorationStatesService;
  let explorationRightsService;

  let explorationImprovementsTaskRegistryService:
    ExplorationImprovementsTaskRegistryService;
  let explorationStatsService: ExplorationStatsService;
  let playthroughObjectFactory: PlaythroughObjectFactory;
  let playthroughIssuesBackendApiService: PlaythroughIssuesBackendApiService;
  let stateTopAnswersStatsService: StateTopAnswersStatsService;
  let contextService: ContextService;
  let explorationImprovementsBackendApiService:
    ExplorationImprovementsBackendApiService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;

  const expId = 'eid';
  const expVersion = 1;
  const stateName = 'Introduction';
  const stateBackendDict: StateBackendDict = {
    classifier_model_id: null,
    content: {
      content_id: 'content',
      html: '',
    },
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {},
        default_outcome: {},
      },
    },
    interaction: {
      answer_groups: [],
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: '',
          },
        },
        rows: { value: 1 },
      },
      default_outcome: {
        dest: 'new state',
        feedback: {
          content_id: 'default_outcome',
          html: '',
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
          html: '<p>This is an explanation.</p>',
        },
      },
      id: 'TextInput',
    },
    linked_skill_id: null,
    next_content_id_index: 0,
    param_changes: [],
    solicit_answer_details: false,
    card_is_checkpoint: false,
    written_translations: {
      translations_mapping: {
        content: {},
        default_outcome: {},
      },
    },
  };
  const statesBackendDict: StateObjectsBackendDict = {
    [stateName]: stateBackendDict,
    End: stateBackendDict,
  };

  const newExpImprovementsConfig = (improvementsTabIsEnabled: boolean) => {
    return new ExplorationImprovementsConfig(
      expId, expVersion, improvementsTabIsEnabled, 0.25, 0.20, 100);
  };

  const newExpPermissions = (canEdit: boolean) => {
    return (
      new ExplorationPermissions(
        null, null, null, null, null, null, canEdit, null));
  };

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChangeListService
      ]
    });
  });

  beforeEach(angular.mock.inject($injector => {
    $uibModal = $injector.get('$uibModal');
    ngbModal = $injector.get('NgbModal');
    contextService = $injector.get('ContextService');
    explorationImprovementsBackendApiService = (
      $injector.get('ExplorationImprovementsBackendApiService'));
    explorationImprovementsService = (
      $injector.get('ExplorationImprovementsService'));
    explorationImprovementsTaskRegistryService = (
      $injector.get('ExplorationImprovementsTaskRegistryService'));
    explorationRightsService = $injector.get('ExplorationRightsService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    explorationStatsService = $injector.get('ExplorationStatsService');
    playthroughIssuesBackendApiService = (
      $injector.get('PlaythroughIssuesBackendApiService'));
    playthroughObjectFactory = $injector.get('PlaythroughObjectFactory');
    stateTopAnswersStatsService = $injector.get('StateTopAnswersStatsService');
    userExplorationPermissionsService = (
      $injector.get('UserExplorationPermissionsService'));
  }));

  beforeEach(() => {
    changeListService = TestBed.inject(ChangeListService);
    spyOn(contextService, 'getExplorationId').and.returnValue(expId);

    this.eibasGetTasksAsyncSpy = (
      spyOn(explorationImprovementsBackendApiService, 'getTasksAsync'));
    this.essGetExplorationStatsSpy = (
      spyOn(explorationStatsService, 'getExplorationStatsAsync'));
    this.pibasFetchIssuesSpy = (
      spyOn(playthroughIssuesBackendApiService, 'fetchIssuesAsync'));
    this.stassGetTopAnswersByStateNameAsyncSpy = (
      spyOn(stateTopAnswersStatsService, 'getTopAnswersByStateNameAsync'));

    this.eibasGetTasksAsyncSpy.and.returnValue(Promise.resolve(
      new ExplorationImprovementsResponse([], new Map())));
    this.essGetExplorationStatsSpy.and.returnValue(Promise.resolve(
      new ExplorationStats(expId, expVersion, 0, 0, 0, new Map())));
    this.pibasFetchIssuesSpy.and.returnValue(Promise.resolve(
      []));
    this.stassGetTopAnswersByStateNameAsyncSpy.and.returnValue(Promise.resolve(
      new Map()));

    explorationStatesService.init(statesBackendDict);
  });

  it('should enable improvements tab based on back-end response',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(true)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeTrue();
    }));

  it('should disable improvements tab based on back-end response',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(false)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should disable improvements tab for private explorations',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(false);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(true)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should disable improvements tab for non-editors when config gives false',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(false)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(false)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should disable improvements tab for non-editors when config gives true',
    fakeAsync(async() => {
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(false)));
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(true)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();

      expect(
        await explorationImprovementsService.isImprovementsTabEnabledAsync()
      ).toBeFalse();
    }));

  it('should propagate errors from the back-end', fakeAsync(async() => {
    const error = new Error('Whoops!');
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
      .and.throwError(error);

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure', reason => {
      expect(reason).toBe(error);
    });

    const promise = explorationImprovementsService.initAsync()
      .then(onSuccess, onFailure);
    flushMicrotasks();
    await promise;
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();
  }));

  describe('Flushing updated tasks', () => {
    beforeEach(() => {
      this.eibasPostTasksAsyncSpy = (
        spyOn(explorationImprovementsBackendApiService, 'postTasksAsync'));
      this.eibasGetConfigAsyncSpy = (
        spyOn(explorationImprovementsBackendApiService, 'getConfigAsync'));

      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));
      this.eibasGetConfigAsyncSpy.and.returnValue(Promise.resolve(
        newExpImprovementsConfig(true)));
    });

    it('should do nothing when flush is attempted while the improvements ' +
      'tab is disabled', fakeAsync(() => {
      this.eibasGetConfigAsyncSpy.and.returnValue(Promise.resolve(
        newExpImprovementsConfig(false)));

      explorationImprovementsService.initAsync();
      expect(
        async() => (
          await explorationImprovementsService.flushUpdatedTasksToBackend()))
        .not.toThrowError();

      flushMicrotasks();
    }));

    it('should post new high bounce rate tasks', fakeAsync(async() => {
      // Set-up the conditions to generate an HBR task:
      // -   A state demonstrating a high bounce-rate (determined by config).
      const numStarts = 100;
      const numCompletions = 60;
      // Bounce-rate is 40% because only 40% of starts led to a completion.
      const expStats = new ExplorationStats(
        expId, expVersion, numStarts, numStarts, numCompletions, new Map([
          [stateName, new StateStats(0, 0, numStarts, 0, 0, numCompletions)],
          ['End', new StateStats(0, 0, numStarts, 0, 0, numCompletions)],
        ]));
      this.essGetExplorationStatsSpy.and.returnValue(Promise.resolve(expStats));
      // -   A state with an early-quit playthrough associated to it.
      const eqPlaythrough = (
        playthroughObjectFactory.createNewEarlyQuitPlaythrough(
          expId, expVersion, {
            state_name: {value: stateName},
            time_spent_in_exp_in_msecs: {value: 1000},
          }, []));
      this.pibasFetchIssuesSpy.and.returnValue(Promise.resolve(
        [eqPlaythrough]));

      // The newly open HBR tasks should be flushed to the back-end.
      this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
        expect(tasks.length).toEqual(1);
        expect(tasks[0].taskType).toEqual('high_bounce_rate');
      });

      explorationImprovementsService.initAsync();
      let p = explorationImprovementsService.flushUpdatedTasksToBackend();
      flushMicrotasks();
      await p;

      expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();

      // Each newly opened HBR task is flushed once and only once.
      this.eibasPostTasksAsyncSpy.calls.reset();
      this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
        expect(tasks.length).toEqual(0);
      });

      p = explorationImprovementsService.flushUpdatedTasksToBackend();
      flushMicrotasks();
      await p;

      expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();
    }));

    it('should post obsolete high bounce rate tasks', fakeAsync(async() => {
      // Set-up the conditions to obsolete an HBR task:
      // -   A state demonstrating a low bounce-rate.
      const numStarts = 100;
      const numCompletions = 100;
      // Bounce-rate is 0% because every start led to a completion.
      const expStats = new ExplorationStats(
        expId, expVersion, numStarts, numStarts, numCompletions, new Map([
          [stateName, new StateStats(0, 0, numStarts, 0, 0, numCompletions)],
          ['End', new StateStats(0, 0, numStarts, 0, 0, numCompletions)],
        ]));
      this.essGetExplorationStatsSpy.and.returnValue(Promise.resolve(expStats));

      // Mock a preexisting open HBR task provided by the back-end.
      const hbrTask = HighBounceRateTask.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: expId,
        entity_version: expVersion,
        task_type: 'high_bounce_rate',
        target_type: 'state',
        target_id: stateName,
        status: 'open',
        issue_description: null,
        resolved_on_msecs: null,
        resolver_username: null,
        resolver_profile_picture_data_url: null,
      });
      this.eibasGetTasksAsyncSpy.and.returnValue(Promise.resolve(
        new ExplorationImprovementsResponse([hbrTask], new Map())));

      // The HBR task should no longer be open.
      let p = explorationImprovementsService.initAsync();
      flushMicrotasks();
      await p;

      expect(hbrTask.isOpen()).toBeFalse();
      expect(
        explorationImprovementsTaskRegistryService.getOpenHighBounceRateTasks()
          .length)
        .toEqual(0);

      // The HBR task should be flushed.
      this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
        expect(tasks).toEqual([hbrTask]);
      });

      p = explorationImprovementsService.flushUpdatedTasksToBackend();
      flushMicrotasks();
      await p;

      expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();

      // The HBR task should not be flushed again.
      this.eibasPostTasksAsyncSpy.calls.reset();
      this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
        expect(tasks).toEqual([]);
      });

      p = explorationImprovementsService.flushUpdatedTasksToBackend();
      flushMicrotasks();
      await p;

      expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();
    }));

    it('should post new NGR tasks after they are resolved', fakeAsync(
      async() => {
      // Set-up the conditions to generate an NGR task:
      // -   A high-frequency unaddressed answer.
        const answerStats = new AnswerStats('foo', 'foo', 100, false);
        this.stassGetTopAnswersByStateNameAsyncSpy.and.returnValue(
          Promise.resolve(new Map([[stateName, [answerStats]]])));
        const expStats = new ExplorationStats(
          expId, expVersion, 0, 0, 0,
          new Map([[stateName, new StateStats(0, 0, 0, 0, 0, 0)]]));
        this.essGetExplorationStatsSpy.and.returnValue(
          Promise.resolve(expStats));

        // Initialize the service, this should generate a new NGR task.
        let p = explorationImprovementsService.initAsync();
        flushMicrotasks();
        await p;

        const [ngrTask] = (
          explorationImprovementsTaskRegistryService
            .getOpenNeedsGuidingResponsesTasks());
        expect(ngrTask).toBeDefined();
        expect(ngrTask.targetId).toEqual(stateName);

        // There should be no tasks to flush, because the NGR task is still
        // open.
        this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
          expect(tasks).toEqual([]);
        });

        p = explorationImprovementsService.flushUpdatedTasksToBackend();
        flushMicrotasks();
        await p;
        expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();

        // Once the NGR task is resolved, however, it should get flushed.
        answerStats.isAddressed = true;
        explorationImprovementsTaskRegistryService
          .onStateInteractionSaved(
            explorationStatesService.getState(stateName));
        expect(ngrTask.isResolved()).toBeTrue();

        this.eibasPostTasksAsyncSpy.calls.reset();
        this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
          expect(tasks).toEqual([ngrTask]);
        });

        p = explorationImprovementsService.flushUpdatedTasksToBackend();
        flushMicrotasks();
        await p;

        expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();

        // The NGR task should be flushed once and only once.
        this.eibasPostTasksAsyncSpy.calls.reset();
        this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
          expect(tasks).toEqual([]);
        });

        p = explorationImprovementsService.flushUpdatedTasksToBackend();
        flushMicrotasks();
        await p;

        expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();
      }));

    it('should not store post-init NGR tasks', fakeAsync(async() => {
      // An NGR task will not be generated because all answers are addressed.
      const answerStats = new AnswerStats('foo', 'foo', 100, true);
      this.stassGetTopAnswersByStateNameAsyncSpy.and.returnValue(
        Promise.resolve(new Map([[stateName, [answerStats]]])));

      // Initialize the service. This should not generate a new NGR task.
      let p = explorationImprovementsService.initAsync();
      flushMicrotasks();
      await p;

      expect(
        explorationImprovementsTaskRegistryService
          .getOpenNeedsGuidingResponsesTasks().length)
        .toEqual(0);

      // After making answer unaddressed, a new NGR task should be generated.
      answerStats.isAddressed = false;
      explorationImprovementsTaskRegistryService
        .onStateInteractionSaved(explorationStatesService.getState(stateName));
      const [ngrTask] = (
        explorationImprovementsTaskRegistryService
          .getOpenNeedsGuidingResponsesTasks());
      expect(ngrTask).toBeDefined();

      // Even after resolving the new task.
      answerStats.isAddressed = true;
      explorationImprovementsTaskRegistryService
        .onStateInteractionSaved(explorationStatesService.getState(stateName));
      expect(ngrTask.isResolved()).toBeTrue();

      // It should not be flushed because it wasn't created by initAsync().
      this.eibasPostTasksAsyncSpy.and.callFake(async(_, tasks) => {
        expect(tasks).toEqual([]);
      });

      p = explorationImprovementsService.flushUpdatedTasksToBackend();
      flushMicrotasks();
      await p;

      expect(this.eibasPostTasksAsyncSpy).toHaveBeenCalled();
    }));
  });

  describe('Registering callbacks for state changes', () => {
    beforeEach(fakeAsync(() => {
      spyOn($uibModal, 'open').and.returnValue({result: Promise.resolve()});
      spyOn(changeListService, 'addState').and.stub();
      spyOn(changeListService, 'deleteState').and.stub();
      spyOn(changeListService, 'editStateProperty').and.stub();
      spyOn(changeListService, 'renameState').and.stub();
      spyOn(explorationImprovementsBackendApiService, 'getConfigAsync')
        .and.returnValue(Promise.resolve(newExpImprovementsConfig(true)));
      spyOn(explorationRightsService, 'isPublic').and.returnValue(true);
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve(newExpPermissions(true)));

      explorationImprovementsService.initAsync();
      flushMicrotasks();
    }));

    it('should respond to state additions', fakeAsync(() => {
      let onStateAddedSpy = (
        spyOn(explorationImprovementsTaskRegistryService, 'onStateAdded'));

      explorationStatesService.addState('Prologue');
      flushMicrotasks();

      expect(onStateAddedSpy).toHaveBeenCalledWith('Prologue');
    }));

    it('should respond to state deletions', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.resolve()
        } as NgbModalRef);
      });
      let onStateDeletedSpy = (
        spyOn(explorationImprovementsTaskRegistryService, 'onStateDeleted'));

      explorationStatesService.deleteState('End');
      flushMicrotasks();

      expect(onStateDeletedSpy).toHaveBeenCalledWith('End');
    }));

    it('should respond to state renames', fakeAsync(() => {
      let onStateRenamedSpy = (
        spyOn(explorationImprovementsTaskRegistryService, 'onStateRenamed'));

      explorationStatesService.renameState('Introduction', 'Start');
      flushMicrotasks();

      expect(onStateRenamedSpy).toHaveBeenCalledWith('Introduction', 'Start');
    }));

    it('should respond to state interaction changes', fakeAsync(() => {
      let onStateInteractionSavedSpy = spyOn(
        explorationImprovementsTaskRegistryService, 'onStateInteractionSaved');

      explorationStatesService.saveInteractionAnswerGroups('Introduction', []);
      flushMicrotasks();

      expect(onStateInteractionSavedSpy).toHaveBeenCalledWith(
        explorationStatesService.getState('Introduction'));
    }));
  });
});
