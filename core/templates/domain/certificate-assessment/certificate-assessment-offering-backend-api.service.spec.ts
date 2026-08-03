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
import {
  AvailableCertificateAssessmentOfferingData,
  CertificateAssessmentOfferingData,
} from './certificate-assessment-offering.model';
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
    mockCertificateOfferingData = new CertificateAssessmentOfferingData(
      '',
      'Stub Certificate',
      'Stub Description',
      'math_classroom_01',
      {topic_place_values: 1},
      1,
      1,
      ['Stub demonstration'],
      'Available',
      1
    );

    caos
      .createCertificateAssessmentOfferingAsync(mockCertificateOfferingData)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      title: 'Stub Certificate',
      description: 'Stub Description',
      classroom_id: 'math_classroom_01',
      topics: [{topic_id: 'topic_place_values'}],
      total_questions: 1,
      time_limit_in_minutes: 1,
      demonstrates: ['Stub demonstration'],
      async_status: 'Available',
    });
    req.flush({
      certificate_id: 'mock_certificate_id',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('mock_certificate_id');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch all certificate offerings', fakeAsync(() => {
    caos
      .getCertificateAssessmentOfferingsAsync()
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      certificate_offerings: [
        {
          certificate_id: 'mock_certificate_id',
          title: 'Sample Certificate',
          description: 'Sample Description',
          classroom_id: 'sample_classroom',
          topic_ids: ['topic_1', 'topic_2'],
          total_questions: 4,
          time_limit_in_minutes: 20,
          demonstrates: ['Sample skill'],
          async_status: 'Available',
          version: 1,
        },
      ],
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith([
      new CertificateAssessmentOfferingData(
        'mock_certificate_id',
        'Sample Certificate',
        'Sample Description',
        'sample_classroom',
        {
          topic_1: 1,
          topic_2: 1,
        },
        4,
        20,
        ['Sample skill'],
        'Available',
        1
      ),
    ]);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch available certificate offerings for a classroom', fakeAsync(() => {
    caos
      .getAvailableCertificateOfferingsForClassroomAsync('math_classroom_01')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.AVAILABLE_CERTIFICATE_ASSESSMENT_OFFERING_FOR_CLASSROOM_HANDLER_URL.replace(
        '<classroom_id>',
        'math_classroom_01'
      )
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      available_certificate_offerings: [
        {
          certificate_id: 'mock_certificate_id',
          title: 'Sample Certificate',
          attempt_status: 'Not Attempted',
        },
      ],
    });

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith([
      new AvailableCertificateAssessmentOfferingData(
        'mock_certificate_id',
        'Sample Certificate',
        'Not Attempted'
      ),
    ]);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use backend error if fetching available offerings for a classroom fails with a nested error message', fakeAsync(() => {
    caos
      .getAvailableCertificateOfferingsForClassroomAsync('math_classroom_01')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.AVAILABLE_CERTIFICATE_ASSESSMENT_OFFERING_FOR_CLASSROOM_HANDLER_URL.replace(
        '<classroom_id>',
        'math_classroom_01'
      )
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: {
          error: 'Error occurred while fetching classroom offerings.',
        },
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith({
      error: 'Error occurred while fetching classroom offerings.',
    });
  }));

  it('should fall back to the http error message if fetching available offerings for a classroom fails with no nested backend message', fakeAsync(() => {
    caos
      .getAvailableCertificateOfferingsForClassroomAsync('math_classroom_01')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.AVAILABLE_CERTIFICATE_ASSESSMENT_OFFERING_FOR_CLASSROOM_HANDLER_URL.replace(
        '<classroom_id>',
        'math_classroom_01'
      )
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      jasmine.stringMatching(
        /^Http failure response for .*: 500 Internal Server Error$/
      )
    );
  }));

  it('should include provided topic ids in the stub payload', fakeAsync(() => {
    mockCertificateOfferingData = new CertificateAssessmentOfferingData(
      '',
      'Sample Title',
      'Sample Description',
      'sample_classroom',
      {
        topic_1: 1,
        topic_2: 1,
      },
      3,
      15,
      [],
      'Available',
      1
    );

    caos
      .createCertificateAssessmentOfferingAsync(mockCertificateOfferingData)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    expect(req.request.body.topics).toEqual([
      {topic_id: 'topic_1'},
      {topic_id: 'topic_2'},
    ]);
    req.flush({
      certificate_id: 'mock_certificate_id',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('mock_certificate_id');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should forward the provided async status when creating', fakeAsync(() => {
    mockCertificateOfferingData = new CertificateAssessmentOfferingData(
      '',
      'Sample Title',
      'Sample Description',
      'sample_classroom',
      {topic_1: 1},
      3,
      15,
      ['Learn math'],
      'Not_Ready',
      1
    );

    caos
      .createCertificateAssessmentOfferingAsync(mockCertificateOfferingData)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.body.async_status).toEqual('Not_Ready');
    req.flush({certificate_id: 'mock_certificate_id'});

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

  it('should use rejection handler if fetching certificate offerings fails', fakeAsync(() => {
    caos
      .getCertificateAssessmentOfferingsAsync()
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      jasmine.stringMatching(
        /^Http failure response for .*: 500 Internal Server Error$/
      )
    );
  }));

  it('should fall back to the http error message if creation error has no nested backend message', fakeAsync(() => {
    caos
      .createCertificateAssessmentOfferingAsync(mockCertificateOfferingData)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      jasmine.stringMatching(
        /^Http failure response for .*: 500 Internal Server Error$/
      )
    );
  }));

  it('should successfully update a certificate assessment offering', fakeAsync(() => {
    mockCertificateOfferingData = new CertificateAssessmentOfferingData(
      '',
      'Stub Certificate',
      'Stub Description',
      'math_classroom_01',
      {topic_place_values: 1},
      1,
      1,
      ['Stub demonstration'],
      'Available',
      1
    );

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
    expect(req.request.body).toEqual({
      title: 'Stub Certificate',
      description: 'Stub Description',
      classroom_id: 'math_classroom_01',
      topics: [{topic_id: 'topic_place_values'}],
      total_questions: 1,
      time_limit_in_minutes: 1,
      demonstrates: ['Stub demonstration'],
      async_status: 'Available',
    });
    req.flush({
      certificate_id: 'mock_certificate_id',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('mock_certificate_id');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should include provided topic ids when updating a certificate assessment offering', fakeAsync(() => {
    mockCertificateOfferingData = new CertificateAssessmentOfferingData(
      '',
      'Sample Title',
      'Sample Description',
      'sample_classroom',
      {
        topic_1: 1,
        topic_2: 1,
      },
      3,
      15,
      [],
      'Available',
      1
    );

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
    expect(req.request.body.topics).toEqual([
      {topic_id: 'topic_1'},
      {topic_id: 'topic_2'},
    ]);
    req.flush({
      certificate_id: 'mock_certificate_id',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('mock_certificate_id');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should forward the provided async status when updating', fakeAsync(() => {
    mockCertificateOfferingData = new CertificateAssessmentOfferingData(
      '',
      'Sample Title',
      'Sample Description',
      'sample_classroom',
      {topic_1: 1},
      3,
      15,
      ['Learn math'],
      'Available',
      1
    );

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
    expect(req.request.body.async_status).toEqual('Available');
    req.flush({certificate_id: 'mock_certificate_id'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('mock_certificate_id');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch a certificate assessment offering', fakeAsync(() => {
    caos
      .getCertificateAssessmentOfferingAsync('mock_certificate_id')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL.replace(
        '<certificate_id>',
        'mock_certificate_id'
      )
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      certificate_offering: {
        certificate_id: 'mock_certificate_id',
        title: 'Fetched Title',
        description: 'Fetched Description',
        classroom_id: 'fetched_classroom',
        topic_data: {topic_1: 1},
        demonstrates: ['Fetched Demonstration'],
        total_questions: 4,
        time_limit_in_minutes: 20,
        async_status: 'Available',
        version: 3,
      },
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      jasmine.objectContaining({
        certificateId: 'mock_certificate_id',
        title: 'Fetched Title',
        description: 'Fetched Description',
        classroomId: 'fetched_classroom',
        topicData: {topic_1: 1},
        demonstrates: ['Fetched Demonstration'],
        totalQuestions: 4,
        timeLimitInMinutes: 20,
        asyncStatus: 'Available',
      })
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully validate a certificate assessment offering', fakeAsync(() => {
    caos
      .validateCertificateAssessmentOfferingAsync(['topic_1', 'topic_2'], 4)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      topic_ids: ['topic_1', 'topic_2'],
      total_questions: 4,
    });
    req.flush({
      is_valid: true,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      is_valid: true,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use backend error when validating and the error response has a nested message', fakeAsync(() => {
    caos
      .validateCertificateAssessmentOfferingAsync(['topic_1'], 2)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {
        error: {
          error: 'Error occurred while validating offering.',
        },
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith({
      error: 'Error occurred while validating offering.',
    });
  }));

  it('should fall back to the http error message when validating and the error response has no nested backend message', fakeAsync(() => {
    caos
      .validateCertificateAssessmentOfferingAsync(['topic_1'], 2)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      jasmine.stringMatching(
        /^Http failure response for .*: 500 Internal Server Error$/
      )
    );
  }));

  it('should use backend error if fetching fails with an error response body', fakeAsync(() => {
    caos
      .getCertificateAssessmentOfferingAsync('mock_certificate_id')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL.replace(
        '<certificate_id>',
        'mock_certificate_id'
      )
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: {
          error: 'Error occurred while fetching offering.',
        },
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith({
      error: 'Error occurred while fetching offering.',
    });
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
  it('should successfully validate a certificate assessment offering', fakeAsync(() => {
    caos
      .validateCertificateAssessmentOfferingAsync(['topic_1', 'topic_2'], 6)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      topic_ids: ['topic_1', 'topic_2'],
      total_questions: 6,
    });
    req.flush({
      is_valid: true,
      validation_errors: {},
      validation_message: 'Certificate assessment is valid.',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      is_valid: true,
      validation_errors: {},
      validation_message: 'Certificate assessment is valid.',
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should return validation errors when topics lack enough questions', fakeAsync(() => {
    caos
      .validateCertificateAssessmentOfferingAsync(['topic_1'], 3)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      topic_ids: ['topic_1'],
      total_questions: 3,
    });
    req.flush({
      is_valid: false,
      validation_errors: {
        topic_1: {
          easy: {required: 1, available: 0},
          medium: {required: 1, available: 1},
          hard: {required: 1, available: 1},
        },
      },
      validation_message:
        'topic_1 needs 3 unique questions but only 2 are available.',
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      jasmine.objectContaining({
        is_valid: false,
      })
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if validation fails', fakeAsync(() => {
    caos
      .validateCertificateAssessmentOfferingAsync(['topic_1'], 3)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {
        error: 'Error occurred while validating offering.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error occurred while validating offering.'
    );
  }));

  it('should fall back to the http error message if validation error has no nested backend message', fakeAsync(() => {
    caos
      .validateCertificateAssessmentOfferingAsync(['topic_1'], 3)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
    );
    req.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      jasmine.stringMatching(
        /^Http failure response for .*: 500 Internal Server Error$/
      )
    );
  }));
  it('should successfully fetch a certificate assessment result', fakeAsync(() => {
    caos
      .getCertificateAssessmentResultAsync('mock_attempt_id')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_RESULT_HANDLER_URL.replace(
        '<attempt_id>',
        'mock_attempt_id'
      )
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 80,
      attempt_data: {
        dummy_topic_id: {
          total_related_questions: 5,
          total_correct_questions: 4,
        },
      },
      is_submitted: true,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 80,
      attempt_data: {
        dummy_topic_id: {
          total_related_questions: 5,
          total_correct_questions: 4,
        },
      },
      is_submitted: true,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if fetching certificate assessment result fails', fakeAsync(() => {
    caos
      .getCertificateAssessmentResultAsync('mock_attempt_id')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_RESULT_HANDLER_URL.replace(
        '<attempt_id>',
        'mock_attempt_id'
      )
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error occurred while fetching result.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error occurred while fetching result.'
    );
  }));

  it('should successfully fetch certificate assessment attempts', fakeAsync(() => {
    caos
      .getCertificateAssessmentAttemptsAsync()
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_ATTEMPTS_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      attempts: [
        {
          attempt_id: 'dummy_attempt_id',
          classroom_id: 'dummy_classroom_id',
          title: 'Everyday Arithmetic & Number Confidence',
          total_score: 80,
          attempt_index: 1,
          started_at: '2026-07-18T00:00:00Z',
          is_submitted: true,
        },
      ],
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith([
      {
        attempt_id: 'dummy_attempt_id',
        classroom_id: 'dummy_classroom_id',
        title: 'Everyday Arithmetic & Number Confidence',
        total_score: 80,
        attempt_index: 1,
        started_at: '2026-07-18T00:00:00Z',
        is_submitted: true,
      },
    ]);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if fetching certificate assessment attempts fails', fakeAsync(() => {
    caos
      .getCertificateAssessmentAttemptsAsync()
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_ATTEMPTS_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error occurred while fetching attempts.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error occurred while fetching attempts.'
    );
  }));
});
