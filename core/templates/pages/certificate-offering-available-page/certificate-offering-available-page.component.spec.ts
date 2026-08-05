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
 * @fileoverview Unit tests for certificate offering available page component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';

import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {AvailableCertificateOfferingPageComponent} from './certificate-offering-available-page.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('AvailableCertificateOfferingPageComponent', () => {
  let component: AvailableCertificateOfferingPageComponent;
  let fixture: ComponentFixture<AvailableCertificateOfferingPageComponent>;
  let certificateAssessmentOfferingBackendApiService: jasmine.SpyObj<CertificateAssessmentOfferingBackendApiService>;
  let alertsService: jasmine.SpyObj<AlertsService>;

  beforeEach(async () => {
    certificateAssessmentOfferingBackendApiService = jasmine.createSpyObj(
      'CertificateAssessmentOfferingBackendApiService',
      ['getAvailableCertificateOfferingsForClassroomAsync']
    );
    alertsService = jasmine.createSpyObj('AlertsService', ['addWarning']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [
        AvailableCertificateOfferingPageComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: certificateAssessmentOfferingBackendApiService,
        },
        {provide: AlertsService, useValue: alertsService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      AvailableCertificateOfferingPageComponent
    );
    component = fixture.componentInstance;
    component.classroomUrlFragment = 'math';
  });

  it('should load and render certificate offerings', async () => {
    certificateAssessmentOfferingBackendApiService.getAvailableCertificateOfferingsForClassroomAsync.and.returnValue(
      Promise.resolve([
        {
          certificateId: 'certificate-2',
          title: 'Zoology',
          attemptStatus: 'Passed',
        },
        {
          certificateId: 'certificate-1',
          title: 'Arithmetic',
          attemptStatus: 'Not Attempted',
        },
      ])
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tiles: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.oppia-certificate-offering-available-page-tile'
      )
    );

    expect(
      certificateAssessmentOfferingBackendApiService.getAvailableCertificateOfferingsForClassroomAsync
    ).toHaveBeenCalledWith('math');
    expect(tiles.length).toBe(2);
    expect(tiles[0].querySelector('h3')?.textContent?.trim()).toBe(
      'Arithmetic'
    );
    expect(tiles[1].querySelector('h3')?.textContent?.trim()).toBe('Zoology');
    expect(component.hasError).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain(
      'No certificates available yet.'
    );
  });

  it('should show an empty state when no offerings are returned', async () => {
    certificateAssessmentOfferingBackendApiService.getAvailableCertificateOfferingsForClassroomAsync.and.returnValue(
      Promise.resolve([])
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No certificates available yet.'
    );
    expect(component.hasError).toBe(false);
    expect(alertsService.addWarning).not.toHaveBeenCalled();
  });

  it('should show an error message when the API call fails', async () => {
    certificateAssessmentOfferingBackendApiService.getAvailableCertificateOfferingsForClassroomAsync.and.returnValue(
      Promise.reject('API error')
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to load certificate assessment offerings.'
    );
    expect(component.isLoading).toBe(false);
    expect(component.hasError).toBe(true);
    expect(component.availableCertificateOfferings).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      'Failed to load certificate assessment offerings.'
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'No certificates available yet.'
    );
  });

  it('should link assessment buttons to the certificate assessment page', async () => {
    certificateAssessmentOfferingBackendApiService.getAvailableCertificateOfferingsForClassroomAsync.and.returnValue(
      Promise.resolve([
        {
          certificateId: 'certificate-1',
          title: 'Arithmetic',
          attemptStatus: 'Not Attempted',
        },
      ])
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const assessmentButtons = buttons.filter(b =>
      [
        'I18N_CERTIFICATE_OFFERING_AVAILABLE_PAGE_CONTINUE_TO_ASSESSMENT_BUTTON_TEXT',
        'I18N_CERTIFICATE_OFFERING_AVAILABLE_PAGE_RETRY_ASSESSMENT_BUTTON_TEXT',
      ].includes(b.textContent?.trim() || '')
    );

    expect(assessmentButtons.length).toBe(
      component.availableCertificates.length
    );
    assessmentButtons.forEach(button => {
      expect(button.getAttribute('ng-reflect-router-link')).toContain(
        '/certificate-assessment'
      );
    });
  });

  it('should show a Check Score button for passed and failed certificates', async () => {
    certificateAssessmentOfferingBackendApiService.getAvailableCertificateOfferingsForClassroomAsync.and.returnValue(
      Promise.resolve([
        {
          certificateId: 'certificate-1',
          title: 'Arithmetic',
          attemptStatus: 'Passed',
        },
        {
          certificateId: 'certificate-2',
          title: 'Zoology',
          attemptStatus: 'Failed',
        },
        {
          certificateId: 'certificate-3',
          title: 'History',
          attemptStatus: 'Not Attempted',
        },
      ])
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const checkScoreButtons = buttons.filter(
      b =>
        b.textContent?.trim() ===
        'I18N_CERTIFICATE_OFFERING_AVAILABLE_PAGE_CHECK_SCORE_BUTTON_TEXT'
    );
    const passedOrFailedCount = component.availableCertificates.filter(
      c => c.status === 'passed' || c.status === 'failed'
    ).length;

    expect(checkScoreButtons.length).toBe(passedOrFailedCount);
    expect(checkScoreButtons.length).toBe(2);
  });

  it('should route the Exit button to the classroom page', () => {
    fixture.detectChanges();
    const exitButton = fixture.nativeElement.querySelector(
      '.oppia-certificate-offering-available-page-exit-button'
    ) as HTMLButtonElement;

    expect(exitButton.textContent?.trim()).toBe(
      'I18N_CERTIFICATE_OFFERING_AVAILABLE_PAGE_EXIT_BUTTON_TEXT'
    );
    expect(exitButton.getAttribute('ng-reflect-router-link')).toContain('math');
  });

  it('should build the certificate assessment route with the certificate id', () => {
    expect(component.getCertificateAssessmentRoute('some_cert_id')).toEqual([
      '/certificate-assessment',
      'some_cert_id',
    ]);
  });
});
