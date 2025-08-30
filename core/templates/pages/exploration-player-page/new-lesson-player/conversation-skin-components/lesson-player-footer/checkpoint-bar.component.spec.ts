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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Subscription, Subject} from 'rxjs';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {CheckpointBarComponent} from './checkpoint-bar.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {PlayerTranscriptService} from 'pages/exploration-player-page/services/player-transcript.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PageContextService} from 'services/page-context.service';
import {CheckpointProgressService} from 'pages/exploration-player-page/services/checkpoint-progress.service';
import {TranslateService} from '@ngx-translate/core';

class MockTranslateService {
  get(key: string): string {
    return key;
  }
}

class MockReadOnlyExplorationBackendApiService {
  fetchExplorationAsync = jasmine
    .createSpy('fetchExplorationAsync')
    .and.returnValue(
      Promise.resolve({
        exploration: {
          states: {
            state1: {card_is_checkpoint: true},
            state2: {card_is_checkpoint: false},
            state3: {card_is_checkpoint: true},
            state4: {card_is_checkpoint: true},
          },
        },
      } as FetchExplorationBackendResponse)
    );
}

class MockExplorationEngineService {
  getState = jasmine.createSpy('getState').and.returnValue({name: 'testState'});
  getStateCardByName = jasmine.createSpy('getStateCardByName').and.returnValue({
    isTerminal: jasmine.createSpy('isTerminal').and.returnValue(false),
  });
}

class MockPlayerPositionService {
  private activeCardChangedSubject = new Subject<void>();
  private newCardOpenedSubject = new Subject<void>();

  get onActiveCardChanged() {
    return this.activeCardChangedSubject.asObservable();
  }

  get onNewCardOpened() {
    return this.newCardOpenedSubject.asObservable();
  }

  getDisplayedCardIndex = jasmine
    .createSpy('getDisplayedCardIndex')
    .and.returnValue(0);

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
    .and.returnValue(Promise.resolve(3));
  getMostRecentlyReachedCheckpointIndex = jasmine
    .createSpy('getMostRecentlyReachedCheckpointIndex')
    .and.returnValue(2);
}

describe('CheckpointBarComponent', () => {
  let component: CheckpointBarComponent;
  let fixture: ComponentFixture<CheckpointBarComponent>;
  let mockReadOnlyExplorationBackendApiService: MockReadOnlyExplorationBackendApiService;
  let mockExplorationEngineService: MockExplorationEngineService;
  let mockPlayerPositionService: MockPlayerPositionService;
  let mockPageContextService: MockPageContextService;
  let mockCheckpointProgressService: MockCheckpointProgressService;

  beforeEach(async () => {
    mockReadOnlyExplorationBackendApiService =
      new MockReadOnlyExplorationBackendApiService();
    mockExplorationEngineService = new MockExplorationEngineService();
    mockPlayerPositionService = new MockPlayerPositionService();
    mockPageContextService = new MockPageContextService();
    mockCheckpointProgressService = new MockCheckpointProgressService();

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CheckpointBarComponent, MockTranslatePipe],
      providers: [
        {
          provide: ReadOnlyExplorationBackendApiService,
          useValue: mockReadOnlyExplorationBackendApiService,
        },
        {
          provide: ExplorationEngineService,
          useValue: mockExplorationEngineService,
        },
        {
          provide: PlayerTranscriptService,
          useValue: {},
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

  it('should initialize exploration id and fetch checkpoint count on init', fakeAsync(() => {
    spyOn(component, 'updateLessonProgressBar');

    component.ngOnInit();
    tick();

    expect(component.explorationId).toBe('exp123');
    expect(
      mockCheckpointProgressService.fetchCheckpointCount
    ).toHaveBeenCalled();
    expect(component.checkpointCount).toBe(3);
    expect(component.updateLessonProgressBar).toHaveBeenCalled();
  }));

  it('should subscribe to active card changed events', () => {
    spyOn(component, 'updateLessonProgressBar');

    component.ngOnInit();
    mockPlayerPositionService.emitActiveCardChanged();

    expect(component.updateLessonProgressBar).toHaveBeenCalled();
  });

  it('should subscribe to new card opened events', () => {
    spyOn(component, 'updateLessonProgressBar');

    component.ngOnInit();
    mockPlayerPositionService.emitNewCardOpened();

    expect(component.updateLessonProgressBar).toHaveBeenCalled();
  });

  it('should calculate completed progress bar width correctly', () => {
    component.checkpointCount = 5;
    component.completedCheckpointsCount = 3;

    const spaceBetweenEachNode = 100 / (component.checkpointCount - 1);
    const expectedWidth =
      (component.completedCheckpointsCount - 1) * spaceBetweenEachNode +
      spaceBetweenEachNode / 2;

    expect(component.getCompletedProgressBarWidth()).toBe(expectedWidth);
  });

  it('should return 0 width when no checkpoints are completed', () => {
    component.completedCheckpointsCount = 0;

    expect(component.getCompletedProgressBarWidth()).toBe(0);
  });

  it('should return correct progress percentage for complete progress', () => {
    component.completedCheckpointsCount = 5;
    component.checkpointCount = 5;

    expect(component.getProgressPercentage()).toBe('100');
  });

  it('should return correct progress percentage for zero progress', () => {
    component.completedCheckpointsCount = 0;
    component.checkpointCount = 5;

    expect(component.getProgressPercentage()).toBe('0');
  });

  it('should return correct progress percentage for partial progress', () => {
    component.completedCheckpointsCount = 3;
    component.checkpointCount = 5;

    const progressPercentage = Math.floor((3 / 5) * 100);
    expect(component.getProgressPercentage()).toBe(
      progressPercentage.toString()
    );
  });

  it('should update lesson progress bar when exploration has not ended', () => {
    component.expEnded = false;
    component.checkpointCount = 4;
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      3
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);

    component.updateLessonProgressBar();

    expect(component.completedCheckpointsCount).toBe(2);
    expect(component.checkpointStatusArray.length).toBe(4);
    expect(component.checkpointStatusArray[0]).toBe('completed');
    expect(component.checkpointStatusArray[1]).toBe('completed');
    expect(component.checkpointStatusArray[2]).toBe('in-progress');
    expect(component.checkpointStatusArray[3]).toBe('incomplete');
  });

  it('should mark exploration as ended when current state is terminal', () => {
    component.expEnded = false;
    component.checkpointCount = 3;
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      2
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(1);
    mockExplorationEngineService.getState.and.returnValue({
      name: 'terminalState',
    });
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(true),
    });

    component.updateLessonProgressBar();

    expect(component.expEnded).toBe(true);
    expect(component.completedCheckpointsCount).toBe(2);
  });

  it('should not update progress when exploration has ended', () => {
    component.expEnded = true;
    component.checkpointCount = 3;
    component.completedCheckpointsCount = 2;

    component.updateLessonProgressBar();

    expect(component.completedCheckpointsCount).toBe(2);
    expect(component.checkpointStatusArray.length).toBe(3);
  });

  it('should create checkpoint status array with all completed when all checkpoints are done', () => {
    component.expEnded = false;
    component.checkpointCount = 3;
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      4
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);

    component.updateLessonProgressBar();

    expect(component.checkpointStatusArray.length).toBe(3);
    expect(component.completedCheckpointsCount).toBe(3);
    expect(component.checkpointStatusArray[0]).toBe('completed');
    expect(component.checkpointStatusArray[1]).toBe('completed');
    expect(component.checkpointStatusArray[2]).toBe('completed');
  });

  it('should handle case where displayed card index is 0', () => {
    component.expEnded = false;
    component.checkpointCount = 3;
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      2
    );
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);

    component.updateLessonProgressBar();

    expect(mockExplorationEngineService.getState).not.toHaveBeenCalled();
    expect(component.completedCheckpointsCount).toBe(1);
  });

  it('should fetch checkpoint count from backend and set it correctly', fakeAsync(() => {
    component.explorationId = 'test-exp';

    component.getCheckpointCount();
    tick();

    expect(
      mockReadOnlyExplorationBackendApiService.fetchExplorationAsync
    ).toHaveBeenCalledWith('test-exp', null);
    expect(component.checkpointCount).toBe(3);
  }));

  it('should unsubscribe from all subscriptions on destroy', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should initialize directiveSubscriptions as new Subscription', () => {
    expect(component.directiveSubscriptions).toBeInstanceOf(Subscription);
  });

  it('should initialize checkpointStatusArray property', () => {
    component.checkpointCount = 3;
    component.completedCheckpointsCount = 1;

    component.updateLessonProgressBar();

    expect(component.checkpointStatusArray).toBeDefined();
    expect(Array.isArray(component.checkpointStatusArray)).toBe(true);
  });

  it('should handle edge case where checkpoint count is 1', () => {
    component.checkpointCount = 1;
    component.completedCheckpointsCount = 0;

    const width = component.getCompletedProgressBarWidth();
    expect(width).toBe(0);

    component.completedCheckpointsCount = 1;
    const percentage = component.getProgressPercentage();
    expect(percentage).toBe('100');
  });
});
