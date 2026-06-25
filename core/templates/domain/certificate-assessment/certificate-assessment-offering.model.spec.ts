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
 * @fileoverview Unit tests for CertificateAssessmentOfferingData model.
 */

import {
  CertificateAssessmentOfferingData,
  CertificateAssessmentOfferingBackendDict,
} from './certificate-assessment-offering.model';

describe('Certificate Assessment Offering Data Model', () => {
  let backendDict: CertificateAssessmentOfferingBackendDict;

  beforeEach(() => {
    backendDict = {
      certificate_id: 'cert_id_1',
      title: 'Math Assessment',
      description: 'An assessment covering basic algebra and geometry.',
      classroom_id: 'classroom_id_1',
      topic_data: {
        topic_1: 5,
        topic_2: 10,
      },
      total_questions: 15,
      time_limit_in_minutes: 60,
      async_status: 'Ready',
      version: 1,
    };
  });

  it('should correctly create an empty model instance', () => {
    const emptyOffering = CertificateAssessmentOfferingData.createEmpty();

    expect(emptyOffering.certificateId).toEqual('');
    expect(emptyOffering.title).toEqual('');
    expect(emptyOffering.description).toEqual('');
    expect(emptyOffering.classroomId).toEqual('');
    expect(emptyOffering.topicData).toEqual({});
    expect(emptyOffering.totalQuestions).toEqual(0);
    expect(emptyOffering.timeLimitInMinutes).toEqual(0);
    expect(emptyOffering.demonstrates).toEqual([]);
    expect(emptyOffering.asyncStatus).toEqual('Not_Ready');
    expect(emptyOffering.version).toEqual(0);
  });

  it('should correctly create an instance from a backend dictionary', () => {
    const offering =
      CertificateAssessmentOfferingData.createFromBackendDict(backendDict);

    expect(offering.certificateId).toEqual('cert_id_1');
    expect(offering.title).toEqual('Math Assessment');
    expect(offering.description).toEqual(
      'An assessment covering basic algebra and geometry.'
    );
    expect(offering.classroomId).toEqual('classroom_id_1');
    expect(offering.topicData).toEqual({topic_1: 5, topic_2: 10});
    expect(offering.totalQuestions).toEqual(15);
    expect(offering.timeLimitInMinutes).toEqual(60);
    expect(offering.demonstrates).toEqual([]);
    expect(offering.asyncStatus).toEqual('Ready');
    expect(offering.version).toEqual(1);
  });

  it('should correctly mutates fields using setters', () => {
    const offering =
      CertificateAssessmentOfferingData.createFromBackendDict(backendDict);

    offering.title = 'Updated Title';
    offering.description = 'Updated Description';
    offering.classroomId = 'updated_classroom_id';
    offering.topicData = {topic_3: 20};
    offering.totalQuestions = 20;
    offering.timeLimitInMinutes = 90;
    offering.demonstrates = ['Learn math'];

    expect(offering.title).toEqual('Updated Title');
    expect(offering.description).toEqual('Updated Description');
    expect(offering.classroomId).toEqual('updated_classroom_id');
    expect(offering.topicData).toEqual({topic_3: 20});
    expect(offering.totalQuestions).toEqual(20);
    expect(offering.timeLimitInMinutes).toEqual(90);
    expect(offering.demonstrates).toEqual(['Learn math']);
  });
});
