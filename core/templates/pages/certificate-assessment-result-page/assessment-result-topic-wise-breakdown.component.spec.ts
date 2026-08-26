// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AssessmentResultTopicWiseBreakdownComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AssessmentResultTopicWiseBreakdownComponent} from './assessment-result-topic-wise-breakdown.component';

describe('AssessmentResultTopicWiseBreakdownComponent', () => {
  let component: AssessmentResultTopicWiseBreakdownComponent;
  let fixture: ComponentFixture<AssessmentResultTopicWiseBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssessmentResultTopicWiseBreakdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      AssessmentResultTopicWiseBreakdownComponent
    );
    component = fixture.componentInstance;
  });

  it('should render topic breakdown rows', () => {
    component.topicBreakdown = [
      {topicName: 'Place Values', scorePercentage: 88},
      {topicName: 'Addition', scorePercentage: 95},
    ];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.topic-row');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('.topic-row-name').textContent).toContain(
      'Place Values'
    );
    expect(rows[0].querySelector('.topic-row-value').textContent).toContain(
      '88%'
    );
    expect(
      rows[0].querySelector('.topic-row-bar').getAttribute('aria-valuenow')
    ).toBe('88');
    expect(rows[0].querySelector('.topic-row-bar-fill').style.width).toBe(
      '88%'
    );
  });
});
