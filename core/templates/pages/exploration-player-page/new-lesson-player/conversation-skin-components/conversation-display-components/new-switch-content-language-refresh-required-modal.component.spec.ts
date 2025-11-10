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
 * @fileoverview Unit tests for
 * NewSwitchContentLanguageRefreshRequiredModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {NewSwitchContentLanguageRefreshRequiredModalComponent} from './new-switch-content-language-refresh-required-modal.component';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

// Mocking window object here because changing location.reload() causes the
// full page to reload. Page reloads raise an error in karma.
class MockWindowRef {
  private mockWindow = {
    location: {
      reload: jasmine.createSpy('reload'),
    },
  };

  get nativeWindow() {
    return this.mockWindow;
  }
}

describe('NewSwitchContentLanguageRefreshRequiredModalComponent', function () {
  let component: NewSwitchContentLanguageRefreshRequiredModalComponent;
  let fixture: ComponentFixture<NewSwitchContentLanguageRefreshRequiredModalComponent>;
  let activeModal: MockActiveModal;
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MockTranslatePipe,
        NewSwitchContentLanguageRefreshRequiredModalComponent,
      ],
      imports: [MatIconModule, MatButtonModule],
      providers: [
        {provide: NgbActiveModal, useClass: MockActiveModal},
        {provide: WindowRef, useClass: MockWindowRef},
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      NewSwitchContentLanguageRefreshRequiredModalComponent
    );
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal) as MockActiveModal;
    windowRef = TestBed.inject(WindowRef);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with modalText input', () => {
    const testModalText = 'Test modal text';
    component.modalText = testModalText;
    expect(component.modalText).toBe(testModalText);
  });

  it('should dismiss modal when cancel is called', () => {
    const dismissSpy = spyOn(activeModal, 'dismiss').and.callThrough();

    component.cancel();

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should close modal and reload window when confirm is called', () => {
    const closeSpy = spyOn(activeModal, 'close').and.callThrough();
    const reloadSpy = windowRef.nativeWindow.location.reload as jasmine.Spy;

    component.confirm();

    expect(closeSpy).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });
});
