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
 * @fileoverview Unit tests for ConfirmationModalComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmationModalComponent} from './confirmation-modal.component';

describe('Confirmation Modal Component', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let modalService: NgbModal;
  let modalRef: NgbModalRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmationModalComponent],
      providers: [NgbModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(NgbModal);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default content values', () => {
    expect(component.content).toEqual({
      title: '',
      message: '',
      confirmText: '',
      cancelText: '',
    });
  });

  it('should update content when input is provided', () => {
    const testContent = {
      title: 'Test Title',
      message: 'Test Message',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    };
    component.content = testContent;
    fixture.detectChanges();

    expect(component.content).toEqual(testContent);
  });

  it('should emit confirm when confirm button is clicked', fakeAsync(() => {
    spyOn(component.activeModal, 'close');
    component.confirm();
    tick();
    expect(component.activeModal.close).toHaveBeenCalledWith('confirm');
  }));

  it('should emit cancel when cancel button is clicked', fakeAsync(() => {
    spyOn(component.activeModal, 'dismiss');
    component.cancel();
    tick();
    expect(component.activeModal.dismiss).toHaveBeenCalledWith('cancel');
  }));
});
