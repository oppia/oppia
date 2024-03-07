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

import cloneDeep from 'lodash/cloneDeep';
import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AlertsService } from 'services/alerts.service';
import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService, ClassroomBackendDict, ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ClassroomEditorConfirmModalComponent } from './modals/classroom-editor-confirm-modal.component';
import { DeleteClassroomConfirmModalComponent } from './modals/delete-classroom-confirm-modal.component';
import { CreateNewClassroomModalComponent } from './modals/create-new-classroom-modal.component';
import { DeleteTopicFromClassroomModalComponent } from './modals/delete-topic-from-classroom-modal.component';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { TopicsDependencyGraphModalComponent } from './modals/topic-dependency-graph-viz-modal.component';
import { ExistingClassroomData, TopicIdToPrerequisiteTopicIds, TopicIdToTopicName } from './existing-classroom.model';
import { ClassroomAdminDataService } from './services/classroom-admin-data.service';


export interface TopicNameToPrerequisiteTopicNames {
  [topicName: string]: string[];
}

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
    private editableTopicBackendApiService: EditableTopicBackendApiService
  ) {}

  classroomData!: ExistingClassroomData;
  tempClassroomData!: ExistingClassroomData;

  classroomCount: number = 0;
  classroomIdToClassroomName: {[classroomId: string]: string} = {};
  existingClassroomNames: string[] = [];

  currentTopicOnEdit!: string;
  eligibleTopicNamesForPrerequisites: string[] = [];
  tempEligibleTopicNamesForPrerequisites: string[] = [];
  prerequisiteInput!: string;

  topicIds: string[] = [];
  newTopicId: string = '';

  topicNameToPrerequisiteTopicNames: TopicNameToPrerequisiteTopicNames = {};
  topicIdsToTopicName: TopicIdToTopicName = {};
  topicNames: string[] = [];
  topicDependencyIsLoaded: boolean = false;

  pageIsInitialized: boolean = false;
  classroomDataIsChanged: boolean = false;
  classroomDetailsIsShown: boolean = false;
  classroomViewerMode: boolean = false;
  classroomEditorMode: boolean = false;
  classroomDataSaveInProgress: boolean = false;

  newTopicCanBeAdded: boolean = false;
  topicWithGivenIdExists: boolean = true;
  topicDependencyEditOptionIsShown: boolean = false;
  editTopicOptionIsShown: boolean = true;

  getEligibleTopicPrerequisites(currentTopicName: string): void {
    this.eligibleTopicNamesForPrerequisites = [];
    this.prerequisiteInput = '';
    let topicNames = Object.keys(this.topicNameToPrerequisiteTopicNames);

    for (let topicName of topicNames) {
      if (
        topicName !== currentTopicName &&
          this.topicNameToPrerequisiteTopicNames[currentTopicName]
            .indexOf(topicName) === -1
      ) {
        this.eligibleTopicNamesForPrerequisites.push(topicName);
      }
    }
    this.tempEligibleTopicNamesForPrerequisites = (
      this.eligibleTopicNamesForPrerequisites);
    this.currentTopicOnEdit = currentTopicName;
  }

  onPrerequisiteInputChange(): void {
    this.tempEligibleTopicNamesForPrerequisites = (
      this.eligibleTopicNamesForPrerequisites.filter(
        option => option.includes(this.prerequisiteInput)
      )
    );
  }

  getClassroomData(classroomId: string): void {
    if (this.classroomEditorMode) {
      return;
    }

    if (
      this.tempClassroomData && (
        this.tempClassroomData.getClassroomId() === classroomId) &&
      this.classroomViewerMode
    ) {
      this.classroomDetailsIsShown = false;
      this.classroomViewerMode = false;
      this.topicNames = [];
      this.topicNameToPrerequisiteTopicNames = {};
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

        this.classroomAdminDataService.validateClassroom(
          this.tempClassroomData, this.classroomData);

        this.setTopicDependencyByTopicName(
          this.tempClassroomData.getTopicIdToPrerequisiteTopicId());
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
    const topicDependencyIsChanged = (
      JSON.stringify(
        this.tempClassroomData.getTopicIdToPrerequisiteTopicId()) !==
      JSON.stringify(
        this.classroomData.getTopicIdToPrerequisiteTopicId())
    );

    if (
      classroomNameIsChanged ||
      classroomUrlIsChanged ||
      classroomCourseDetailsIsChanged ||
      classroomTopicListIntroIsChanged ||
      topicDependencyIsChanged
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

    this.openClassroomInViewerMode();
    this.classroomDataIsChanged = false;

    this.classroomBackendApiService.updateClassroomDataAsync(
      classroomId, backendDict).then(() => {
      this.classroomIdToClassroomName[
        this.tempClassroomData.getClassroomId()] = (
        this.tempClassroomData.getClassroomName()
      );
      this.classroomData = cloneDeep(this.tempClassroomData);
      this.classroomDataSaveInProgress = false;
    }, () => {
      this.tempClassroomData = cloneDeep(this.classroomData);
      this.setTopicDependencyByTopicName(
        this.tempClassroomData.getTopicIdToPrerequisiteTopicId());
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
        this.tempClassroomData = cloneDeep(this.classroomData);
        this.setTopicDependencyByTopicName(
          this.tempClassroomData.getTopicIdToPrerequisiteTopicId());

        this.classroomDataIsChanged = false;
        this.classroomAdminDataService.reinitializeErrorMsgs();
        this.openClassroomInViewerMode();
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    } else {
      this.openClassroomInViewerMode();
    }
    this.removeNewTopicInputField();
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
      this.classroomAdminDataService.reinitializeErrorMsgs();
    });
  }

  ngOnInit(): void {
    this.getAllClassroomIdToClassroomName();
  }

  setTopicDependencyByTopicName(
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ): void {
    this.topicDependencyIsLoaded = false;
    let topicIds = Object.keys(topicIdToPrerequisiteTopicIds);

    this.editableTopicBackendApiService.getTopicIdToTopicNameAsync(
      topicIds).then(topicIdsToTopicName => {
      this.topicNameToPrerequisiteTopicNames = {};

      for (let currentTopicId in topicIdToPrerequisiteTopicIds) {
        let currentTopicName = topicIdsToTopicName[currentTopicId];

        let prerequisiteTopicIds = (
          topicIdToPrerequisiteTopicIds[currentTopicId]);
        let prerequisiteTopicNames = [];

        for (let topicId of prerequisiteTopicIds) {
          prerequisiteTopicNames.push(
            topicIdsToTopicName[topicId]);
        }

        this.tempClassroomData._topicIdToTopicName = topicIdsToTopicName;

        this.topicNameToPrerequisiteTopicNames[currentTopicName] = (
          prerequisiteTopicNames);
        this.topicIdsToTopicName = topicIdsToTopicName;
        this.topicNames = Object.values(this.topicIdsToTopicName);
        this.topicDependencyIsLoaded = true;
      }
    });
  }

  addTopicId(topicId: string): void {
    this.editableTopicBackendApiService.getTopicIdToTopicNameAsync(
      [topicId]).then(topicIdToTopicName => {
      const topicName = topicIdToTopicName[topicId];

      this.topicIdsToTopicName[topicId] = topicName;
      this.tempClassroomData.addNewTopicId(topicId);
      this.topicNameToPrerequisiteTopicNames[topicName] = [];
      this.topicNames.push(topicName);
      this.topicDependencyIsLoaded = true;

      this.classroomDataIsChanged = true;
      this.newTopicCanBeAdded = false;
      this.topicWithGivenIdExists = true;

      this.newTopicId = '';
    }, () => {
      this.topicWithGivenIdExists = false;
    });
  }

  showNewTopicInputField(): void {
    this.newTopicCanBeAdded = true;
  }

  removeNewTopicInputField(): void {
    this.newTopicCanBeAdded = false;
    this.topicWithGivenIdExists = true;
    this.newTopicId = '';
  }

  onNewTopicInputModelChange(): void {
    if (!this.topicWithGivenIdExists) {
      this.topicWithGivenIdExists = true;
    }
  }

  getTopicIdFromTopicName(topicName: string): string {
    let topicIdForGivenTopicName: string = '';
    for (let topicId in this.topicIdsToTopicName) {
      if (this.topicIdsToTopicName[topicId] === topicName) {
        topicIdForGivenTopicName = topicId;
        break;
      }
    }
    return topicIdForGivenTopicName;
  }

  addDependencyForTopic(
      currentTopicName: string, prerequisiteTopicName: string): void {
    let prerequisiteTopicNames = cloneDeep(
      this.topicNameToPrerequisiteTopicNames[currentTopicName]);
    let currentTopicId = this.getTopicIdFromTopicName(currentTopicName);
    let prerequisiteTopicId = this.getTopicIdFromTopicName(
      prerequisiteTopicName);

    if (prerequisiteTopicNames.indexOf(prerequisiteTopicName) !== -1) {
      return;
    }

    this.topicNameToPrerequisiteTopicNames[currentTopicName].push(
      prerequisiteTopicName);
    this.topicNameToPrerequisiteTopicNames[currentTopicName].sort();
    this.tempClassroomData.addPrerequisiteTopicId(
      currentTopicId, prerequisiteTopicId);

    this.classroomAdminDataService.validateClassroom(
      this.tempClassroomData, this.classroomData);
    this.updateClassroomField();
  }

  removeDependencyFromTopic(
      currentTopicName: string, prerequisiteTopicName: string
  ): void {
    let currentTopicId = this.getTopicIdFromTopicName(currentTopicName);
    let prerequisiteTopicId = this.getTopicIdFromTopicName(
      prerequisiteTopicName);

    this.tempClassroomData.removeDependency(
      currentTopicId, prerequisiteTopicId);

    let prerequisiteTopicNames = (
      this.topicNameToPrerequisiteTopicNames[currentTopicName]);
    const index = prerequisiteTopicNames.indexOf(prerequisiteTopicName);
    prerequisiteTopicNames.splice(index, 1);

    this.classroomAdminDataService.validateClassroom(
      this.tempClassroomData, this.classroomData);
    this.updateClassroomField();
  }

  editDependency(topicName: string): void {
    if (this.topicDependencyEditOptionIsShown === false) {
      this.topicDependencyEditOptionIsShown = true;
      this.currentTopicOnEdit = topicName;
    } else {
      this.topicDependencyEditOptionIsShown = false;
    }
  }

  deleteTopic(topicNameToDelete: string): void {
    let childTopicNodes = [];
    for (let topicName in this.topicNameToPrerequisiteTopicNames) {
      const prerequisites = this.topicNameToPrerequisiteTopicNames[topicName];
      if (prerequisites.indexOf(topicNameToDelete) !== -1) {
        childTopicNodes.push(topicName);
      }
    }

    let modalRef: NgbModalRef = this.ngbModal.
      open(DeleteTopicFromClassroomModalComponent, {
        backdrop: 'static'
      });
    modalRef.componentInstance.prerequisiteTopics = (
      Object.values(childTopicNodes)
    );
    modalRef.componentInstance.topicName = topicNameToDelete;
    modalRef.result.then(() => {
      const topicId = this.getTopicIdFromTopicName(topicNameToDelete);
      this.tempClassroomData.removeTopic(topicId);

      delete this.topicNameToPrerequisiteTopicNames[topicNameToDelete];
      delete this.topicIdsToTopicName[topicId];

      this.topicNames = Object.keys(this.topicNameToPrerequisiteTopicNames);

      this.classroomAdminDataService.validateClassroom(
        this.tempClassroomData, this.classroomData);

      this.classroomDataIsChanged = true;

      if (this.tempClassroomData.getTopicsCount() === 0) {
        this.topicDependencyIsLoaded = false;
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.topicNames, event.previousIndex, event.currentIndex);
    this.classroomDataIsChanged = true;
    let tempTopicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds = {};

    for (let topicName of this.topicNames) {
      const prerequisiteTopicNames = (
        this.topicNameToPrerequisiteTopicNames[topicName]);
      const topicId = this.getTopicIdFromTopicName(topicName);

      let prerequisiteTopicIds = [];
      for (let prerequisiteTopicName of prerequisiteTopicNames) {
        prerequisiteTopicIds.push(this.getTopicIdFromTopicName(
          prerequisiteTopicName));
      }
      tempTopicIdToPrerequisiteTopicIds[topicId] = prerequisiteTopicIds;
    }

    this.tempClassroomData.setTopicIdToPrerequisiteTopicId(
      tempTopicIdToPrerequisiteTopicIds);
    this.updateClassroomField();
  }

  viewGraph(): void {
    let modalRef: NgbModalRef = this.ngbModal.
      open(TopicsDependencyGraphModalComponent, {
        backdrop: true,
        windowClass: 'oppia-large-modal-window'
      });
    modalRef.componentInstance.topicIdToPrerequisiteTopicIds = (
      this.tempClassroomData.getTopicIdToPrerequisiteTopicId());
    modalRef.componentInstance.topicIdToTopicName = this.topicIdsToTopicName;

    modalRef.result.then(() => {
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  getPrerequisiteLength(topicName: string): number {
    return this.topicNameToPrerequisiteTopicNames[topicName].length;
  }
}
