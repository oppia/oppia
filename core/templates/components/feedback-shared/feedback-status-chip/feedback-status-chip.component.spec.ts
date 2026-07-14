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
 * @fileoverview Unit tests for FeedbackStatusChipComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FeedbackStatusChipComponent} from './feedback-status-chip.component';
import {FeedbackStatus} from '../../../domain/feedback/feedback.model';

describe('FeedbackStatusChipComponent', () => {
  let component: FeedbackStatusChipComponent;
  let fixture: ComponentFixture<FeedbackStatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackStatusChipComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackStatusChipComponent);
    component = fixture.componentInstance;
    component.status = FeedbackStatus.OPEN;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get css class', () => {
    expect(component.cssClass).toBe('oppia-feedback-status-chip-open');
  });
});
