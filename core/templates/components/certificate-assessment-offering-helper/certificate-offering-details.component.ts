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
 * @fileoverview Details step for creating or editing a certificate offering.
 */

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {
  ClassroomBackendApiService,
  ClassroomSummaryDict,
} from 'domain/classroom/classroom-backend-api.service';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import './certificate-offering-details.component.css';

interface CertificateOfferingDetailsFormData {
  title: string;
  description: string;
  classroomId: string;
  classroomName: string;
  timeLimitInMinutes: number;
  totalQuestions: number;
  demonstrates: string[];
}

@Component({
  selector: 'oppia-certificate-offering-details',
  templateUrl: './certificate-offering-details.component.html',
})
export class CertificateOfferingDetailsComponent implements OnInit {
  readonly TITLE_MAX_LENGTH = 80;
  readonly DESCRIPTION_MAX_LENGTH = 500;
  readonly TIME_LIMIT_MAX_VALUE = 60;
  readonly TOTAL_QUESTIONS_MAX_VALUE = 50;
  readonly DEMONSTRATES_MAX_LENGTH = 200;

  @Input() certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();
  @Input() initialValues: CertificateOfferingDetailsFormData | null = null;
  @Output() certificateAssessmentOfferingChange =
    new EventEmitter<CertificateAssessmentOfferingData>();
  @Output() stepCompleted =
    new EventEmitter<CertificateOfferingDetailsFormData>();
  @Output() navigateToAddTopicsSection = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();

  title: string = '';
  description: string = '';
  classroomId: string = '';
  classroomOptions: ClassroomSummaryDict[] = [];
  classroomLoadErrorMessage: string = '';
  timeLimitInMinutes: number | null = null;
  totalQuestions: number | null = null;
  demonstratesList: string[] = [''];

  constructor(private classroomBackendApiService: ClassroomBackendApiService) {}

  ngOnInit(): void {
    this.setFormValues();
    this.loadClassrooms();
  }

  async loadClassrooms(): Promise<void> {
    try {
      this.classroomOptions =
        await this.classroomBackendApiService.getAllClassroomsSummaryAsync();
      this.classroomLoadErrorMessage = '';
    } catch (error: unknown) {
      console.error('Failed to load classrooms summary.', error);
      this.classroomOptions = [];
      this.classroomLoadErrorMessage =
        'Unable to load classrooms. Please try again.';
    }
  }

  setFormValues(): void {
    if (this.initialValues) {
      this.title = this.initialValues.title;
      this.description = this.initialValues.description;
      this.classroomId = this.initialValues.classroomId;
      this.timeLimitInMinutes = this.initialValues.timeLimitInMinutes;
      this.totalQuestions = this.initialValues.totalQuestions;
      this.demonstratesList = this.initialValues.demonstrates.length
        ? [...this.initialValues.demonstrates]
        : [''];
      return;
    }

    this.title = this.certificateAssessmentOffering.title;
    this.description = this.certificateAssessmentOffering.description;
    this.classroomId = this.certificateAssessmentOffering.classroomId;
    this.timeLimitInMinutes =
      this.certificateAssessmentOffering.timeLimitInMinutes || null;
    this.totalQuestions =
      this.certificateAssessmentOffering.totalQuestions || null;
    this.demonstratesList = this.certificateAssessmentOffering.demonstrates
      .length
      ? [...this.certificateAssessmentOffering.demonstrates]
      : [''];
  }

  addOutcome(): void {
    this.demonstratesList.push('');
  }

  removeOutcome(index: number): void {
    if (this.demonstratesList.length > 1) {
      this.demonstratesList.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  private getNormalizedDemonstrates(): string[] {
    return this.demonstratesList
      .map(outcome => outcome.trim())
      .filter(outcome => outcome.length > 0);
  }

  isFormValid(): boolean {
    const normalizedDemonstrates = this.getNormalizedDemonstrates();
    return Boolean(
      this.title.trim() &&
        this.title.length <= this.TITLE_MAX_LENGTH &&
        this.description.trim() &&
        this.description.length <= this.DESCRIPTION_MAX_LENGTH &&
        this.classroomId &&
        this.timeLimitInMinutes &&
        this.timeLimitInMinutes > 0 &&
        this.timeLimitInMinutes <= this.TIME_LIMIT_MAX_VALUE &&
        this.totalQuestions &&
        this.totalQuestions > 0 &&
        this.totalQuestions <= this.TOTAL_QUESTIONS_MAX_VALUE &&
        normalizedDemonstrates.length > 0 &&
        normalizedDemonstrates.join('\n').length <= this.DEMONSTRATES_MAX_LENGTH
    );
  }

  getSelectedClassroomName(): string {
    const selectedClassroom = this.classroomOptions.find(
      classroom => classroom.classroom_id === this.classroomId
    );
    return selectedClassroom ? selectedClassroom.name : '';
  }

  getTitleValidationError(): string {
    if (this.title.length > this.TITLE_MAX_LENGTH) {
      return `Certificate title should contain at most ${this.TITLE_MAX_LENGTH} characters.`;
    }
    return '';
  }

  getDescriptionValidationError(): string {
    if (this.description.length > this.DESCRIPTION_MAX_LENGTH) {
      return `Certificate description should contain at most ${this.DESCRIPTION_MAX_LENGTH} characters.`;
    }
    return '';
  }

  getClassroomValidationError(): string {
    if (!this.classroomId) {
      return '';
    }
    if (
      !this.classroomOptions.some(
        classroom => classroom.classroom_id === this.classroomId
      )
    ) {
      return 'Please select a valid classroom.';
    }
    return '';
  }

  getTimeLimitValidationError(): string {
    if (
      this.timeLimitInMinutes !== null &&
      this.timeLimitInMinutes !== undefined &&
      this.timeLimitInMinutes > this.TIME_LIMIT_MAX_VALUE
    ) {
      return `Time limit should be at most ${this.TIME_LIMIT_MAX_VALUE} minutes.`;
    }
    return '';
  }

  getTotalQuestionsValidationError(): string {
    if (
      this.totalQuestions !== null &&
      this.totalQuestions !== undefined &&
      this.totalQuestions > this.TOTAL_QUESTIONS_MAX_VALUE
    ) {
      return `Total number of questions should be at most ${this.TOTAL_QUESTIONS_MAX_VALUE}.`;
    }
    return '';
  }

  isTimeLimitInvalid(): boolean {
    return (
      this.timeLimitInMinutes === null ||
      this.timeLimitInMinutes === undefined ||
      this.timeLimitInMinutes <= 0 ||
      this.timeLimitInMinutes > this.TIME_LIMIT_MAX_VALUE
    );
  }

  isTotalQuestionsInvalid(): boolean {
    return (
      this.totalQuestions === null ||
      this.totalQuestions === undefined ||
      this.totalQuestions <= 0 ||
      this.totalQuestions > this.TOTAL_QUESTIONS_MAX_VALUE
    );
  }

  getDemonstratesValidationError(): string {
    if (
      this.getNormalizedDemonstrates().join('\n').length >
      this.DEMONSTRATES_MAX_LENGTH
    ) {
      return `Learning outcomes should contain at most ${this.DEMONSTRATES_MAX_LENGTH} characters.`;
    }
    return '';
  }

  getFormData(): CertificateOfferingDetailsFormData {
    const normalizedDemonstrates = this.getNormalizedDemonstrates();
    return {
      title: this.title.trim(),
      description: this.description.trim(),
      classroomId: this.classroomId,
      classroomName: this.getSelectedClassroomName(),
      timeLimitInMinutes: this.timeLimitInMinutes || 0,
      totalQuestions: this.totalQuestions || 0,
      demonstrates: normalizedDemonstrates,
    };
  }

  onNextClicked(): void {
    if (!this.isFormValid()) {
      return;
    }

    const formData = this.getFormData();
    this.certificateAssessmentOffering.title = formData.title;
    this.certificateAssessmentOffering.description = formData.description;
    this.certificateAssessmentOffering.classroomId = formData.classroomId;
    this.certificateAssessmentOffering.timeLimitInMinutes =
      formData.timeLimitInMinutes;
    this.certificateAssessmentOffering.totalQuestions = formData.totalQuestions;
    this.certificateAssessmentOffering.demonstrates = [
      ...formData.demonstrates,
    ];

    this.stepCompleted.emit(formData);
    this.certificateAssessmentOfferingChange.emit(
      this.certificateAssessmentOffering
    );
    this.navigateToAddTopicsSection.emit();
  }

  onCancelClicked(): void {
    this.cancelClicked.emit();
  }
}
