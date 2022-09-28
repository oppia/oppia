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
import { CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { AlertsService } from 'services/alerts.service';
import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService, ClassroomBackendDict, ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ClassroomEditorConfirmModalComponent } from './modals/classroom-editor-confirm-modal.component';
import { DeleteClassroomConfirmModalComponent } from './modals/delete-classroom-confirm-modal.component';
import { CreateNewClassroomModalComponent } from './modals/create-new-classroom-modal.component';
import { DeleteTopicFromClassroomModalComponent } from './modals/delete-topic-from-classroom-modal.component';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import cloneDeep from 'lodash/cloneDeep';
import { ClassroomData } from './classroom-admin.model';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { TopicsDependencyGraphModalComponent } from './modals/topic-dependency-graph-viz-modal.component';


interface TopicIdToPrerequisiteTopicIds {
  [topicId: string]: string[];
}

interface TopicNameToPrerequisiteTopicNames {
  [topicName: string]: string[];
}

interface TopicIdToTopicName {
  [topicId: string]: string;
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
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private editableTopicBackendApiService: EditableTopicBackendApiService
  ) {}

  classroomCount: number = 0;
  classroomIdToClassroomName: {[classroomId: string]: string} = {};

  myControl = new FormControl('');
  filteredOptions: Observable<string[]>;
  graphData;

  classroomId: string = '';
  classroomName: string = '';
  urlFragment: string = '';
  courseDetails: string = '';
  topicListIntro: string = '';
  topicIds: string[] = [];
  topicNames: string[] = [];
  eligibleTopicNames: string[] = [];
  topicIdsToTopicName: TopicIdToTopicName = {};
  newTopicId: string = '';
  topicNameToPrerequisiteTopicNames: TopicNameToPrerequisiteTopicNames = {};
  topicsCountInClassroom: number = 0;
  selectedTopicName = '';
  classroomData!: ClassroomData;
  tempClassroomData!: ClassroomData;

  classroomUrlFragmentIsDuplicate: boolean = false;
  existingClassroomNames: string[] = [];

  pageIsInitialized: boolean = false;
  classroomDataIsChanged: boolean = false;
  classroomDetailsIsShown: boolean = false;
  classroomViewerMode: boolean = false;
  classroomEditorMode: boolean = false;
  classroomDataSaveInProgress: boolean = false;

  cyclicCheckError: boolean = false;
  topicsGraphIsCorrect = true;
  addNewTopicInputIsShown: boolean = false;
  topicWithGivenIdExists: boolean = true;
  topicDependencyEditOptionIsShown: boolean = false;
  editTopicOptionIsShown: boolean = true;

  dependencyGraphDropdownIsShown: boolean = false;
  currentTopicOnEdit!: string;
  eligibleTopicNamesForPrerequisites: string[];

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.eligibleTopicNames.filter(
      option => option.toLowerCase().includes(filterValue));
  }

  getEligibleTopicPrerequisites(currentTopicName: string): void {
    this.eligibleTopicNames = [];
    let topicNames = Object.keys(this.topicNameToPrerequisiteTopicNames);
    for (let topicName of topicNames) {
      if (
        topicName !== currentTopicName &&
          this.topicNameToPrerequisiteTopicNames[currentTopicName]
            .indexOf(topicName) === -1
      ) {
        this.eligibleTopicNames.push(topicName);
      }
    }
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  getClassroomData(classroomId: string): void {
    if (
      this.tempClassroomData && (
        this.tempClassroomData.classroomId === classroomId) &&
      this.classroomViewerMode
    ) {
      this.classroomDetailsIsShown = false;
      this.classroomViewerMode = false;
      this.topicNames = [];
      this.topicNameToPrerequisiteTopicNames = {};
      return;
    }

    if (this.classroomEditorMode) {
      return;
    }

    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then(
      response => {
        this.classroomData = ClassroomData.createNewClassroomFromDict(
          cloneDeep(response.classroomDict));
        this.tempClassroomData = ClassroomData.createNewClassroomFromDict(
          cloneDeep(response.classroomDict));
        this.topicsCountInClassroom = Object.keys(
          this.tempClassroomData.topicIdToPrerequisiteTopicIds).length;
        this.classroomDataIsChanged = false;

        this.existingClassroomNames = (
          Object.values(this.classroomIdToClassroomName));
        const index = this.existingClassroomNames.indexOf(
          this.tempClassroomData.name);
        this.existingClassroomNames.splice(index, 1);

        this.classroomDetailsIsShown = true;
        this.classroomViewerMode = true;

        this.tempClassroomData.setExistingClassroomData(
          this.existingClassroomNames);
        this.tempClassroomData.onClassroomNameChange();
        this.tempClassroomData.onClassroomUrlFragmentChange();
        this.tempClassroomData.topicsGraphIsCorrect = true;

        this.getTopicDependencyByTopicName(
          this.tempClassroomData.topicIdToPrerequisiteTopicIds);
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
      this.tempClassroomData.name !== this.classroomData.name);
    const classroomUrlIsChanged = (
      this.tempClassroomData.urlFragment !==
      this.classroomData.urlFragment);
    const classroomTopicListIntroIsChanged = (
      this.tempClassroomData.topicListIntro !==
      this.classroomData.topicListIntro);
    const classroomCourseDetailsIsChanged = (
      this.tempClassroomData.courseDetails !==
      this.classroomData.courseDetails);

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
    let backendDict = this.convertClassroomDictToBackendForm(
      this.tempClassroomData.getClassroomDict());

    this.classroomBackendApiService.doesClassroomWithUrlFragmentExistAsync(
      this.tempClassroomData.urlFragment).then(response => {
      if (
        response && (
          this.tempClassroomData.urlFragment !== this.classroomData.urlFragment
        )
      ) {
        this.classroomDataSaveInProgress = false;
        this.classroomUrlFragmentIsDuplicate = true;
        this.tempClassroomData.classroomUrlFragmentIsValid = false;
        return;
      }

      this.openClassroomInViewerMode();
      this.classroomDataIsChanged = false;
      this.classroomBackendApiService.updateClassroomDataAsync(
        classroomId, backendDict).then(() => {
        this.classroomIdToClassroomName[this.tempClassroomData.classroomId] = (
          this.tempClassroomData.name);
        this.classroomData = cloneDeep(this.tempClassroomData);
        this.classroomDataSaveInProgress = false;
      }, () => {
        this.tempClassroomData = cloneDeep(this.classroomData);
        this.getTopicDependencyByTopicName(
          this.tempClassroomData.topicIdToPrerequisiteTopicIds);
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
        this.getTopicDependencyByTopicName(
          this.tempClassroomData.topicIdToPrerequisiteTopicIds);

        this.tempClassroomData.supressClassroomNameErrorMessages();
        this.tempClassroomData.supressClassroomUrlFragmentErrorMessages();

        this.tempClassroomData.classroomNameIsValid = true;
        this.tempClassroomData.classroomUrlFragmentIsValid = true;
        this.classroomDataIsChanged = false;
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

  getTopicDependencyByTopicName(
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ): void {
    let topicIds = Object.keys(topicIdToPrerequisiteTopicIds);
    this.topicNameToPrerequisiteTopicNames = {};

    this.editableTopicBackendApiService.getTopicIdToTopicNameAsync(
      topicIds).then(topicIdsToTopicName => {
      for (let currentTopicId in topicIdToPrerequisiteTopicIds) {
        let currentTopicName = topicIdsToTopicName[currentTopicId];

        let prerequisiteTopicIds = (
          topicIdToPrerequisiteTopicIds[currentTopicId]);
        let prerequisiteTopicNames = [];

        for (let topicId of prerequisiteTopicIds) {
          prerequisiteTopicNames.push(
            topicIdsToTopicName[topicId]);
        }

        this.topicNameToPrerequisiteTopicNames[currentTopicName] = (
          prerequisiteTopicNames);
        this.topicIdsToTopicName = topicIdsToTopicName;
        this.topicNames = Object.values(this.topicIdsToTopicName);
      }
    });
  }

  addTopicId(topicId: string): void {
    this.editableTopicBackendApiService.getTopicIdToTopicNameAsync(
      [topicId]).then(topicIdToTopicName => {
      const topicName = topicIdToTopicName[topicId];
      this.tempClassroomData.topicIdToPrerequisiteTopicIds[topicId] = [];
      this.topicNameToPrerequisiteTopicNames[topicName] = [];
      this.classroomDataIsChanged = true;
      this.addNewTopicInputIsShown = false;
      this.topicsCountInClassroom += 1;
      this.newTopicId = '';
    }, () => {
      this.topicWithGivenIdExists = false;
    });
  }

  showNewTopicInputField(): void {
    this.addNewTopicInputIsShown = true;
  }

  removeNewTopicInputField(): void {
    this.topicWithGivenIdExists = true;
    this.addNewTopicInputIsShown = false;
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
    this.selectedTopicName = '';
    this.closeDependencyGraphDropdown();
    let prerequisiteTopicNames = (
      this.topicNameToPrerequisiteTopicNames[currentTopicName]);
    let currentTopicId = this.getTopicIdFromTopicName(currentTopicName);
    let prerequisiteTopicId = this.getTopicIdFromTopicName(
      prerequisiteTopicName);

    if (prerequisiteTopicNames.indexOf(prerequisiteTopicName) !== -1) {
      return;
    }

    prerequisiteTopicNames.push(prerequisiteTopicName);
    prerequisiteTopicNames.sort();
    this.tempClassroomData.topicIdToPrerequisiteTopicIds[currentTopicId].push(
      prerequisiteTopicId);

    this.tempClassroomData.validateDependencyGraph();
    this.classroomDataIsChanged = true;
  }

  removeDependencyFromTopic(
      currentTopicName: string, prerequisiteTopicName: string): void {
    let prerequisiteTopicNames = (
      this.topicNameToPrerequisiteTopicNames[currentTopicName]);
    let currentTopicId = this.getTopicIdFromTopicName(currentTopicName);
    let prerequisiteTopicId = this.getTopicIdFromTopicName(
      prerequisiteTopicName);

    let index = prerequisiteTopicNames.indexOf(prerequisiteTopicName);
    prerequisiteTopicNames.splice(index, 1);

    index = (
      this.tempClassroomData
        .topicIdToPrerequisiteTopicIds[currentTopicId].indexOf(
          prerequisiteTopicId));
    this.tempClassroomData.topicIdToPrerequisiteTopicIds[currentTopicId].splice(
      index, 1);

    this.tempClassroomData.validateDependencyGraph();
    this.classroomDataIsChanged = true;
  }

  showDependencyGraphDropdown(topicName: string): void {
    this.dependencyGraphDropdownIsShown = true;
    this.currentTopicOnEdit = topicName;
  }

  closeDependencyGraphDropdown(): void {
    this.dependencyGraphDropdownIsShown = false;
    this.editTopicOptionIsShown = true;
  }

  getAvailablePrerequisiteTopicNamesForDropdown(givenTopicName: string): void {
    let allTopicNames = Object.keys(
      this.topicNameToPrerequisiteTopicNames);
    this.eligibleTopicNames = [];
    let prerequisites = this.topicNameToPrerequisiteTopicNames[givenTopicName];

    for (let topicName of allTopicNames) {
      if (
        topicName !== givenTopicName &&
        prerequisites.indexOf(topicName) === -1
      ) {
        this.eligibleTopicNames.push(topicName);
      }
    }
  }

  editDependency(topicName: string): void {
    if (this.topicDependencyEditOptionIsShown === false) {
      this.topicDependencyEditOptionIsShown = true;
      this.currentTopicOnEdit = topicName;
    } else {
      this.topicDependencyEditOptionIsShown = false;
    }
  }

  editPrerequisite(): void {
    this.topicDependencyEditOptionIsShown = false;
    this.dependencyGraphDropdownIsShown = true;
    this.editTopicOptionIsShown = false;
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
      delete this.tempClassroomData.topicIdToPrerequisiteTopicIds[topicId];
      delete this.topicNameToPrerequisiteTopicNames[topicNameToDelete];
      this.topicNames = Object.keys(this.topicNameToPrerequisiteTopicNames);

      this.classroomDataIsChanged = true;
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.topicNames, event.previousIndex, event.currentIndex);
    this.classroomDataIsChanged = true;
    let tempTopicIdToPrerequisiteTopicIds = {};

    for (let topicName of this.topicNames) {
      let prerequisiteTopicNames = (
        this.topicNameToPrerequisiteTopicNames[topicName]);
      let prerequisiteTopicIds = [];
      for (let prerequisiteTopicName of prerequisiteTopicNames) {
        prerequisiteTopicIds.push(this.getTopicIdFromTopicName(
          prerequisiteTopicName));
      }
      tempTopicIdToPrerequisiteTopicIds[
        this.getTopicIdFromTopicName(topicName)
      ] = prerequisiteTopicIds;
    }

    this.tempClassroomData.topicIdToPrerequisiteTopicIds = (
      tempTopicIdToPrerequisiteTopicIds);
  }
  viewGraph() {
    this.graphData = {
      finalStateIds: ['4', '5'],
      initStateId: 1,
      links: [
        {source: 1, target: 2, linkProperty: null},
        {source: 1, target: 3, linkProperty: null},
        {source: 2, target: 4, linkProperty: null},
        {source: 3, target: 5, linkProperty: null}
      ],
      nodes: {
        1: 'Dummy Topic 1',
        2: 'Dummy Topic 2',
        3: 'Dummy Topic 3',
        4: 'Dummy Topic 4',
        5: 'Dummy Topic 5',
      }
    }
    let modalRef: NgbModalRef = this.ngbModal.
      open(TopicsDependencyGraphModalComponent, {
        backdrop: 'static'
      });
    modalRef.componentInstance.graphData = this.graphData;
    modalRef.result.then(() => {
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }
}

angular.module('oppia').directive(
  'oppiaClassroomAdminPage', downgradeComponent(
    {component: ClassroomAdminPageComponent}));
