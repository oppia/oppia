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

import {
  AvailableCertificateAssessmentOfferingBackendDict,
  AvailableCertificateAssessmentOfferingData,
  CertificateAssessmentOfferingBackendDict,
  CertificateAssessmentOfferingData,
} from './certificate-assessment-offering.model';
import {CertificateAssessmentDomainConstants} from './certificate-assessment-domain.constants';

interface CreateCertificateOfferingBackendResponse {
  certificate_id: string;
}

interface UpdateCertificateOfferingBackendResponse {
  certificate_id: string;
}

interface ValidateCertificateAssessmentOfferingBackendResponse {
  is_valid: boolean;
  validation_errors: {
    [topicId: string]: {
      easy: {required: number; available: number};
      medium: {required: number; available: number};
      hard: {required: number; available: number};
    };
  };
  validation_message: string;
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

interface GetCertificateOfferingsBackendResponse {
  certificate_offerings: CertificateAssessmentOfferingBackendDict[];
}

interface GetAvailableCertificateOfferingsForClassroomBackendResponse {
  available_certificate_offerings: AvailableCertificateAssessmentOfferingBackendDict[];
}
interface CertificateAssessmentTopicScoreBackendDict {
  total_related_questions: number;
  total_correct_questions: number;
}

interface GetCertificateAssessmentResultBackendResponse {
  title: string;
  total_score: number;
  attempt_data: {[topicId: string]: CertificateAssessmentTopicScoreBackendDict};
  is_submitted: boolean;
}

interface CertificateAssessmentAttemptSummaryBackendDict {
  attempt_id: string;
  classroom_id: string;
  title: string;
  total_score: number;
  attempt_index: number;
  started_at: string;
  is_submitted: boolean;
}

interface GetCertificateAssessmentAttemptsBackendResponse {
  attempts: CertificateAssessmentAttemptSummaryBackendDict[];
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

  private getAvailableCertificateOfferingsForClassroomHandlerUrl(
    classroomId: string
  ): string {
    return CertificateAssessmentDomainConstants.AVAILABLE_CERTIFICATE_ASSESSMENT_OFFERING_FOR_CLASSROOM_HANDLER_URL.replace(
      '<classroom_id>',
      classroomId
    );
  }

  private getResultHandlerUrl(attemptId: string): string {
    return CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_RESULT_HANDLER_URL.replace(
      '<attempt_id>',
      attemptId
    );
  }

  async getCertificateAssessmentOfferingsAsync(): Promise<
    CertificateAssessmentOfferingData[]
  > {
    return new Promise((resolve, reject) => {
      this.http
        .get<GetCertificateOfferingsBackendResponse>(
          CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL
        )
        .toPromise()
        .then(
          response => {
            resolve(
              response.certificate_offerings.map(
                certificateOfferingBackendDict => {
                  const topicData: {
                    [topicId: string]: number;
                  } = {};
                  for (const topicId of certificateOfferingBackendDict.topic_ids) {
                    topicData[topicId] = 1;
                  }
                  return CertificateAssessmentOfferingData.createFromBackendDict(
                    {
                      certificate_id:
                        certificateOfferingBackendDict.certificate_id,
                      title: certificateOfferingBackendDict.title,
                      description: certificateOfferingBackendDict.description,
                      classroom_id: certificateOfferingBackendDict.classroom_id,
                      topic_ids: certificateOfferingBackendDict.topic_ids,
                      topic_data: topicData,
                      demonstrates: certificateOfferingBackendDict.demonstrates,
                      total_questions:
                        certificateOfferingBackendDict.total_questions,
                      time_limit_in_minutes:
                        certificateOfferingBackendDict.time_limit_in_minutes,
                      async_status: certificateOfferingBackendDict.async_status,
                      version: certificateOfferingBackendDict.version,
                    }
                  );
                }
              )
            );
          },
          errorResponse => {
            reject(errorResponse?.error?.error || errorResponse.message);
          }
        );
    });
  }

  async getCertificateAssessmentOfferingAsync(
    certificateId: string
  ): Promise<CertificateAssessmentOfferingData> {
    try {
      const response = await this.http
        .get<GetCertificateOfferingBackendResponse>(
          this.getCertificateOfferingByIdHandlerUrl(certificateId)
        )
        .toPromise();
      return CertificateAssessmentOfferingData.createFromBackendDict({
        certificate_id: response.certificate_offering.certificate_id,
        title: response.certificate_offering.title,
        description: response.certificate_offering.description,
        classroom_id: response.certificate_offering.classroom_id,
        topic_ids: Object.keys(response.certificate_offering.topic_data),
        topic_data: response.certificate_offering.topic_data,
        demonstrates: response.certificate_offering.demonstrates,
        total_questions: response.certificate_offering.total_questions,
        time_limit_in_minutes:
          response.certificate_offering.time_limit_in_minutes,
        async_status: response.certificate_offering.async_status,
        version: response.certificate_offering.version,
      });
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }

  async createCertificateAssessmentOfferingAsync(
    certificateAssessmentOffering: CertificateAssessmentOfferingData
  ): Promise<string> {
    const topicIds = Object.keys(certificateAssessmentOffering.topicData || {});
    try {
      const response = await this.http
        .post<CreateCertificateOfferingBackendResponse>(
          CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL,
          {
            title: certificateAssessmentOffering.title,
            description: certificateAssessmentOffering.description,
            classroom_id: certificateAssessmentOffering.classroomId,
            topics: topicIds.map(topicId => ({
              topic_id: topicId,
            })),
            total_questions: certificateAssessmentOffering.totalQuestions,
            time_limit_in_minutes:
              certificateAssessmentOffering.timeLimitInMinutes,
            demonstrates: certificateAssessmentOffering.demonstrates,
            async_status: certificateAssessmentOffering.asyncStatus,
          }
        )
        .toPromise();
      return response.certificate_id;
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }

  async updateCertificateAssessmentOfferingAsync(
    certificateId: string,
    certificateAssessmentOffering: CertificateAssessmentOfferingData
  ): Promise<string> {
    const topicIds = Object.keys(certificateAssessmentOffering.topicData || {});
    try {
      const response = await this.http
        .put<UpdateCertificateOfferingBackendResponse>(
          this.getCertificateOfferingByIdHandlerUrl(certificateId),
          {
            title: certificateAssessmentOffering.title,
            description: certificateAssessmentOffering.description,
            classroom_id: certificateAssessmentOffering.classroomId,
            topics: topicIds.map(topicId => ({
              topic_id: topicId,
            })),
            total_questions: certificateAssessmentOffering.totalQuestions,
            time_limit_in_minutes:
              certificateAssessmentOffering.timeLimitInMinutes,
            demonstrates: certificateAssessmentOffering.demonstrates,
            async_status: certificateAssessmentOffering.asyncStatus,
          }
        )
        .toPromise();
      return response.certificate_id;
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }

  async deleteCertificateAssessmentOfferingAsync(
    certificateId: string
  ): Promise<void> {
    try {
      await this.http
        .delete<void>(this.getCertificateOfferingByIdHandlerUrl(certificateId))
        .toPromise();
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }

  async validateCertificateAssessmentOfferingAsync(
    topicIds: string[],
    totalQuestions: number
  ): Promise<ValidateCertificateAssessmentOfferingBackendResponse> {
    try {
      const response = await this.http
        .post<ValidateCertificateAssessmentOfferingBackendResponse>(
          CertificateAssessmentDomainConstants.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL,
          {
            topic_ids: topicIds,
            total_questions: totalQuestions,
          }
        )
        .toPromise();
      return response;
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }

  async getAvailableCertificateOfferingsForClassroomAsync(
    classroomId: string
  ): Promise<AvailableCertificateAssessmentOfferingData[]> {
    try {
      const response = await this.http
        .get<GetAvailableCertificateOfferingsForClassroomBackendResponse>(
          this.getAvailableCertificateOfferingsForClassroomHandlerUrl(
            classroomId
          )
        )
        .toPromise();

      return response.available_certificate_offerings.map(offering =>
        AvailableCertificateAssessmentOfferingData.createFromBackendDict(
          offering
        )
      );
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }

  async getCertificateAssessmentResultAsync(
    attemptId: string
  ): Promise<GetCertificateAssessmentResultBackendResponse> {
    try {
      const response = await this.http
        .get<GetCertificateAssessmentResultBackendResponse>(
          this.getResultHandlerUrl(attemptId)
        )
        .toPromise();
      return response;
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }

  async getCertificateAssessmentAttemptsAsync(): Promise<
    CertificateAssessmentAttemptSummaryBackendDict[]
  > {
    try {
      const response = await this.http
        .get<GetCertificateAssessmentAttemptsBackendResponse>(
          CertificateAssessmentDomainConstants.CERTIFICATE_ASSESSMENT_ATTEMPTS_HANDLER_URL
        )
        .toPromise();
      return response.attempts;
    } catch (errorResponse) {
      throw errorResponse?.error?.error || errorResponse.message;
    }
  }
}
