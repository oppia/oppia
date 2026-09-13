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
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {CertificateOfferingDetailsComponent} from './certificate-offering-details.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';
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
                  thumbnail_filename: '',
                  thumbnail_bg_color: '',
                },
                {
                  classroom_id: 'science',
                  name: 'Science',
                  url_fragment: 'science',
                  teaser_text: '',
                  is_published: true,
                  thumbnail_filename: '',
                  thumbnail_bg_color: '',
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

  it('should load classroom options on init', async () => {
    await component.loadClassrooms();

    expect(component.classroomOptions.map(classroom => classroom.name)).toEqual(
      ['Math', 'Science']
    );
    expect(component.classroomLoadErrorMessage).toEqual('');
  });

  it('should capitalize classroom names in the dropdown', async () => {
    component.classroomOptions = [
      {
        classroom_id: 'math',
        name: 'math classroom',
        url_fragment: 'math',
        teaser_text: '',
        is_published: true,
        thumbnail_filename: '',
        thumbnail_bg_color: '',
      },
    ];

    fixture.detectChanges();

    const optionText = fixture.nativeElement
      .querySelectorAll('select option')[1]
      .textContent.trim();

    expect(optionText).toEqual('Math Classroom');
  });

  it('should show an error message when loading classrooms fails', fakeAsync(() => {
    spyOn(console, 'error');
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(Promise.reject(new Error('boom')));

    component.loadClassrooms();
    flushMicrotasks();

    expect(component.classroomOptions).toEqual([]);
    expect(component.classroomLoadErrorMessage).toEqual(
      'Unable to load classrooms. Please try again.'
    );
  }));

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

  it('should sync form fields when the offering input changes after init', () => {
    component.title = 'Stale title';
    component.description = 'Stale description';
    component.classroomId = 'stale_classroom';
    component.timeLimitInMinutes = 12;
    component.totalQuestions = 2;
    component.demonstratesList = ['Stale outcome'];

    component.certificateAssessmentOffering =
      CertificateAssessmentOfferingData.createFromBackendDict({
        certificate_id: 'certificate_1',
        title: 'Loaded title',
        description: 'Loaded description',
        classroom_id: 'science',
        topic_ids: [],
        topic_data: {},
        demonstrates: ['Loaded outcome'],
        total_questions: 6,
        time_limit_in_minutes: 25,
        async_status: 'Available',
        version: 1,
      });

    component.ngOnChanges({
      certificateAssessmentOffering: {
        currentValue: component.certificateAssessmentOffering,
        previousValue: CertificateAssessmentOfferingData.createEmpty(),
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.title).toEqual('Loaded title');
    expect(component.description).toEqual('Loaded description');
    expect(component.classroomId).toEqual('science');
    expect(component.timeLimitInMinutes).toEqual(25);
    expect(component.totalQuestions).toEqual(6);
    expect(component.demonstratesList).toEqual(['Loaded outcome']);
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
    expect(component.isFormValid()).toBe(false);

    component.title = 'Certificate title';
    component.description = 'Certificate description';
    component.classroomId = 'classroom_id';
    component.timeLimitInMinutes = 30;
    component.totalQuestions = 5;
    component.demonstratesList = ['Learn math'];

    expect(component.isFormValid()).toBe(true);
  });

  it('should disable the next button when numeric values exceed limits', () => {
    component.title = 'Certificate title';
    component.description = 'Certificate description';
    component.classroomId = 'classroom_id';
    component.timeLimitInMinutes = 4;
    component.totalQuestions = 2;
    component.demonstratesList = ['Learn math'];

    expect(component.isTimeLimitInvalid()).toBe(true);
    expect(component.isTotalQuestionsInvalid()).toBe(true);
    expect(component.isFormValid()).toBe(false);
  });

  it('should return an empty classroom name when the classroom is not found', () => {
    component.classroomId = 'unknown';

    expect(component.getSelectedClassroomName()).toEqual('');
  });

  it('should mark time limit and question count as invalid when out of range', () => {
    component.timeLimitInMinutes = 4;
    component.totalQuestions = 2;

    expect(component.getTimeLimitValidationError()).toContain(
      'at least 5 minutes'
    );
    expect(component.getTotalQuestionsValidationError()).toContain(
      'at least 3'
    );
    expect(component.isFormValid()).toBe(false);
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
    expect(component.isFormValid()).toBe(false);
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

  it('should set loading state while classrooms are fetched', fakeAsync(() => {
    let resolveClassrooms: (value: never[]) => void = () => {};
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(
      new Promise(resolve => {
        resolveClassrooms = resolve;
      })
    );

    void component.loadClassrooms();
    expect(component.isLoadingClassrooms).toBe(true);
    resolveClassrooms([]);
    flushMicrotasks();

    expect(component.isLoadingClassrooms).toBe(false);
  }));

  it('should return a demonstrates validation error when outcomes exceed the limit', () => {
    component.demonstratesList = ['a'.repeat(201)];

    expect(component.getDemonstratesValidationError()).toContain(
      'at most 200 characters'
    );
  });

  it('should return normalized demonstrates and classroom name in form data', async () => {
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
});
