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
 * @fileoverview Tests for the classroom admin component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ClassroomAdminPageComponent } from 'pages/classroom-admin-page/classroom-admin-page.component';
import { ClassroomBackendApiService} from '../../domain/classroom/classroom-backend-api.service';
import { ClassroomData } from './classroom-admin.model';
import { AlertsService } from 'services/alerts.service';


class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Classroom Admin Page component ', () => {
  let component: ClassroomAdminPageComponent;
  let fixture: ComponentFixture<ClassroomAdminPageComponent>;

  let classroomBackendApiService: ClassroomBackendApiService;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [ClassroomAdminPageComponent],
      providers: [
        AlertsService,
        ClassroomBackendApiService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(ClassroomAdminPageComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
  });

  it('should initialize the component', fakeAsync(() => {
    let response = {
      mathClassroomId: 'math',
      physicsClassroomId: 'physics'
    };
    spyOn(
      classroomBackendApiService,
      'getAllClassroomIdToClassroomNameDictAsync'
    ).and.returnValue(Promise.resolve(response));

    expect(component.pageIsInitialized).toBeFalse();

    component.ngOnInit();
    tick();

    expect(component.pageIsInitialized).toBeTrue();
    expect(component.classroomIdToClassroomName).toEqual(response);
    expect(component.classroomCount).toEqual(2);
  }));

  it(
    'should open classroom detail and update classroom properties',
    fakeAsync(() => {
      let response = {
        classroomDict: {
          classroomId: 'classroomId',
          name: 'math',
          urlFragment: 'math',
          courseDetails: '',
          topicListIntro: '',
          topicIdToPrerequisiteTopicIds: {}
        }
      };
      spyOn(classroomBackendApiService, 'getClassroomDataAsync')
        .and.returnValue(Promise.resolve(response));

      expect(component.classroomViewerMode).toBeFalse();
      expect(component.classroomDetailsIsShown).toBeFalse();
      component.ngOnInit();

      component.getClassroomData('classroomId');
      tick();

      expect(component.classroomViewerMode).toBeTrue();
      expect(component.classroomDetailsIsShown).toBeTrue();
    }));

  it('should display alert when unable to fetch classroom data',
    fakeAsync(() => {
      spyOn(classroomBackendApiService, 'getClassroomDataAsync')
        .and.returnValue(Promise.reject(400));
      spyOn(alertsService, 'addWarning');

      component.getClassroomData('classroomId');
      tick();

      expect(
        classroomBackendApiService.getClassroomDataAsync).toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get classroom data');
    }));

  it(
    'should close classroom details when already in view mode',
    fakeAsync(() => {
      let response = {
        classroomDict: {
          classroomId: 'classroomId',
          name: 'math',
          urlFragment: 'math',
          courseDetails: '',
          topicListIntro: '',
          topicIdToPrerequisiteTopicIds: {}
        }
      };
      spyOn(classroomBackendApiService, 'getClassroomDataAsync')
        .and.returnValue(Promise.resolve(response));
      component.classroomViewerMode = true;
      component.classroomDetailsIsShown = true;

      component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
        response.classroomDict);

      component.getClassroomData('classroomId');
      tick();

      expect(component.classroomDetailsIsShown).toBeFalse();
      expect(component.classroomViewerMode).toBeFalse();
    }));

  it(
    'should not close classroom details while editing classroom properties',
    fakeAsync(() => {
      let response = {
        classroomDict: {
          classroomId: 'classroomId',
          name: 'math',
          urlFragment: 'math',
          courseDetails: '',
          topicListIntro: '',
          topicIdToPrerequisiteTopicIds: {}
        }
      };
      spyOn(classroomBackendApiService, 'getClassroomDataAsync')
        .and.returnValue(Promise.resolve(response));

      component.classroomEditorMode = true;
      component.classroomDetailsIsShown = true;

      component.ngOnInit();

      component.getClassroomData('classroomId');
      tick();

      expect(component.classroomDetailsIsShown).toBeTrue();
      expect(component.classroomEditorMode).toBeTrue();
    }));

  it(
    'should get classroom ID to classroom name and update classroom count',
    fakeAsync(() => {
      let response = {
        mathClassroomId: 'math',
        physicsClassroomId: 'physics'
      };
      spyOn(
        classroomBackendApiService,
        'getAllClassroomIdToClassroomNameDictAsync'
      ).and.returnValue(Promise.resolve(response));

      expect(component.pageIsInitialized).toBeFalse();

      component.getAllClassroomIdToClassroomName();
      tick();

      expect(component.pageIsInitialized).toBeTrue();
      expect(component.classroomIdToClassroomName).toEqual(response);
      expect(component.classroomCount).toEqual(2);
    }));

  it('should be able to update the classroom name', () => {
    const response = {
      classroomDict: {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: '',
        topicListIntro: '',
        topicIdToPrerequisiteTopicIds: {}
      }
    };
    component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.classroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.tempClassroomData.name = 'Discrete maths';
    component.classroomDataIsChanged = false;

    component.updateClassroomField();

    expect(component.classroomDataIsChanged).toBeTrue();
  });

  it(
    'should not update the classroom field if the current changes match ' +
    'with existing ones', () => {
      const response = {
        classroomDict: {
          classroomId: 'classroomId',
          name: 'math',
          urlFragment: 'math',
          courseDetails: '',
          topicListIntro: '',
          topicIdToPrerequisiteTopicIds: {}
        }
      };
      component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
        response.classroomDict);
      component.classroomData = ClassroomData.createNewClassroomFromDict(
        response.classroomDict);
      component.tempClassroomData.name = 'Discrete maths';
      component.classroomDataIsChanged = false;

      component.updateClassroomField();

      expect(component.classroomDataIsChanged).toBeTrue();

      component.tempClassroomData.name = 'math';

      component.updateClassroomField();

      expect(component.classroomDataIsChanged).toBeFalse();
    })

  it('should be able to update the classroom url fragment', () => {
    let response = {
      classroomDict: {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: '',
        topicListIntro: '',
        topicIdToPrerequisiteTopicIds: {}
      }
    };
    component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.classroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.tempClassroomData.urlFragment = 'newMathUrl';
    component.classroomDataIsChanged = false;

    component.updateClassroomField();

    expect(component.classroomDataIsChanged).toBeTrue();
  });

  it('should be able to update the classroom course details', () => {
    let response = {
      classroomDict: {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: '',
        topicListIntro: '',
        topicIdToPrerequisiteTopicIds: {}
      }
    };
    component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.classroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.tempClassroomData.courseDetails = (
      'Oppia\'s curated maths lesson.');
    component.classroomDataIsChanged = false;

    component.updateClassroomField();

    expect(component.classroomDataIsChanged).toBeTrue();
  });

  it('should be able to update the classroom topic list intro', () => {
    let response = {
      classroomDict: {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: '',
        topicListIntro: '',
        topicIdToPrerequisiteTopicIds: {}
      }
    };
    component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.classroomData = ClassroomData.createNewClassroomFromDict(
      response.classroomDict);
    component.tempClassroomData.topicListIntro = (
      'Start from the basics with our first topic.');
    component.classroomDataIsChanged = false;

    component.updateClassroomField();

    expect(component.classroomDataIsChanged).toBeTrue();
  });

  it('should be able to convert classroom dict to the backend form', () => {
    let classroomDict = {
      classroomId: 'classroomId',
      name: 'math',
      urlFragment: 'math',
      courseDetails: 'Oppia\'s curated maths lesson.',
      topicListIntro: 'Start from the basics with our first topic.',
      topicIdToPrerequisiteTopicIds: {}
    };

    let classroomBackendDict = {
      classroom_id: 'classroomId',
      name: 'math',
      url_fragment: 'math',
      course_details: 'Oppia\'s curated maths lesson.',
      topic_list_intro: 'Start from the basics with our first topic.',
      topic_id_to_prerequisite_topic_ids: {}
    };

    expect(component.convertClassroomDictToBackendForm(
      classroomDict)).toEqual(classroomBackendDict);
  });

  it(
    'should be able to close classroom viewer and open classroom editor',
    () => {
      component.classroomViewerMode = true;
      component.classroomEditorMode = false;

      component.openClassroomInEditorMode();

      expect(component.classroomViewerMode).toBeFalse();
      expect(component.classroomEditorMode).toBeTrue();
    });

  it('should be able to save classroom data', fakeAsync(() => {
    component.classroomViewerMode = false;
    component.classroomEditorMode = true;
    component.classroomDataIsChanged = true;
    component.classroomIdToClassroomName = {};
    let classroomDict = {
      classroomId: 'classroomId',
      name: 'math',
      urlFragment: 'math',
      courseDetails: 'Oppia\'s curated maths lesson.',
      topicListIntro: 'Start from the basics with our first topic.',
      topicIdToPrerequisiteTopicIds: {}
    };
    component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
      classroomDict);
    component.classroomData = ClassroomData.createNewClassroomFromDict(
      classroomDict);

    spyOn(
      classroomBackendApiService,
      'updateClassroomDataAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(
      classroomBackendApiService,
      'doesClassroomWithUrlFragmentExistAsync'
    ).and.returnValue(Promise.resolve(false));

    component.saveClassroomData('classroomId');
    tick();

    expect(component.classroomViewerMode).toBeTrue();
    expect(component.classroomEditorMode).toBeFalse();
    expect(component.classroomDataIsChanged).toBeFalse();
  }));

  it(
    'should not be able to save classroom data when url fragment is duplicate',
    fakeAsync(() => {
      component.classroomViewerMode = false;
      component.classroomEditorMode = true;

      let classroomDict = {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: 'Oppia\'s curated maths lesson.',
        topicListIntro: 'Start from the basics with our first topic.',
        topicIdToPrerequisiteTopicIds: {}
      };
      component.tempClassroomData = ClassroomData.createNewClassroomFromDict(
        classroomDict);
      component.classroomData = ClassroomData.createNewClassroomFromDict(
        classroomDict);
      component.tempClassroomData.urlFragment = 'discrete-maths';

      expect(component.classroomUrlFragmentIsDuplicate).toBeFalse();

      component.tempClassroomData.classroomUrlFragmentIsValid = true;

      spyOn(
        classroomBackendApiService,
        'updateClassroomDataAsync'
      ).and.returnValue(Promise.resolve());
      spyOn(
        classroomBackendApiService,
        'doesClassroomWithUrlFragmentExistAsync'
      ).and.returnValue(Promise.resolve(true));

      component.saveClassroomData('classroomId');
      tick();

      expect(component.classroomUrlFragmentIsDuplicate).toBeTrue();
      expect(
        component.tempClassroomData.classroomUrlFragmentIsValid).toBeFalse();
      expect(component.classroomViewerMode).toBeFalse();
      expect(component.classroomEditorMode).toBeTrue();
    }));

  it(
    'should present a confirmation modal before exiting editor mode if ' +
    'any classroom propeties are already modified', fakeAsync(() => {
      component.classroomDataIsChanged = true;
      component.classroomEditorMode = true;
      component.classroomViewerMode = false;
      component.classroomData = ClassroomData.createNewClassroomFromDict({
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: 'Oppia\'s curated maths lesson.',
        topicListIntro: 'Start from the basics with our first topic.',
        topicIdToPrerequisiteTopicIds: {}
      });
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: {},
          result: Promise.resolve()
        } as NgbModalRef
      );

      component.closeClassroomConfigEditor();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(component.classroomEditorMode).toBeFalse();
      expect(component.classroomViewerMode).toBeTrue();
      expect(component.classroomDataIsChanged).toBeFalse();
    }));
  it(
    'should be able to cancel the exit editor confirmation modal and ' +
    'continue editing', () => {
      component.classroomDataIsChanged = true;
      component.classroomEditorMode = true;
      component.classroomViewerMode = false;
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: {},
          result: Promise.reject()
        } as NgbModalRef
      );

      component.closeClassroomConfigEditor();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(component.classroomDataIsChanged).toBeTrue();
      expect(component.classroomEditorMode).toBeTrue();
      expect(component.classroomViewerMode).toBeFalse();
    });

  it(
    'should not present a confirmation modal if none of the classroom ' +
    'properties were updated', () => {
      component.classroomDataIsChanged = false;
      component.classroomEditorMode = true;
      component.classroomViewerMode = false;
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: {},
          result: Promise.resolve()
        } as NgbModalRef
      );

      component.closeClassroomConfigEditor();

      expect(ngbModal.open).not.toHaveBeenCalled();
      expect(component.classroomEditorMode).toBeFalse();
      expect(component.classroomViewerMode).toBeTrue();
    });

  it('should be able to delete classroom', fakeAsync(() => {
    component.classroomIdToClassroomName = {
      mathClassroomId: 'math',
      chemistryClassroomId: 'chemistry',
      physicsClassroomId: 'physics'
    };
    let expectedClassroom = {
      chemistryClassroomId: 'chemistry',
      physicsClassroomId: 'physics'
    };
    component.classroomCount = 3;
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: {},
        result: Promise.resolve()
      } as NgbModalRef
    );
    spyOn(classroomBackendApiService, 'deleteClassroomAsync')
      .and.returnValue(Promise.resolve());

    component.deleteClassroom('mathClassroomId');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.classroomIdToClassroomName).toEqual(expectedClassroom);
    expect(component.classroomCount).toEqual(2);
  }));

  it(
    'should be able to cancel modal for not deleting the classroom',
    fakeAsync(() => {
      component.classroomIdToClassroomName = {
        mathClassroomId: 'math',
        chemistryClassroomId: 'chemistry',
        physicsClassroomId: 'physics'
      };
      let expectedClassroomIdToName = {
        mathClassroomId: 'math',
        chemistryClassroomId: 'chemistry',
        physicsClassroomId: 'physics'
      };
      component.classroomCount = 3;
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: {},
          result: Promise.reject()
        } as NgbModalRef
      );
      spyOn(classroomBackendApiService, 'deleteClassroomAsync')
        .and.returnValue(Promise.resolve());

      component.deleteClassroom('mathClassroomId');
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(component.classroomIdToClassroomName).toEqual(
        expectedClassroomIdToName);
      expect(component.classroomCount).toEqual(3);
    }));

  it('should be able to create new classroom', fakeAsync(() => {
    component.classroomIdToClassroomName = {
      mathClassroomId: 'math',
      chemistryClassroomId: 'chemistry'
    };
    let expectedClassroomIdToName = {
      mathClassroomId: 'math',
      chemistryClassroomId: 'chemistry',
      physicsClassroomId: 'physics'
    };
    let classroomDict = {
      classroom_id: 'physicsClassroomId',
      name: 'physics',
      url_fragment: '',
      course_details: '',
      topic_list_intro: '',
      topic_id_to_prerequisite_topic_ids: {}
    };
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: {
          existingClassroomNames: ['math', 'chemistry']
        },
        result: Promise.resolve(classroomDict)
      } as NgbModalRef
    );

    component.createNewClassroom();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.classroomIdToClassroomName).toEqual(
      expectedClassroomIdToName);
  }));

  it('should be able to cancel create classsroom modal', fakeAsync(() => {
    component.classroomIdToClassroomName = {
      mathClassroomId: 'math',
      chemistryClassroomId: 'chemistry'
    };
    let expectedClassroomIdToName = {
      mathClassroomId: 'math',
      chemistryClassroomId: 'chemistry'
    };

    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: {
          existingClassroomNames: ['math', 'chemistry']
        },
        result: Promise.reject()
      } as NgbModalRef
    );

    component.createNewClassroom();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.classroomIdToClassroomName).toEqual(
      expectedClassroomIdToName);
  }));
});
