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

  it('should render the configured section icon classes', () => {
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('i');
    expect(
      icons[0].classList.contains('oppia-feedback-detail-section-icon')
    ).toBeTrue();
    expect(icons[0].classList.contains('fas')).toBeTrue();
    expect(icons[0].classList.contains('fa-info-circle')).toBeTrue();
  });

  it('should toggle the collapse chevron icon', () => {
    component.isCollapsible = true;
    fixture.detectChanges();

    let icons = fixture.nativeElement.querySelectorAll('i');
    expect(icons[1].classList.contains('fas')).toBeTrue();
    expect(icons[1].classList.contains('fa-chevron-down')).toBeTrue();
    expect(icons[1].classList.contains('fa-chevron-right')).toBeFalse();

    icons[1].dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    icons = fixture.nativeElement.querySelectorAll('i');
    expect(icons[1].classList.contains('fa-chevron-down')).toBeFalse();
    expect(icons[1].classList.contains('fa-chevron-right')).toBeTrue();
  });
});
