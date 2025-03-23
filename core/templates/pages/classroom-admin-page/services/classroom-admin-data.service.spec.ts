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
 * @fileoverview Tests for classroom admin data service.
 */

import {ClassroomAdminDataService} from './classroom-admin-data.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ExistingClassroomData} from '../existing-classroom.model';

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

let existingClassroom = new ExistingClassroomData(
  'classroomID',
  'physics',
  'physics',
  'Curated math foundations course.',
  'Learn math through fun stories!',
  'Start from the basics with our first topic.',
  {},
  true,
  false,
  dummyThumbnailData,
  dummyBannerData
);

describe('Classroom Admin Data Service', () => {
  let classroomAdminDataService: ClassroomAdminDataService;
  let classroomBackendApiService: ClassroomBackendApiService;
  let classroomData: ExistingClassroomData;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClassroomBackendApiService],
    }).compileComponents();
  }));

  beforeEach(() => {
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    classroomAdminDataService = TestBed.inject(ClassroomAdminDataService);
    classroomData = new ExistingClassroomData(
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

  it('should return classroom name error coming from model', () => {
    spyOn(classroomData, 'getClassroomNameValidationErrors').and.returnValue(
      'Name error from model.'
    );

    classroomAdminDataService.onClassroomNameChange(classroomData);
    expect(classroomAdminDataService.nameValidationError).toEqual(
      'Name error from model.'
    );
  });

  it('should be able to validate duplicate classroom name', () => {
    classroomAdminDataService.existingClassroomNames = ['chemistry', 'physics'];

    spyOn(classroomData, 'getClassroomNameValidationErrors').and.returnValue(
      ''
    );

    classroomData.setClassroomName('chemistry');

    classroomAdminDataService.onClassroomNameChange(classroomData);

    expect(classroomAdminDataService.nameValidationError).toEqual(
      'A classroom with this name already exists.'
    );
  });

  it('should be able return classroom URL error coming from model', () => {
    spyOn(classroomData, 'getClassroomUrlValidationErrors').and.returnValue(
      'URL error from model.'
    );

    classroomAdminDataService.onClassroomUrlChange(classroomData, '');

    expect(classroomAdminDataService.urlValidationError).toEqual(
      'URL error from model.'
    );
  });

  it('should be able to validate duplicate classroom URL', fakeAsync(() => {
    spyOn(classroomData, 'getClassroomUrlValidationErrors').and.returnValue('');
    spyOn(
      classroomBackendApiService,
      'doesClassroomWithUrlFragmentExistAsync'
    ).and.returnValue(Promise.resolve(true));

    classroomAdminDataService.onClassroomUrlChange(classroomData, '');
    tick();

    expect(classroomAdminDataService.urlValidationError).toEqual(
      'A classroom with this name already exists.'
    );
  }));

  it('should be able to call setClassroomValidityFlag method from the model', () => {
    spyOn(classroomData, 'setClassroomValidityFlag');
    classroomAdminDataService.existingClassroomNames = ['chemistry', 'physics'];

    classroomAdminDataService.validateClassroom(
      classroomData,
      existingClassroom
    );

    expect(classroomData.setClassroomValidityFlag).toHaveBeenCalled();
  });

  it('should return all validation errors', () => {
    let tempClassroom = new ExistingClassroomData(
      '',
      '',
      '',
      '',
      '',
      '',
      {},
      true,
      false,
      {...dummyThumbnailData, filename: ''},
      {...dummyBannerData, filename: ''}
    );
    classroomAdminDataService.validateClassroom(
      tempClassroom,
      existingClassroom
    );
    expect(
      classroomAdminDataService.getAllClassroomValidationErrors().length
    ).toEqual(9);
    expect(
      classroomAdminDataService.getSaveClassroomValidationErrors().length
    ).toEqual(2);
  });

  it('should be able to reinitialize validation errors', () => {
    classroomAdminDataService.nameValidationError = 'Name error';
    classroomAdminDataService.urlValidationError = 'URL error';
    classroomAdminDataService.topicsGraphValidationError = 'Topics graph error';
    classroomAdminDataService.classroomValidationErrors = ['Erro1', 'Error2'];

    classroomAdminDataService.reinitializeErrorMsgs();

    expect(classroomAdminDataService.nameValidationError).toEqual('');
    expect(classroomAdminDataService.urlValidationError).toEqual('');
    expect(classroomAdminDataService.topicsGraphValidationError).toEqual('');
    expect(classroomAdminDataService.classroomValidationErrors.length).toEqual(
      0
    );
  });
});
