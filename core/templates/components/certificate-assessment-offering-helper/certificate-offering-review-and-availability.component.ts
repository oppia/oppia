// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS-IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific
// language governing permissions and limitations under the
// License.

/**
 * @fileoverview Review step for certificate offering creation
 * and edit flows.
 */

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';

import './certificate-offering-review-and-availability.component.css';
// Shape of one difficulty bucket returned by the validation API.
// Matches /validate_certificate_assessment_offering_handler response.
export interface DifficultyValidation {
  required: number;
  available: number;
}

// Shape of one topic's validation result from the API.
export interface TopicValidationResult {
  easy: DifficultyValidation;
  medium: DifficultyValidation;
  hard: DifficultyValidation;
}

// Full validation_errors map: topic_id TopicValidationResult.
export interface ValidationErrors {
  [topicId: string]: TopicValidationResult;
}

// Derived row shape used by the template built from
// ValidationErrors + topic name map.
export interface TopicReadinessRow {
  topicId: string;
  topicName: string;
  easyAvailable: number;
  mediumAvailable: number;
  hardAvailable: number;
  easyRequired: number;
  mediumRequired: number;
  hardRequired: number;
  totalQuestions: number;
  totalRequiredQuestions: number;
  isReady: boolean;
  easySufficient: boolean;
  mediumSufficient: boolean;
  hardSufficient: boolean;
}

// Derived flat error message used in the 'What still needs to be fixed' list.
// Built from ValidationErrors.
export interface ReadinessErrorMessage {
  topicName: string;
  difficulty: string;
  available: number;
  required: number;
  // True if zero questions are available, and false if some are available but
  // still below the required threshold.
  isZero: boolean;
}

export interface ValidationResponse {
  is_valid: boolean;
  validation_errors: ValidationErrors;
  validation_message: string;
}

@Component({
  selector: 'oppia-certificate-offering-review-and-availability',
  templateUrl: './certificate-offering-review-and-availability.component.html',
  styleUrls: ['./certificate-offering-review-and-availability.component.css'],
})
export class CertificateOfferingReviewAndAvailabilityComponent
  implements OnInit
{
  @Input() certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();
  @Input() isEditMode: boolean = false;
  @Input() isCertificateValid: boolean = true;

  @Output() saveCertificateOffering = new EventEmitter<void>();
  @Output() navigateToAddTopicsSection = new EventEmitter<void>();
  @Output() isCertificateValidChange = new EventEmitter<boolean>();

  // Derived display data - rebuilt whenever inputs change.
  isValid: boolean = true;
  validationErrors: ValidationErrors = {};
  topicNameMap: {[topicId: string]: string} = {};
  validationMessage: string = '';
  topicReadinessRows: TopicReadinessRow[] = [];
  errorMessages: ReadinessErrorMessage[] = [];
  isLoadingValidation: boolean = false;

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService
  ) {}

  async ngOnInit(): Promise<void> {
    if (
      Object.keys(this.validationErrors).length > 0 ||
      Object.keys(this.topicNameMap).length > 0
    ) {
      this._buildDisplayData();
      return;
    }

    await this._loadValidationState();
  }

  async refreshValidationState(): Promise<void> {
    await this._loadValidationState();
  }

  private async _loadValidationState(): Promise<void> {
    this.isLoadingValidation = true;
    try {
      const classroomSummaries =
        await this.classroomBackendApiService.getAllClassroomsSummaryAsync();
      const selectedClassroom = classroomSummaries.find(
        classroom =>
          classroom.classroom_id ===
          this.certificateAssessmentOffering.classroomId
      );
      if (!selectedClassroom) {
        throw new Error('Selected classroom could not be found.');
      }
      const classroomData =
        await this.classroomBackendApiService.fetchClassroomDataAsync(
          selectedClassroom.url_fragment
        );
      const topicNameById: {[topicId: string]: string} = {};
      classroomData.getTopicSummaries().forEach(topic => {
        topicNameById[topic.getId()] = topic.getName();
      });
      this.topicNameMap = topicNameById;

      const topicIds = Object.keys(
        this.certificateAssessmentOffering.topicData || {}
      );
      const totalQuestions =
        this.certificateAssessmentOffering.totalQuestions || 0;
      const validationResponse =
        await this.certificateAssessmentOfferingBackendApiService.validateCertificateAssessmentOfferingAsync(
          topicIds,
          totalQuestions
        );
      this.validationErrors = validationResponse.validation_errors;
      this.isValid = validationResponse.is_valid;
      this.validationMessage = validationResponse.validation_message;
      this._buildDisplayData();
      this.isCertificateValidChange.emit(this.isValid);
    } catch (error: unknown) {
      this.isValid = false;
      this.validationErrors = {};
      this.validationMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to validate this certificate.';
      this._buildDisplayData();
      this.isCertificateValidChange.emit(this.isValid);
    } finally {
      this.isLoadingValidation = false;
    }
  }

  private _buildDisplayData(): void {
    this.topicReadinessRows = [];
    this.errorMessages = [];

    for (const topicId of Object.keys(this.validationErrors)) {
      const result = this.validationErrors[topicId];
      const topicName = this.topicNameMap[topicId] || topicId;

      const easySufficient = result.easy.available >= result.easy.required;
      const mediumSufficient =
        result.medium.available >= result.medium.required;
      const hardSufficient = result.hard.available >= result.hard.required;
      const isReady = easySufficient && mediumSufficient && hardSufficient;

      const totalQuestions =
        result.easy.available + result.medium.available + result.hard.available;
      const totalRequiredQuestions =
        result.easy.required + result.medium.required + result.hard.required;

      this.topicReadinessRows.push({
        topicId,
        topicName,
        easyAvailable: result.easy.available,
        mediumAvailable: result.medium.available,
        hardAvailable: result.hard.available,
        easyRequired: result.easy.required,
        mediumRequired: result.medium.required,
        hardRequired: result.hard.required,
        totalQuestions,
        totalRequiredQuestions,
        isReady,
        easySufficient,
        mediumSufficient,
        hardSufficient,
      });

      const difficulties: [string, DifficultyValidation, boolean][] = [
        ['Easy', result.easy, easySufficient],
        ['Medium', result.medium, mediumSufficient],
        ['Hard', result.hard, hardSufficient],
      ];

      for (const [label, data, sufficient] of difficulties) {
        if (!sufficient) {
          this.errorMessages.push({
            topicName,
            difficulty: label,
            available: data.available,
            required: data.required,
            isZero: data.available === 0,
          });
        }
      }
    }
  }

  getErrorText(error: ReadinessErrorMessage): string {
    if (error.isZero) {
      return `${error.topicName}: No ${error.difficulty.toLowerCase()} difficulty questions available`;
    }
    return `${error.topicName}: Only ${error.available} ${error.difficulty.toLowerCase()} questions (minimum ${error.required} required)`;
  }

  onSaveClicked(): void {
    this.saveCertificateOffering.emit();
  }

  onBackClicked(): void {
    this.navigateToAddTopicsSection.emit();
  }
}
