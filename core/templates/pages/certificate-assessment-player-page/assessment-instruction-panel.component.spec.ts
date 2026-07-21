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
 * @fileoverview Unit tests for AssessmentInstructionPanelComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {AssessmentInstructionPanelComponent} from './assessment-instruction-panel.component';

describe('AssessmentInstructionPanelComponent', () => {
  let component: AssessmentInstructionPanelComponent;
  let fixture: ComponentFixture<AssessmentInstructionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssessmentInstructionPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentInstructionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit startAssessment when onStartAssessment is called', () => {
    spyOn(component.startAssessment, 'emit');

    component.onStartAssessment();

    expect(component.startAssessment.emit).toHaveBeenCalled();
  });

  it('should emit startAssessment when the start button is clicked', () => {
    spyOn(component.startAssessment, 'emit');

    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(component.startAssessment.emit).toHaveBeenCalled();
  });
});
