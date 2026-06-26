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
 * @fileoverview Unit tests for CertificateOfferingDashboardPageComponent.
 */

import {
  ComponentFixture,
  TestBed,
  CUSTOM_ELEMENTS_SCHEMA,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {RouterTestingModule} from '@angular/router/testing';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AlertsService} from 'services/alerts.service';

import {CertificateOfferingDashboardPageComponent} from './certificate-offering-dashboard-page.component';
import {DeleteCertificateOfferingModalComponent} from 'components/certificate-assessment-offering-helper/delete-certificate-offering-modal.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';

describe('CertificateOfferingDashboardPageComponent', () => {
  let component: CertificateOfferingDashboardPageComponent;
  let fixture: ComponentFixture<CertificateOfferingDashboardPageComponent>;
  let alertsService: AlertsService;
  let certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService;
  let ngbModal: NgbModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [CertificateOfferingDashboardPageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: AlertsService,
          useValue: {
            addWarning: () => {},
            addSuccessMessage: () => {},
          },
        },
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: {
            getCertificateAssessmentOfferingsAsync: async () =>
              Promise.resolve([]),
            deleteCertificateAssessmentOfferingAsync: async () =>
              Promise.resolve(),
          },
        },
        {
          provide: NgbModal,
          useValue: {
            open: () => ({
              result: Promise.resolve(),
            }),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CertificateOfferingDashboardPageComponent
    );
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    certificateAssessmentOfferingBackendApiService = TestBed.inject(
      CertificateAssessmentOfferingBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
    fixture.detectChanges();
  });

  it('should create the component instance', () => {
    expect(component instanceof CertificateOfferingDashboardPageComponent).toBe(
      true
    );
  });

  it('should load real certificate offerings on init', fakeAsync(() => {
    const loadSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'getCertificateAssessmentOfferingsAsync'
    ).and.returnValue(
      Promise.resolve([
        CertificateAssessmentOfferingData.createFromBackendDict({
          certificate_id: 'certificate_1',
          title: 'Algebra Certificate',
          description: 'Covers equations.',
          classroom_id: 'math_classroom_01',
          topic_data: {topic_1: 1, topic_2: 1},
          demonstrates: ['Equations'],
          total_questions: 8,
          time_limit_in_minutes: 40,
          async_status: 'Available',
          version: 1,
        }),
      ])
    );

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(loadSpy).toHaveBeenCalled();
    expect(component.certificateOfferings).toEqual([
      {
        certificateId: 'certificate_1',
        title: 'Algebra Certificate',
        topicsLabel: '2 topics',
        timeLabel: '40 min',
        status: 'Available',
      },
    ]);
  }));

  it('should display not_ready as Not Ready', () => {
    expect(component.getHumanReadableStatus('not_ready')).toBe('Not Ready');
  });

  it('should leave other statuses unchanged', () => {
    expect(component.getHumanReadableStatus('Available')).toBe('Available');
  });

  it('should show empty state when there are no certificate offerings', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(component.certificateOfferings).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      'No certificate created yet.'
    );
  }));

  it('should render not_ready as Not Ready in the table', fakeAsync(() => {
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'getCertificateAssessmentOfferingsAsync'
    ).and.returnValue(
      Promise.resolve([
        CertificateAssessmentOfferingData.createFromBackendDict({
          certificate_id: 'certificate_1',
          title: 'Algebra Certificate',
          description: 'Covers equations.',
          classroom_id: 'math_classroom_01',
          topic_data: {topic_1: 1},
          demonstrates: ['Equations'],
          total_questions: 8,
          time_limit_in_minutes: 40,
          async_status: 'not_ready',
          version: 1,
        }),
      ])
    );

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Not Ready');
    expect(fixture.nativeElement.textContent).not.toContain('not_ready');
  }));

  it('should build the edit certificate offering route', () => {
    expect(component.getEditCertificateOfferingRoute('mock_id')).toEqual(
      '/edit-certificate-assessment-offering/mock_id'
    );
  });

  it('should open delete certificate offering modal', fakeAsync(() => {
    const deleteSpy = spyOn(
      component,
      'deleteCertificateOffering'
    ).and.returnValue(Promise.resolve());
    const modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(),
    } as NgbModalRef);

    component.openDeleteCertificateOfferingModal('dummy_id');
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalledWith(
      DeleteCertificateOfferingModalComponent,
      {
        backdrop: 'static',
      }
    );
    expect(deleteSpy).toHaveBeenCalledWith('dummy_id');
  }));

  it('should not delete certificate offering when modal is cancelled', fakeAsync(() => {
    const deleteSpy = spyOn(component, 'deleteCertificateOffering');
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);

    component.openDeleteCertificateOfferingModal('dummy_id');
    flushMicrotasks();

    expect(deleteSpy).not.toHaveBeenCalled();
  }));

  it('should delete certificate offering and remove it locally', fakeAsync(() => {
    const deleteSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'deleteCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.resolve());
    const alertsSpy = spyOn(alertsService, 'addSuccessMessage');

    component.deleteCertificateOffering('dummy_id');
    flushMicrotasks();

    expect(deleteSpy).toHaveBeenCalledWith('dummy_id');
    expect(component.certificateOfferings).toEqual([]);
    expect(alertsSpy).toHaveBeenCalledWith('Certificate deleted successfully.');
  }));

  it('should show warning when certificate deletion fails', fakeAsync(() => {
    const deleteSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'deleteCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.reject('error'));
    const warningSpy = spyOn(alertsService, 'addWarning');

    void component.deleteCertificateOffering('dummy_id');
    flushMicrotasks();

    expect(deleteSpy).toHaveBeenCalledWith('dummy_id');
    expect(component.certificateOfferings).toEqual([
      {
        certificateId: 'dummy_id',
        title: 'Certificate Title',
        topicsLabel: '-',
        timeLabel: '-',
        status: 'Draft',
      },
    ]);
    expect(warningSpy).toHaveBeenCalledWith('Failed to delete certificate.');
  }));
});
