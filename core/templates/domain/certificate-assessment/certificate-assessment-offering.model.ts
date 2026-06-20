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
 * @fileoverview Model for creating and mutating instances of frontend
 * certificate assessment offering domain objects.
 */

export interface CertificateAssessmentOfferingTopicData {
  [topicId: string]: number;
}

export interface CertificateAssessmentOfferingBackendDict {
  certificate_id: string;
  title: string;
  description: string;
  classroom_id: string;
  topic_data: CertificateAssessmentOfferingTopicData;
  total_questions: number;
  time_limit_in_minutes: number;
  async_status: string;
  version: number;
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
      [],
      certificateAssessmentOfferingBackendDict.async_status,
      certificateAssessmentOfferingBackendDict.version
    );
  }
}
