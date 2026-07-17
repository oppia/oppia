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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {AssessmentIntroductionCardComponent} from './assessment-introduction-card.component';

describe('AssessmentIntroductionCardComponent', () => {
  let component: AssessmentIntroductionCardComponent;
  let fixture: ComponentFixture<AssessmentIntroductionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssessmentIntroductionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentIntroductionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default certificateId to an empty string', () => {
    expect(component.certificateId).toBe('');
  });

  it('should display the provided certificateId', () => {
    component.certificateId = 'cert-123';
    fixture.detectChanges();

    const paragraph = fixture.debugElement.query(By.css('p')).nativeElement;
    expect(paragraph.textContent).toContain('cert-123');
  });

  it('should emit continue when onContinue is called', () => {
    spyOn(component.continue, 'emit');

    component.onContinue();

    expect(component.continue.emit).toHaveBeenCalled();
  });

  it('should emit continue when the button is clicked', () => {
    spyOn(component.continue, 'emit');

    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(component.continue.emit).toHaveBeenCalled();
  });
});
