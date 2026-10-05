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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CreateNewClassroomModalComponent} from './create-new-classroom-modal.component';
import {ClassroomBackendApiService} from '../../../domain/classroom/classroom-backend-api.service';
import {ClassroomAdminDataService} from '../services/classroom-admin-data.service';
import {NewClassroomData} from '../new-classroom.model';

describe('Create new classroom modal', () => {
  let fixture: ComponentFixture<CreateNewClassroomModalComponent>;
  let componentInstance: CreateNewClassroomModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let classroomBackendApiService: ClassroomBackendApiService;
  let classroomAdminDataService: ClassroomAdminDataService;

  class MockClassroomBackendApiService {
    getNewClassroomIdAsync() {
      return {
        then: (callback: () => void) => {
          callback();
        },
      };
    }

    updateClassroomDataAsync() {
      return {
        then: (callback: () => void) => {
          callback();
        },
      };
    }
  }

  class MockWindowRef {
    nativeWindow = {
      location: {
        hostname: '',
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [CreateNewClassroomModalComponent],
      providers: [
        NgbActiveModal,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: ClassroomBackendApiService,
          useClass: MockClassroomBackendApiService,
        },
        ClassroomBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewClassroomModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    classroomAdminDataService = TestBed.inject(ClassroomAdminDataService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should be able to save new classroom name', fakeAsync(() => {
    spyOn(ngbActiveModal, 'close');
    spyOn(
      classroomBackendApiService,
      'createNewClassroomAsync'
    ).and.returnValue(Promise.resolve({new_classroom_id: 'newClassroomId'}));

    componentInstance.existingClassroomNames = ['math', 'chemistry'];
    componentInstance.ngOnInit();
    componentInstance.tempClassroom.setClassroomName('physics');
    componentInstance.tempClassroom.setUrlFragment('physics');
    componentInstance.tempClassroom.setFeedbackEmail('user@email.com');

    componentInstance.createClassroom();
    tick();

    let expectedDefaultClassroom = {
      classroom_id: 'newClassroomId',
      name: 'physics',
      url_fragment: 'physics',
      feedback_recipient_email: 'user@email.com',
    };

    expect(ngbActiveModal.close).toHaveBeenCalledWith(expectedDefaultClassroom);
  }));

  it('should return name validation error from the data service', () => {
    classroomAdminDataService.nameValidationError = 'Name already exists.';

    expect(componentInstance.nameValidationError).toBe('Name already exists.');
  });

  it('should return url validation error from the data service', () => {
    classroomAdminDataService.urlValidationError = 'Invalid URL fragment.';

    expect(componentInstance.urlValidationError).toBe('Invalid URL fragment.');
  });

  it('should return feedback recipient email validation error from the data service', () => {
    classroomAdminDataService.feedbackRecipientEmailValidationError =
      'Invalid Email.';

    expect(componentInstance.feedbackRecipientEmailValidationError).toBe(
      'Invalid Email.'
    );
  });

  it('should delegate validateClassroom to the data service', () => {
    const tempClassroom = new NewClassroomData(
      'name',
      'url',
      'desc',
      'user@email.com'
    );
    const classroom = new NewClassroomData(
      'name',
      'url',
      'desc',
      'user@email.com'
    );
    spyOn(classroomAdminDataService, 'validateClassroom');

    componentInstance.validateClassroom(tempClassroom, classroom);

    expect(classroomAdminDataService.validateClassroom).toHaveBeenCalledWith(
      tempClassroom,
      classroom
    );
  });
});
