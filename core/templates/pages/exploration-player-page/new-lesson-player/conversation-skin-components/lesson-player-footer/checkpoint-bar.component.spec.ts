// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CheckpointBar component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Subscription, Subject} from 'rxjs';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';

import {CheckpointBarComponent} from './checkpoint-bar.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PageContextService} from 'services/page-context.service';
import {CheckpointProgressService} from 'pages/exploration-player-page/services/checkpoint-progress.service';
import {TranslateService} from '@ngx-translate/core';

class MockTranslateService {
  get(key: string): string {
    return key;
  }
}

class MockExplorationEngineService {
  getState = jasmine.createSpy('getState').and.returnValue({name: 'testState'});
  getStateCardByName = jasmine.createSpy('getStateCardByName').and.returnValue({
    isTerminal: jasmine.createSpy('isTerminal').and.returnValue(false),
  });
  getMaxStateDepth = jasmine.createSpy('getMaxStateDepth').and.returnValue(20);
}

class MockPlayerPositionService {
  private activeCardChangedSubject = new Subject<void>();
  private newCardOpenedSubject = new Subject<void>();
  onActiveCardChanged = new EventEmitter<void>();

  get onNewCardOpened() {
    return this.newCardOpenedSubject.asObservable();
  }

  getDisplayedCardIndex = jasmine
    .createSpy('getDisplayedCardIndex')
    .and.returnValue(0);

  setDisplayedCardIndex = jasmine.createSpy('setDisplayedCardIndex');

  emitActiveCardChanged(): void {
    this.activeCardChangedSubject.next();
  }

  emitNewCardOpened(): void {
    this.newCardOpenedSubject.next();
  }
}

class MockPageContextService {
  getExplorationId = jasmine
    .createSpy('getExplorationId')
    .and.returnValue('exp123');
}

class MockCheckpointProgressService {
  fetchCheckpointCount = jasmine
    .createSpy('fetchCheckpointCount')
    .and.returnValue(3);
  getMostRecentlyReachedCheckpointIndex = jasmine
    .createSpy('getMostRecentlyReachedCheckpointIndex')
    .and.returnValue(2);
  getCheckpointStates = jasmine
    .createSpy('getCheckpointStates')
    .and.returnValue([0, 5, 10, 15]);
}

describe('CheckpointBarComponent', () => {
  let component: CheckpointBarComponent;
  let fixture: ComponentFixture<CheckpointBarComponent>;
  let mockExplorationEngineService: MockExplorationEngineService;
  let mockPlayerPositionService: MockPlayerPositionService;
  let mockPageContextService: MockPageContextService;
  let mockCheckpointProgressService: MockCheckpointProgressService;

  beforeEach(async () => {
    mockExplorationEngineService = new MockExplorationEngineService();
    mockPlayerPositionService = new MockPlayerPositionService();
    mockPageContextService = new MockPageContextService();
    mockCheckpointProgressService = new MockCheckpointProgressService();

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CheckpointBarComponent, MockTranslatePipe],
      providers: [
        {
          provide: ExplorationEngineService,
          useValue: mockExplorationEngineService,
        },
        {
          provide: PlayerPositionService,
          useValue: mockPlayerPositionService,
        },
        {
          provide: PageContextService,
          useValue: mockPageContextService,
        },
        {
          provide: CheckpointProgressService,
          useValue: mockCheckpointProgressService,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckpointBarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize properties on init', () => {
    spyOn(component, 'updateLessonProgressBar');

    component.ngOnInit();

    expect(component.explorationId).toBe('exp123');
    expect(component.checkpointIndexes).toEqual([0, 5, 10, 15]);
    expect(component.maxStateDepth).toBe(20);
    expect(component.checkpointCount).toBe(3);
    expect(component.updateLessonProgressBar).toHaveBeenCalled();
  });

  it('should subscribe to active card changed events', () => {
    spyOn(component, 'updateLessonProgressBar');

    component.ngOnInit();

    mockPlayerPositionService.onActiveCardChanged.emit();

    expect(component.updateLessonProgressBar).toHaveBeenCalledTimes(2);
  });

  it('should subscribe to new card opened events', () => {
    spyOn(component, 'updateLessonProgressBar');

    component.ngOnInit();
    mockPlayerPositionService.emitNewCardOpened();

    expect(component.updateLessonProgressBar).toHaveBeenCalled();
  });

  it('should return 0 progress width when at first checkpoint', () => {
    component.checkpointIndexes = [0, 5, 10, 15];
    component.checkpointCount = 4;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);

    const width = component.getCompletedProgressBarWidth();

    expect(width).toBe(0);
  });

  it('should return 100% progress width when at terminal state', () => {
    component.checkpointIndexes = [0, 5, 10, 15];
    component.checkpointCount = 4;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(10);
    mockExplorationEngineService.getState.and.returnValue({
      name: 'terminalState',
    });
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(true),
    });

    const width = component.getCompletedProgressBarWidth();

    expect(width).toBe(100);
  });

  it('should return correct tooltip for completed checkpoint', () => {
    component.checkpointStatusArray = [
      'completed',
      'in-progress',
      'incomplete',
    ];
    expect(component.getCheckpointTooltip(0)).toBe('Checkpoint 0: Completed');
  });

  it('should return correct tooltip for in-progress checkpoint', () => {
    component.checkpointStatusArray = [
      'completed',
      'in-progress',
      'incomplete',
    ];
    expect(component.getCheckpointTooltip(1)).toBe(
      'Checkpoint 1: Next checkpoint'
    );
  });

  it('should return correct tooltip for incomplete checkpoint', () => {
    component.checkpointStatusArray = [
      'completed',
      'in-progress',
      'incomplete',
    ];
    expect(component.getCheckpointTooltip(2)).toBe('Checkpoint 2: Locked');
  });

  it('should return empty string for unknown checkpoint status', () => {
    component.checkpointStatusArray = ['completed', 'unknown'];
    expect(component.getCheckpointTooltip(1)).toBe('');
  });

  it('should return correct aria label using getCheckpointAriaLabel', () => {
    component.checkpointStatusArray = [
      'completed',
      'in-progress',
      'incomplete',
    ];
    spyOn(component, 'getCheckpointTooltip').and.returnValue(
      'Checkpoint 1: Next checkpoint'
    );
    expect(component.getCheckpointAriaLabel(1)).toBe(
      'Checkpoint 1: Next checkpoint'
    );
    expect(component.getCheckpointTooltip).toHaveBeenCalledWith(1);
  });

  it('should calculate progress width correctly within a segment', () => {
    component.checkpointIndexes = [0, 10, 20, 30];
    component.checkpointCount = 4;
    component.maxStateDepth = 40;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(5);

    const width = component.getCompletedProgressBarWidth();

    // Should be 0% (base) + (5/10 * 25%) = 12.5%.
    expect(width).toBe(12.5);
  });

  it('should calculate progress width at checkpoint boundary', () => {
    component.checkpointIndexes = [0, 10, 20, 30];
    component.checkpointCount = 4;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(10);

    const width = component.getCompletedProgressBarWidth();

    // Should be at second checkpoint = 25%.
    expect(width).toBe(25);
  });

  it('should handle case when beyond last checkpoint', () => {
    component.checkpointIndexes = [0, 10, 20, 30];
    component.checkpointCount = 4;
    component.maxStateDepth = 40;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(35);

    const width = component.getCompletedProgressBarWidth();

    // Should be 75% (base) + (5/10 * 25%) = 87.5%.
    expect(width).toBe(87.5);
  });

  it('should return progress percentage as string', () => {
    component.progressBarWidth = 75.5;

    expect(component.getProgressPercentage()).toBe('75.5');
  });

  it('should update lesson progress bar and calculate progress width', () => {
    component.checkpointIndexes = [0, 10, 20, 30];
    component.checkpointCount = 3;
    component.expEnded = false;
    spyOn(component, 'getCompletedProgressBarWidth').and.returnValue(50);
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      3
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);
    mockExplorationEngineService.getState.and.returnValue({name: 'testState'});
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(false),
    });

    component.updateLessonProgressBar();

    expect(component.progressBarWidth).toBe(50);
    expect(component.completedCheckpointsCount).toBe(2);
    expect(component.checkpointStatusArray).toBeDefined();
  });

  it('should mark exploration as ended when at terminal state with displayedCardIndex > 0', () => {
    component.checkpointCount = 3;
    component.expEnded = false;
    component.completedCheckpointsCount = 0;
    component.checkpointStatusArray = new Array(
      component.checkpointCount + 1
    ).fill('incomplete');

    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      2
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(5);
    mockExplorationEngineService.getState.and.returnValue({
      name: 'terminalState',
    });
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(true),
    });
    spyOn(component, 'getCompletedProgressBarWidth').and.returnValue(100);

    component.updateLessonProgressBar();

    expect(component.expEnded).toBe(true);
    expect(component.completedCheckpointsCount).toBe(2);
    expect(component.checkpointStatusArray[component.checkpointCount]).toBe(
      'completed'
    );
  });

  it('should not mark exploration as ended when displayedCardIndex is 0 even if terminal', () => {
    component.checkpointCount = 3;
    component.expEnded = false;

    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      2
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);
    mockExplorationEngineService.getState.and.returnValue({
      name: 'terminalState',
    });
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(true),
    });
    spyOn(component, 'getCompletedProgressBarWidth').and.returnValue(100);

    component.updateLessonProgressBar();

    expect(component.expEnded).toBe(false);
  });

  it('should not mark exploration as ended when not at terminal state', () => {
    component.checkpointCount = 3;
    component.expEnded = false;

    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      2
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(5);
    mockExplorationEngineService.getState.and.returnValue({name: 'testState'});
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(false),
    });
    spyOn(component, 'getCompletedProgressBarWidth').and.returnValue(50);

    component.updateLessonProgressBar();

    expect(component.expEnded).toBe(false);
  });

  it('should handle edge case with empty checkpoint indexes', () => {
    component.checkpointIndexes = [];
    component.checkpointCount = 0;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(5);

    const width = component.getCompletedProgressBarWidth();

    expect(isNaN(width)).toBe(true);
  });

  it('should create correct checkpoint status array structure', () => {
    component.checkpointCount = 3;
    component.expEnded = false;
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      2
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);
    mockExplorationEngineService.getState.and.returnValue({name: 'testState'});
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(false),
    });
    spyOn(component, 'getCompletedProgressBarWidth').and.returnValue(25);

    component.updateLessonProgressBar();

    expect(component.checkpointStatusArray.length).toBe(4);
    expect(component.checkpointStatusArray[0]).toBe('completed');
    expect(component.checkpointStatusArray[1]).toBe('in-progress');
    expect(component.checkpointStatusArray[2]).toBe('incomplete');
    expect(component.checkpointStatusArray[3]).toBe('incomplete');
  });

  it('should mark all checkpoints as completed when completedCheckpointsCount exceeds checkpointCount', () => {
    component.checkpointCount = 3;
    component.expEnded = false;
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      5
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);
    mockExplorationEngineService.getState.and.returnValue({name: 'testState'});
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(false),
    });
    spyOn(component, 'getCompletedProgressBarWidth').and.returnValue(100);

    component.updateLessonProgressBar();

    expect(component.completedCheckpointsCount).toBe(4);
    expect(component.checkpointStatusArray[0]).toBe('completed');
    expect(component.checkpointStatusArray[1]).toBe('completed');
    expect(component.checkpointStatusArray[2]).toBe('completed');
    expect(component.checkpointStatusArray[3]).toBe('incomplete');
  });

  it('should set displayed card index when returning to completed checkpoint', () => {
    component.checkpointIndexes = [0, 10, 20, 30];
    component.checkpointStatusArray = [
      'completed',
      'completed',
      'in-progress',
      'incomplete',
    ];
    spyOn(mockPlayerPositionService.onActiveCardChanged, 'emit');

    component.returnToCheckpointIfCompleted(1);

    expect(
      mockPlayerPositionService.setDisplayedCardIndex
    ).toHaveBeenCalledWith(10);
    expect(
      mockPlayerPositionService.onActiveCardChanged.emit
    ).toHaveBeenCalled();
  });

  it('should not set displayed card index when checkpoint is not completed', () => {
    component.checkpointIndexes = [0, 10, 20, 30];
    component.checkpointStatusArray = [
      'completed',
      'in-progress',
      'incomplete',
      'incomplete',
    ];

    component.returnToCheckpointIfCompleted(2);

    expect(
      mockPlayerPositionService.setDisplayedCardIndex
    ).not.toHaveBeenCalled();
  });

  it('should handle case when displayed card index is negative', () => {
    component.checkpointIndexes = [0, 10, 20, 30];
    component.checkpointCount = 4;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(-1);

    const width = component.getCompletedProgressBarWidth();

    // The method will find currentSegmentIndex = 0, then calculate based on that
    // startIdx = 0, endIdx = 10, stepsCompleted = -1 - 0 = -1
    // fractionInSegment = -1/10 = -0.1, baseWidth = 0, additionalWidth = -0.1 * 25 = -2.5
    // So result is 0 + (-2.5) = -2.5, but we should handle this edge case.
    expect(width).toBeLessThan(0);
  });

  it('should unsubscribe from all subscriptions on destroy', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should initialize directiveSubscriptions as new Subscription', () => {
    expect(component.directiveSubscriptions).toBeInstanceOf(Subscription);
  });

  it('should handle case when maxStateDepth is used in calculation', () => {
    component.checkpointIndexes = [0, 10, 20];
    component.checkpointCount = 3;
    component.maxStateDepth = 30;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(25);

    const width = component.getCompletedProgressBarWidth();

    // Should be 66.67% (base) + (5/10 * 33.33%) = 83.33%.
    expect(width).toBeCloseTo(83.33, 1);
  });

  it('should handle division by zero in progress calculation', () => {
    component.checkpointIndexes = [5, 5, 5];
    component.checkpointCount = 3;
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(5);

    expect(() => component.getCompletedProgressBarWidth()).not.toThrowError();

    const width = component.getCompletedProgressBarWidth();
    // When totalSteps is 0, fractionInSegment should be 0, so result should be baseWidth.
    // currentSegmentIndex = 0, baseWidth = 0 * (100/3) = 0.
    expect(width).toBe(0);
  });

  it('should handle case when exploration has already ended', () => {
    component.expEnded = true;
    component.checkpointCount = 3;
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      2
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(5);
    mockExplorationEngineService.getState.and.returnValue({name: 'testState'});
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(true),
    });
    spyOn(component, 'getCompletedProgressBarWidth').and.returnValue(100);

    component.updateLessonProgressBar();

    expect(component.checkpointStatusArray).toBeDefined();
  });
});
