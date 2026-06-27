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
 * @fileoverview Unit tests for CreateCertificateOfferingPageComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  waitForAsync,
} from '@angular/core/testing';
import {Router} from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import {CreateCertificateOfferingPageComponent} from './create-certificate-offering-page.component';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {
  CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS,
  CERTIFICATE_OFFERING_RESULT_ACTIONS,
  CERTIFICATE_OFFERING_SAVE_STATUSES,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import {CERTIFICATE_OFFERING_SECTION_IDS} from 'components/certificate-assessment-offering-helper/certificate-offering-section.model';
import {AlertsService} from 'services/alerts.service';

describe('Create Certificate Offering Page Component', () => {
  let component: CreateCertificateOfferingPageComponent;
  let fixture: ComponentFixture<CreateCertificateOfferingPageComponent>;
  let alertsService: AlertsService;
  let certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService;
  let ngbModal: NgbModal;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CreateCertificateOfferingPageComponent],
      providers: [
        {
          provide: AlertsService,
          useValue: {
            addSuccessMessage: () => {},
            addWarning: () => {},
          },
        },
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: {
            createCertificateAssessmentOfferingAsync: async () =>
              Promise.resolve('mock_id'),
          },
        },
        {
          provide: NgbModal,
          useValue: {
            open: () =>
              ({
                componentInstance: {
                  isCertificateValid: false,
                },
                result: Promise.resolve(
                  CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY
                ),
              }) as NgbModalRef,
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
    fixture = TestBed.createComponent(CreateCertificateOfferingPageComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    certificateAssessmentOfferingBackendApiService = TestBed.inject(
      CertificateAssessmentOfferingBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should initialize active section to details section on ngOnInit', () => {
    component.ngOnInit();
    expect(component.activeSection).toEqual(
      CERTIFICATE_OFFERING_SECTION_IDS.DETAILS
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
    updatedOffering.title = 'New Title';

    component.updateCertificateAssessmentOffering(updatedOffering);

    expect(component.certificateAssessmentOffering.title).toEqual('New Title');
  });

  it('should update topic data inside the current offering', () => {
    const mockTopicData = {topic_id_1: 4};

    component.updateTopicData(mockTopicData);

    expect(component.certificateAssessmentOffering.topicData).toEqual(
      mockTopicData
    );
  });

  it('should initialize the offering with empty details values', () => {
    expect(component.certificateAssessmentOffering).toEqual(
      CertificateAssessmentOfferingData.createEmpty()
    );
  });

  it('should navigate back to the dashboard', () => {
    const routerSpy = spyOn(router, 'navigate');

    component.navigateBackToDashboard();

    expect(routerSpy).toHaveBeenCalledWith(['/certificate-offering-dashboard']);
  });

  it('should save certificate offering successfully and navigate away', fakeAsync(() => {
    const modalRef = {
      componentInstance: {
        isCertificateValid: false,
        action: undefined as string | undefined,
      },
      result: Promise.resolve(CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY),
    } as NgbModalRef;
    const apiSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'createCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.resolve('certificate_id_123'));
    const alertsSpy = spyOn(alertsService, 'addSuccessMessage');
    const routerSpy = spyOn(router, 'navigate');
    const modalSpy = spyOn(ngbModal, 'open').and.returnValue(modalRef);

    component.saveCertificateOffering();
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalled();
    expect(modalRef.componentInstance.action).toBe(
      CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE
    );
    expect(apiSpy).toHaveBeenCalledWith(
      component.certificateAssessmentOffering
    );
    expect(alertsSpy).toHaveBeenCalledWith('Certificate saved as not ready.');
    expect(routerSpy).toHaveBeenCalledWith(['/certificate-offering-dashboard']);
  }));

  it('should create certificate offering and show post-result modal', fakeAsync(() => {
    const firstModalRef = {
      componentInstance: {
        isCertificateValid: false,
        action: undefined as string | undefined,
      },
      result: Promise.resolve(CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.CREATE),
    } as NgbModalRef;
    const secondModalRef = {
      componentInstance: {
        action: undefined as string | undefined,
      },
      result: Promise.reject('dismissed'),
    } as NgbModalRef;
    const apiSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'createCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.resolve('certificate_id_123'));
    const alertsSpy = spyOn(alertsService, 'addSuccessMessage');
    const routerSpy = spyOn(router, 'navigate');
    const modalSpy = spyOn(ngbModal, 'open').and.returnValues(
      firstModalRef,
      secondModalRef
    );

    component.saveCertificateOffering();
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalledTimes(2);
    expect(apiSpy).toHaveBeenCalledWith(
      component.certificateAssessmentOffering
    );
    expect(alertsSpy).toHaveBeenCalledWith('Certificate created.');
    expect(secondModalRef.componentInstance.action).toBe(
      CERTIFICATE_OFFERING_RESULT_ACTIONS.CREATED
    );
    expect(routerSpy).toHaveBeenCalledWith(['/certificate-offering-dashboard']);
  }));

  it('should not navigate or show alert if certificate creation returns falsy value', fakeAsync(() => {
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'createCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.resolve(''));
    const alertsSpy = spyOn(alertsService, 'addSuccessMessage');
    const routerSpy = spyOn(router, 'navigate');
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isCertificateValid: false,
      },
      result: Promise.resolve(CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY),
    } as NgbModalRef);

    component.saveCertificateOffering();
    flushMicrotasks();

    expect(alertsSpy).not.toHaveBeenCalled();
    expect(routerSpy).not.toHaveBeenCalled();
  }));

  it('should return early when the confirmation modal is dismissed', fakeAsync(() => {
    const apiSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'createCertificateAssessmentOfferingAsync'
    );
    const alertsSpy = spyOn(alertsService, 'addSuccessMessage');
    const routerSpy = spyOn(router, 'navigate');
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isCertificateValid: false,
      },
      result: Promise.reject('dismissed'),
    } as NgbModalRef);

    component.saveCertificateOffering();
    flushMicrotasks();

    expect(apiSpy).not.toHaveBeenCalled();
    expect(alertsSpy).not.toHaveBeenCalled();
    expect(routerSpy).not.toHaveBeenCalled();
  }));

  it('should show the error message from an Error instance', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isCertificateValid: false,
      },
      result: Promise.resolve(CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY),
    } as NgbModalRef);
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'createCertificateAssessmentOfferingAsync'
    ).and.returnValue(
      Promise.reject(new Error('Failed to create certificate.'))
    );
    const alertsSpy = spyOn(alertsService, 'addWarning');
    const routerSpy = spyOn(router, 'navigate');

    component.saveCertificateOffering();
    flushMicrotasks();

    expect(alertsSpy).toHaveBeenCalledWith('Failed to create certificate.');
    expect(routerSpy).not.toHaveBeenCalled();
  }));

  it('should fall back to a generic message for non-Error failures', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isCertificateValid: false,
      },
      result: Promise.resolve(CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY),
    } as NgbModalRef);
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'createCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.reject('Failed to create certificate.'));
    const alertsSpy = spyOn(alertsService, 'addWarning');
    const routerSpy = spyOn(router, 'navigate');

    component.saveCertificateOffering();
    flushMicrotasks();

    expect(alertsSpy).toHaveBeenCalledWith('Failed to create certificate.');
    expect(routerSpy).not.toHaveBeenCalled();
  }));
});
