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
 * @fileoverview Tests for new classroom model.
 */

import {TestBed} from '@angular/core/testing';
import {NewClassroomData} from './new-classroom.model';

describe('Classroom admin model', () => {
  let classroomData: NewClassroomData;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
    });

    classroomData = new NewClassroomData('classroomId', 'math', 'math');
  });

  it('should return error messgage when classroom name exceeds max len', () => {
    classroomData.setClassroomName(
      'Long classroom name with some random texts abcdefghi'
    );

    expect(classroomData.getClassroomNameValidationErrors()).toEqual(
      'The classroom name should contain at most 39 characters.'
    );
  });

  it('should present error messgae when classroom name is empty', () => {
    classroomData.setClassroomName('');

    expect(classroomData.getClassroomNameValidationErrors()).toEqual(
      'The classroom name should not be empty.'
    );
  });

  it('should not present any error when classroom name is valid', () => {
    classroomData.setClassroomName('Discrete maths');

    expect(classroomData.getClassroomNameValidationErrors()).toEqual('');
  });

  it('should present error messgae when clasroom url fragment is empty', () => {
    classroomData.setUrlFragment('');

    expect(classroomData.getClassroomUrlValidationErrors()).toEqual(
      'The classroom URL fragment should not be empty.'
    );
  });

  it('should present error message when classroom url fragment exceeds max len', () => {
    classroomData.setUrlFragment('long-url-fragment-for-raising-error-msg');

    expect(classroomData.getClassroomUrlValidationErrors()).toEqual(
      'The classroom URL fragment should contain at most 20 characters.'
    );
  });

  it('should present error message when classroom url fragment is invalid', () => {
    classroomData.setUrlFragment('Incorrect-url');

    expect(classroomData.getClassroomUrlValidationErrors()).toEqual(
      'The classroom URL fragment should only contain lowercase ' +
        'letters separated by hyphens.'
    );
  });

  it('should not present error for valid classroom url fragment', () => {
    classroomData.setUrlFragment('physics-url-fragment');

    expect(classroomData.getClassroomUrlValidationErrors()).toEqual('');
  });

  it('should be able to set and get classroom validity flag', () => {
    classroomData.setClassroomValidityFlag(false);

    expect(classroomData.isClassroomDataValid()).toBeFalse();

    classroomData.setClassroomValidityFlag(true);

    expect(classroomData.isClassroomDataValid()).toBeTrue();
  });
});
