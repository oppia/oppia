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


import { TestBed } from '@angular/core/testing';
import { ExistingClassroomData } from './existing-classroom.model';


describe('Classroom admin model', () => {
  let existingClassroomData: ExistingClassroomData;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    });

    existingClassroomData = new ExistingClassroomData(
      'classroomId',
      'math',
      'math',
      'Curated math foundations course.',
      'Start from the basics with our first topic.',
      {}
    );
  });

  it('should be able to get and set course details', () => {
    expect(existingClassroomData.getCourseDetails()).toEqual(
      'Curated math foundations course.');

    existingClassroomData.setCourseDetails('Test data for course details.');

    expect(existingClassroomData.getCourseDetails()).toEqual(
      'Test data for course details.');
  });

  it('should be able to get and set topic list intro', () => {
    expect(existingClassroomData.getTopicListIntro()).toEqual(
      'Start from the basics with our first topic.');

    existingClassroomData.setTopicListIntro('Test data for topic list intro.');

    expect(existingClassroomData.getTopicListIntro()).toEqual(
      'Test data for topic list intro.');
  });

  it('should be able to get and set topic dependency', () => {
    expect(existingClassroomData.getTopicIdToPrerequisiteTopicId()).toEqual({});

    const sampleTopicIdToprerequisiteTopicIds = {
      topic1: [],
      topic2: ['topic1'],
      topic3: ['topic2']
    };

    existingClassroomData.setTopicIdToPrerequisiteTopicId(
      sampleTopicIdToprerequisiteTopicIds);

    expect(existingClassroomData.getTopicIdToPrerequisiteTopicId()).toEqual(
      sampleTopicIdToprerequisiteTopicIds);
  });

  it('should be able to create existing classroom model from dict', () => {
    const classroomDict = {
      classroomId: 'pysicsClassroomId',
      name: 'physics',
      urlFragment: 'physics',
      courseDetails: 'Test course details',
      topicListIntro: 'Test topic intro',
      topicIdToPrerequisiteTopicIds: {
        topic1: [],
        topic2: ['topic1']
      }
    };

    let classroom: ExistingClassroomData = (
      ExistingClassroomData.createClassroomFromDict(classroomDict));

    expect(classroom.getClassroomId()).toEqual('pysicsClassroomId');
    expect(classroom.getClassroomName()).toEqual('physics');
    expect(classroom.getClassroomUrlFragment()).toEqual('physics');
    expect(classroom.getCourseDetails()).toEqual('Test course details');
    expect(classroom.getTopicListIntro()).toEqual('Test topic intro');
    expect(classroom.getTopicIdToPrerequisiteTopicId()).toEqual({
      topic1: [],
      topic2: ['topic1']
    });
  });

  it('should be able to get classroom dict from object', () => {
    const expectedClassroomDict = {
      classroomId: 'classroomId',
      name: 'math',
      urlFragment: 'math',
      courseDetails: 'Curated math foundations course.',
      topicListIntro: 'Start from the basics with our first topic.',
      topicIdToPrerequisiteTopicIds: {}
    };

    expect(existingClassroomData.getClassroomDict()).toEqual(
      expectedClassroomDict);
  });

  it('should not present error for valid dependency graph', () => {
    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: ['topic_id_2', 'topic_id_3'],
      topic_id_2: [],
      topic_id_3: ['topic_id_2']
    });

    expect(existingClassroomData.validateDependencyGraph()).toEqual('');

    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: [],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2']
    });

    expect(existingClassroomData.validateDependencyGraph()).toEqual('');

    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: [],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2', 'topic_id_1']
    });

    expect(existingClassroomData.validateDependencyGraph()).toEqual('');
  });

  it('should be able to present error for invalid dependency graph', () => {
    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: ['topic_id_3'],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2']
    });
    existingClassroomData.setTopicIdToTopicName({
      topic_id_1: 'Topic1',
      topic_id_2: 'Topic2',
      topic_id_3: 'Topic3'
    });
    const errorMsg = existingClassroomData.generateGraphErrorMsg(
      ['Topic2', 'Topic3', 'Topic1']);

    expect(existingClassroomData.validateDependencyGraph()).toEqual(errorMsg);
  });

  it('should be able to get prerequisite topic IDs', () => {
    existingClassroomData.setTopicIdToPrerequisiteTopicId({
      topic_id_1: ['topic_id_2', 'topic_id_3'],
      topic_id_2: [],
      topic_id_3: ['topic_id_2']
    });

    expect(existingClassroomData.getPrerequisiteTopicIds('topic_id_1')).toEqual(
      ['topic_id_2', 'topic_id_3']);
  });
});
