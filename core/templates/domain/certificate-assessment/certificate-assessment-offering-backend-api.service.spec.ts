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
 * @fileoverview Unit tests for CertificateAssessmentOfferingBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {CertificateAssessmentOfferingBackendApiService} from './certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingData} from './certificate-assessment-offering.model';
import {CertificateAssessmentDomainConstants} from './certificate-assessment-domain.constants';

describe('Certificate Assessment Offering backend api service', () => {
  let caos: CertificateAssessmentOfferingBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  let mockCertificateOfferingData: CertificateAssessmentOfferingData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    caos = TestBed.inject(CertificateAssessmentOfferingBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    // Mocking an empty object or placeholder data as the payload structure is managed by its model.
    mockCertificateOfferingData = {} as CertificateAssessmentOfferingData;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create a certificate assessment offering', fakeAsync(() => {
    caos
      .createCertificateAssessmentOfferingAsync(mockCertificateOfferingData)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({});
    req.flush({
      certificate_id: 'mock_certificate_id',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('mock_certificate_id');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if creation of certificate assessment offering fails', fakeAsync(() => {
    caos
      .createCertificateAssessmentOfferingAsync(mockCertificateOfferingData)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {
        error: 'Error occurred while creating offering.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error occurred while creating offering.'
    );
  }));

  it('should successfully update a certificate assessment offering', fakeAsync(() => {
    caos
      .updateCertificateAssessmentOfferingAsync(
        'mock_certificate_id',
        mockCertificateOfferingData
      )
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL.replace(
        '<certificate_id>',
        'mock_certificate_id'
      )
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({});
    req.flush({
      certificate_id: 'mock_certificate_id',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('mock_certificate_id');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if update fails', fakeAsync(() => {
    caos
      .updateCertificateAssessmentOfferingAsync(
        'mock_certificate_id',
        mockCertificateOfferingData
      )
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL.replace(
        '<certificate_id>',
        'mock_certificate_id'
      )
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {
        error: 'Error occurred while updating offering.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error occurred while updating offering.'
    );
  }));

  it('should successfully delete a certificate assessment offering', fakeAsync(() => {
    caos
      .deleteCertificateAssessmentOfferingAsync('mock_certificate_id')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL.replace(
        '<certificate_id>',
        'mock_certificate_id'
      )
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if deletion fails', fakeAsync(() => {
    caos
      .deleteCertificateAssessmentOfferingAsync('mock_certificate_id')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL.replace(
        '<certificate_id>',
        'mock_certificate_id'
      )
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush(
      {
        error: 'Error occurred while deleting offering.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error occurred while deleting offering.'
    );
  }));
});
