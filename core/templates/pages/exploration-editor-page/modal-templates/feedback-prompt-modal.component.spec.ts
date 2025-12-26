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
 * @fileoverview Unit tests for Feedback Prompt Modal Component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FeedbackPromptModalComponent} from './feedback-prompt-modal.component';

describe('FeedbackPromptModalComponent', () => {
  let component: FeedbackPromptModalComponent;
  let fixture: ComponentFixture<FeedbackPromptModalComponent>;
  let activeModal: NgbActiveModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackPromptModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackPromptModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);

    component.openThreadsCount = 5;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct open threads count', () => {
    expect(component.openThreadsCount).toBe(5);
  });

  it('should close modal when proceeding to feedback tab', () => {
    spyOn(activeModal, 'close');

    component.proceedToFeedbackTab();

    expect(activeModal.close).toHaveBeenCalled();
  });

  it('should dismiss modal when dismissing', () => {
    spyOn(activeModal, 'dismiss');

    component.dismissModal();

    expect(activeModal.dismiss).toHaveBeenCalled();
  });
});
