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
 * @fileoverview Unit tests for MyCertificatesTabComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterTestingModule} from '@angular/router/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {CERTIFICATE_ATTEMPT_STATUSES} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAttemptSummary} from 'domain/certificate-assessment/certificate-assessment.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {MyCertificatesTabComponent} from './my-certificates-tab.component';

describe('MyCertificatesTabComponent', () => {
  let component: MyCertificatesTabComponent;
  let fixture: ComponentFixture<MyCertificatesTabComponent>;
  let backendApiServiceSpy: jasmine.SpyObj<CertificateAssessmentOfferingBackendApiService>;
  let classroomBackendApiServiceSpy: jasmine.SpyObj<ClassroomBackendApiService>;

  const mockAttempts: CertificateAttemptSummary[] = [
    {
      attempt_id: 'attempt_id_1',
      classroom_id: 'math_classroom_01',
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 90,
      attempt_index: 1,
      started_at: '2026-01-15T08:30:00Z',
      is_submitted: true,
    },
    {
      attempt_id: 'attempt_id_2',
      classroom_id: 'math_classroom_01',
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 85,
      attempt_index: 2,
      started_at: '2026-01-16T10:00:00Z',
      is_submitted: true,
    },
    {
      attempt_id: 'attempt_id_3',
      classroom_id: 'science_classroom_01',
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 50,
      attempt_index: 3,
      started_at: '2026-01-17T09:15:00Z',
      is_submitted: true,
    },
  ];

  beforeEach(waitForAsync(() => {
    backendApiServiceSpy = jasmine.createSpyObj(
      'CertificateAssessmentOfferingBackendApiService',
      ['getCertificateAssessmentAttemptsAsync']
    );
    backendApiServiceSpy.getCertificateAssessmentAttemptsAsync.and.returnValue(
      Promise.resolve(mockAttempts)
    );
    classroomBackendApiServiceSpy = jasmine.createSpyObj(
      'ClassroomBackendApiService',
      ['getClassroomDataAsync']
    );
    classroomBackendApiServiceSpy.getClassroomDataAsync.and.callFake(
      async (classroomId: string) => ({
        classroomDict: {
          classroomId,
          name: classroomId === 'math_classroom_01' ? 'Mathematics' : 'Science',
          urlFragment: classroomId,
          courseDetails: '',
          feedbackRecipientEmail: '',
          teaserText: '',
          topicListIntro: '',
          topicIdToPrerequisiteTopicIds: {},
          isPublished: true,
          diagnosticTestIsEnabled: false,
          thumbnailData: {
            filename: '',
            sizeInBytes: 0,
            bgColor: '',
          },
          bannerData: {
            filename: '',
            sizeInBytes: 0,
            bgColor: '',
          },
        },
      })
    );

    TestBed.configureTestingModule({
      imports: [CommonModule, RouterTestingModule],
      declarations: [MyCertificatesTabComponent, MockTranslatePipe],
      providers: [
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: backendApiServiceSpy,
        },
        {
          provide: ClassroomBackendApiService,
          useValue: classroomBackendApiServiceSpy,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyCertificatesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render the table while attempts are loading', () => {
    expect(
      fixture.nativeElement.querySelector('.certificates-table')
    ).toBeNull();
  });

  it('should fetch and display real attempts on init', async () => {
    await fixture.whenStable();

    expect(
      backendApiServiceSpy.getCertificateAssessmentAttemptsAsync
    ).toHaveBeenCalled();
    expect(component.certificateAttempts.length).toBe(3);
    expect(component.certificateAttempts[0].attempt_id).toBe('attempt_id_3');
    expect(component.isLoading).toBeFalse();
  });

  it('should keep attempts empty when the request fails', async () => {
    await fixture.whenStable();
    component.certificateAttempts = [];
    backendApiServiceSpy.getCertificateAssessmentAttemptsAsync.and.returnValue(
      Promise.reject('Error')
    );

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.certificateAttempts).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  it('should show the empty state when there are no attempts', async () => {
    await fixture.whenStable();
    backendApiServiceSpy.getCertificateAssessmentAttemptsAsync.and.returnValue(
      Promise.resolve([])
    );

    component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.my-certificates-empty-state')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.certificates-table')
    ).toBeNull();
  });

  it('should display all attempts by default', async () => {
    await fixture.whenStable();

    expect(component.filteredAttempts.length).toBe(3);
    expect(component.filteredAttempts[0].attempt_id).toBe('attempt_id_3');
  });

  it('should filter attempts by passed status', async () => {
    await fixture.whenStable();

    component.selectedFilter = CERTIFICATE_ATTEMPT_STATUSES.PASSED;
    expect(component.filteredAttempts.length).toBe(2);
    expect(
      component.filteredAttempts.every(attempt => component.isPassed(attempt))
    ).toBeTrue();
  });

  it('should filter attempts by not passed status', async () => {
    await fixture.whenStable();

    component.selectedFilter = CERTIFICATE_ATTEMPT_STATUSES.NOT_PASSED;
    expect(component.filteredAttempts.length).toBe(1);
    expect(component.isPassed(component.filteredAttempts[0])).toBeFalse();
  });

  it('should update the selected filter on filter change', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const selectElement = fixture.nativeElement.querySelector(
      '#certificate-attempt-status-filter'
    );
    selectElement.value = CERTIFICATE_ATTEMPT_STATUSES.PASSED;
    selectElement.dispatchEvent(new Event('change'));
    expect(component.selectedFilter).toBe(CERTIFICATE_ATTEMPT_STATUSES.PASSED);
  });

  it('should derive the passed status from the score threshold', async () => {
    await fixture.whenStable();

    expect(component.isPassed(component.certificateAttempts[0])).toBeFalse();
    expect(component.isPassed(component.certificateAttempts[2])).toBeTrue();
  });

  it('should evaluate pass/fail against the passing score threshold', () => {
    const attemptJustBelowThreshold = {
      ...mockAttempts[0],
      total_score: 79,
    };
    const attemptAtThreshold = {
      ...mockAttempts[0],
      total_score: 80,
    };

    expect(component.isPassed(attemptJustBelowThreshold)).toBeFalse();
    expect(component.isPassed(attemptAtThreshold)).toBeTrue();
  });

  it('should map classroom ids to subject names', async () => {
    await fixture.whenStable();

    expect(component.getSubjectName('math_classroom_01')).toBe('Mathematics');
    expect(component.getSubjectName('science_classroom_01')).toBe('Science');
    expect(component.getSubjectName('unknown_id')).toBe('');
  });

  it('should map a failed classroom data request to an empty subject name', async () => {
    await fixture.whenStable();
    classroomBackendApiServiceSpy.getClassroomDataAsync.and.returnValue(
      Promise.reject('Error')
    );
    component.classroomIdToNameMap = {};

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.getSubjectName('math_classroom_01')).toBe('');
    expect(component.getSubjectName('science_classroom_01')).toBe('');
    expect(component.isLoading).toBeFalse();
  });

  it('should derive the status label i18n keys from the score', async () => {
    await fixture.whenStable();

    expect(component.getStatusLabel(component.certificateAttempts[0])).toBe(
      'I18N_LEARNER_DASHBOARD_MY_CERTIFICATES_NOT_PASSED'
    );
    expect(component.getStatusLabel(component.certificateAttempts[2])).toBe(
      'I18N_LEARNER_DASHBOARD_MY_CERTIFICATES_PASSED'
    );
  });

  it('should render a link to the result page for each attempt', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll(
      '.certificate-title-link'
    );
    expect(links.length).toBe(3);
    expect(links[0].getAttribute('href')).toBe(
      '/certificate-assessment-result/attempt_id_3'
    );
    expect(links[1].getAttribute('href')).toBe(
      '/certificate-assessment-result/attempt_id_2'
    );
    expect(links[2].getAttribute('href')).toBe(
      '/certificate-assessment-result/attempt_id_1'
    );
  });

  it('should render the classroom name instead of the classroom id', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const subjectCells =
      fixture.nativeElement.querySelectorAll('.subject-cell');
    expect(subjectCells[0].textContent.trim()).toBe('Science');
    expect(subjectCells[1].textContent.trim()).toBe('Mathematics');
    expect(subjectCells[2].textContent.trim()).not.toContain('classroom');
  });
});
