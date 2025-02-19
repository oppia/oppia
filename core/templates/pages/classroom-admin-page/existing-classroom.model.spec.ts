// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for existing classroom model.
 */

import {TestBed} from '@angular/core/testing';
import {ExistingClassroomData} from './existing-classroom.model';

const dummyThumbnailData = {
  filename: 'thumbnail.svg',
  bg_color: 'transparent',
  size_in_bytes: 1000,
};

const dummyBannerData = {
  filename: 'banner.png',
  bg_color: 'transparent',
  size_in_bytes: 1000,
};

describe('Classroom admin model', () => {
  let existingClassroomData: ExistingClassroomData;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
    });

    existingClassroomData = new ExistingClassroomData(
      'classroomId',
      'math',
      'math',
      'Curated math foundations course.',
      'Learn math through fun stories!',
      'Start from the basics with our first topic.',
      {},
      true,
      false,
      dummyThumbnailData,
      dummyBannerData
    );
  });

  it('should be able to get and set course details', () => {
    expect(existingClassroomData.getCourseDetails()).toEqual(
      'Curated math foundations course.'
    );

    existingClassroomData.setCourseDetails('Test data for course details.');

    expect(existingClassroomData.getCourseDetails()).toEqual(
      'Test data for course details.'
    );
  });

  it('should be able to get and set topic list intro', () => {
    expect(existingClassroomData.getTopicListIntro()).toEqual(
      'Start from the basics with our first topic.'
    );

    existingClassroomData.setTopicListIntro('Test data for topic list intro.');

    expect(existingClassroomData.getTopicListIntro()).toEqual(
      'Test data for topic list intro.'
    );
  });

  it('should be able to get and set topic dependency', () => {
    expect(existingClassroomData.getTopicIdToPrerequisiteTopicId()).toEqual({});

    const sampleTopicIdToprerequisiteTopicIds = {
      topic1: [],
      topic2: ['topic1'],
      topic3: ['topic2'],
    };

    existingClassroomData.setTopicIdToPrerequisiteTopicId(
      sampleTopicIdToprerequisiteTopicIds
    );

    expect(existingClassroomData.getTopicIdToPrerequisiteTopicId()).toEqual(
      sampleTopicIdToprerequisiteTopicIds
    );
  });

  it('should be able to create existing classroom model from dict', () => {
    const classroomDict = {
      classroomId: 'pysicsClassroomId',
      name: 'physics',
      urlFragment: 'physics',
      courseDetails: 'Test course details',
      teaserText: 'Learn physics',
      topicListIntro: 'Test topic intro',
      topicIdToPrerequisiteTopicIds: {
        topic1: [],
        topic2: ['topic1'],
      },
      isPublished: true,
      isDiagnosticTestEnabled: false,
      thumbnailData: dummyThumbnailData,
      bannerData: dummyBannerData,
    };

    let classroom: ExistingClassroomData =
      ExistingClassroomData.createClassroomFromDict(classroomDict);

    expect(classroom.getClassroomId()).toEqual('pysicsClassroomId');
    expect(classroom.getClassroomName()).toEqual('physics');
    expect(classroom.getClassroomUrlFragment()).toEqual('physics');
    expect(classroom.getCourseDetails()).toEqual('Test course details');
    expect(classroom.getTeaserText()).toEqual('Learn physics');
    expect(classroom.getTopicListIntro()).toEqual('Test topic intro');
    expect(classroom.getTopicIdToPrerequisiteTopicId()).toEqual({
      topic1: [],
      topic2: ['topic1'],
    });
    expect(classroom.getIsPublished()).toBeTrue();
    classroom.setIsPublished(false);
    expect(classroom.getIsPublished()).toBeFalse();
    expect(classroom.getIsDiagnosticTestEnabled()).toBeFalse();
    classroom.setIsDiagnosticTestEnabled(true);
    expect(classroom.getIsDiagnosticTestEnabled()).toBeTrue();
  });

  it('should be able to get classroom dict from object', () => {
    const expectedClassroomDict = {
      classroomId: 'classroomId',
      name: 'math',
      urlFragment: 'math',
      courseDetails: 'Curated math foundations course.',
      teaserText: 'Learn math through fun stories!',
      topicListIntro: 'Start from the basics with our first topic.',
      topicIdToPrerequisiteTopicIds: {},
      isPublished: true,
      isDiagnosticTestEnabled: false,
      thumbnailData: dummyThumbnailData,
      bannerData: dummyBannerData,
    };

    expect(existingClassroomData.getClassroomDict()).toEqual(
      expectedClassroomDict
    );
  });

  it('should not present error for valid dependency graph', () => {
    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: ['topic_id_2', 'topic_id_3'],
      topic_id_2: [],
      topic_id_3: ['topic_id_2'],
    });

    expect(existingClassroomData.validateDependencyGraph()).toEqual('');

    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: [],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2'],
    });

    expect(existingClassroomData.validateDependencyGraph()).toEqual('');

    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: [],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2', 'topic_id_1'],
    });

    expect(existingClassroomData.validateDependencyGraph()).toEqual('');
  });

  it('should be able to present error for invalid dependency graph', () => {
    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: ['topic_id_3'],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2'],
    });
    existingClassroomData.setTopicIdToTopicName({
      topic_id_1: 'Topic1',
      topic_id_2: 'Topic2',
      topic_id_3: 'Topic3',
    });
    const errorMsg = existingClassroomData.generateGraphErrorMsg([
      'Topic2',
      'Topic3',
      'Topic1',
    ]);

    expect(existingClassroomData.validateDependencyGraph()).toEqual(errorMsg);
  });

  it('should be able to get prerequisite topic IDs', () => {
    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: ['topic_id_2', 'topic_id_3'],
      topic_id_2: [],
      topic_id_3: ['topic_id_2'],
    });

    expect(existingClassroomData.getPrerequisiteTopicIds('topic_id_1')).toEqual(
      ['topic_id_2', 'topic_id_3']
    );
  });

  it('should handle errors in various properties', () => {
    let validationErrors = [
      'A classroom should have at least one topic.',
      'The classroom course details should not be empty.',
      'The classroom teaser text should not be empty.',
      'The classroom topic list intro should not be empty.',
      'The classroom thumbnail should not be empty.',
      'The classroom banner should not be empty.',
    ];
    existingClassroomData.setCourseDetails('');
    existingClassroomData.setTeaserText('');
    existingClassroomData.setTopicListIntro('');
    existingClassroomData.setThumbnailData({
      ...dummyThumbnailData,
      filename: '',
    });
    existingClassroomData.setBannerData({...dummyBannerData, filename: ''});
    existingClassroomData._topicsCountInClassroom = 0;

    expect(existingClassroomData.getAllValidationErrors().sort()).toEqual(
      validationErrors.sort()
    );

    existingClassroomData.setCourseDetails('a'.repeat(1001));
    existingClassroomData.setTopicListIntro('a'.repeat(1001));
    existingClassroomData.setTeaserText('a'.repeat(1001));
    existingClassroomData._topicsCountInClassroom = 1;

    validationErrors = [
      'The classroom topic list intro should contain at most 240 characters.',
      'The classroom course details should contain at most 720 characters.',
      'The classroom teaser text should contain at most 68 characters.',
      'The classroom thumbnail should not be empty.',
      'The classroom banner should not be empty.',
    ];

    expect(existingClassroomData.getAllValidationErrors().sort()).toEqual(
      validationErrors.sort()
    );
  });

  it('should not present errors for valid properties', () => {
    existingClassroomData.setClassroomName('Discrete maths');
    existingClassroomData.setUrlFragment('physics-url-fragment');
    existingClassroomData.setCourseDetails('Curated math foundations course.');
    existingClassroomData.setTeaserText('Learn math through fun stories!');
    existingClassroomData.setTopicListIntro(
      'Start from the basics with our first topic.'
    );
    existingClassroomData.setThumbnailData(dummyThumbnailData);
    existingClassroomData.setBannerData(dummyBannerData);
    existingClassroomData._topicsCountInClassroom = 1;
    expect(existingClassroomData.getAllValidationErrors().length).toEqual(0);
  });
});
