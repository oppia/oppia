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

import {Component} from '@angular/core';
import {
  CERTIFICATE_ATTEMPT_STATUSES,
  CertificateAttemptStatus,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import {CertificateAttemptSummary} from 'domain/certificate-assessment/certificate-assessment.model';
import './my-certificates-tab.component.css';

@Component({
  selector: 'oppia-my-certificates-tab',
  templateUrl: './my-certificates-tab.component.html',
  styleUrls: ['./my-certificates-tab.component.css'],
})

// TODO(#24717-M2.17): Replace the stub attempt data below with a real request
// to the certificate assessment attempts handler.
export class MyCertificatesTabComponent {
  PASSING_SCORE_THRESHOLD = 70;
  selectedFilter: CertificateAttemptStatus = CERTIFICATE_ATTEMPT_STATUSES.ALL;

  certificateAttempts: CertificateAttemptSummary[] = [
    {
      attempt_id: 'stub_attempt_id_1',
      classroom_id: 'math',
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 90,
      attempt_index: 1,
      started_at: '2026-01-15T08:30:00Z',
      is_submitted: true,
    },
    {
      attempt_id: 'stub_attempt_id_2',
      classroom_id: 'math',
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 85,
      attempt_index: 2,
      started_at: '2026-01-16T10:00:00Z',
      is_submitted: true,
    },
    {
      attempt_id: 'stub_attempt_id_3',
      classroom_id: 'math',
      title: 'Everyday Arithmetic & Number Confidence',
      total_score: 50,
      attempt_index: 3,
      started_at: '2026-01-17T09:15:00Z',
      is_submitted: true,
    },
  ];

  constructor() {}

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

  getSubject(classroomId: string): string {
    const subjectByClassroomId: Record<string, string> = {
      math: 'I18N_LIBRARY_CATEGORIES_MATHEMATICS',
      science: 'I18N_LIBRARY_CATEGORIES_SCIENCE',
    };
    return subjectByClassroomId[classroomId] || classroomId;
  }
}
