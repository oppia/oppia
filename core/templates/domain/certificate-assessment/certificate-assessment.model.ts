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
 * @fileoverview Frontend models and interfaces for certificate assessment
 * domain objects.
 */

import {StateBackendDict} from 'domain/state/state.model';

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

/** The interaction type of an assessment question. */
export type AssessmentQuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'text_input'
  | 'numeric_input'
  | 'fraction_input'
  | 'number_with_units'
  | 'drag_and_drop_sort'
  | 'image_click';

/** Named constants for AssessmentQuestionType values. */
export const AssessmentQuestionTypes = {
  MULTIPLE_CHOICE: 'multiple_choice' as const,
  MULTIPLE_SELECT: 'multiple_select' as const,
  TEXT_INPUT: 'text_input' as const,
  NUMERIC_INPUT: 'numeric_input' as const,
  FRACTION_INPUT: 'fraction_input' as const,
  NUMBER_WITH_UNITS: 'number_with_units' as const,
  DRAG_AND_DROP_SORT: 'drag_and_drop_sort' as const,
  IMAGE_CLICK: 'image_click' as const,
};

/** An answer choice within an assessment question. */
export interface AssessmentQuestionOption {
  /** Unique identifier for this option (content id). */
  id: string;
  /** The choice's rich-text HTML, rendered via oppia-rte-output-display. */
  text: string;
  /** The index of the option in the question's stored choice list. This is
   *  the value submitted for multiple-choice questions, so it is independent
   *  of any on-screen reordering of the choices. */
  index: number;
}

/** A fully-resolved assessment question rendered by the conversation skin. */
export interface AssessmentQuestion {
  /** The question's unique identifier. */
  id: string;
  /** The interaction type determining how the question is rendered. */
  type: AssessmentQuestionType;
  /** The question's rich-text HTML, rendered via oppia-rte-output-display. */
  prompt: string;
  /** Hint text shown to the learner on request. */
  hint: string;
  /** Available answer choices (empty for free-response questions). */
  options: AssessmentQuestionOption[];
  /** Input placeholder text for free-response questions. */
  placeholder?: string;
  /** The raw state backend dict used by AnswerClassificationService to
   *  evaluate correctness via the interaction's rule functions. */
  stateData: StateBackendDict;
}

/** Converts an interaction id from the backend into the narrower assessment
 *  question type union used by the frontend model. */
export function getAssessmentQuestionType(
  interactionId: string
): AssessmentQuestionType {
  switch (interactionId) {
    case 'MultipleChoiceInput':
      return AssessmentQuestionTypes.MULTIPLE_CHOICE;
    case 'ItemSelectionInput':
      return AssessmentQuestionTypes.MULTIPLE_SELECT;
    case 'TextInput':
      return AssessmentQuestionTypes.TEXT_INPUT;
    case 'NumericInput':
      return AssessmentQuestionTypes.NUMERIC_INPUT;
    case 'FractionInput':
      return AssessmentQuestionTypes.FRACTION_INPUT;
    case 'NumberWithUnits':
      return AssessmentQuestionTypes.NUMBER_WITH_UNITS;
    case 'DragAndDropSortInput':
      return AssessmentQuestionTypes.DRAG_AND_DROP_SORT;
    case 'ImageClickInput':
      return AssessmentQuestionTypes.IMAGE_CLICK;
    default:
      return AssessmentQuestionTypes.TEXT_INPUT;
  }
}

/** Converts question state data returned by the certificate question handler
 *  into the AssessmentQuestion shape rendered by the conversation skin. */
export function createAssessmentQuestionFromStateData(
  questionId: string,
  stateData: StateBackendDict
): AssessmentQuestion {
  return {
    id: questionId,
    type: getAssessmentQuestionType(stateData.interaction.id ?? ''),
    prompt: stateData.content.html,
    hint: '',
    options: [],
    stateData,
  };
}

// The shape of a recommended topic tile shown on the certificate assessment
// introduction card.
export interface RecommendedTopicStub {
  name: string;
  lessonCount: number;
  // Placeholder swatch shown instead of a topic thumbnail image.
  colorClass: string;
}

export interface CertificateAssessmentOfferingTopicData {
  [topicId: string]: number;
}

export interface CertificateAssessmentOfferingBackendDict {
  certificate_id: string;
  title: string;
  description: string;
  classroom_id: string;
  topic_ids: string[];
  topic_data: CertificateAssessmentOfferingTopicData;
  demonstrates: string[];
  total_questions: number;
  time_limit_in_minutes: number;
  async_status: string;
  version: number;
}

export interface AvailableCertificateAssessmentOfferingBackendDict {
  certificate_id: string;
  title: string;
  attempt_status: string;
  passed_on_date: number | null;
  failed_on_date: number | null;
}

export interface CertificateAssessmentAttemptQuestionBackendDict {
  question_id: string;
  question_version: number;
}

export interface CertificateAssessmentAttemptBackendDict {
  attempt_id: string;
  questions: CertificateAssessmentAttemptQuestionBackendDict[];
}

export interface CertificateAssessmentAttemptQuestion {
  questionId: string;
  questionVersion: number;
}

/** Backend response shape for the question handler. */
export interface CertificateAssessmentQuestionStateBackendDict {
  question_id: string;
  question_state_data: StateBackendDict;
}

/** Domain representation of a single assessment question returned by the
 *  question handler. */
export class CertificateAssessmentQuestionData {
  _questionId: string;
  _questionStateData: StateBackendDict;

  constructor(questionId: string, questionStateData: StateBackendDict) {
    this._questionId = questionId;
    this._questionStateData = questionStateData;
  }

  get questionId(): string {
    return this._questionId;
  }

  get questionStateData(): StateBackendDict {
    return this._questionStateData;
  }

  static createFromBackendDict(
    dict: CertificateAssessmentQuestionStateBackendDict
  ): CertificateAssessmentQuestionData {
    return new CertificateAssessmentQuestionData(
      dict.question_id,
      dict.question_state_data
    );
  }
}

export class AvailableCertificateAssessmentOfferingData {
  _certificateId: string;
  _title: string;
  _attemptStatus: string;
  _passedOnDate: number | null;
  _failedOnDate: number | null;

  constructor(
    certificateId: string,
    title: string,
    attemptStatus: string,
    passedOnDate: number | null = null,
    failedOnDate: number | null = null
  ) {
    this._certificateId = certificateId;
    this._title = title;
    this._attemptStatus = attemptStatus;
    this._passedOnDate = passedOnDate;
    this._failedOnDate = failedOnDate;
  }

  get certificateId(): string {
    return this._certificateId;
  }

  get title(): string {
    return this._title;
  }

  get attemptStatus(): string {
    return this._attemptStatus;
  }

  get passedOnDate(): number | null {
    return this._passedOnDate;
  }

  get failedOnDate(): number | null {
    return this._failedOnDate;
  }

  static createFromBackendDict(
    availableCertificateAssessmentOfferingBackendDict: AvailableCertificateAssessmentOfferingBackendDict
  ): AvailableCertificateAssessmentOfferingData {
    return new AvailableCertificateAssessmentOfferingData(
      availableCertificateAssessmentOfferingBackendDict.certificate_id,
      availableCertificateAssessmentOfferingBackendDict.title,
      availableCertificateAssessmentOfferingBackendDict.attempt_status,
      availableCertificateAssessmentOfferingBackendDict.passed_on_date,
      availableCertificateAssessmentOfferingBackendDict.failed_on_date
    );
  }
}

export class CertificateAssessmentOfferingData {
  _certificateId: string;
  _title: string;
  _description: string;
  _classroomId: string;
  _topicData: CertificateAssessmentOfferingTopicData;
  _totalQuestions: number;
  _timeLimitInMinutes: number;
  _demonstrates: string[];
  _asyncStatus: string;
  _version: number;

  constructor(
    certificateId: string,
    title: string,
    description: string,
    classroomId: string,
    topicData: CertificateAssessmentOfferingTopicData,
    totalQuestions: number,
    timeLimitInMinutes: number,
    demonstrates: string[],
    asyncStatus: string,
    version: number
  ) {
    this._certificateId = certificateId;
    this._title = title;
    this._description = description;
    this._classroomId = classroomId;
    this._topicData = topicData;
    this._totalQuestions = totalQuestions;
    this._timeLimitInMinutes = timeLimitInMinutes;
    this._demonstrates = demonstrates;
    this._asyncStatus = asyncStatus;
    this._version = version;
  }

  get certificateId(): string {
    return this._certificateId;
  }

  get title(): string {
    return this._title;
  }

  set title(title: string) {
    this._title = title;
  }

  get description(): string {
    return this._description;
  }

  set description(description: string) {
    this._description = description;
  }

  get classroomId(): string {
    return this._classroomId;
  }

  set classroomId(classroomId: string) {
    this._classroomId = classroomId;
  }

  get topicData(): CertificateAssessmentOfferingTopicData {
    return this._topicData;
  }

  set topicData(topicData: CertificateAssessmentOfferingTopicData) {
    this._topicData = topicData;
  }

  get totalQuestions(): number {
    return this._totalQuestions;
  }

  set totalQuestions(totalQuestions: number) {
    this._totalQuestions = totalQuestions;
  }

  get timeLimitInMinutes(): number {
    return this._timeLimitInMinutes;
  }

  set timeLimitInMinutes(timeLimitInMinutes: number) {
    this._timeLimitInMinutes = timeLimitInMinutes;
  }

  get demonstrates(): string[] {
    return this._demonstrates;
  }

  set demonstrates(demonstrates: string[]) {
    this._demonstrates = demonstrates;
  }

  get asyncStatus(): string {
    return this._asyncStatus;
  }

  get version(): number {
    return this._version;
  }

  static createEmpty(): CertificateAssessmentOfferingData {
    return new CertificateAssessmentOfferingData(
      '',
      '',
      '',
      '',
      {},
      0,
      0,
      [],
      'Not_Ready',
      0
    );
  }

  static createFromBackendDict(
    certificateAssessmentOfferingBackendDict: CertificateAssessmentOfferingBackendDict
  ): CertificateAssessmentOfferingData {
    return new CertificateAssessmentOfferingData(
      certificateAssessmentOfferingBackendDict.certificate_id,
      certificateAssessmentOfferingBackendDict.title,
      certificateAssessmentOfferingBackendDict.description,
      certificateAssessmentOfferingBackendDict.classroom_id,
      certificateAssessmentOfferingBackendDict.topic_data,
      certificateAssessmentOfferingBackendDict.total_questions,
      certificateAssessmentOfferingBackendDict.time_limit_in_minutes,
      certificateAssessmentOfferingBackendDict.demonstrates,
      certificateAssessmentOfferingBackendDict.async_status,
      certificateAssessmentOfferingBackendDict.version
    );
  }
}

export class CertificateAssessmentAttemptData {
  _attemptId: string;
  _questions: CertificateAssessmentAttemptQuestion[];

  constructor(
    attemptId: string,
    questions: CertificateAssessmentAttemptQuestion[]
  ) {
    this._attemptId = attemptId;
    this._questions = questions;
  }

  get attemptId(): string {
    return this._attemptId;
  }

  get questions(): CertificateAssessmentAttemptQuestion[] {
    return this._questions;
  }

  static createFromBackendDict(
    certificateAssessmentAttemptBackendDict: CertificateAssessmentAttemptBackendDict
  ): CertificateAssessmentAttemptData {
    return new CertificateAssessmentAttemptData(
      certificateAssessmentAttemptBackendDict.attempt_id,
      certificateAssessmentAttemptBackendDict.questions.map(question => ({
        questionId: question.question_id,
        questionVersion: question.question_version,
      }))
    );
  }
}
