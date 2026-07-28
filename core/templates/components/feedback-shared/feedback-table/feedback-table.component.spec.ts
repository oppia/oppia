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
 * @fileoverview Unit tests for FeedbackTableComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FeedbackTableComponent} from './feedback-table.component';
import {FeedbackSharedModule} from '../feedback-shared.module';
import {
  ReportAnIssueCategory,
  ReportType,
} from '../../../domain/feedback/feedback.model';

describe('FeedbackTableComponent', () => {
  let component: FeedbackTableComponent;
  let fixture: ComponentFixture<FeedbackTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackSharedModule, HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackTableComponent);
    component = fixture.componentInstance;
    component.feedbackCardConfig = {
      showCategory: true,
      showResponse: true,
      showLessonMetadata: true,
      showScreenshot: true,
      showSessionInfo: true,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get category label for the given category', () => {
    expect(
      component.getCategoryLabel(ReportAnIssueCategory.BROKEN_LAYOUT_OR_IMAGE)
    ).toBe('Broken Layout / Image');
    expect(
      component.getCategoryLabel(
        ReportAnIssueCategory.CONFUSING_OR_INCORRECT_ANSWER
      )
    ).toBe('Confusing / Incorrect Answer');
  });

  it('should return ---- category label for empty category', () => {
    expect(component.getCategoryLabel('')).toBe('----');
    expect(component.getCategoryLabel(null)).toBe('----');
  });

  it('should return source label for the given source', () => {
    expect(component.getSourceLabel(ReportType.APP)).toBe('App');
    expect(component.getSourceLabel(ReportType.LESSON)).toBe('Lesson');
  });
});
