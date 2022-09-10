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
 * @fileoverview Classroom admin component.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ClassroomBackendApiService, ClassroomBackendDict, ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ClassroomEditorConfirmModalComponent } from './modals/classroom-editor-confirm-modal.component';
import { DeleteClassroomConfirmModalComponent } from './modals/delete-classroom-confirm-modal.component';
import { CreateNewClassroomModalComponent } from './modals/create-new-classroom-modal.component';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import cloneDeep from 'lodash/cloneDeep';

@Component({
  selector: 'oppia-classroom-admin-page',
  templateUrl: './classroom-admin-page.component.html',
})
export class ClassroomAdminPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private editableTopicBackendApiService: EditableTopicBackendApiService,
    private ngbModal: NgbModal,
  ) {}

  classroomCount: number = 0;
  classroomIdToClassroomName: {[classroomId: string]: string} = {};
  selectedClassroomDict!: ClassroomDict;
  updatedClassroomDict!: ClassroomDict;

  classroomId: string = '';
  classroomName: string = '';
  urlFragment: string = '';
  courseDetails: string = '';
  topicListIntro: string = '';
  topicIds: string[] = [];
  topicIdToPrerequisiteTopicIds: {[topicId: string]: string[]} = {};

  pageIsInitialized: boolean = false;
  classroomDataIsChanged: boolean = false;
  classroomDetailsIsShown: boolean = false;
  classroomViewerMode: boolean = false;
  classroomEditorMode: boolean = false;
  savingClassroomData: boolean = false;

  classroomNameExceedsMaxLen: boolean = false;
  emptyClassroomName: boolean = false;
  duplicateClassroomName: boolean = false;
  classroomNameIsValid: boolean = true;

  classroomUrlFragmentExceedsmaxLen: boolean = false;
  emptyClassroomUrlFrgament: boolean = false;
  duplicateClassroomUrlFragment: boolean = false;
  urlFragmentRegexMatched: boolean = true;
  classroomUrlFragmentIsValid: boolean = true;

  getClassroomData(classroomId: string): void {
    if (this.classroomId === classroomId && this.classroomViewerMode) {
      this.classroomDetailsIsShown = false;
      this.classroomViewerMode = false;
      return;
    }
    if (this.classroomEditorMode) {
      return;
    }
    this.classroomDetailsIsShown = true;
    this.classroomViewerMode = true;

    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then(
      response => {
        this.selectedClassroomDict = cloneDeep(response.classroomDict);
        this.updatedClassroomDict = cloneDeep(response.classroomDict);

        this.updateClassroomPropertiesFromDict(
          cloneDeep(this.selectedClassroomDict));

        this.classroomDataIsChanged = false;
      }
    );
  }

  getAllClassroomIdToClassroomName(): void {
    this.classroomBackendApiService
      .getAllClassroomIdToClassroomNameDictAsync().then(response => {
        this.pageIsInitialized = true;
        this.classroomIdToClassroomName = response;
        this.classroomCount = Object.keys(response).length;
      });
  }

  updateClassroomName(newClasroomName: string): void {
    this.updatedClassroomDict.name = newClasroomName;
    this.classroomDataIsChanged = true;
  }

  updateUrlFragment(newUrlFragment: string): void {
    this.updatedClassroomDict.urlFragment = newUrlFragment;
    this.classroomDataIsChanged = true;
  }

  updateCourseDetails(newClassroomDetails: string): void {
    this.updatedClassroomDict.courseDetails = newClassroomDetails;
    this.classroomDataIsChanged = true;
  }

  updateTopicListIntro(newTopicListIntro: string): void {
    this.updatedClassroomDict.topicListIntro = newTopicListIntro;
    this.classroomDataIsChanged = true;
  }

  convertClassroomDictToBackendForm(
      classroomDict: ClassroomDict): ClassroomBackendDict {
    return {
      classroom_id: classroomDict.classroomId,
      name: classroomDict.name,
      url_fragment: classroomDict.urlFragment,
      course_details: classroomDict.courseDetails,
      topic_list_intro: classroomDict.topicListIntro,
      topic_id_to_prerequisite_topic_ids: (
        classroomDict.topicIdToPrerequisiteTopicIds)
    };
  }

  saveClassroomData(classroomId: string): void {
    this.savingClassroomData = true;
    let backendDict = this.convertClassroomDictToBackendForm(
      this.updatedClassroomDict);
    this.classroomBackendApiService.doesClassroomWithUrlFragmentExist(
      this.urlFragment).then(response => {
      if (response && (
          this.selectedClassroomDict.urlFragment !=
          this.updatedClassroomDict.urlFragment)
      ) {
        this.savingClassroomData = false;
        this.duplicateClassroomUrlFragment = true;
        this.classroomUrlFragmentIsValid = false;
        return;
      }
      this.classroomEditorMode = false;
      this.classroomViewerMode = true;
      this.classroomDataIsChanged = false;

      this.classroomBackendApiService.updateClassroomDataAsync(
        classroomId, backendDict).then(() => {
        this.classroomIdToClassroomName[this.classroomId] = this.classroomName;
        this.selectedClassroomDict = cloneDeep(this.updatedClassroomDict);
        this.savingClassroomData = false;
      });
    });
  }

  deleteClassroom(classroomId: string): void {
    let modalRef: NgbModalRef = this.ngbModal.
      open(DeleteClassroomConfirmModalComponent, {
        backdrop: 'static'
      });
    modalRef.result.then(() => {
      this.classroomBackendApiService.deleteClassroomAsync(classroomId).then(
        () => {
          delete this.classroomIdToClassroomName[classroomId];
          this.classroomCount--;
        });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  openClassroomConfigEditor(): void {
    this.classroomViewerMode = false;
    this.classroomEditorMode = true;
  }

  closeClassroomConfigEditor(): void {
    if (this.classroomDataIsChanged) {
      let modalRef: NgbModalRef = this.ngbModal.
        open(ClassroomEditorConfirmModalComponent, {
          backdrop: 'static'
        });
      modalRef.result.then(() => {
        this.classroomEditorMode = false;
        this.classroomViewerMode = true;
        this.updateClassroomPropertiesFromDict(this.selectedClassroomDict);
        this.classroomDataIsChanged = false;
        this.duplicateClassroomUrlFragment = false;
        this.classroomUrlFragmentIsValid = true;
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    } else {
      this.classroomEditorMode = false;
      this.classroomViewerMode = true;
    }
  }

  createNewClassroom(): void {
    this.classroomViewerMode = false;
    this.classroomDetailsIsShown = false;
    let modalRef: NgbModalRef = this.ngbModal.
      open(CreateNewClassroomModalComponent, {
        backdrop: 'static'
      });
    modalRef.componentInstance.existingClassroomNames = (
      Object.values(this.classroomIdToClassroomName)
    );
    modalRef.result.then((classroomDict) => {
      this.classroomIdToClassroomName[classroomDict.classroom_id] = (
        classroomDict.name);
      this.classroomCount++;
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  updateClassroomPropertiesFromDict(classroomDict: ClassroomDict): void {
    this.classroomId = classroomDict.classroomId;
    this.classroomName = classroomDict.name;
    this.urlFragment = classroomDict.urlFragment;
    this.courseDetails = classroomDict.courseDetails;
    this.topicListIntro = classroomDict.topicListIntro;
    this.topicIds = Object.keys(
      classroomDict.topicIdToPrerequisiteTopicIds);
    this.topicIdToPrerequisiteTopicIds = (
      classroomDict.topicIdToPrerequisiteTopicIds);
  }

  ngOnInit(): void {
    this.getAllClassroomIdToClassroomName();
  }

  onClassroomNameChange(): void {
    this.classroomName = this.classroomName.replace(/\s+/g, ' ').trim();
    this.classroomNameIsValid = true;

    if (this.classroomName === '') {
      this.emptyClassroomName = true;
      this.classroomNameIsValid = false;
      this.duplicateClassroomName = false;
      return;
    } else {
      this.emptyClassroomName = false;
    }

    if (
      this.classroomName.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_NAME
    ) {
      this.classroomNameExceedsMaxLen = true;
      this.duplicateClassroomName = false;
      this.classroomNameIsValid = false;
      return;
    } else {
      this.classroomNameExceedsMaxLen = false;
    }

    let existingClassroomNames: string[] = (
      Object.values(this.classroomIdToClassroomName));

    if (existingClassroomNames.indexOf(this.classroomName) !== -1) {
      this.duplicateClassroomName = true;
      this.classroomNameIsValid = false;
    } else {
      this.duplicateClassroomName = false;
    }
  }

  onClassroomUrlFragmentChange(): void {
    this.classroomUrlFragmentIsValid = true;

    if (this.urlFragment === '') {
      this.emptyClassroomUrlFrgament = true;
      this.duplicateClassroomUrlFragment = false;
      this.classroomUrlFragmentIsValid = false;
      return;
    } else {
      this.emptyClassroomUrlFrgament = false;
    }

    if (
      this.urlFragment.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
    ) {
      this.classroomUrlFragmentExceedsmaxLen = true;
      this.duplicateClassroomUrlFragment = false;
      this.classroomUrlFragmentIsValid = false;
      return;
    } else {
      this.classroomUrlFragmentExceedsmaxLen = false;
    }

    let validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX);
    if (validUrlFragmentRegex.test(this.urlFragment)) {
      this.urlFragmentRegexMatched = true;
    } else {
      this.urlFragmentRegexMatched = false;
      this.classroomUrlFragmentIsValid = false;
      return;
    }

    if (this.duplicateClassroomUrlFragment) {
      this.duplicateClassroomUrlFragment = false;
      this.classroomUrlFragmentIsValid = true;
    }
  }
}

angular.module('oppia').directive(
  'oppiaClassroomAdminPage', downgradeComponent(
    {component: ClassroomAdminPageComponent}));
