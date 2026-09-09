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
 * @fileoverview Unit tests for FeedbackDetailSectionComponent.
 */

import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FeedbackDetailSectionComponent} from './feedback-detail-section.component';

describe('FeedbackDetailSectionComponent', () => {
  let fixture: ComponentFixture<FeedbackDetailSectionComponent>;
  let component: FeedbackDetailSectionComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [FeedbackDetailSectionComponent],
    });

    fixture = TestBed.createComponent(FeedbackDetailSectionComponent);
    component = fixture.componentInstance;
    component.heading = 'Details';
    component.iconClass = 'fas fa-info-circle';
  });

  it('should create component with the correct heading and icon', () => {
    fixture.detectChanges();
    expect(component).toBeDefined();
    expect(component.heading).toBe('Details');
    expect(component.iconClass).toBe('fas fa-info-circle');
  });

  it('should toggle collapse', () => {
    component.isCollapsible = true;
    fixture.detectChanges();
    component.toggleCollapse();

    expect(component.isCollapsed).toBe(true);
    component.toggleCollapse();
    expect(component.isCollapsed).toBe(false);
  });

  it('should not be able to toggle collapse when isCollapsible False', () => {
    component.isCollapsible = false;
    fixture.detectChanges();
    component.toggleCollapse();
    expect(component.isCollapsed).toBe(false);
  });
});
