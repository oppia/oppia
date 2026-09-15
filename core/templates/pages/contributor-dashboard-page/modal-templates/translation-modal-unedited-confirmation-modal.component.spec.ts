// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TranslationModalUneditedConfirmationModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {TranslationModalUneditedConfirmationModalComponent} from './translation-modal-unedited-confirmation-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('Translation Modal Unedited Confirmation Modal Component', () => {
  let component: TranslationModalUneditedConfirmationModalComponent;
  let fixture: ComponentFixture<TranslationModalUneditedConfirmationModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TranslationModalUneditedConfirmationModalComponent,
        MockTranslatePipe,
      ],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      TranslationModalUneditedConfirmationModalComponent
    );
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should initialize component', () => {
    expect(component).toBeDefined();
  });

  it('should close modal on confirm', () => {
    spyOn(ngbActiveModal, 'close');
    component.confirm();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should dismiss modal on cancel', () => {
    spyOn(ngbActiveModal, 'dismiss');
    component.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});
