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
 * @fileoverview Unit tests for certificate assessment offering model.
 */

import {CertificateAssessmentOfferingData} from './certificate-assessment-offering.model';

describe('CertificateAssessmentOfferingData', () => {
  it('should create empty data with default values', () => {
    const offering = CertificateAssessmentOfferingData.createEmpty();

    expect(offering.certificateId).toEqual('');
    expect(offering.title).toEqual('');
    expect(offering.description).toEqual('');
    expect(offering.classroomId).toEqual('');
    expect(offering.topicData).toEqual({});
    expect(offering.totalQuestions).toEqual(0);
    expect(offering.timeLimitInMinutes).toEqual(0);
    expect(offering.asyncStatus).toEqual('Not Ready');
    expect(offering.version).toEqual(0);
  });

  it('should create data from backend dict', () => {
    const offering = CertificateAssessmentOfferingData.createFromBackendDict({
      certificate_id: 'certificate_id',
      title: 'Title',
      description: 'Description',
      classroom_id: 'classroom_id',
      topic_data: {topic_id: 1},
      total_questions: 10,
      time_limit_in_minutes: 20,
      async_status: 'Ready',
      version: 2,
    });

    expect(offering.certificateId).toEqual('certificate_id');
    expect(offering.title).toEqual('Title');
    expect(offering.description).toEqual('Description');
    expect(offering.classroomId).toEqual('classroom_id');
    expect(offering.topicData).toEqual({topic_id: 1});
    expect(offering.totalQuestions).toEqual(10);
    expect(offering.timeLimitInMinutes).toEqual(20);
    expect(offering.asyncStatus).toEqual('Ready');
    expect(offering.version).toEqual(2);
  });
});
