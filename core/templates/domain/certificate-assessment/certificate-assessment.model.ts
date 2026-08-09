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
 * @fileoverview Interfaces for frontend certificate assessment domain objects.
 */

// The shape of each attempt summary mirrors the response returned by the
// CertificateAssessmentAttemptsHandler.
export interface CertificateAttemptSummary {
  attempt_id: string;
  classroom_id: string;
  title: string;
  total_score: number;
  attempt_index: number;
  started_at: string;
  is_submitted: boolean;
}

// The shape of the certificate assessment result, which is derived from the
// response returned by the certificate assessment result handler.
export interface AssessmentResult {
  certificateName: string;
  scorePercentage: number;
  topicBreakdown: AssessmentResultTopicWiseBreakdown[];
  timeTakenMinutes: number;
}

// The shape of the topic-wise breakdown shown on the certificate assessment
// result card.
export interface AssessmentResultTopicWiseBreakdown {
  topicName: string;
  scorePercentage: number;
}

// The shape of each certificate assessment question returned by the assessment
// player.
export type AssessmentQuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'text_input'
  | 'numeric_input';

export interface AssessmentQuestionOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  hint: string;
  options: AssessmentQuestionOption[];
  placeholder?: string;
  correctAnswerText: string;
}

// The shape of a recommended topic tile shown on the certificate assessment
// introduction card.
export interface RecommendedTopicStub {
  name: string;
  lessonCount: number;
  // Placeholder swatch shown instead of a topic thumbnail image.
  colorClass: string;
}
