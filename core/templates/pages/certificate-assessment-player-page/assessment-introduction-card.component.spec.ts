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
 * @fileoverview Unit tests for AssessmentIntroductionCardComponent.
 */

import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, Pipe, PipeTransform} from '@angular/core';

import {AssessmentIntroductionCardComponent} from './assessment-introduction-card.component';

// Mock the 'translate' pipe used in the template so the TestBed can compile
// the component without pulling in the real i18n/translate module.
@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('AssessmentIntroductionCardComponent', () => {
  let component: AssessmentIntroductionCardComponent;
  let fixture: ComponentFixture<AssessmentIntroductionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [AssessmentIntroductionCardComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentIntroductionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should default certificateId to an empty string', () => {
    expect(component.certificateId).toBe('');
  });

  it('should allow certificateId to be set via input binding', () => {
    component.certificateId = 'cert-123';

    expect(component.certificateId).toBe('cert-123');
  });

  it('should have the correct default certificate title', () => {
    expect(component.certificateTitle).toBe(
      'Everyday Arithmetic & Number Confidence'
    );
  });

  it('should have the correct default certificate description', () => {
    expect(component.certificateDescription).toBe(
      'This certificate recognizes your ability to work confidently with ' +
        'numbers in everyday situations, including basic operations and ' +
        'number reasoning.'
    );
  });

  it('should have the correct default demonstratesList', () => {
    expect(component.demonstratesList).toEqual([
      'Understanding of numbers and their relationships',
      'Ability to perform basic arithmetic accurately',
      'Confidence solving everyday numerical problems',
    ]);
  });

  it('should have the correct default recommendedTopics', () => {
    expect(component.recommendedTopics).toEqual([
      {name: 'Place Values', lessonCount: 5, colorClass: 'topic-color-1'},
      {
        name: 'Addition and Subtraction',
        lessonCount: 7,
        colorClass: 'topic-color-2',
      },
      {name: 'Multiplication', lessonCount: 7, colorClass: 'topic-color-3'},
      {name: 'Fractions', lessonCount: 12, colorClass: 'topic-color-4'},
    ]);
  });

  it('should expose the correct i18n key for the demonstrates heading', () => {
    expect(component.demonstratesHeadingI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_DEMONSTRATES_HEADING'
    );
  });

  it('should expose the correct i18n key for the topics heading', () => {
    expect(component.topicsHeadingI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_TOPICS_HEADING'
    );
  });

  it('should expose the correct i18n key for the topics subtext', () => {
    expect(component.topicsSubtextI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_TOPICS_SUBTEXT'
    );
  });

  it('should expose the correct i18n key for the continue button', () => {
    expect(component.continueButtonI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_CONTINUE_BUTTON'
    );
  });

  it('should emit the continue event when onContinue is called', () => {
    spyOn(component.continue, 'emit');

    component.onContinue();

    expect(component.continue.emit).toHaveBeenCalled();
  });

  it('should emit the continue event exactly once per call', () => {
    spyOn(component.continue, 'emit');

    component.onContinue();

    expect(component.continue.emit).toHaveBeenCalledTimes(1);
  });
});
