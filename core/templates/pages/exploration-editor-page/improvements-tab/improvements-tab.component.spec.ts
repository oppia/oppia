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
 * @fileoverview Unit tests for the controller of the 'Completion Graph' used by
 * the improvements tab.
 */

import { fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ExplorationTaskType } from
  'domain/improvements/exploration-task.model';
import { HighBounceRateTask } from
  'domain/improvements/high-bounce-rate-task.model';
import { IneffectiveFeedbackLoopTask } from
  'domain/improvements/ineffective-feedback-loop-task.model';
import { NeedsGuidingResponsesTask } from
  'domain/improvements/needs-guiding-response-task.model';
import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/successive-incorrect-answers-task.model';
import { StateStats } from 'domain/statistics/state-stats-model';
import { ExplorationStats } from
  'domain/statistics/exploration-stats.model';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';

// TODO(#7222): Remove usages of UpgradedServices. Used here because too many
// indirect AngularJS dependencies are required for the improvements tab.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

require(
  'pages/exploration-editor-page/improvements-tab/' +
  'improvements-tab.component.ts');

describe('Improvements tab', function() {
  let $ctrl, $scope, explorationImprovementsService, routerService;

  let taskRegistryService: ExplorationImprovementsTaskRegistryService;
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function(
      $componentController, $rootScope, _ExplorationImprovementsService_,
      _ExplorationImprovementsTaskRegistryService_, _RouterService_) {
    explorationImprovementsService = _ExplorationImprovementsService_;
    routerService = _RouterService_;
    taskRegistryService = _ExplorationImprovementsTaskRegistryService_;

    $scope = $rootScope.$new();
    $ctrl = $componentController('improvementsTab');
  }));

  const emptyStateStats = new StateStats(0, 0, 0, 0, 0, 0);
  const emptyExpStats = new ExplorationStats('id', 1, 0, 0, 0, new Map([
    ['Introduction', emptyStateStats],
  ]));

  beforeEach(() => {
    this.expStatsSpy = spyOn(taskRegistryService, 'getExplorationStats');
    this.hbrTasksSpy = (
      spyOn(taskRegistryService, 'getOpenHighBounceRateTasks'));
    this.iflTasksSpy = (
      spyOn(taskRegistryService, 'getOpenIneffectiveFeedbackLoopTasks'));
    this.ngrTasksSpy = (
      spyOn(taskRegistryService, 'getOpenNeedsGuidingResponsesTasks'));
    this.siaTasksSpy = (
      spyOn(taskRegistryService, 'getOpenSuccessiveIncorrectAnswersTasks'));
    this.stateTasksSpy = spyOn(taskRegistryService, 'getStateTasks');
    this.allStateTasksSpy = spyOn(taskRegistryService, 'getAllStateTasks');

    this.expStatsSpy.and.returnValue(emptyExpStats);
    this.hbrTasksSpy.and.returnValue([]);
    this.iflTasksSpy.and.returnValue([]);
    this.ngrTasksSpy.and.returnValue([]);
    this.siaTasksSpy.and.returnValue([]);
    this.allStateTasksSpy.and.returnValue([]);
  });

  it('should provide the time machine image URL', () => {
    $ctrl.$onInit();

    expect($ctrl.timeMachineImageUrl).toMatch('/icons/time_machine.svg');
  });

  it('should use router service to navigate to state editor', () => {
    const spy = spyOn(routerService, 'navigateToMainTab');
    $ctrl.$onInit();

    $ctrl.navigateToStateEditor('foo');

    expect(spy).toHaveBeenCalledWith('foo');
  });

  describe('Post-initialization', () => {
    const newTaskEntryBackendDict = (
      <T extends ExplorationTaskType>(taskType: T, isOpen: boolean) => ({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: taskType,
        target_type: 'state',
        target_id: 'Introduction',
        status: (isOpen ? 'open' : 'obsolete'),
        issue_description: null,
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      }));

    const newHbrTask = (isOpen = true) => new HighBounceRateTask(
      newTaskEntryBackendDict('high_bounce_rate', isOpen));
    const newIflTask = (isOpen = true) => new IneffectiveFeedbackLoopTask(
      newTaskEntryBackendDict('ineffective_feedback_loop', isOpen));
    const newNgrTask = (isOpen = true) => new NeedsGuidingResponsesTask(
      newTaskEntryBackendDict('needs_guiding_responses', isOpen));
    const newSiaTask = (isOpen = true) => new SuccessiveIncorrectAnswersTask(
      newTaskEntryBackendDict('successive_incorrect_answers', isOpen));

    beforeEach(() => {
      spyOn(explorationImprovementsService, 'isImprovementsTabEnabledAsync')
        .and.returnValue(Promise.resolve(true));
    });

    it('should report the number of exp-level tasks', fakeAsync(() => {
      this.hbrTasksSpy.and.returnValue([newHbrTask()]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.getNumExpLevelTasks()).toEqual(1);
    }));

    it('should report the number of concept-level tasks', fakeAsync(() => {
      this.iflTasksSpy.and.returnValue([newIflTask()]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.getNumConceptLevelTasks()).toEqual(1);
    }));

    it('should report the number of card-level tasks', fakeAsync(() => {
      this.ngrTasksSpy.and.returnValue([newNgrTask()]);
      this.siaTasksSpy.and.returnValue([newSiaTask()]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.getNumCardLevelTasks()).toEqual(2);
    }));

    it('should report the total number of tasks', fakeAsync(() => {
      this.hbrTasksSpy.and.returnValue([newHbrTask()]);
      this.iflTasksSpy.and.returnValue([newIflTask()]);
      this.ngrTasksSpy.and.returnValue([newNgrTask()]);
      this.siaTasksSpy.and.returnValue([newSiaTask()]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.getNumTasks()).toEqual(4);
    }));

    it('should report that critical tasks exist', fakeAsync(() => {
      this.ngrTasksSpy.and.returnValue([newNgrTask()]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.hasCriticalTasks()).toEqual(true);
    }));

    it('should report the completion rate', fakeAsync(() => {
      const numStarts = 100;
      const numCompletions = 60;
      this.expStatsSpy.and.returnValue(
        new ExplorationStats('id', 1, numStarts, 0, numCompletions, new Map()));

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.completionRate).toBeCloseTo(0.6);
      expect($ctrl.completionRateAsPercent).toEqual('60%');
    }));

    it('should provide the correct state retention', fakeAsync(() => {
      const totalHitCount = 100;
      const numCompletions = 60;
      const stateStats = (
        new StateStats(0, 0, totalHitCount, 0, 0, numCompletions));
      this.expStatsSpy.and.returnValue(new ExplorationStats(
        'id', 1, 0, 0, 0, new Map([['Introduction', stateStats]])));
      this.allStateTasksSpy.and.returnValue([
        {
          stateName: 'Introduction',
          ngrTask: newNgrTask(),
          siaTask: newSiaTask(),
          supportingStats: {stateStats},
        }
      ]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.getStateRetentionPercent('Introduction')).toEqual('60%');
    }));

    it('should provide the number of open cards in a state', fakeAsync(() => {
      this.expStatsSpy.and.returnValue(
        new ExplorationStats('id', 1, 0, 0, 0, new Map([
          ['Introduction', emptyStateStats],
          ['End', emptyStateStats],
        ])));
      const stateTasks = {
        Introduction: {
          stateName: 'Introduction',
          ngrTask: newNgrTask(true),
          siaTask: newSiaTask(false),
          supportingStats: {stateStats: emptyStateStats},
        },
        End: {
          stateName: 'End',
          ngrTask: newNgrTask(true),
          siaTask: newSiaTask(true),
          supportingStats: {stateStats: emptyStateStats},
        },
      };
      this.stateTasksSpy.and.callFake(stateName => stateTasks[stateName]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.getNumCardLevelTasksForState('Introduction')).toEqual(1);
      expect($ctrl.getNumCardLevelTasksForState('End')).toEqual(2);
    }));

    it('should toggle the visibility of state tasks', fakeAsync(() => {
      this.expStatsSpy.and.returnValue(
        new ExplorationStats('id', 1, 0, 0, 0, new Map([
          ['Introduction', emptyStateStats],
          ['End', emptyStateStats],
        ])));
      this.allStateTasksSpy.and.returnValue([
        {
          stateName: 'Introduction',
          ngrTask: newNgrTask(),
          siaTask: newSiaTask(),
          supportingStats: {stateStats: emptyStateStats},
        },
        {
          stateName: 'End',
          ngrTask: newNgrTask(),
          siaTask: newSiaTask(),
          supportingStats: {stateStats: emptyStateStats},
        },
      ]);

      $ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect($ctrl.isStateTasksVisible('Introduction')).toBeTrue();
      expect($ctrl.isStateTasksVisible('End')).toBeTrue();

      $ctrl.toggleStateTasks('End');

      expect($ctrl.isStateTasksVisible('Introduction')).toBeTrue();
      expect($ctrl.isStateTasksVisible('End')).toBeFalse();
    }));

    describe('Exploration-health', () => {
      it('should report health as warning if HBR task exists', fakeAsync(() => {
        this.hbrTasksSpy.and.returnValue([newHbrTask()]);

        $ctrl.$onInit();
        flushMicrotasks();
        $scope.$apply();

        expect($ctrl.getExplorationHealth()).toEqual('warning');
      }));

      it('should report heath as warning if only IFL task exists',
        fakeAsync(() => {
          this.iflTasksSpy.and.returnValue([newIflTask()]);

          $ctrl.$onInit();
          flushMicrotasks();
          $scope.$apply();

          expect($ctrl.getExplorationHealth()).toEqual('warning');
        }));

      it('should report heath as critical if NGR task exists',
        fakeAsync(() => {
          this.ngrTasksSpy.and.returnValue([newNgrTask()]);

          $ctrl.$onInit();
          flushMicrotasks();
          $scope.$apply();

          expect($ctrl.getExplorationHealth()).toEqual('critical');
        }));

      it('should report heath as warning if only SIA task exists',
        fakeAsync(() => {
          this.siaTasksSpy.and.returnValue([newSiaTask()]);

          $ctrl.$onInit();
          flushMicrotasks();
          $scope.$apply();

          expect($ctrl.getExplorationHealth()).toEqual('warning');
        }));

      it('should report health as healthy if zero tasks exist',
        fakeAsync(() => {
          $ctrl.$onInit();
          flushMicrotasks();
          $scope.$apply();

          expect($ctrl.getExplorationHealth()).toEqual('healthy');
        }));
    });
  });
});
