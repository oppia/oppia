// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for new classroom creation modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CreateNewClassroomModalComponent } from './create-new-classroom-modal.component';
import { ClassroomBackendApiService } from '../../../domain/classroom/classroom-backend-api.service';


describe('Create new topic modal', () => {
  let fixture: ComponentFixture<CreateNewClassroomModalComponent>;
  let componentInstance: CreateNewClassroomModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let classroomBackendApiService: ClassroomBackendApiService;

  class MockClassroomBackendApiService {
    getNewClassroomIdAsync() {
      return {
        then: (callback: () => void) => {
          callback();
        }
      };
    }

    updateClassroomDataAsync() {
      return {
        then: (callback: () => void) => {
          callback();
        }
      };
    }
  }

  class MockWindowRef {
    nativeWindow = {
      location: {
        hostname: ''
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [
        CreateNewClassroomModalComponent,
      ],
      providers: [
        NgbActiveModal,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: ClassroomBackendApiService,
          useClass: MockClassroomBackendApiService
        },
        ClassroomBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewClassroomModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    componentInstance.newClassroomId = '';
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should intialize', fakeAsync(() => {
    expect(componentInstance.newClassroomId).toEqual('');
    spyOn(classroomBackendApiService, 'getNewClassroomIdAsync')
      .and.returnValue(Promise.resolve('newClassroomId'));

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.newClassroomId).toEqual('newClassroomId');
  }));

  it('should be able to save new classroom name', fakeAsync(() => {
    spyOn(ngbActiveModal, 'close');
    spyOn(classroomBackendApiService, 'updateClassroomDataAsync')
      .and.returnValue(Promise.resolve());
    spyOn(
      classroomBackendApiService,
      'doesClassroomWithUrlFragmentExist'
    ).and.returnValue(Promise.resolve(false));
    componentInstance.existingClassroomNames = ['math', 'chemistry'];
    componentInstance.newClassroomId = 'newClassroomId';

    componentInstance.createClassroom('physics', 'physics');
    tick();

    let expectedDefaultClassroom = {
      classroom_id: 'newClassroomId',
      name: 'physics',
      url_fragment: 'physics',
      course_details: '',
      topic_list_intro: '',
      topic_id_to_prerequisite_topic_ids: {}
    };

    expect(ngbActiveModal.close).toHaveBeenCalledWith(expectedDefaultClassroom);
  }));

  it(
    'should not be able to save classroom data when url fragment is duplicate',
    fakeAsync(() => {
      expect(componentInstance.duplicateClassroomUrlFragment).toBeFalse();
      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();

      spyOn(
        classroomBackendApiService,
        'doesClassroomWithUrlFragmentExist'
      ).and.returnValue(Promise.resolve(true));


      componentInstance.createClassroom('math', 'math');
      tick();

      expect(componentInstance.duplicateClassroomUrlFragment).toBeTrue();
      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
    }));

  it(
    'should not save new classroom if given classroom name matches with the ' +
    'existing classroom name', fakeAsync(() => {
      spyOn(ngbActiveModal, 'close');
      spyOn(classroomBackendApiService, 'updateClassroomDataAsync')
        .and.returnValue(Promise.resolve());
      componentInstance.existingClassroomNames = ['math', 'chemistry'];
      componentInstance.newClassroomId = 'newClassroomId';

      componentInstance.createClassroom('chemistry', 'chemistry');
      tick();

      expect(ngbActiveModal.close).not.toHaveBeenCalled();
    }));

  it(
    'should enable error messgage when classroom name exceeds max len',
    () => {
      expect(componentInstance.classroomNameIsValid).toBeFalse();
      expect(componentInstance.classroomNameExceedsMaxLen).toBeFalse();

      componentInstance.newClassroomName = (
        'Long classroom name with some randome texts abcdefghi');
      componentInstance.onClassroomNameChange();

      expect(componentInstance.classroomNameIsValid).toBeFalse();
      expect(componentInstance.classroomNameExceedsMaxLen).toBeTrue();
    });

  it(
    'should enable error messgae when classroom name is empty',
    () => {
      expect(componentInstance.classroomNameIsValid).toBeFalse();
      expect(componentInstance.emptyClassroomName).toBeFalse();

      componentInstance.newClassroomName = '';

      componentInstance.onClassroomNameChange();

      expect(componentInstance.classroomNameIsValid).toBeFalse();
      expect(componentInstance.emptyClassroomName).toBeTrue();
    });

  it(
    'should enable error message when classroom name already exists',
    () => {
      expect(componentInstance.classroomNameIsValid).toBeFalse();
      expect(componentInstance.duplicateClassroomName).toBeFalse();

      componentInstance.existingClassroomNames = ['physics', 'chemistry'];

      componentInstance.newClassroomName = 'physics';

      componentInstance.onClassroomNameChange();

      expect(componentInstance.classroomNameIsValid).toBeFalse();
      expect(componentInstance.duplicateClassroomName).toBeTrue();
    });

  it(
    'should not present any error when classroom name is valid', () => {
      expect(componentInstance.classroomNameIsValid).toBeFalse();
      expect(componentInstance.duplicateClassroomName).toBeFalse();
      expect(componentInstance.emptyClassroomName).toBeFalse();
      expect(componentInstance.classroomNameExceedsMaxLen).toBeFalse();

      componentInstance.existingClassroomNames = ['physics', 'chemistry'];

      componentInstance.newClassroomName = 'math';

      componentInstance.onClassroomNameChange();

      expect(componentInstance.classroomNameIsValid).toBeTrue();
      expect(componentInstance.duplicateClassroomName).toBeFalse();
      expect(componentInstance.emptyClassroomName).toBeFalse();
      expect(componentInstance.classroomNameExceedsMaxLen).toBeFalse();
    });

  it(
    'should present error messgae when clasroom url fragment is empty', () => {
      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
      expect(componentInstance.emptyClassroomUrlFrgament).toBeFalse();

      componentInstance.newClassroomUrlFragment = '';

      componentInstance.onClassroomUrlFragmentChange();

      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
      expect(componentInstance.emptyClassroomUrlFrgament).toBeTrue();
    });

  it(
    'should present error message when classroom url fragment exceeds max len',
    () => {
      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
      expect(componentInstance.classroomUrlFragmentExceedsmaxLen).toBeFalse();

      componentInstance.newClassroomUrlFragment = (
        'long-url-fragment-for-raising-error-msg');

      componentInstance.onClassroomUrlFragmentChange();

      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
      expect(componentInstance.classroomUrlFragmentExceedsmaxLen).toBeTrue();
    });

  it(
    'should present error message when classroom url fragment is invalid',
    () => {
      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
      expect(componentInstance.urlFragmentRegexMatched).toBeTrue();

      componentInstance.newClassroomUrlFragment = 'Incorrect-url';
      componentInstance.onClassroomUrlFragmentChange();

      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
      expect(componentInstance.urlFragmentRegexMatched).toBeFalse();
    });

  it(
    'should not present error for valid classroom url fragment', () => {
      expect(componentInstance.classroomUrlFragmentIsValid).toBeFalse();
      expect(componentInstance.urlFragmentRegexMatched).toBeTrue();
      expect(componentInstance.classroomUrlFragmentExceedsmaxLen).toBeFalse();
      expect(componentInstance.emptyClassroomUrlFrgament).toBeFalse();

      componentInstance.newClassroomUrlFragment = 'physics-url-fragment';

      componentInstance.onClassroomUrlFragmentChange();

      expect(componentInstance.classroomUrlFragmentIsValid).toBeTrue();
      expect(componentInstance.urlFragmentRegexMatched).toBeTrue();
      expect(componentInstance.classroomUrlFragmentExceedsmaxLen).toBeFalse();
      expect(componentInstance.emptyClassroomUrlFrgament).toBeFalse();
    });

  it(
    'should remove duplicate url fragment error message on model change',
    () => {
      componentInstance.duplicateClassroomUrlFragment = true;
      componentInstance.newClassroomUrlFragment = 'physics';

      componentInstance.onClassroomUrlFragmentChange();

      expect(componentInstance.duplicateClassroomUrlFragment).toBeFalse();
    });
});
