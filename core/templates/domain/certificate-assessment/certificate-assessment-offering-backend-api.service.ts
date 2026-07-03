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

interface UpdateCertificateOfferingBackendResponse {
  certificate_id: string;
}

interface GetCertificateOfferingBackendResponse {
  certificate_offering: {
    certificate_id: string;
    title: string;
    description: string;
    classroom_id: string;
    topic_data: {
      [topicId: string]: number;
    };
    demonstrates: string[];
    total_questions: number;
    time_limit_in_minutes: number;
    async_status: string;
    version: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CertificateAssessmentOfferingBackendApiService {
  constructor(private http: HttpClient) {}

  private getCertificateOfferingByIdHandlerUrl(certificateId: string): string {
    return CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL.replace(
      '<certificate_id>',
      certificateId
    );
  }

  async getCertificateAssessmentOfferingAsync(
    certificateId: string
  ): Promise<CertificateAssessmentOfferingData> {
    return new Promise((resolve, reject) => {
      this.http
        .get<GetCertificateOfferingBackendResponse>(
          this.getCertificateOfferingByIdHandlerUrl(certificateId)
        )
        .toPromise()
        .then(
          response => {
            resolve(
              CertificateAssessmentOfferingData.createFromBackendDict({
                certificate_id: response.certificate_offering.certificate_id,
                title: response.certificate_offering.title,
                description: response.certificate_offering.description,
                classroom_id: response.certificate_offering.classroom_id,
                topic_data: response.certificate_offering.topic_data,
                demonstrates: response.certificate_offering.demonstrates,
                total_questions: response.certificate_offering.total_questions,
                time_limit_in_minutes:
                  response.certificate_offering.time_limit_in_minutes,
                async_status: response.certificate_offering.async_status,
                version: response.certificate_offering.version,
              })
            );
          },
          errorResponse => {
            reject(errorResponse?.error?.error || errorResponse.message);
          }
        );
    });
  }

  async createCertificateAssessmentOfferingAsync(
    certificateAssessmentOffering: CertificateAssessmentOfferingData
  ): Promise<string> {
    const topicIds = Object.keys(certificateAssessmentOffering.topicData || {});
    return new Promise((resolve, reject) => {
      // TODO(#24717-M1.14): Replace this temporary stub payload with the real create
      // request once the end-to-end certificate offering wiring is in place.
      this.http
        .post<CreateCertificateOfferingBackendResponse>(
          CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL,
          {
            title: certificateAssessmentOffering.title || 'Stub Certificate',
            description:
              certificateAssessmentOffering.description || 'Stub Description',
            classroom_id:
              certificateAssessmentOffering.classroomId || 'math_classroom_01',
            topics:
              topicIds.length > 0
                ? topicIds.map(topicId => ({topic_id: topicId}))
                : [{topic_id: 'topic_place_values'}],
            total_questions: certificateAssessmentOffering.totalQuestions || 1,
            time_limit_in_minutes:
              certificateAssessmentOffering.timeLimitInMinutes || 1,
            demonstrates: ['Stub demonstration'],
            async_status:
              certificateAssessmentOffering.asyncStatus || 'Available',
          }
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

  async updateCertificateAssessmentOfferingAsync(
    certificateId: string,
    certificateAssessmentOffering: CertificateAssessmentOfferingData
  ): Promise<string> {
    const topicIds = Object.keys(certificateAssessmentOffering.topicData || {});
    return new Promise((resolve, reject) => {
      // TODO(#24717-M1.14): Replace the temporary stub fallbacks in this
      // request with the real edit-form values once the M1.14 wiring is done.
      this.http
        .put<UpdateCertificateOfferingBackendResponse>(
          this.getCertificateOfferingByIdHandlerUrl(certificateId),
          {
            title: certificateAssessmentOffering.title || 'Stub Certificate',
            description:
              certificateAssessmentOffering.description || 'Stub Description',
            classroom_id:
              certificateAssessmentOffering.classroomId || 'math_classroom_01',
            topics:
              topicIds.length > 0
                ? topicIds.map(topicId => ({topic_id: topicId}))
                : [{topic_id: 'topic_place_values'}],
            total_questions: certificateAssessmentOffering.totalQuestions || 1,
            time_limit_in_minutes:
              certificateAssessmentOffering.timeLimitInMinutes || 1,
            demonstrates: ['Stub demonstration'],
            async_status:
              certificateAssessmentOffering.asyncStatus || 'Available',
          }
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

  async deleteCertificateAssessmentOfferingAsync(
    certificateId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .delete<void>(this.getCertificateOfferingByIdHandlerUrl(certificateId))
        .toPromise()
        .then(
          () => {
            resolve();
          },
          errorResponse => {
            reject(errorResponse?.error?.error || errorResponse.message);
          }
        );
    });
  }
}
