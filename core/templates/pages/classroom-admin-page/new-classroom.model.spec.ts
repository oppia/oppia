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


import { TestBed } from '@angular/core/testing';
import { NewClassroomData } from './new-classroom.model';


describe('Classroom admin model', () => {
  let newClassroomData: NewClassroomData;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    });

    newClassroomData = new NewClassroomData('classroomId', 'math', 'math');
  });

  it(
    'should enable error messgage when classroom name exceeds max len',
    () => {
      classroomData.classroomNameIsValid = true;
      classroomData.classroomNameIsTooLong = false;
      classroomData.name = (
        'Long classroom name with some randome texts abcdefghi');

      classroomData.onClassroomNameChange();

      expect(classroomData.classroomNameIsValid).toBeFalse();
      expect(classroomData.classroomNameIsTooLong).toBeTrue();
    });

  it(
    'should enable error messgae when classroom name is empty',
    () => {
      classroomData.classroomNameIsValid = true;
      classroomData.emptyClassroomName = false;
      classroomData.name = '';

      classroomData.onClassroomNameChange();

      expect(classroomData.classroomNameIsValid).toBeFalse();
      expect(classroomData.emptyClassroomName).toBeTrue();
    });

  it(
    'should enable error message when classroom name already exists',
    () => {
      classroomData.classroomNameIsValid = true;
      classroomData.duplicateClassroomName = false;
      classroomData.existingClassroomNames = ['physics', 'chemistry'];
      classroomData.name = 'physics';

      classroomData.onClassroomNameChange();

      expect(classroomData.classroomNameIsValid).toBeFalse();
      expect(classroomData.duplicateClassroomName).toBeTrue();
    });

  it(
    'should not present any error when classroom name is valid', () => {
      classroomData.classroomNameIsValid = true;
      classroomData.duplicateClassroomName = false;
      classroomData.emptyClassroomName = false;
      classroomData.classroomNameIsTooLong = false;
      classroomData.existingClassroomNames = ['physics', 'chemistry'];
      classroomData.name = 'Discrete maths';

      classroomData.onClassroomNameChange();

      expect(classroomData.classroomNameIsValid).toBeTrue();
      expect(classroomData.duplicateClassroomName).toBeFalse();
      expect(classroomData.emptyClassroomName).toBeFalse();
      expect(classroomData.classroomNameIsTooLong).toBeFalse();
    });

  it(
    'should present error messgae when clasroom url fragment is empty', () => {
      classroomData.classroomUrlFragmentIsValid = true;
      classroomData.classroomUrlFragmentIsEmpty = false;
      classroomData.urlFragment = '';

      classroomData.onClassroomUrlFragmentChange();

      expect(classroomData.classroomUrlFragmentIsValid).toBeFalse();
      expect(classroomData.classroomUrlFragmentIsEmpty).toBeTrue();
    });

  it(
    'should present error message when classroom url fragment exceeds max len',
    () => {
      classroomData.classroomUrlFragmentIsValid = true;
      classroomData.classroomUrlFragmentIsTooLong = false;
      classroomData.urlFragment = 'long-url-fragment-for-raising-error-msg';

      classroomData.onClassroomUrlFragmentChange();

      expect(classroomData.classroomUrlFragmentIsValid).toBeFalse();
      expect(classroomData.classroomUrlFragmentIsTooLong).toBeTrue();
    });

  it(
    'should present error message when classroom url fragment is invalid',
    () => {
      classroomData.classroomUrlFragmentIsValid = true;
      classroomData.urlFragmentRegexMatched = true;
      classroomData.urlFragment = 'Incorrect-url';

      classroomData.onClassroomUrlFragmentChange();

      expect(classroomData.classroomUrlFragmentIsValid).toBeFalse();
      expect(classroomData.urlFragmentRegexMatched).toBeFalse();
    });

  it(
    'should not present error for valid classroom url fragment', () => {
      classroomData.classroomUrlFragmentIsValid = true;
      classroomData.urlFragmentRegexMatched = true;
      classroomData.classroomUrlFragmentIsTooLong = false;
      classroomData.classroomUrlFragmentIsEmpty = false;
      classroomData.urlFragment = 'physics-url-fragment';

      classroomData.onClassroomUrlFragmentChange();

      expect(classroomData.classroomUrlFragmentIsValid).toBeTrue();
      expect(classroomData.urlFragmentRegexMatched).toBeTrue();
      expect(classroomData.classroomUrlFragmentIsTooLong).toBeFalse();
      expect(classroomData.classroomUrlFragmentIsEmpty).toBeFalse();
    });
});
