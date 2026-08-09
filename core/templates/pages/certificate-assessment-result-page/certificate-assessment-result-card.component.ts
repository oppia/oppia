// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the certificate assessment result card.
 */

import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AssessmentResultTopicWiseBreakdown} from './assessment-result-topic-wise-breakdown.component';

// The backend result response does not expose a pass/fail flag, so the pass
// state is derived from the total score using a 70% threshold.
const PASSING_SCORE_THRESHOLD = 70;

interface AssessmentResult {
  certificateName: string;
  scorePercentage: number;
  topicBreakdown: AssessmentResultTopicWiseBreakdown[];
  timeTakenMinutes: number | null;
}

@Component({
  selector: 'oppia-certificate-assessment-result-card-page',
  templateUrl: './certificate-assessment-result-card.component.html',
  styleUrls: ['./certificate-assessment-result-card.component.css'],
})
export class CertificateAssessmentResultCardComponent implements OnInit {
  @Input() attemptId = '';

  result: AssessmentResult | null = null;
  certificateId = '';
  isLoading = true;

  constructor(
    private router: Router,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService
  ) {}

  ngOnInit(): void {
    this.certificateAssessmentOfferingBackendApiService
      .getCertificateAssessmentResultAsync(this.attemptId)
      .then(resultData => {
        this.certificateId = resultData.certificate_id;
        this.result = {
          certificateName: resultData.title,
          scorePercentage: resultData.total_score,
          topicBreakdown: Object.entries(resultData.attempt_data).map(
            ([topicId, topicStats]) => ({
              topicName: topicStats.topic_name,
              scorePercentage: this.getTopicScorePercentage(
                topicStats.total_related_questions,
                topicStats.total_correct_questions
              ),
            })
          ),
          timeTakenMinutes: resultData.time_taken_in_minutes,
        };
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  get passed(): boolean {
    if (!this.result) {
      return false;
    }
    return this.result.scorePercentage >= PASSING_SCORE_THRESHOLD;
  }

  onRetryAssessment(): void {
    this.router.navigate([
      '/certificate-assessment',
      this.certificateId,
      'session',
    ]);
  }

  private getTopicScorePercentage(
    totalRelatedQuestions: number,
    totalCorrectQuestions: number
  ): number {
    if (totalRelatedQuestions === 0) {
      return 0;
    }
    return Math.round((totalCorrectQuestions / totalRelatedQuestions) * 100);
  }
}
