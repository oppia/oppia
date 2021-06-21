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
 * @fileoverview Unit tests for SaveVersionMismatchModalComponent.
 */

import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WindowRef } from 'services/contextual/window-ref.service';
import { SaveVersionMismatchModalComponent } from './save-version-mismatch-modal.component';
import { LostChange, LostChangeObjectFactory } from 'domain/exploration/LostChangeObjectFactory';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LoggerService } from 'services/contextual/logger.service';
import { ExplorationDataService } from '../services/exploration-data.service';

@Component({
  selector: 'oppia-changes-in-human-readable-form',
  template: ''
})
class ChangesInHumanReadableFormComponentStub {
}

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

// Mocking window object here because changing location.href causes the
// full page to reload. Page reloads raise an error in karma.
class MockWindowRef {
  _window = {
    location: {
      _hash: '',
      _hashChange: null,
      get hash() {
        return this._hash;
      },
      set hash(val) {
        this._hash = val;
        if (this._hashChange === null) {
          return;
        }
        this._hashChange();
      },
      reload: (val) => val
    },
    get onhashchange() {
      return this.location._hashChange;
    },

    set onhashchange(val) {
      this.location._hashChange = val;
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

class MockExplorationDataService {
  discardDraftAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

describe('Save Version Mismatch Modal Component', () => {
  const lostChanges = [{
    cmd: 'add_state',
    state_name: 'State name',
  } as unknown as LostChange];

  const lostChangesResponse = [{
    utilsService: {},
    cmd: 'add_state',
    stateName: 'State name',
  }];

  let component: SaveVersionMismatchModalComponent;
  let fixture: ComponentFixture<SaveVersionMismatchModalComponent>;
  let windowRef: MockWindowRef;
  let loggerService: LoggerService;
  let logSpy = null;
  let explorationDataService: MockExplorationDataService;

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    explorationDataService = new MockExplorationDataService();

    TestBed.configureTestingModule({
      declarations: [
        SaveVersionMismatchModalComponent,
        ChangesInHumanReadableFormComponentStub
      ],
      providers: [
        LoggerService,
        LostChangeObjectFactory,
        {
          provide: ExplorationDataService,
          useValue: explorationDataService
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        { provide: WindowRef,
          useValue: windowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveVersionMismatchModalComponent);
    component = fixture.componentInstance;
    component.lostChanges = lostChanges;

    loggerService = TestBed.inject(LoggerService);
    logSpy = spyOn(loggerService, 'error').and.callThrough();

    fixture.detectChanges();
  });

  it('should evaluates lostChanges when controller is initialized', () => {
    expect(component.lostChanges[0].cmd).toBe('add_state');
    expect(component.lostChanges[0].stateName).toBe('State name');
    expect(logSpy).toHaveBeenCalledWith(
      'Lost changes: ' + JSON.stringify(lostChangesResponse));
  });

  it('should remove exploration draft from local storage when modal is closed',
    () => {
      const reloadSpy = jasmine.createSpy('reload');
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          reload: reloadSpy
        }
      });

      component.discardChanges();
      fixture.detectChanges();

      waitForAsync(() => {
        expect(explorationDataService.discardDraftAsync).toHaveBeenCalled();
        expect(reloadSpy).toHaveBeenCalled();
      });
    });

  it('should contain correct modal header', () => {
    const modalHeader =
    fixture.debugElement.nativeElement
      .querySelector('.modal-header').innerText;

    expect(modalHeader).toBe('Error Saving Exploration');
  });

  it('should contain correct modal body', () => {
    const modalBody =
    fixture.debugElement.nativeElement
      .querySelector('.modal-body').children[0].innerText;

    expect(modalBody).toBe(
      'Sorry! Someone else has saved a new version of this exploration, so ' +
      'your pending changes cannot be saved.');
  });

  it('should contain description on lost changes' +
    'only if they exists in modal body', () => {
    const modalBody =
    fixture.debugElement.nativeElement
      .querySelector('.modal-body').children[1].innerText;

    component.hasLostChanges = true;
    fixture.detectChanges();

    expect(modalBody).toBe(
      'The lost changes are displayed below. You may want to copy and ' +
      'paste these changes before discarding them.');
  });
});
