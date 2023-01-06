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
 * @fileoverview Unit tests for SaveValidationFailModalComponent.
 */

import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SaveValidationFailModalComponent } from './save-validation-fail-modal.component';

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
      },
      reload: (val: number) => val
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

describe('Save Validation Fail Modal Component', () => {
  let windowRef: MockWindowRef;

  let component: SaveValidationFailModalComponent;
  let fixture: ComponentFixture<SaveValidationFailModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [
        SaveValidationFailModalComponent,
        ChangesInHumanReadableFormComponentStub
      ],
      providers: [
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
    fixture = TestBed.createComponent(SaveValidationFailModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    fixture.detectChanges();
  });

  it('should refresh page when modal is closed', fakeAsync(() => {
    const reloadSpy = jasmine.createSpy('reload');
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        _hash: '',
        _hashChange: null,
        hash: '',
        reload: reloadSpy,
      },
      onhashchange: null,
    });

    component.closeAndRefresh();

    tick(20);

    expect(dismissSpy).toHaveBeenCalledWith('cancel');
    expect(reloadSpy).toHaveBeenCalled();
  }));


  it('should contain correct modal header', () => {
    const modalHeader =
    fixture.debugElement.nativeElement
      .querySelector('.modal-header').innerText;

    expect(modalHeader).toBe('Error Saving Exploration');
  });

  it('should contain correct modal body', () => {
    const modalBody =
    fixture.debugElement.nativeElement
      .querySelector('.modal-body').innerText;

    expect(modalBody).toContain(
      'Sorry, an unexpected error occurred.');
  });
});
