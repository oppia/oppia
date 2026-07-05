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

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';

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
  easy: number;
  medium: number;
  hard: number;
  totalQuestions: number;
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

@Component({
  selector: 'oppia-certificate-offering-review-and-availability',
  templateUrl: './certificate-offering-review-and-availability.component.html',
})
export class CertificateOfferingReviewAndAvailabilityComponent
  implements OnInit, OnChanges
{
  @Input() certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();
  @Input() isEditMode: boolean = false;
  @Input() isCertificateValid: boolean = true;
  @Input() useStubData: boolean = false;

  // These two inputs will be wired from the real validation API response.
  // TODO(##24717 - M1.13): Replace the stub path below with the backend contract once the
  // validation endpoint is implemented.
  @Input() isValid: boolean = true;
  @Input() validationErrors: ValidationErrors = {};

  // Map of topic_id to human-readable topic name.
  // Wired from real data.
  @Input() topicNameMap: {[topicId: string]: string} = {};

  @Output() saveCertificateOffering = new EventEmitter<void>();
  @Output() navigateToAddTopicsSection = new EventEmitter<void>();

  // Derived display data - rebuilt whenever inputs change.
  topicReadinessRows: TopicReadinessRow[] = [];
  errorMessages: ReadinessErrorMessage[] = [];

  // Stub data.
  // Mirrors the exact shape the validation API returns.
  // Replaced by real @Input() values.
  private readonly STUB_TOPIC_NAME_MAP: {
    [topicId: string]: string;
  } = {
    topic_adding_numbers: 'Adding Numbers',
    topic_fractions: 'Fractions',
    topic_percentages: 'Percentages',
  };

  private readonly STUB_IS_VALID: boolean = false;

  private readonly STUB_VALIDATION_ERRORS: ValidationErrors = {
    topic_adding_numbers: {
      easy: {required: 5, available: 5},
      medium: {required: 5, available: 8},
      hard: {required: 3, available: 4},
    },
    topic_fractions: {
      easy: {required: 5, available: 6},
      medium: {required: 10, available: 3},
      hard: {required: 3, available: 0},
    },
    topic_percentages: {
      easy: {required: 5, available: 4},
      medium: {required: 5, available: 5},
      hard: {required: 3, available: 2},
    },
  };

  ngOnInit(): void {
    if (this.useStubData) {
      this.validationErrors = this.STUB_VALIDATION_ERRORS;
      this.isValid = this.STUB_IS_VALID;
      this.topicNameMap = this.STUB_TOPIC_NAME_MAP;
    }
    this._buildDisplayData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.validationErrors || changes.topicNameMap) {
      this._buildDisplayData();
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

      this.topicReadinessRows.push({
        topicId,
        topicName,
        easy: result.easy.available,
        medium: result.medium.available,
        hard: result.hard.available,
        totalQuestions,
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

  getSaveButtonText(): string {
    return this.isEditMode ? 'Update Certificate' : 'Save Certificate';
  }

  onSaveClicked(): void {
    this.saveCertificateOffering.emit();
  }

  onBackClicked(): void {
    this.navigateToAddTopicsSection.emit();
  }
}
