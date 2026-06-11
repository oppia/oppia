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
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {RouterTestingModule} from '@angular/router/testing';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AlertsService} from 'services/alerts.service';

import {CertificateOfferingDashboardPageComponent} from './certificate-offering-dashboard-page.component';
import {DeleteCertificateOfferingModalComponent} from 'components/certificate-assessment-offering-helper/delete-certificate-offering-modal.component';

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
