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
import {AssessmentResultTopicWiseBreakdown} from './assessment-result-topic-wise-breakdown.component';

// TODO(#24717-M1.17): Confirm the real result-endpoint contract. Until then we
// assume the backend returns `scorePercentage` and derive `passed` from a
// 70% threshold, rather than trusting an (unconfirmed) `passed` field.
const PASSING_SCORE_THRESHOLD = 70;

interface AssessmentResult {
  certificateName: string;
  scorePercentage: number;
  topicBreakdown: AssessmentResultTopicWiseBreakdown[];
  timeTakenMinutes: number;
}

@Component({
  selector: 'oppia-certificate-assessment-result-card-page',
  templateUrl: './certificate-assessment-result-card.component.html',
  styleUrls: ['./certificate-assessment-result-card.component.css'],
})
export class CertificateAssessmentResultCardComponent implements OnInit {
  @Input() attemptId = '';

  result: AssessmentResult | null = null;
  isLoading = true;

  ngOnInit(): void {
    // TODO(#24717-M1.17): Replace this mock with the real assessment result
    // backend response keyed on this.attemptId after the API is wired up.
    this.result = this.getMockResult();
    this.isLoading = false;
  }

  get passed(): boolean {
    if (!this.result) {
      return false;
    }
    return this.result.scorePercentage >= PASSING_SCORE_THRESHOLD;
  }

  onRetryAssessment(): void {
    // TODO(#24717-M1.17): Navigate back into the assessment retry flow.
  }

  private getMockResult(): AssessmentResult {
    // Keep a single stub result until the backend endpoint returns persisted
    // attempt data for this page.
    const MOCK_FAILED_RESULT: AssessmentResult = {
      certificateName: 'Everyday Arithmetic & Number Confidence',
      scorePercentage: 50,
      topicBreakdown: [
        {topicName: 'Place Values', scorePercentage: 48},
        {topicName: 'Addition & Subtraction', scorePercentage: 55},
        {topicName: 'Multiplication', scorePercentage: 65},
        {topicName: 'Division', scorePercentage: 33},
      ],
      timeTakenMinutes: 48,
    };

    return MOCK_FAILED_RESULT;
  }
}
