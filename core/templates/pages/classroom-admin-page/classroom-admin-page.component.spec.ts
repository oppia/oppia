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
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import cloneDeep from 'lodash/cloneDeep';
import { ClassroomAdminPageComponent } from 'pages/classroom-admin-page/classroom-admin-page.component';
import { ClassroomBackendApiService} from '../../domain/classroom/classroom-backend-api.service';


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
  let editableTopicBackendApiService: EditableTopicBackendApiService;
  let ngbModal: NgbModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [ClassroomAdminPageComponent],
      providers: [
        ClassroomBackendApiService,
        EditableTopicBackendApiService,
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
    editableTopicBackendApiService = TestBed.inject(
      EditableTopicBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
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

      component.getClassroomData('classroomId');
      tick();

      expect(component.classroomViewerMode).toBeTrue();
      expect(component.classroomDetailsIsShown).toBeTrue();
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
      component.classroomId = 'classroomId';
      component.classroomViewerMode = true;
      component.classroomDetailsIsShown = true;

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

      component.classroomId = 'classroomId';
      component.classroomEditorMode = true;
      component.classroomDetailsIsShown = true;

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
    component.updatedClassroomDict = response.classroomDict;
    component.classroomDataIsChanged = false;

    component.updateClassroomName('Discrete maths');

    expect(component.updatedClassroomDict.name).toEqual('Discrete maths');
    expect(component.classroomDataIsChanged).toBeTrue();
  });

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
    component.updatedClassroomDict = response.classroomDict;
    component.classroomDataIsChanged = false;

    component.updateUrlFragment('newMathUrl');

    expect(component.updatedClassroomDict.urlFragment).toEqual('newMathUrl');
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
    component.updatedClassroomDict = response.classroomDict;
    component.classroomDataIsChanged = false;

    component.updateCourseDetails('Oppia\'s curated maths lesson.');

    expect(component.updatedClassroomDict.courseDetails).toEqual(
      'Oppia\'s curated maths lesson.');
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
    component.updatedClassroomDict = response.classroomDict;
    component.classroomDataIsChanged = false;

    component.updateTopicListIntro(
      'Start from the basics with our first topic.');

    expect(component.updatedClassroomDict.topicListIntro).toEqual(
      'Start from the basics with our first topic.');
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

      component.openClassroomConfigEditor();

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
    component.updatedClassroomDict = classroomDict;

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
    expect(component.selectedClassroomDict).toEqual(classroomDict);
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
      component.updatedClassroomDict = classroomDict;
      component.selectedClassroomDict = cloneDeep(classroomDict);
      component.selectedClassroomDict.urlFragment = 'discrete-math';

      expect(component.classroomUrlFragmentIsDuplicate).toBeFalse();
      expect(component.classroomUrlFragmentIsValid).toBeTrue();

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
      expect(component.classroomUrlFragmentIsValid).toBeFalse();
      expect(component.classroomViewerMode).toBeFalse();
      expect(component.classroomEditorMode).toBeTrue();
    }));

  it(
    'should present a confirmation modal before exiting editor mode if ' +
    'any classroom propeties are already modified', fakeAsync(() => {
      component.classroomDataIsChanged = true;
      component.classroomEditorMode = true;
      component.classroomViewerMode = false;
      component.selectedClassroomDict = {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: 'Oppia\'s curated maths lesson.',
        topicListIntro: 'Start from the basics with our first topic.',
        topicIdToPrerequisiteTopicIds: {}
      };
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

  it(
    'should enable error messgage when classroom name exceeds max len',
    () => {
      expect(component.classroomNameIsValid).toBeTrue();
      expect(component.classroomNameIsTooLong).toBeFalse();

      component.classroomName = (
        'Long classroom name with some randome texts abcdefghi');
      component.onClassroomNameChange();

      expect(component.classroomNameIsValid).toBeFalse();
      expect(component.classroomNameIsTooLong).toBeTrue();
    });

  it(
    'should enable error messgae when classroom name is empty',
    () => {
      expect(component.classroomNameIsValid).toBeTrue();
      expect(component.emptyClassroomName).toBeFalse();

      component.classroomName = '';

      component.onClassroomNameChange();

      expect(component.classroomNameIsValid).toBeFalse();
      expect(component.emptyClassroomName).toBeTrue();
    });

  it(
    'should enable error message when classroom name already exists',
    () => {
      expect(component.classroomNameIsValid).toBeTrue();
      expect(component.duplicateClassroomName).toBeFalse();

      component.existingClassroomNames = ['physics', 'chemistry'];
      component.classroomName = 'physics';

      component.onClassroomNameChange();

      expect(component.classroomNameIsValid).toBeFalse();
      expect(component.duplicateClassroomName).toBeTrue();
    });

  it(
    'should not present any error when classroom name is valid', () => {
      expect(component.classroomNameIsValid).toBeTrue();
      expect(component.duplicateClassroomName).toBeFalse();
      expect(component.emptyClassroomName).toBeFalse();
      expect(component.classroomNameIsTooLong).toBeFalse();

      component.classroomIdToClassroomName = {
        physicsId: 'physics',
        chemistryId: 'chemistry'
      };
      component.classroomName = 'math';

      component.onClassroomNameChange();

      expect(component.classroomNameIsValid).toBeTrue();
      expect(component.duplicateClassroomName).toBeFalse();
      expect(component.emptyClassroomName).toBeFalse();
      expect(component.classroomNameIsTooLong).toBeFalse();
    });

  it(
    'should present error messgae when clasroom url fragment is empty', () => {
      expect(component.classroomUrlFragmentIsValid).toBeTrue();
      expect(component.classroomUrlFragmentIsEmpty).toBeFalse();

      component.urlFragment = '';

      component.onClassroomUrlFragmentChange();

      expect(component.classroomUrlFragmentIsValid).toBeFalse();
      expect(component.classroomUrlFragmentIsEmpty).toBeTrue();
    });

  it(
    'should present error message when classroom url fragment exceeds max len',
    () => {
      expect(component.classroomUrlFragmentIsValid).toBeTrue();
      expect(component.classroomUrlFragmentIsTooLong).toBeFalse();

      component.urlFragment = 'long-url-fragment-for-raising-error-msg';

      component.onClassroomUrlFragmentChange();

      expect(component.classroomUrlFragmentIsValid).toBeFalse();
      expect(component.classroomUrlFragmentIsTooLong).toBeTrue();
    });

  it(
    'should present error message when classroom url fragment is invalid',
    () => {
      expect(component.classroomUrlFragmentIsValid).toBeTrue();
      expect(component.urlFragmentRegexMatched).toBeTrue();

      component.urlFragment = 'Incorrect-url';
      component.onClassroomUrlFragmentChange();

      expect(component.classroomUrlFragmentIsValid).toBeFalse();
      expect(component.urlFragmentRegexMatched).toBeFalse();
    });

  it(
    'should not present error for valid classroom url fragment', () => {
      expect(component.classroomUrlFragmentIsValid).toBeTrue();
      expect(component.urlFragmentRegexMatched).toBeTrue();
      expect(component.classroomUrlFragmentIsTooLong).toBeFalse();
      expect(component.classroomUrlFragmentIsEmpty).toBeFalse();

      component.urlFragment = 'physics-url-fragment';

      component.onClassroomUrlFragmentChange();

      expect(component.classroomUrlFragmentIsValid).toBeTrue();
      expect(component.urlFragmentRegexMatched).toBeTrue();
      expect(component.classroomUrlFragmentIsTooLong).toBeFalse();
      expect(component.classroomUrlFragmentIsEmpty).toBeFalse();
    });

  it(
    'should remove duplicate url fragment error message on model change',
    () => {
      component.classroomUrlFragmentIsDuplicate = true;
      component.urlFragment = 'physics';

      component.onClassroomUrlFragmentChange();

      expect(component.classroomUrlFragmentIsDuplicate).toBeFalse();
    });

  it(
    'should convert the topic dependencies from topic ID form to topic name',
    fakeAsync(() => {
      const topicIdTotopicName = {
        topicId1: 'Dummy topic 1',
        topicId2: 'Dummy topic 2',
        topicId3: 'Dummy topic 3'
      };
      const topicIdToPrerequisiteTopicIds = {
        topicId1: [],
        topicId2: ['topicId1'],
        topicId3: ['topicId1']
      };
      const topicNameToPrerequisiteTopicNames = {
        'Dummy topic 1': [],
        'Dummy topic 2': ['Dummy topic 1'],
        'Dummy topic 3': ['Dummy topic 1']
      };

      spyOn(editableTopicBackendApiService, 'getTopicIdToTopicNameAsync')
        .and.returnValue(Promise.resolve(topicIdTotopicName));

      component.getTopicDependencyByTopicName(topicIdToPrerequisiteTopicIds);

      tick();

      expect(component.topicNameToPrerequisiteTopicNames).toEqual(
        topicNameToPrerequisiteTopicNames);
    }));

  it(
    'should be able to add new topic ID to classroom', fakeAsync(() => {
      component.updatedClassroomDict = {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: '',
        topicListIntro: '',
        topicIdToPrerequisiteTopicIds: {}
      };
      expect(component.topicsCountInClassroom).toEqual(0);
      expect(component.topicIdToPrerequisiteTopicIds).toEqual({});
      expect(component.topicNameToPrerequisiteTopicNames).toEqual({});
      const topicIdToTopicName = {
        topicId1: 'Dummy topic 1'
      };

      spyOn(editableTopicBackendApiService, 'getTopicIdToTopicNameAsync')
        .and.returnValue(Promise.resolve(topicIdToTopicName));

      component.addTopicId('topicId1');

      tick();

      expect(component.topicIdToPrerequisiteTopicIds).toEqual({
        topicId1: []
      });
      expect(component.topicNameToPrerequisiteTopicNames).toEqual({
        'Dummy topic 1': []
      });
      expect(component.topicsCountInClassroom).toEqual(1);
    }));

  it(
    'should be able to show error when new topic ID does not exist',
    fakeAsync(() => {
      component.topicWithGivenIdExists = true;

      spyOn(editableTopicBackendApiService, 'getTopicIdToTopicNameAsync')
        .and.returnValue(Promise.reject());

      component.addTopicId('topicId1');

      tick();

      expect(component.topicWithGivenIdExists).toBeFalse();
    }));

  it('should be able to show and remove new topic input field', () => {
    expect(component.addNewTopicInputIsShown).toBeFalse();

    component.showNewTopicInputField();

    expect(component.addNewTopicInputIsShown).toBeTrue();

    component.removeNewTopicInputField();

    expect(component.addNewTopicInputIsShown).toBeFalse();
  });

  it('should remove existing error for topic ID model change', () => {
    component.topicWithGivenIdExists = false;

    component.onNewTopicInputModelChange();

    expect(component.topicWithGivenIdExists).toBeTrue();
  });

  it('should not present error for valid dependency graph', () => {
    component.cyclicCheckError = false;
    component.topicsGraphIsCorrect = true;

    component.topicIdToPrerequisiteTopicIds = {
      topic_id_1: ['topic_id_2', 'topic_id_3'],
      topic_id_2: [],
      topic_id_3: ['topic_id_2']
    };

    component.validateDependencyGraph();

    expect(component.cyclicCheckError).toBeFalse();
    expect(component.topicsGraphIsCorrect).toBeTrue();

    component.topicIdToPrerequisiteTopicIds = {
      topic_id_1: [],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2']
    };

    component.validateDependencyGraph();

    expect(component.cyclicCheckError).toBeFalse();
    expect(component.topicsGraphIsCorrect).toBeTrue();

    component.topicIdToPrerequisiteTopicIds = {
      topic_id_1: [],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2', 'topic_id_1']
    };

    component.validateDependencyGraph();

    expect(component.cyclicCheckError).toBeFalse();
    expect(component.topicsGraphIsCorrect).toBeTrue();
  });

  it('should be able to present error for invalid dependency graph', () => {
    component.cyclicCheckError = false;
    component.topicsGraphIsCorrect = true;

    component.topicIdToPrerequisiteTopicIds = {
      topic_id_1: ['topic_id_3'],
      topic_id_2: ['topic_id_1'],
      topic_id_3: ['topic_id_2']
    };

    component.validateDependencyGraph();

    expect(component.cyclicCheckError).toBeTrue();
    expect(component.topicsGraphIsCorrect).toBeFalse();
  });

  it('should be able to add prerequisite for a topic', () => {
    component.topicIdsToTopicName = {
      topicId1: 'Dummy topic 1',
      topicId2: 'Dummy topic 2',
      topicId3: 'Dummy topic 3'
    };

    component.topicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2']
    };
    component.topicNameToPrerequisiteTopicNames = {
      'Dummy topic 1': [],
      'Dummy topic 2': ['Dummy topic 1'],
      'Dummy topic 3': ['Dummy topic 2']
    };

    component.updatedClassroomDict = {
      classroomId: 'classroomId',
      name: 'math',
      urlFragment: 'math',
      courseDetails: '',
      topicListIntro: '',
      topicIdToPrerequisiteTopicIds: component.topicNameToPrerequisiteTopicNames
    };

    component.modifyDependencyForTopic('Dummy topic 3', 'Dummy topic 1');

    const expectedTopicNameToPrerequisiteTopicNames = {
      'Dummy topic 1': [],
      'Dummy topic 2': ['Dummy topic 1'],
      'Dummy topic 3': ['Dummy topic 1', 'Dummy topic 2']
    };

    const expectedTopicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2', 'topicId1']
    };

    expect(component.topicIdToPrerequisiteTopicIds).toEqual(
      expectedTopicIdToPrerequisiteTopicIds);
    expect(component.topicNameToPrerequisiteTopicNames).toEqual(
      expectedTopicNameToPrerequisiteTopicNames);
  });

  it('should be able to remove prerequisite from a topic', () => {
    component.topicIdsToTopicName = {
      topicId1: 'Dummy topic 1',
      topicId2: 'Dummy topic 2',
      topicId3: 'Dummy topic 3'
    };

    component.topicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2', 'topicId1']
    };
    component.topicNameToPrerequisiteTopicNames = {
      'Dummy topic 1': [],
      'Dummy topic 2': ['Dummy topic 1'],
      'Dummy topic 3': ['Dummy topic 2', 'Dummy topic 1']
    };

    component.updatedClassroomDict = {
      classroomId: 'classroomId',
      name: 'math',
      urlFragment: 'math',
      courseDetails: '',
      topicListIntro: '',
      topicIdToPrerequisiteTopicIds: component.topicNameToPrerequisiteTopicNames
    };

    component.modifyDependencyForTopic('Dummy topic 3', 'Dummy topic 1');

    const expectedTopicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2']
    };
    const expectedTopicNameToPrerequisiteTopicNames = {
      'Dummy topic 1': [],
      'Dummy topic 2': ['Dummy topic 1'],
      'Dummy topic 3': ['Dummy topic 2']
    };

    expect(component.topicIdToPrerequisiteTopicIds).toEqual(
      expectedTopicIdToPrerequisiteTopicIds);
    expect(component.topicNameToPrerequisiteTopicNames).toEqual(
      expectedTopicNameToPrerequisiteTopicNames);
  });

  it('should correctly display dependency dropdown input field', () => {
    component.dependencyGraphDropdownIsShown = false;
    component.currentTopicOnEdit = '';

    component.showDependencyGraphDropdown('Dummy topic 1');

    expect(component.dependencyGraphDropdownIsShown).toBeTrue();
    expect(component.currentTopicOnEdit).toEqual('Dummy topic 1');

    component.closeDependencyGraphDropdown();

    expect(component.dependencyGraphDropdownIsShown).toBeFalse();
  });

  it('should be able to get available prerequisite for topic names', () => {
    component.topicNameToPrerequisiteTopicNames = {
      'Dummy topic 1': [],
      'Dummy topic 2': ['Dummy topic 1'],
      'Dummy topic 3': ['Dummy topic 2']
    };
    component.selectedTopics = [];

    component.getAvailablePrerequisiteTopicNamesForDropdown('Dummy topic 2');

    expect(component.eligibleTopicNames).toEqual(
      ['Dummy topic 1', 'Dummy topic 3']);
    expect(component.selectedTopics).toEqual(['Dummy topic 1']);
  });
});
