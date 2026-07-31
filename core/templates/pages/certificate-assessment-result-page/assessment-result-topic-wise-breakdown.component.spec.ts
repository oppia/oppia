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
