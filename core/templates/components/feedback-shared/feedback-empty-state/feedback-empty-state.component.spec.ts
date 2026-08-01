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
 * @fileoverview Unit tests for FeedbackEmptyStateComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FeedbackEmptyStateComponent} from './feedback-empty-state.component';

describe('FeedbackEmptyStateComponent', () => {
  let component: FeedbackEmptyStateComponent;
  let fixture: ComponentFixture<FeedbackEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackEmptyStateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default input values', () => {
    expect(component.title).toBe('No feedback found');
    expect(component.message).toBe(
      'There are no feedback items matching your current filters.'
    );
    expect(component.icon).toBe('feedback');
  });

  it('should allow inputs to be overridden', () => {
    component.title = 'Custom title';
    component.message = 'Custom message';
    component.icon = 'warning';

    fixture.detectChanges();

    expect(component.title).toBe('Custom title');
    expect(component.message).toBe('Custom message');
    expect(component.icon).toBe('warning');
  });
});
