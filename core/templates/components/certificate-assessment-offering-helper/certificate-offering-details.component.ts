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

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {
  ClassroomBackendApiService,
  ClassroomSummaryDict,
} from 'domain/classroom/classroom-backend-api.service';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';
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
  styleUrls: ['./certificate-offering-details.component.css'],
})
export class CertificateOfferingDetailsComponent implements OnInit, OnChanges {
  readonly MAX_TITLE_LENGTH = 80;
  readonly MAX_DESCRIPTION_LENGTH = 500;
  readonly MIN_TIME_LIMIT_IN_MINUTES = 5;
  readonly MAX_TIME_LIMIT_IN_MINUTES = 60;
  readonly MIN_TOTAL_QUESTIONS = 3;
  readonly MAX_TOTAL_QUESTIONS = 50;
  readonly MAX_DEMONSTRATES_LENGTH = 200;

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
  isLoadingClassrooms: boolean = false;
  timeLimitInMinutes: number | null = null;
  totalQuestions: number | null = null;
  demonstratesList: string[] = [''];

  constructor(private classroomBackendApiService: ClassroomBackendApiService) {}

  ngOnInit(): void {
    this.setFormValues();
    this.loadClassrooms();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.certificateAssessmentOffering &&
      !changes.certificateAssessmentOffering.firstChange
    ) {
      this.setFormValues();
    }
  }

  async loadClassrooms(): Promise<void> {
    this.isLoadingClassrooms = true;
    try {
      this.classroomOptions =
        await this.classroomBackendApiService.getAllClassroomsSummaryAsync();
      this.classroomLoadErrorMessage = '';
    } catch (error: unknown) {
      console.error('Failed to load classrooms summary.', error);
      this.classroomOptions = [];
      this.classroomLoadErrorMessage =
        'Unable to load classrooms. Please try again.';
    } finally {
      this.isLoadingClassrooms = false;
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
        this.title.length <= this.MAX_TITLE_LENGTH &&
        this.description.trim() &&
        this.description.length <= this.MAX_DESCRIPTION_LENGTH &&
        this.classroomId &&
        this.timeLimitInMinutes &&
        this.timeLimitInMinutes >= this.MIN_TIME_LIMIT_IN_MINUTES &&
        this.timeLimitInMinutes <= this.MAX_TIME_LIMIT_IN_MINUTES &&
        this.totalQuestions &&
        this.totalQuestions >= this.MIN_TOTAL_QUESTIONS &&
        this.totalQuestions <= this.MAX_TOTAL_QUESTIONS &&
        normalizedDemonstrates.length > 0 &&
        normalizedDemonstrates.join('\n').length <= this.MAX_DEMONSTRATES_LENGTH
    );
  }

  getSelectedClassroomName(): string {
    const selectedClassroom = this.classroomOptions.find(
      classroom => classroom.classroom_id === this.classroomId
    );
    return selectedClassroom ? selectedClassroom.name : '';
  }

  getTitleValidationError(): string {
    if (this.title.length > this.MAX_TITLE_LENGTH) {
      return `Certificate title should contain at most ${this.MAX_TITLE_LENGTH} characters.`;
    }
    return '';
  }

  getDescriptionValidationError(): string {
    if (this.description.length > this.MAX_DESCRIPTION_LENGTH) {
      return `Certificate description should contain at most ${this.MAX_DESCRIPTION_LENGTH} characters.`;
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
      this.timeLimitInMinutes < this.MIN_TIME_LIMIT_IN_MINUTES
    ) {
      return `Time limit should be at least ${this.MIN_TIME_LIMIT_IN_MINUTES} minutes.`;
    }
    if (
      this.timeLimitInMinutes !== null &&
      this.timeLimitInMinutes !== undefined &&
      this.timeLimitInMinutes > this.MAX_TIME_LIMIT_IN_MINUTES
    ) {
      return `Time limit should be at most ${this.MAX_TIME_LIMIT_IN_MINUTES} minutes.`;
    }
    return '';
  }

  getTotalQuestionsValidationError(): string {
    if (
      this.totalQuestions !== null &&
      this.totalQuestions !== undefined &&
      this.totalQuestions < this.MIN_TOTAL_QUESTIONS
    ) {
      return `Total number of questions should be at least ${this.MIN_TOTAL_QUESTIONS}.`;
    }
    if (
      this.totalQuestions !== null &&
      this.totalQuestions !== undefined &&
      this.totalQuestions > this.MAX_TOTAL_QUESTIONS
    ) {
      return `Total number of questions should be at most ${this.MAX_TOTAL_QUESTIONS}.`;
    }
    return '';
  }

  isTimeLimitInvalid(): boolean {
    return (
      this.timeLimitInMinutes === null ||
      this.timeLimitInMinutes === undefined ||
      this.timeLimitInMinutes < this.MIN_TIME_LIMIT_IN_MINUTES ||
      this.timeLimitInMinutes > this.MAX_TIME_LIMIT_IN_MINUTES
    );
  }

  isTotalQuestionsInvalid(): boolean {
    return (
      this.totalQuestions === null ||
      this.totalQuestions === undefined ||
      this.totalQuestions < this.MIN_TOTAL_QUESTIONS ||
      this.totalQuestions > this.MAX_TOTAL_QUESTIONS
    );
  }

  getDemonstratesValidationError(): string {
    if (
      this.getNormalizedDemonstrates().join('\n').length >
      this.MAX_DEMONSTRATES_LENGTH
    ) {
      return `Learning outcomes should contain at most ${this.MAX_DEMONSTRATES_LENGTH} characters.`;
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
