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
 * @fileoverview Unit tests for
 * TranslationOnboardingSkipConfirmationModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {TranslationOnboardingSkipConfirmationModalComponent} from './translation-onboarding-skip-confirmation-modal.component';

describe('Translation Onboarding Skip Confirmation Modal Component', () => {
  let activeModal: NgbActiveModal;
  let component: TranslationOnboardingSkipConfirmationModalComponent;
  let fixture: ComponentFixture<TranslationOnboardingSkipConfirmationModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TranslationOnboardingSkipConfirmationModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      TranslationOnboardingSkipConfirmationModalComponent
    );
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should close the modal with the selected skip preference', () => {
    const closeSpy = spyOn(activeModal, 'close');

    component.skipTour(true);

    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('should dismiss the modal when cancelling skip', () => {
    const dismissSpy = spyOn(activeModal, 'dismiss');

    component.cancel();

    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });
});
