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
import { AlertsService } from 'services/alerts.service';
import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService, ClassroomBackendDict, ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ClassroomEditorConfirmModalComponent } from './modals/classroom-editor-confirm-modal.component';
import { DeleteClassroomConfirmModalComponent } from './modals/delete-classroom-confirm-modal.component';
import { CreateNewClassroomModalComponent } from './modals/create-new-classroom-modal.component';
import cloneDeep from 'lodash/cloneDeep';
import { ExistingClassroomData } from './existing-classroom-admin.model';
import { ClassroomAdminDataService } from './services/classroom-admin-data.service';

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
    private classroomAdminDataService: ClassroomAdminDataService,
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
  ) {}

  classroomCount: number = 0;
  classroomIdToClassroomName: {[classroomId: string]: string} = {};

  classroomData!: ExistingClassroomData;
  tempClassroomData!: ExistingClassroomData;

  classroomUrlFragmentIsDuplicate: boolean = false;
  existingClassroomNames: string[] = [];

  pageIsInitialized: boolean = false;
  classroomDataIsChanged: boolean = false;
  classroomDetailsIsShown: boolean = false;
  classroomViewerMode: boolean = false;
  classroomEditorMode: boolean = false;
  classroomDataSaveInProgress: boolean = false;

  getClassroomData(classroomId: string): void {
    if (
      this.tempClassroomData && (
        this.tempClassroomData.getClassroomId() === classroomId) &&
      this.classroomViewerMode
    ) {
      this.classroomDetailsIsShown = false;
      this.classroomViewerMode = false;
      return;
    }

    if (this.classroomEditorMode) {
      return;
    }

    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then(
      response => {
        this.classroomData = ExistingClassroomData.createClassroomFromDict(
          cloneDeep(response.classroomDict));
        this.tempClassroomData = ExistingClassroomData.createClassroomFromDict(
          cloneDeep(response.classroomDict));

        this.classroomDataIsChanged = false;

        this.existingClassroomNames = (
          Object.values(this.classroomIdToClassroomName));
        const index = this.existingClassroomNames.indexOf(
          this.tempClassroomData.getClassroomName());
        this.existingClassroomNames.splice(index, 1);

        this.classroomDetailsIsShown = true;
        this.classroomViewerMode = true;

        this.classroomAdminDataService.existingClassroomNames = (
          this.existingClassroomNames);

        this.classroomAdminDataService.onClassroomNameChange(
          this.tempClassroomData);
        this.classroomAdminDataService.onClassroomUrlChange(
          this.tempClassroomData,
          this.classroomData.getClassroomUrlFragment());
      }, (errorResponse) => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(
            errorResponse) !== -1) {
          this.alertsService.addWarning('Failed to get classroom data');
        }
      });
  }

  getAllClassroomIdToClassroomName(): void {
    this.classroomBackendApiService
      .getAllClassroomIdToClassroomNameDictAsync().then(response => {
        this.pageIsInitialized = true;
        this.classroomIdToClassroomName = response;
        this.classroomCount = Object.keys(response).length;
      });
  }

  updateClassroomField(): void {
    const classroomNameIsChanged = (
      this.tempClassroomData.getClassroomName() !==
      this.classroomData.getClassroomName()
    );
    const classroomUrlIsChanged = (
      this.tempClassroomData.getClassroomUrlFragment() !==
      this.classroomData.getClassroomUrlFragment()
    );
    const classroomTopicListIntroIsChanged = (
      this.tempClassroomData.getTopicListIntro() !==
      this.classroomData.getTopicListIntro()
    );
    const classroomCourseDetailsIsChanged = (
      this.tempClassroomData.getCourseDetails() !==
      this.classroomData.getCourseDetails()
    );

    if (
      classroomNameIsChanged ||
      classroomUrlIsChanged ||
      classroomCourseDetailsIsChanged ||
      classroomTopicListIntroIsChanged
    ) {
      this.classroomDataIsChanged = true;
    } else {
      this.classroomDataIsChanged = false;
    }
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
    this.classroomDataSaveInProgress = true;
    const backendDict = this.convertClassroomDictToBackendForm(
      this.tempClassroomData.getClassroomDict());

    this.classroomEditorMode = false;
    this.classroomViewerMode = true;
    this.classroomDataIsChanged = false;

    this.classroomBackendApiService.updateClassroomDataAsync(
      classroomId, backendDict).then(() => {
      this.classroomIdToClassroomName[
        this.tempClassroomData.getClassroomId()] = (
        this.tempClassroomData.getClassroomName());
      this.classroomData = cloneDeep(this.tempClassroomData);
      this.classroomDataSaveInProgress = false;
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

  openClassroomInEditorMode(): void {
    this.classroomViewerMode = false;
    this.classroomEditorMode = true;
  }

  openClassroomInViewerMode(): void {
    this.classroomViewerMode = true;
    this.classroomEditorMode = false;
  }

  closeClassroomConfigEditor(): void {
    if (this.classroomDataIsChanged) {
      let modalRef: NgbModalRef = this.ngbModal.
        open(ClassroomEditorConfirmModalComponent, {
          backdrop: 'static'
        });
      modalRef.result.then(() => {
        this.openClassroomInViewerMode();
        this.tempClassroomData = cloneDeep(this.classroomData);
        this.classroomDataIsChanged = false;

        this.classroomAdminDataService.reinitializeClassroomValidationFields();
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    } else {
      this.openClassroomInViewerMode();
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

  ngOnInit(): void {
    this.getAllClassroomIdToClassroomName();
  }
}

angular.module('oppia').directive(
  'oppiaClassroomAdminPage', downgradeComponent(
    {component: ClassroomAdminPageComponent}));
