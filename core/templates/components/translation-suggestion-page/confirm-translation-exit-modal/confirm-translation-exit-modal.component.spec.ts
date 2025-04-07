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
 * @fileoverview Unit tests for the confirm translation exit
 * modal component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmTranslationExitModalComponent} from './confirm-translation-exit-modal.component';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

describe('Confirm Translation Exit Modal Component', () => {
  let component: ConfirmTranslationExitModalComponent;
  let fixture: ComponentFixture<ConfirmTranslationExitModalComponent>;
  let activeModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmTranslationExitModalComponent],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmTranslationExitModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should extend ConfirmOrCancelModal', () => {
    expect(component instanceof ConfirmOrCancelModal).toBe(true);
  });

  it('should close modal when confirming', () => {
    spyOn(activeModal, 'close');
    (component as ConfirmOrCancelModal).confirm();
    expect(activeModal.close).toHaveBeenCalled();
  });

  it('should dismiss modal when canceling', () => {
    spyOn(activeModal, 'dismiss');
    (component as ConfirmOrCancelModal).cancel();
    expect(activeModal.dismiss).toHaveBeenCalled();
  });

  it('should dismiss modal when clicking close button', () => {
    spyOn(activeModal, 'dismiss');
    (component as ConfirmOrCancelModal).cancel();
    expect(activeModal.dismiss).toHaveBeenCalled();
  });
});
