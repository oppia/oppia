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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ImprovementsTabComponent } from './improvements-tab.component';
import { ExplorationTaskType } from 'domain/improvements/exploration-task.model';
import { HighBounceRateTask } from 'domain/improvements/high-bounce-rate-task.model';
import { IneffectiveFeedbackLoopTask } from 'domain/improvements/ineffective-feedback-loop-task.model';
import { NeedsGuidingResponsesTask } from 'domain/improvements/needs-guiding-response-task.model';
import { SuccessiveIncorrectAnswersTask } from 'domain/improvements/successive-incorrect-answers-task.model';
import { StateStats } from 'domain/statistics/state-stats-model';
import { ExplorationStats } from 'domain/statistics/exploration-stats.model';
import { ExplorationImprovementsTaskRegistryService } from 'services/exploration-improvements-task-registry.service';
import { ExplorationImprovementsService } from 'services/exploration-improvements.service';
import { RouterService } from '../services/router.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('Improvements tab', () => {
  let component: ImprovementsTabComponent;
  let fixture: ComponentFixture<ImprovementsTabComponent>;
  let explorationImprovementsService: ExplorationImprovementsService;
  let routerService: RouterService;
  let taskRegistryService: ExplorationImprovementsTaskRegistryService;
  let expStatsSpy;
  let hbrTasksSpy;
  let iflTasksSpy;
  let ngrTasksSpy;
  let siaTasksSpy;
  let stateTasksSpy;
  let allStateTasksSpy;

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve()
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [
        ImprovementsTabComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  const emptyStateStats = new StateStats(0, 0, 0, 0, 0, 0);
  const emptyExpStats = new ExplorationStats('id', 1, 0, 0, 0, new Map([
    ['Introduction', emptyStateStats],
  ]));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImprovementsTabComponent);
    component = fixture.componentInstance;

    routerService = TestBed.inject(RouterService);
    taskRegistryService = TestBed.inject(
      ExplorationImprovementsTaskRegistryService);
    explorationImprovementsService = TestBed.inject(
      ExplorationImprovementsService
    );

    expStatsSpy = spyOn(taskRegistryService, 'getExplorationStats');
    hbrTasksSpy = (
      spyOn(taskRegistryService, 'getOpenHighBounceRateTasks'));
    iflTasksSpy = (
      spyOn(taskRegistryService, 'getOpenIneffectiveFeedbackLoopTasks'));
    ngrTasksSpy = (
      spyOn(taskRegistryService, 'getOpenNeedsGuidingResponsesTasks'));
    siaTasksSpy = (
      spyOn(taskRegistryService, 'getOpenSuccessiveIncorrectAnswersTasks'));
    stateTasksSpy = spyOn(taskRegistryService, 'getStateTasks');
    allStateTasksSpy = spyOn(taskRegistryService, 'getAllStateTasks');

    expStatsSpy.and.returnValue(emptyExpStats);
    hbrTasksSpy.and.returnValue([]);
    iflTasksSpy.and.returnValue([]);
    ngrTasksSpy.and.returnValue([]);
    siaTasksSpy.and.returnValue([]);
    allStateTasksSpy.and.returnValue([]);
  });

  it('should provide the time machine image URL', () => {
    component.ngOnInit();

    expect(component.timeMachineImageUrl).toMatch('/icons/time_machine.svg');
  });

  it('should use router service to navigate to state editor', () => {
    const spy = spyOn(routerService, 'navigateToMainTab');
    component.ngOnInit();

    component.navigateToStateEditor('foo');

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
      hbrTasksSpy.and.returnValue([newHbrTask()]);

      component.ngOnInit();
      flushMicrotasks();

      expect(component.getNumExpLevelTasks()).toEqual(1);
    }));

    it('should report the number of concept-level tasks', fakeAsync(() => {
      iflTasksSpy.and.returnValue([newIflTask()]);

      component.ngOnInit();
      flushMicrotasks();

      expect(component.getNumConceptLevelTasks()).toEqual(1);
    }));

    it('should report the number of card-level tasks', fakeAsync(() => {
      ngrTasksSpy.and.returnValue([newNgrTask()]);
      siaTasksSpy.and.returnValue([newSiaTask()]);

      component.ngOnInit();
      flushMicrotasks();

      expect(component.getNumCardLevelTasks()).toEqual(2);
    }));

    it('should report the total number of tasks', fakeAsync(() => {
      hbrTasksSpy.and.returnValue([newHbrTask()]);
      iflTasksSpy.and.returnValue([newIflTask()]);
      ngrTasksSpy.and.returnValue([newNgrTask()]);
      siaTasksSpy.and.returnValue([newSiaTask()]);

      component.ngOnInit();
      flushMicrotasks();

      expect(component.getNumTasks()).toEqual(4);
    }));

    it('should report that critical tasks exist', fakeAsync(() => {
      ngrTasksSpy.and.returnValue([newNgrTask()]);

      component.ngOnInit();
      flushMicrotasks();

      expect(component.hasCriticalTasks()).toEqual(true);
    }));

    it('should report the completion rate', fakeAsync(() => {
      const numStarts = 100;
      const numCompletions = 60;
      expStatsSpy.and.returnValue(
        new ExplorationStats('id', 1, numStarts, 0, numCompletions, new Map()));

      component.ngOnInit();
      flushMicrotasks();

      expect(component.completionRate).toBeCloseTo(0.6);
      expect(component.completionRateAsPercent).toEqual('60%');
    }));

    it('should provide the correct state retention', fakeAsync(() => {
      const totalHitCount = 100;
      const numCompletions = 60;
      const stateStats = (
        new StateStats(0, 0, totalHitCount, 0, 0, numCompletions));
      expStatsSpy.and.returnValue(new ExplorationStats(
        'id', 1, 0, 0, 0, new Map([['Introduction', stateStats]])));
      allStateTasksSpy.and.returnValue([
        {
          stateName: 'Introduction',
          ngrTask: newNgrTask(),
          siaTask: newSiaTask(),
          supportingStats: {stateStats},
        }
      ]);

      component.ngOnInit();
      flushMicrotasks();

      expect(component.getStateRetentionPercent('Introduction')).toEqual('60%');
    }));

    it('should provide the number of open cards in a state', fakeAsync(() => {
      expStatsSpy.and.returnValue(
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
      stateTasksSpy.and.callFake(stateName => stateTasks[stateName]);

      component.ngOnInit();
      flushMicrotasks();

      expect(component.getNumCardLevelTasksForState('Introduction')).toEqual(1);
      expect(component.getNumCardLevelTasksForState('End')).toEqual(2);
    }));

    it('should toggle the visibility of state tasks', fakeAsync(() => {
      expStatsSpy.and.returnValue(
        new ExplorationStats('id', 1, 0, 0, 0, new Map([
          ['Introduction', emptyStateStats],
          ['End', emptyStateStats],
        ])));
      allStateTasksSpy.and.returnValue([
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

      component.ngOnInit();
      flushMicrotasks();

      expect(component.isStateTasksVisible('Introduction')).toBeTrue();
      expect(component.isStateTasksVisible('End')).toBeTrue();

      component.toggleStateTasks('End');

      expect(component.isStateTasksVisible('Introduction')).toBeTrue();
      expect(component.isStateTasksVisible('End')).toBeFalse();
    }));

    describe('Exploration-health', () => {
      it('should report health as warning if HBR task exists', fakeAsync(() => {
        hbrTasksSpy.and.returnValue([newHbrTask()]);

        component.ngOnInit();
        flushMicrotasks();

        expect(component.getExplorationHealth()).toEqual('warning');
      }));

      it('should report heath as warning if only IFL task exists',
        fakeAsync(() => {
          iflTasksSpy.and.returnValue([newIflTask()]);

          component.ngOnInit();
          flushMicrotasks();

          expect(component.getExplorationHealth()).toEqual('warning');
        }));

      it('should report heath as critical if NGR task exists',
        fakeAsync(() => {
          ngrTasksSpy.and.returnValue([newNgrTask()]);

          component.ngOnInit();
          flushMicrotasks();

          expect(component.getExplorationHealth()).toEqual('critical');
        }));

      it('should report heath as warning if only SIA task exists',
        fakeAsync(() => {
          siaTasksSpy.and.returnValue([newSiaTask()]);

          component.ngOnInit();
          flushMicrotasks();

          expect(component.getExplorationHealth()).toEqual('warning');
        }));

      it('should report health as healthy if zero tasks exist',
        fakeAsync(() => {
          component.ngOnInit();
          flushMicrotasks();

          expect(component.getExplorationHealth()).toEqual('healthy');
        }));
    });
  });
});
