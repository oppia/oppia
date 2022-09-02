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
import { ClassroomEditorConfirmModalComponent } from './modals/classroom-editor-confirm-modal.component';
import { DeleteClassroomConfirmModalComponent } from './modals/delete-classroom-confirm-modal.component';
import { CreateNewClassroomModalComponent } from './modals/create-new-classroom-modal.component';
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

  getClassroomData(classroomId: string): void {
    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then(
      response => {
        if (this.classroomId === classroomId && this.classroomViewerMode) {
          this.classroomDetailsIsShown = false;
          this.classroomViewerMode = false;
          return;
        }

        if (this.classroomId === classroomId && this.classroomEditorMode) {
          return;
        }

        this.selectedClassroomDict = cloneDeep(response.classroomDict);
        this.updatedClassroomDict = cloneDeep(response.classroomDict);

        this.updateClassroomPropertiesFromDict(
          cloneDeep(this.selectedClassroomDict));

        this.classroomDataIsChanged = false;
        this.classroomDetailsIsShown = true;
        this.classroomViewerMode = true;
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
    let backendDict = this.convertClassroomDictToBackendForm(
      this.updatedClassroomDict);
    this.classroomBackendApiService.updateClassroomDataAsync(
      classroomId, backendDict).then(() => {
      this.classroomEditorMode = false;
      this.classroomViewerMode = true;
      this.classroomDataIsChanged = false;
      this.classroomIdToClassroomName[this.classroomId] = this.classroomName;
      this.selectedClassroomDict = cloneDeep(this.updatedClassroomDict);
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
}

angular.module('oppia').directive(
  'oppiaClassroomAdminPage', downgradeComponent(
    {component: ClassroomAdminPageComponent}));
