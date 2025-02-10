// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerDashboardSuggestionModalComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MockTranslatePipe} from 'tests/unit-test-utils';

import {LearnerDashboardSuggestionModalComponent} from './learner-dashboard-suggestion-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Learner Dashboard Suggestion Modal Component', () => {
  let description = 'This is a description string';
  let newContent = 'new content';
  let oldContent = 'old content';

  let component: LearnerDashboardSuggestionModalComponent;
  let fixture: ComponentFixture<LearnerDashboardSuggestionModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        LearnerDashboardSuggestionModalComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerDashboardSuggestionModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    component.newContent = newContent;
    component.oldContent = oldContent;
    component.description = description;
    fixture.detectChanges();
  });

  it('should initialize componentInstance properties', () => {
    expect(component.newContent).toBe(newContent);
    expect(component.oldContent).toBe(oldContent);
    expect(component.description).toBe(description);
  });

  it('should dismiss the modal on clicking cancel button', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
