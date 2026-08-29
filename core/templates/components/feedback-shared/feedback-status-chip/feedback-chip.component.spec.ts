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
 * @fileoverview Unit tests for FeedbackChipComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FeedbackChipComponent} from './feedback-chip.component';
import {
  FeedbackStatus,
  ReportAnIssueCategory,
} from '../../../domain/feedback/feedback.model';

describe('FeedbackChipComponent', () => {
  let component: FeedbackChipComponent;
  let fixture: ComponentFixture<FeedbackChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackChipComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackChipComponent);
    component = fixture.componentInstance;
    component.value = FeedbackStatus.OPEN;
    component.type = 'status';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get status css class', () => {
    expect(component.cssClass).toBe('oppia-feedback-chip-open');
    component.value = FeedbackStatus.FIXED;
    component.type = 'status';
    fixture.detectChanges();
    expect(component.cssClass).toBe('oppia-feedback-chip-fixed');
  });

  it('should get category css class', () => {
    component.value = ReportAnIssueCategory.BROKEN_LAYOUT_OR_IMAGE;
    component.type = 'category';
    fixture.detectChanges();
    expect(component.cssClass).toBe(
      'oppia-feedback-chip-broken_layout_or_image'
    );
  });

  it('should get status label', () => {
    expect(component.label).toBe('Open');
    component.value = FeedbackStatus.FIXED;
    component.type = 'status';
    fixture.detectChanges();
    expect(component.label).toBe('Fixed');
  });

  it('should get category label', () => {
    component.value = ReportAnIssueCategory.BROKEN_LAYOUT_OR_IMAGE;
    component.type = 'category';
    fixture.detectChanges();
    expect(component.label).toBe('Broken Layout / Image');
  });

  it('should get label for null value', () => {
    component.value = null;
    component.type = 'category';
    fixture.detectChanges();
    expect(component.label).toBe('—');
  });
});
