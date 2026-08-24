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
 * @fileoverview Unit tests for CertificateCreatorDashboardPageComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {RouterTestingModule} from '@angular/router/testing';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AlertsService} from 'services/alerts.service';

import {CertificateCreatorDashboardPageComponent} from './certificate-creator-dashboard-page.component';
import {DeleteCertificateOfferingModalComponent} from 'components/certificate-assessment-offering-helper/delete-certificate-offering-modal.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';

interface CertificateSummary {
  certificateId: string;
  title: string;
  topicsLabel: string;
  timeLabel: string;
  status: string;
}

describe('CertificateCreatorDashboardPageComponent', () => {
  let component: CertificateCreatorDashboardPageComponent;
  let fixture: ComponentFixture<CertificateCreatorDashboardPageComponent>;
  let alertsService: AlertsService;
  let certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService;
  let ngbModal: NgbModal;

  const makeCertificate = (
    id: string,
    title = `Certificate ${id}`
  ): CertificateSummary => ({
    certificateId: id,
    title,
    topicsLabel: '1',
    timeLabel: '10 min',
    status: 'Available',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [CertificateCreatorDashboardPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
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

  // NOTE: We intentionally do NOT call fixture.detectChanges() here.
  // The component now performs a real async call inside ngOnInit(), so
  // any spy that a test needs in place for that initial load must be
  // set up BEFORE the first detectChanges() triggers ngOnInit(). Tests
  // that don't care about the initial load can simply never call
  // detectChanges() and interact with the component instance directly.
  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateCreatorDashboardPageComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    certificateAssessmentOfferingBackendApiService = TestBed.inject(
      CertificateAssessmentOfferingBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
  });

  it('should create the component instance', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();

    expect(component instanceof CertificateCreatorDashboardPageComponent).toBe(
      true
    );
  }));

  it('should set the create certificate offering route', () => {
    expect(component.createCertificateOfferingRoute.startsWith('/')).toBe(true);
  });

  it('should be in a loading state before the offerings resolve', () => {
    expect(component.isLoading).toBe(true);
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
          topic_ids: ['topic_1', 'topic_2'],
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
        topicsLabel: '2',
        timeLabel: '40 min',
        status: 'Available',
      },
    ]);
    expect(component.isLoading).toBe(false);
  }));

  it('should sort loaded certificate offerings alphabetically by title', fakeAsync(() => {
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'getCertificateAssessmentOfferingsAsync'
    ).and.returnValue(
      Promise.resolve([
        CertificateAssessmentOfferingData.createFromBackendDict({
          certificate_id: 'cert_b',
          title: 'Biology Certificate',
          description: '',
          classroom_id: 'science_classroom',
          topic_ids: ['topic_1'],
          topic_data: {topic_1: 1},
          demonstrates: [],
          total_questions: 5,
          time_limit_in_minutes: 20,
          async_status: 'Available',
          version: 1,
        }),
        CertificateAssessmentOfferingData.createFromBackendDict({
          certificate_id: 'cert_a',
          title: 'Algebra Certificate',
          description: '',
          classroom_id: 'math_classroom',
          topic_ids: ['topic_1'],
          topic_data: {topic_1: 1},
          demonstrates: [],
          total_questions: 5,
          time_limit_in_minutes: 20,
          async_status: 'Available',
          version: 1,
        }),
      ])
    );

    fixture.detectChanges();
    flushMicrotasks();

    expect(
      component.certificateOfferings.map(offering => offering.certificateId)
    ).toEqual(['cert_a', 'cert_b']);
  }));

  it('should reset to page 1 after a successful load', fakeAsync(() => {
    component.currentPage = 3;

    fixture.detectChanges();
    flushMicrotasks();

    expect(component.currentPage).toBe(1);
  }));

  it('should warn and stop loading when fetching offerings fails', fakeAsync(() => {
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'getCertificateAssessmentOfferingsAsync'
    ).and.returnValue(Promise.reject('error'));
    const warningSpy = spyOn(alertsService, 'addWarning');

    fixture.detectChanges();
    flushMicrotasks();

    expect(warningSpy).toHaveBeenCalledWith(
      'Failed to load certificate offerings.'
    );
    expect(component.certificateOfferings).toEqual([]);
    expect(component.isLoading).toBe(false);
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
          topic_ids: ['topic_1'],
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
    component.certificateOfferings = [makeCertificate('dummy_id')];
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

  it('should reset to the last page if deleting empties the current page', fakeAsync(() => {
    component.certificateOfferings = Array.from({length: 6}, (_, i) =>
      makeCertificate(`cert_${i}`)
    );
    component.currentPage = 2;
    spyOn(
      certificateAssessmentOfferingBackendApiService,
      'deleteCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.resolve());

    component.deleteCertificateOffering('cert_5');
    flushMicrotasks();

    expect(component.certificateOfferings.length).toBe(5);
    expect(component.totalPages).toBe(1);
    expect(component.currentPage).toBe(1);
  }));

  it('should show warning when certificate deletion fails and keep existing offerings', fakeAsync(() => {
    const initialOfferings = [makeCertificate('dummy_id', 'Certificate Title')];
    component.certificateOfferings = [...initialOfferings];
    const deleteSpy = spyOn(
      certificateAssessmentOfferingBackendApiService,
      'deleteCertificateAssessmentOfferingAsync'
    ).and.returnValue(Promise.reject('error'));
    const warningSpy = spyOn(alertsService, 'addWarning');

    void component.deleteCertificateOffering('dummy_id');
    flushMicrotasks();

    expect(deleteSpy).toHaveBeenCalledWith('dummy_id');
    expect(component.certificateOfferings).toEqual(initialOfferings);
    expect(warningSpy).toHaveBeenCalledWith('Failed to delete certificate.');
  }));

  describe('pagination', () => {
    beforeEach(() => {
      component.certificateOfferings = Array.from({length: 7}, (_, i) =>
        makeCertificate(`cert_${i}`)
      );
    });

    it('should compute total certificate offerings and total pages', () => {
      expect(component.totalCertificateOfferings).toBe(7);
      expect(component.totalPages).toBe(2);
    });

    it('should return 1 total page when there are no offerings', () => {
      component.certificateOfferings = [];
      expect(component.totalPages).toBe(1);
    });

    it('should paginate certificate offerings for the current page', () => {
      component.currentPage = 1;
      expect(component.paginatedCertificateOfferings.length).toBe(5);

      component.currentPage = 2;
      expect(component.paginatedCertificateOfferings.length).toBe(2);
    });

    it('should compute first and final certificate numbers for the current page', () => {
      component.currentPage = 1;
      expect(component.firstCertificateNumber).toBe(1);
      expect(component.finalCertificateNumber).toBe(5);

      component.currentPage = 2;
      expect(component.firstCertificateNumber).toBe(6);
      expect(component.finalCertificateNumber).toBe(7);
    });

    it('should return first certificate number 0 when there are no offerings', () => {
      component.certificateOfferings = [];
      expect(component.firstCertificateNumber).toBe(0);
    });

    it('should know whether it can go to the previous or next page', () => {
      component.currentPage = 1;
      expect(component.canGoToPreviousPage()).toBe(false);
      expect(component.canGoToNextPage()).toBe(true);

      component.currentPage = 2;
      expect(component.canGoToPreviousPage()).toBe(true);
      expect(component.canGoToNextPage()).toBe(false);
    });

    it('should go to the next page and stop at the last page', () => {
      component.currentPage = 1;
      component.goToNextPage();
      expect(component.currentPage).toBe(2);

      component.goToNextPage();
      expect(component.currentPage).toBe(2);
    });

    it('should go to the previous page and stop at the first page', () => {
      component.currentPage = 2;
      component.goToPreviousPage();
      expect(component.currentPage).toBe(1);

      component.goToPreviousPage();
      expect(component.currentPage).toBe(1);
    });
  });
});
