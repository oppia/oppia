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
 * @fileoverview Component for my certificates tab in the Learner Dashboard page.
 */

import {Component, OnInit} from '@angular/core';
import {
  CERTIFICATE_ATTEMPT_STATUSES,
  CertificateAttemptStatus,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAttemptSummary} from 'domain/certificate-assessment/certificate-assessment.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import './my-certificates-tab.component.css';

@Component({
  selector: 'oppia-my-certificates-tab',
  templateUrl: './my-certificates-tab.component.html',
  styleUrls: ['./my-certificates-tab.component.css'],
})
export class MyCertificatesTabComponent implements OnInit {
  PASSING_SCORE_THRESHOLD = 80;
  selectedFilter: CertificateAttemptStatus = CERTIFICATE_ATTEMPT_STATUSES.ALL;

  certificateAttempts: CertificateAttemptSummary[] = [];
  classroomIdToNameMap: Record<string, string> = {};
  isLoading = true;

  constructor(
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private classroomBackendApiService: ClassroomBackendApiService
  ) {}

  ngOnInit(): void {
    this.certificateAssessmentOfferingBackendApiService
      .getCertificateAssessmentAttemptsAsync()
      .then(attempts => {
        this.certificateAttempts = this.sortAttemptsByRecency(attempts);
        const classroomIds = [
          ...new Set(attempts.map(attempt => attempt.classroom_id)),
        ];
        return Promise.all(
          classroomIds.map(classroomId =>
            this.classroomBackendApiService
              .getClassroomDataAsync(classroomId)
              .then(response => {
                this.classroomIdToNameMap[classroomId] =
                  response.classroomDict.name;
              })
              .catch(() => {
                this.classroomIdToNameMap[classroomId] = '';
              })
          )
        );
      })
      .catch(() => {
        this.certificateAttempts = [];
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  get filteredAttempts(): CertificateAttemptSummary[] {
    if (this.selectedFilter === CERTIFICATE_ATTEMPT_STATUSES.PASSED) {
      return this.certificateAttempts.filter(attempt => this.isPassed(attempt));
    }
    if (this.selectedFilter === CERTIFICATE_ATTEMPT_STATUSES.NOT_PASSED) {
      return this.certificateAttempts.filter(
        attempt => !this.isPassed(attempt)
      );
    }
    return this.certificateAttempts;
  }

  onFilterChange(event: Event): void {
    this.selectedFilter = (event.target as HTMLSelectElement)
      .value as CertificateAttemptStatus;
  }

  isPassed(attempt: CertificateAttemptSummary): boolean {
    return attempt.total_score >= this.PASSING_SCORE_THRESHOLD;
  }

  getStatusLabel(attempt: CertificateAttemptSummary): string {
    return this.isPassed(attempt)
      ? 'I18N_LEARNER_DASHBOARD_MY_CERTIFICATES_PASSED'
      : 'I18N_LEARNER_DASHBOARD_MY_CERTIFICATES_NOT_PASSED';
  }

  getSubjectName(classroomId: string): string {
    return this.classroomIdToNameMap[classroomId] || '';
  }

  private sortAttemptsByRecency(
    attempts: CertificateAttemptSummary[]
  ): CertificateAttemptSummary[] {
    return attempts
      .slice()
      .sort(
        (firstAttempt, secondAttempt) =>
          new Date(secondAttempt.started_at).getTime() -
          new Date(firstAttempt.started_at).getTime()
      );
  }
}
