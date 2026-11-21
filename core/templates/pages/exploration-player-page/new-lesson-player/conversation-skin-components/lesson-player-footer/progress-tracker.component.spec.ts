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
 * @fileoverview Unit tests for ProgressTrackerComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Subject} from 'rxjs';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';

import {ProgressTrackerComponent} from './progress-tracker.component';
import {NewProgressReminderModalComponent} from './new-progress-reminder-modal.component';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {UrlService} from 'services/contextual/url.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {CheckpointProgressService} from 'pages/exploration-player-page/services/checkpoint-progress.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';

class MockNgbModal {
  open = jasmine.createSpy('open').and.returnValue({
    componentInstance: {
      checkpointCount: 0,
      completedCheckpointsCount: 0,
      explorationTitle: '',
    },
    result: Promise.resolve(),
  });
}

class MockUrlService {
  getExplorationVersionFromUrl = jasmine
    .createSpy('getExplorationVersionFromUrl')
    .and.returnValue(null);
  getPidFromUrl = jasmine.createSpy('getPidFromUrl').and.returnValue(null);
  getOrigin = jasmine
    .createSpy('getOrigin')
    .and.returnValue('http://localhost');
}

class MockPlayerPositionService {
  private loadedMostRecentCheckpointSubject = new Subject<void>();

  get onLoadedMostRecentCheckpoint() {
    return this.loadedMostRecentCheckpointSubject.asObservable();
  }

  getDisplayedCardIndex = jasmine
    .createSpy('getDisplayedCardIndex')
    .and.returnValue(0);

  emitLoadedMostRecentCheckpoint(): void {
    this.loadedMostRecentCheckpointSubject.next();
  }
}

class MockCheckpointProgressService {
  fetchCheckpointCount = jasmine
    .createSpy('fetchCheckpointCount')
    .and.returnValue(5);
  getMostRecentlyReachedCheckpointIndex = jasmine
    .createSpy('getMostRecentlyReachedCheckpointIndex')
    .and.returnValue(3);
}

class MockConversationFlowService {
  onShowProgressModal = new EventEmitter<void>();
}

class MockExplorationEngineService {
  getState = jasmine.createSpy('getState').and.returnValue({name: 'state1'});
  getStateCardByName = jasmine.createSpy('getStateCardByName').and.returnValue({
    isTerminal: jasmine.createSpy('isTerminal').and.returnValue(false),
  });
}

class MockEditableExplorationBackendApiService {
  resetExplorationProgressAsync = jasmine
    .createSpy('resetExplorationProgressAsync')
    .and.returnValue(Promise.resolve());
}

class MockPageContextService {
  getExplorationId = jasmine
    .createSpy('getExplorationId')
    .and.returnValue('exp1');
}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
      reload: jasmine.createSpy('reload'),
    },
  };
}

class MockReadOnlyExplorationBackendApiService {
  fetchExplorationAsync = jasmine
    .createSpy('fetchExplorationAsync')
    .and.returnValue(
      Promise.resolve({
        exploration: {
          title: 'Mock Exploration Title',
        },
      })
    );
}

describe('ProgressTrackerComponent', () => {
  let component: ProgressTrackerComponent;
  let fixture: ComponentFixture<ProgressTrackerComponent>;

  let mockNgbModal: MockNgbModal;
  let mockUrlService: MockUrlService;
  let mockPlayerPositionService: MockPlayerPositionService;
  let mockCheckpointProgressService: MockCheckpointProgressService;
  let mockConversationFlowService: MockConversationFlowService;
  let mockExplorationEngineService: MockExplorationEngineService;
  let mockEditableExplorationBackendApiService: MockEditableExplorationBackendApiService;
  let mockPageContextService: MockPageContextService;
  let mockWindowRef: MockWindowRef;
  let mockReadOnlyExplorationBackendApiService: MockReadOnlyExplorationBackendApiService;

  beforeEach(async () => {
    mockNgbModal = new MockNgbModal();
    mockUrlService = new MockUrlService();
    mockPlayerPositionService = new MockPlayerPositionService();
    mockCheckpointProgressService = new MockCheckpointProgressService();
    mockConversationFlowService = new MockConversationFlowService();
    mockExplorationEngineService = new MockExplorationEngineService();
    mockEditableExplorationBackendApiService =
      new MockEditableExplorationBackendApiService();
    mockPageContextService = new MockPageContextService();
    mockWindowRef = new MockWindowRef();
    mockReadOnlyExplorationBackendApiService =
      new MockReadOnlyExplorationBackendApiService();

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ProgressTrackerComponent],
      providers: [
        {provide: NgbModal, useValue: mockNgbModal},
        {provide: UrlService, useValue: mockUrlService},
        {provide: PlayerPositionService, useValue: mockPlayerPositionService},
        {
          provide: CheckpointProgressService,
          useValue: mockCheckpointProgressService,
        },
        {
          provide: ConversationFlowService,
          useValue: mockConversationFlowService,
        },
        {
          provide: ExplorationEngineService,
          useValue: mockExplorationEngineService,
        },
        {
          provide: EditableExplorationBackendApiService,
          useValue: mockEditableExplorationBackendApiService,
        },
        {provide: PageContextService, useValue: mockPageContextService},
        {provide: WindowRef, useValue: mockWindowRef},
        {
          provide: ReadOnlyExplorationBackendApiService,
          useValue: mockReadOnlyExplorationBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressTrackerComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.userIsLoggedIn).toBe(false);
    expect(component.checkpointCount).toBe(0);
    expect(component.completedCheckpointsCount).toBe(0);
    expect(component.explorationTitle).toBe('');
  });

  it('should fetch exploration title on init', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(
      mockReadOnlyExplorationBackendApiService.fetchExplorationAsync
    ).toHaveBeenCalledWith('exp1', null, null);
    expect(component.explorationTitle).toBe('Mock Exploration Title');
  }));

  it('should fetch checkpoint count and show progress reminder modal when checkpoint count is zero', fakeAsync(() => {
    component.checkpointCount = 0;
    mockCheckpointProgressService.fetchCheckpointCount.and.returnValue(5);
    spyOn(component, 'showProgressReminderModal');

    component.ngOnInit();
    tick();

    mockPlayerPositionService.emitLoadedMostRecentCheckpoint();

    expect(
      mockCheckpointProgressService.fetchCheckpointCount
    ).toHaveBeenCalled();
    expect(component.checkpointCount).toBe(5);
    expect(component.showProgressReminderModal).toHaveBeenCalled();
  }));

  it('should show progress reminder modal when checkpoint count exists and onLoadedMostRecentCheckpoint emits', fakeAsync(() => {
    component.checkpointCount = 5;
    spyOn(component, 'showProgressReminderModal');

    component.ngOnInit();
    tick();

    mockPlayerPositionService.emitLoadedMostRecentCheckpoint();

    expect(component.showProgressReminderModal).toHaveBeenCalled();
  }));

  it('should emit onShowProgressModal when completedCheckpointsCount is 0', () => {
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      1
    );
    spyOn(mockConversationFlowService.onShowProgressModal, 'emit');

    component.showProgressReminderModal();

    expect(component.completedCheckpointsCount).toBe(0);
    expect(
      mockConversationFlowService.onShowProgressModal.emit
    ).toHaveBeenCalled();
  });

  it('should open progress reminder modal when completedCheckpointsCount is greater than 0', () => {
    mockCheckpointProgressService.getMostRecentlyReachedCheckpointIndex.and.returnValue(
      3
    );
    spyOn(component, 'openProgressReminderModal');

    component.showProgressReminderModal();

    expect(component.completedCheckpointsCount).toBe(2);
    expect(component.openProgressReminderModal).toHaveBeenCalled();
  });

  it('should open progress reminder modal and set modal component instance properties', () => {
    component.checkpointCount = 5;
    component.completedCheckpointsCount = 3;
    component.explorationTitle = 'Test Title';
    spyOn(mockConversationFlowService.onShowProgressModal, 'emit');

    component.openProgressReminderModal();

    expect(mockNgbModal.open).toHaveBeenCalledWith(
      NewProgressReminderModalComponent,
      {
        windowClass: 'oppia-progress-reminder-modal',
      }
    );
    expect(
      mockConversationFlowService.onShowProgressModal.emit
    ).toHaveBeenCalled();
  });

  it('should increment completedCheckpointsCount when state is terminal', () => {
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(1);
    mockExplorationEngineService.getStateCardByName.and.returnValue({
      isTerminal: jasmine.createSpy('isTerminal').and.returnValue(true),
    });
    spyOn(mockConversationFlowService.onShowProgressModal, 'emit');

    component.completedCheckpointsCount = 2;
    component.openProgressReminderModal();

    expect(component.completedCheckpointsCount).toBe(3);
  });

  it('should not increment completedCheckpointsCount when displayedCardIndex is 0', () => {
    mockPlayerPositionService.getDisplayedCardIndex.and.returnValue(0);
    spyOn(mockConversationFlowService.onShowProgressModal, 'emit');

    component.completedCheckpointsCount = 2;
    component.openProgressReminderModal();

    expect(component.completedCheckpointsCount).toBe(2);
    expect(mockExplorationEngineService.getState).not.toHaveBeenCalled();
  });

  it('should handle modal result for logged out user restart', fakeAsync(() => {
    component.userIsLoggedIn = false;
    const modalRef = {
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef;
    mockNgbModal.open.and.returnValue(modalRef);
    spyOn(mockConversationFlowService.onShowProgressModal, 'emit');

    component.openProgressReminderModal();

    modalRef.result.then(() => {
      expect(mockWindowRef.nativeWindow.location.href).toBe(
        'http://localhost/lesson/exp1'
      );
    });
    tick();
  }));

  it('should handle modal result for logged in user restart', fakeAsync(() => {
    component.userIsLoggedIn = true;
    const modalRef = {
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef;
    mockNgbModal.open.and.returnValue(modalRef);
    spyOn(mockConversationFlowService.onShowProgressModal, 'emit');

    component.openProgressReminderModal();

    modalRef.result.then(() => {
      expect(
        mockEditableExplorationBackendApiService.resetExplorationProgressAsync
      ).toHaveBeenCalledWith('exp1');
    });

    tick();

    expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));

  it('should handle modal dismiss gracefully', fakeAsync(() => {
    const modalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed'),
    } as NgbModalRef;
    mockNgbModal.open.and.returnValue(modalRef);
    spyOn(mockConversationFlowService.onShowProgressModal, 'emit');

    expect(() => {
      component.openProgressReminderModal();
      tick();
    }).not.toThrowError();
  }));

  it('should unsubscribe from directive subscriptions on destroy', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should handle userIsLoggedIn input property', () => {
    component.userIsLoggedIn = true;
    expect(component.userIsLoggedIn).toBe(true);

    component.userIsLoggedIn = false;
    expect(component.userIsLoggedIn).toBe(false);
  });
});
