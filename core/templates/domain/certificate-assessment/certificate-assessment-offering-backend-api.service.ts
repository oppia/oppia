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
 * @fileoverview Backend API service for certificate assessment offerings.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {CertificateAssessmentOfferingData} from './certificate-assessment-offering.model';
import {CertificateAssessmentDomainConstants} from './certificate-assessment-domain.constants';

interface CreateCertificateOfferingBackendResponse {
  certificate_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class CertificateAssessmentOfferingBackendApiService {
  constructor(private http: HttpClient) {}

  async createCertificateAssessmentOfferingAsync(
    certificateAssessmentOffering: CertificateAssessmentOfferingData
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http
        .post<CreateCertificateOfferingBackendResponse>(
          CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL,
          {}
        )
        .toPromise()
        .then(
          response => {
            resolve(response.certificate_id);
          },
          errorResponse => {
            reject(errorResponse?.error?.error || errorResponse.message);
          }
        );
    });
  }
}
