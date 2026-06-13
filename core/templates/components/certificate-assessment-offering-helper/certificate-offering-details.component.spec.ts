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
 * @fileoverview Unit tests for CertificateOfferingDetailsComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {CertificateOfferingDetailsComponent} from './certificate-offering-details.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';

describe('Certificate Offering Details Component', () => {
  let component: CertificateOfferingDetailsComponent;
  let fixture: ComponentFixture<CertificateOfferingDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [CertificateOfferingDetailsComponent],
      providers: [
        {
          provide: ClassroomBackendApiService,
          useValue: {
            getAllClassroomsSummaryAsync: () =>
              Promise.resolve([
                {
                  classroom_id: 'math',
                  name: 'Math',
                  url_fragment: 'math',
                  teaser_text: '',
                  is_published: true,
                  diagnostic_test_is_enabled: false,
                  thumbnail_filename: '',
                  thumbnail_bg_color: '',
                  index: 0,
                },
                {
                  classroom_id: 'science',
                  name: 'Science',
                  url_fragment: 'science',
                  teaser_text: '',
                  is_published: true,
                  diagnostic_test_is_enabled: false,
                  thumbnail_filename: '',
                  thumbnail_bg_color: '',
                  index: 1,
                },
              ]),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateOfferingDetailsComponent);
    component = fixture.componentInstance;
    component.certificateAssessmentOffering =
      CertificateAssessmentOfferingData.createEmpty();
    fixture.detectChanges();
  });

  it('should emit events correctly when clicking next button', () => {
    const offeringChangeSpy = spyOn(
      component.certificateAssessmentOfferingChange,
      'emit'
    );
    const stepCompletedSpy = spyOn(component.stepCompleted, 'emit');
    const navigateSpy = spyOn(component.navigateToAddTopicsSection, 'emit');

    component.title = 'Certificate title';
    component.description = 'Certificate description';
    component.classroomId = 'classroom_id';
    component.timeLimitInMinutes = 60;
    component.totalQuestions = 10;
    component.demonstratesList = ['Learn math'];

    component.onNextClicked();

    expect(offeringChangeSpy).toHaveBeenCalledWith(
      component.certificateAssessmentOffering
    );
    expect(stepCompletedSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalled();
    expect(component.certificateAssessmentOffering.demonstrates).toEqual([
      'Learn math',
    ]);
  });

  it('should restore demonstrates from the selected offering when reloading the step', () => {
    component.certificateAssessmentOffering.demonstrates = [
      'Learn math',
      'Learn science',
    ];

    component.setFormValues();

    expect(component.demonstratesList).toEqual(['Learn math', 'Learn science']);
  });

  it('should restore values from initial values when provided', () => {
    component.initialValues = {
      title: 'Initial title',
      description: 'Initial description',
      classroomId: 'math',
      classroomName: 'Math',
      timeLimitInMinutes: 45,
      totalQuestions: 8,
      demonstrates: ['Initial outcome'],
    };

    component.setFormValues();

    expect(component.title).toEqual('Initial title');
    expect(component.description).toEqual('Initial description');
    expect(component.classroomId).toEqual('math');
    expect(component.timeLimitInMinutes).toEqual(45);
    expect(component.totalQuestions).toEqual(8);
    expect(component.demonstratesList).toEqual(['Initial outcome']);
  });

  it('should restore demonstrates from the offering when no initial values are set', () => {
    component.certificateAssessmentOffering.demonstrates = [
      'Learn math',
      'Learn science',
    ];
    component.initialValues = null;

    component.setFormValues();

    expect(component.demonstratesList).toEqual(['Learn math', 'Learn science']);
  });

  it('should emit cancel event when clicking cancel button', () => {
    const cancelSpy = spyOn(component.cancelClicked, 'emit');

    component.onCancelClicked();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should keep demonstrates list in sync when adding and removing outcomes', () => {
    component.demonstratesList = ['First'];

    component.addOutcome();
    expect(component.demonstratesList.length).toEqual(2);

    component.removeOutcome(0);
    expect(component.demonstratesList.length).toEqual(1);
  });

  it('should not remove the only outcome row', () => {
    component.demonstratesList = ['Only'];

    component.removeOutcome(0);

    expect(component.demonstratesList).toEqual(['Only']);
  });

  it('should validate the form only when required fields are present', () => {
    expect(component.isFormValid()).toBeFalse();

    component.title = 'Certificate title';
    component.description = 'Certificate description';
    component.classroomId = 'classroom_id';
    component.timeLimitInMinutes = 30;
    component.totalQuestions = 5;
    component.demonstratesList = ['Learn math'];

    expect(component.isFormValid()).toBeTrue();
  });

  it('should disable the next button when numeric values exceed limits', () => {
    component.title = 'Certificate title';
    component.description = 'Certificate description';
    component.classroomId = 'classroom_id';
    component.timeLimitInMinutes = 61;
    component.totalQuestions = 51;
    component.demonstratesList = ['Learn math'];

    expect(component.isTimeLimitInvalid()).toBeTrue();
    expect(component.isTotalQuestionsInvalid()).toBeTrue();
    expect(component.isFormValid()).toBeFalse();
  });

  it('should return an empty classroom name when the classroom is not found', () => {
    component.classroomId = 'unknown';

    expect(component.getSelectedClassroomName()).toEqual('');
  });

  it('should mark time limit and question count as invalid when out of range', () => {
    component.timeLimitInMinutes = 61;
    component.totalQuestions = 51;

    expect(component.getTimeLimitValidationError()).toContain(
      'at most 60 minutes'
    );
    expect(component.getTotalQuestionsValidationError()).toContain(
      'at most 50'
    );
    expect(component.isFormValid()).toBeFalse();
  });

  it('should not show threshold errors for empty numeric fields', () => {
    component.title = 'Certificate title';
    component.description = 'Certificate description';
    component.classroomId = 'classroom_id';
    component.demonstratesList = ['Learn math'];

    component.timeLimitInMinutes = null;
    component.totalQuestions = null;

    expect(component.getTimeLimitValidationError()).toEqual('');
    expect(component.getTotalQuestionsValidationError()).toEqual('');
    expect(component.isFormValid()).toBeFalse();
  });

  it('should not emit events when the form is invalid', () => {
    const offeringChangeSpy = spyOn(
      component.certificateAssessmentOfferingChange,
      'emit'
    );
    const stepCompletedSpy = spyOn(component.stepCompleted, 'emit');
    const navigateSpy = spyOn(component.navigateToAddTopicsSection, 'emit');

    component.onNextClicked();

    expect(offeringChangeSpy).not.toHaveBeenCalled();
    expect(stepCompletedSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should resolve the classroom name from the selected classroom id', async () => {
    await component.loadClassrooms();
    component.classroomId = 'science';

    expect(component.getSelectedClassroomName()).toEqual('Science');
  });

  it('should set a safe fallback when classrooms fail to load', async () => {
    spyOn(console, 'error');
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(Promise.reject('load failed'));

    await component.loadClassrooms();

    expect(component.classroomOptions).toEqual([]);
    expect(component.classroomLoadErrorMessage).toEqual(
      'Unable to load classrooms. Please try again.'
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('should return normalized form data', async () => {
    await component.loadClassrooms();
    component.title = '  Certificate title  ';
    component.description = '  Certificate description  ';
    component.classroomId = 'science';
    component.timeLimitInMinutes = 30;
    component.totalQuestions = 5;
    component.demonstratesList = [' Learn math ', ''];

    expect(component.getFormData()).toEqual({
      title: 'Certificate title',
      description: 'Certificate description',
      classroomId: 'science',
      classroomName: 'Science',
      timeLimitInMinutes: 30,
      totalQuestions: 5,
      demonstrates: ['Learn math'],
    });
  });

  it('should show field validation errors for invalid values', async () => {
    await component.loadClassrooms();

    component.title = 'a'.repeat(81);
    component.description = '';
    component.classroomId = 'invalid';
    component.timeLimitInMinutes = 61;
    component.totalQuestions = 51;
    component.demonstratesList = [''];

    expect(component.getTitleValidationError()).toContain(
      'at most 80 characters'
    );
    expect(component.getClassroomValidationError()).toContain(
      'valid classroom'
    );
    expect(component.getDescriptionValidationError()).toEqual('');
    expect(component.getTimeLimitValidationError()).toContain(
      'at most 60 minutes'
    );
    expect(component.getTotalQuestionsValidationError()).toContain(
      'at most 50'
    );
    expect(component.getDemonstratesValidationError()).toEqual('');
  });

  it('should return title and description validation errors when over max length', () => {
    component.title = 'a'.repeat(81);
    component.description = 'b'.repeat(501);

    expect(component.getTitleValidationError()).toContain(
      'at most 80 characters'
    );
    expect(component.getDescriptionValidationError()).toContain(
      'at most 500 characters'
    );
  });

  it('should return no title validation error when title is within the limit', () => {
    component.title = 'a'.repeat(80);

    expect(component.getTitleValidationError()).toEqual('');
  });

  it('should return classroom validation errors for empty and invalid classroom ids', async () => {
    await component.loadClassrooms();

    component.classroomId = '';
    expect(component.getClassroomValidationError()).toEqual('');

    component.classroomId = 'invalid';
    expect(component.getClassroomValidationError()).toContain(
      'valid classroom'
    );
  });

  it('should return no classroom validation error for a valid classroom id', async () => {
    await component.loadClassrooms();

    component.classroomId = 'science';

    expect(component.getClassroomValidationError()).toEqual('');
  });

  it('should return a demonstrates validation error when outcomes exceed the limit', () => {
    component.demonstratesList = ['a'.repeat(201)];

    expect(component.getDemonstratesValidationError()).toContain(
      'at most 200 characters'
    );
  });
});
