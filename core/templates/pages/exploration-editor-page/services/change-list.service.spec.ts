// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Change List Service.
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeListService } from './change-list.service';
import { LoaderService } from 'services/loader.service';
import { EventEmitter } from '@angular/core';
import { InternetConnectivityService } from 'services/internet-connectivity.service';
import { ExplorationDataService } from './exploration-data.service';
import { AutosaveInfoModalsService } from './autosave-info-modals.service';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';

class MockWindowRef {
  _window = {
    location: {
      _pathname: '/learn/math',
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      get pathname() {
        return this._pathname;
      },
      set pathname(val) {
        this._pathname = val;
      },
      reload: () => {}
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    },
    navigator: {
      // Internet Connection.
      onLine: true
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

class MockExplorationDataService1 {
  explorationId: 0;
  autosaveChangeListAsync(changeList, successCb, errorCb) {
    successCb({
      changes_are_mergeable: true,
      is_version_of_draft_valid: false,
    });
  }
  discardDraftAsync() {
    return;
  }
}

class MockExplorationDataService2 {
  explorationId: 0;
  autosaveChangeListAsync(changeList, successCb, errorCb) {
    successCb({
      changes_are_mergeable: false,
      is_version_of_draft_valid: false,
    });
  }
  discardDraftAsync() {
    return;
  }
}

class MockExplorationDataService3 {
  explorationId: 0;
  autosaveChangeListAsync(changeList, successCb, errorCb) {
    errorCb();
  }
  discardDraftAsync() {
    return;
  }
}

class MockAutosaveInfoModalsService {
  isModalOpen() {
    return false;
  }

  showNonStrictValidationFailModal() {
    return;
  }
}

describe('Change List Service when changes are mergable', () => {
  let changeListService: ChangeListService;
  let alertsService: AlertsService;
  let mockWindowRef: MockWindowRef;
  let internetConnectivityService: InternetConnectivityService;
  let autosaveInfoModalsService: AutosaveInfoModalsService = null;

  let alertsSpy = null;
  let mockExplorationDataService = null;
  let mockEventEmitter = new EventEmitter();

  beforeEach(fakeAsync(() => {
    mockWindowRef = new MockWindowRef();
    mockExplorationDataService = new MockExplorationDataService1();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: mockExplorationDataService
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef
        },
        {
          provide: LoaderService,
          useValue: {
            onLoadingMessageChange: mockEventEmitter
          }
        }
      ]
    });

    tick(200);
  }));

  beforeEach(fakeAsync(() => {
    changeListService = TestBed.inject(ChangeListService);
    internetConnectivityService = TestBed.inject(InternetConnectivityService);
    autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
    alertsService = TestBed.inject(AlertsService);

    tick(200);

    spyOn(autosaveInfoModalsService, 'showVersionMismatchModal')
      .and.returnValue(null);
    spyOn(autosaveInfoModalsService, 'showNonStrictValidationFailModal')
      .and.returnValue(null);
    alertsSpy = spyOn(alertsService, 'addWarning')
      .and.returnValue(null);
  }));

  it('should set loading message when initialized', fakeAsync(() => {
    mockEventEmitter.emit('loadingMessage');

    tick(200);

    expect(changeListService.loadingMessage).toBe('loadingMessage');
  }));

  it('should save changes after deleting a state ' +
    'when calling \'deleteState\'', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = 10;
    changeListService.explorationChangeList.length = 0;
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter, 'emit')
      .and.callThrough();

    changeListService.deleteState('state');
    tick(200);

    expect(saveSpy).toHaveBeenCalled();
  }));

  it('should not save changes after deleting a state ' +
    'if loading message is being shown', fakeAsync(() => {
    changeListService.explorationChangeList.length = 0;
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter, 'emit')
      .and.callThrough();

    // Setting loading message.
    changeListService.loadingMessage = 'loadingMessage';
    changeListService.deleteState('state');
    tick(200);

    expect(saveSpy).not.toHaveBeenCalled();
  }));

  it('should not save changes after deleting a state ' +
    'if internet is offline', fakeAsync(() => {
    changeListService.explorationChangeList.length = 0;
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter, 'emit')
      .and.callThrough();
    // Setting internet to offline.
    spyOn(internetConnectivityService, 'isOnline')
      .and.returnValue(false);

    changeListService.deleteState('state');
    tick(200);

    expect(saveSpy).not.toHaveBeenCalled();
  }));

  it('should discard all changes ' +
    'when calling \'discardAllChanges\'', fakeAsync(() => {
    let discardSpy = spyOn(mockExplorationDataService, 'discardDraftAsync')
      .and.callThrough();

    changeListService.discardAllChanges();

    tick(200);

    expect(discardSpy).toHaveBeenCalled();
  }));

  it('should show alert message if we try to edit ' +
    'an exploration with invalid property', fakeAsync(() => {
    changeListService.editExplorationProperty(
      'prop1', 'oldValue', 'newValue');
    tick(200);

    expect(alertsSpy).toHaveBeenCalledWith(
      'Invalid exploration property: prop1');
  }));

  it('should show alert message if we try to edit ' +
    'an state with invalid property', fakeAsync(() => {
    changeListService.editStateProperty(
      'stateName', 'prop1', 'oldValue', 'newValue');
    tick(200);

    expect(alertsSpy).toHaveBeenCalledWith(
      'Invalid state property: prop1');
  }));

  it('should check whether exploration locked for editing ' +
    'when calling \'isExplorationLockedForEditing\'', fakeAsync(() => {
    changeListService.explorationChangeList.length = 2;
    tick(200);
    expect(changeListService.isExplorationLockedForEditing())
      .toBe(true);

    changeListService.explorationChangeList.length = 0;
    tick(200);
    expect(changeListService.isExplorationLockedForEditing())
      .toBe(false);
  }));
});

describe('Change List Service when changes are not mergable', () => {
  let changeListService: ChangeListService;
  let alertsService: AlertsService;
  let mockWindowRef: MockWindowRef;
  let autosaveInfoModalsService: AutosaveInfoModalsService = null;

  let alertsSpy = null;
  let mockExplorationDataService = null;

  beforeEach(fakeAsync(() => {
    mockWindowRef = new MockWindowRef();
    mockExplorationDataService = new MockExplorationDataService2();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: mockExplorationDataService
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ]
    });

    tick(200);
  }));

  beforeEach(fakeAsync(() => {
    changeListService = TestBed.inject(ChangeListService);
    autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
    alertsService = TestBed.inject(AlertsService);

    tick(200);

    spyOn(autosaveInfoModalsService, 'showVersionMismatchModal')
      .and.returnValue(null);
    spyOn(autosaveInfoModalsService, 'showNonStrictValidationFailModal')
      .and.returnValue(null);
    alertsSpy = spyOn(alertsService, 'addWarning')
      .and.returnValue(null);
  }));

  it('should undo and save changes when calling \'undoLastChange\'',
    fakeAsync(() => {
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter, 'emit')
        .and.returnValue(null);
      changeListService.explorationChangeList.length = 2;

      changeListService.undoLastChange();

      tick(200);

      expect(saveSpy).toHaveBeenCalled();
    }));

  it('should not undo changes when there are no changes', fakeAsync(() => {
    changeListService.explorationChangeList.length = 0;

    changeListService.undoLastChange();

    tick(200);

    expect(alertsSpy).toHaveBeenCalledWith(
      'There are no changes to undo.');
  }));
});

describe('Change List Service when internet is available', () => {
  let changeListService: ChangeListService;
  let alertsService: AlertsService;
  let mockWindowRef: MockWindowRef;
  let onInternetStateChangeEventEmitter = new EventEmitter();

  let alertsSpy = null;
  let mockExplorationDataService = null;
  let mockAutosaveInfoModalsService = null;

  beforeEach(fakeAsync(() => {
    mockWindowRef = new MockWindowRef();
    mockExplorationDataService = new MockExplorationDataService3();
    mockAutosaveInfoModalsService = new MockAutosaveInfoModalsService();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: mockExplorationDataService
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef
        },
        {
          provide: AutosaveInfoModalsService,
          useValue: mockAutosaveInfoModalsService
        },
        {
          provide: InternetConnectivityService,
          useValue: {
            onInternetStateChange: onInternetStateChangeEventEmitter,
            isOnline() {
              return true;
            }
          }
        }
      ]
    });
    tick(200);
  }));

  beforeEach(fakeAsync(() => {
    changeListService = TestBed.inject(ChangeListService);
    alertsService = TestBed.inject(AlertsService);

    tick(200);

    alertsSpy = spyOn(alertsService, 'addWarning')
      .and.returnValue(null);
  }));

  it('should undo and save changes when calling \'undoLastChange\'',
    fakeAsync(() => {
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter, 'emit')
        .and.returnValue(null);
      changeListService.temporaryListOfChanges = [{
        cmd: 'add_state',
        state_name: 'stateName'
      }];
      changeListService.explorationChangeList.length = 2;

      onInternetStateChangeEventEmitter.emit(true);
      changeListService.undoLastChange();

      tick(200);

      expect(saveSpy).toHaveBeenCalled();
    }));

  it('should not undo changes when there are no changes', fakeAsync(() => {
    changeListService.temporaryListOfChanges = [{
      cmd: 'add_state',
      state_name: 'stateName'
    }];

    changeListService.undoLastChange();

    tick(200);

    expect(alertsSpy).toHaveBeenCalledWith(
      'There are no changes to undo.');
  }));
});
