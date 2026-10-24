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
 * @fileoverview Unit tests for FeedbackPromptModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FeedbackPromptModalComponent} from './feedback-prompt-modal.component';

describe('Feedback Prompt Modal Component', () => {
  let component: FeedbackPromptModalComponent;
  let fixture: ComponentFixture<FeedbackPromptModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FeedbackPromptModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackPromptModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should initialize component with openThreadsCount input', () => {
    component.openThreadsCount = 3;
    expect(component.openThreadsCount).toBe(3);
  });

  it('should close the modal when confirm is called', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close');
    // Pre-check before calling the action.
    expect(closeSpy).not.toHaveBeenCalled();

    component.confirm();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should dismiss the modal when cancel is called', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');
    // Pre-check before calling the action.
    expect(dismissSpy).not.toHaveBeenCalled();

    component.cancel();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
