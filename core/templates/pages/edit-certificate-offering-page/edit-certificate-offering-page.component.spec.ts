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
 * @fileoverview Unit tests for EditCertificateOfferingPageComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  waitForAsync,
} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';

import {EditCertificateOfferingPageComponent} from './edit-certificate-offering-page.component';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {CERTIFICATE_OFFERING_SECTION_IDS} from 'components/certificate-assessment-offering-helper/certificate-offering-section.model';
import {AlertsService} from 'services/alerts.service';

describe('Edit Certificate Offering Page Component', () => {
  let component: EditCertificateOfferingPageComponent;
  let fixture: ComponentFixture<EditCertificateOfferingPageComponent>;
  let alertsService: AlertsService;
  let certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EditCertificateOfferingPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'certificate_offering_id',
              },
            },
          },
        },
        {
          provide: AlertsService,
          useValue: {
            addSuccessMessage: () => {},
          },
        },
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: {
            updateCertificateAssessmentOfferingAsync: async () =>
              Promise.resolve('certificate_offering_id'),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => {},
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCertificateOfferingPageComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    certificateAssessmentOfferingBackendApiService = TestBed.inject(
      CertificateAssessmentOfferingBackendApiService
    );
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should initialize active section and offering id on ngOnInit', () => {
    component.ngOnInit();

    expect(component.activeSection).toEqual(
      CERTIFICATE_OFFERING_SECTION_IDS.DETAILS
    );
    expect(component.certificateOfferingId).toEqual('certificate_offering_id');
  });

  it('should populate the certificate assessment offering with an empty model', () => {
    component.populateCertificateAssessmentOfferingFromId();

    expect(component.certificateAssessmentOffering).toEqual(
      CertificateAssessmentOfferingData.createEmpty()
    );
  });

  it('should correctly evaluate active sections', () => {
    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    expect(component.isDetailsSection()).toBeTrue();
    expect(component.isAddTopicsSection()).toBeFalse();
    expect(component.isReviewAndAvailabilitySection()).toBeFalse();

    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS;
    expect(component.isDetailsSection()).toBeFalse();
    expect(component.isAddTopicsSection()).toBeTrue();
    expect(component.isReviewAndAvailabilitySection()).toBeFalse();

    component.activeSection =
      CERTIFICATE_OFFERING_SECTION_IDS.REVIEW_AND_AVAILABILITY;
    expect(component.isDetailsSection()).toBeFalse();
    expect(component.isAddTopicsSection()).toBeFalse();
    expect(component.isReviewAndAvailabilitySection()).toBeTrue();
  });

  it('should navigate to specific sections correctly', () => {
    component.navigateToAddTopicsSection();
    expect(component.activeSection).toEqual(
      CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS
    );

    component.navigateToDetailsSection();
    expect(component.activeSection).toEqual(
      CERTIFICATE_OFFERING_SECTION_IDS.DETAILS
    );

    component.navigateToReviewAndAvailabilitySection();
    expect(component.activeSection).toEqual(
      CERTIFICATE_OFFERING_SECTION_IDS.REVIEW_AND_AVAILABILITY
    );
  });

  it('should update certificate assessment offering instance', () => {
    const updatedOffering = CertificateAssessmentOfferingData.createEmpty();
    updatedOffering.title = 'Updated Title';

    component.updateCertificateAssessmentOffering(updatedOffering);

    expect(component.certificateAssessmentOffering.title).toEqual(
      'Updated Title'
    );
  });

  it('should update topic data inside the current offering', () => {
    const mockTopicData = {topic_id_1: 7};

    component.updateTopicData(mockTopicData);

    expect(component.certificateAssessmentOffering.topicData).toEqual(
      mockTopicData
    );
  });

  it('should navigate back to the dashboard', () => {
    const routerSpy = spyOn(router, 'navigate');

    component.navigateBackToDashboard();

    expect(routerSpy).toHaveBeenCalledWith(['/certificate-offering-dashboard']);
  });

  it('should update certificate offering successfully and navigate away', fakeAsync(() => {
    const apiSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'updateCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.resolve('certificate_offering_id'));
    const alertsSpy = spyOn(alertsService, 'addSuccessMessage');
    const routerSpy = spyOn(router, 'navigate');

    component.updateCertificateOffering();
    flushMicrotasks();

    expect(apiSpy).toHaveBeenCalledWith(
      'certificate_offering_id',
      component.certificateAssessmentOffering
    );
    expect(alertsSpy).toHaveBeenCalledWith('Certificate updated.');
    expect(routerSpy).toHaveBeenCalledWith(['/certificate-offering-dashboard']);
  }));

  it('should not navigate or show alert if certificate update returns falsy value', fakeAsync(() => {
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'updateCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.resolve(''));
    const alertsSpy = spyOn(alertsService, 'addSuccessMessage');
    const routerSpy = spyOn(router, 'navigate');

    component.updateCertificateOffering();
    flushMicrotasks();

    expect(alertsSpy).not.toHaveBeenCalled();
    expect(routerSpy).not.toHaveBeenCalled();
  }));
});
