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
import {Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {AlertsService} from 'services/alerts.service';
import {AppConstants} from 'app.constants';
import {ContextService} from 'services/context.service';
import {
  ClassroomBackendApiService,
  ClassroomBackendDict,
  ClassroomDict,
  TopicClassroomRelationDict,
  classroomDisplayInfo,
} from '../../domain/classroom/classroom-backend-api.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ClassroomEditorConfirmModalComponent} from './modals/classroom-editor-confirm-modal.component';
import {DeleteClassroomConfirmModalComponent} from './modals/delete-classroom-confirm-modal.component';
import {UpdateClassroomsOrderModalComponent} from './modals/update-classrooms-order-modal.component';
import {CreateNewClassroomModalComponent} from './modals/create-new-classroom-modal.component';
import {DeleteTopicFromClassroomModalComponent} from './modals/delete-topic-from-classroom-modal.component';
import {EditableTopicBackendApiService} from 'domain/topic/editable-topic-backend-api.service';
import {TopicsDependencyGraphModalComponent} from './modals/topic-dependency-graph-viz-modal.component';
import {
  ImageUploaderParameters,
  ImageUploaderData,
} from 'components/forms/custom-forms-directives/image-uploader.component';
import {
  ExistingClassroomData,
  ImageData,
  TopicIdToPrerequisiteTopicIds,
  TopicIdToTopicName,
} from './existing-classroom.model';
import {ClassroomAdminDataService} from './services/classroom-admin-data.service';

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
    private contextService: ContextService,
    private editableTopicBackendApiService: EditableTopicBackendApiService
  ) {}

  classroomData!: ExistingClassroomData;
  tempClassroomData!: ExistingClassroomData;

  classroomCount: number = 0;
  classroomIdToClassroomNameIndex: classroomDisplayInfo[] = [];
  existingClassroomNames: string[] = [];

  currentTopicOnEdit!: string;
  eligibleTopicNamesForPrerequisites: string[] = [];
  tempEligibleTopicNamesForPrerequisites: string[] = [];
  prerequisiteInput!: string;

  topicIds: string[] = [];

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

  topicsToClassroomRelation: TopicClassroomRelationDict[] = [];
  filteredTopicsToClassroomRelation: TopicClassroomRelationDict[] = [];
  allValidationErrors: string[] = [];
  saveClassroomValidationErrors: string[] = [];

  thumbnailParameters: ImageUploaderParameters = {
    disabled: true,
    maxImageSizeInKB: 100,
    imageName: 'Thumbnail',
    orientation: 'portrait',
    bgColor: 'transparent',
    allowedBgColors: ['transparent'],
    allowedImageFormats: ['svg'],
    aspectRatio: '4:3',
    previewImageUrl: '',
  };
  bannerParameters: ImageUploaderParameters = {
    disabled: true,
    maxImageSizeInKB: 1024,
    imageName: 'Banner',
    orientation: 'landscape',
    bgColor: 'transparent',
    allowedBgColors: ['transparent'],
    allowedImageFormats: ['png', 'jpeg'],
    aspectRatio: '2851:197',
    previewImageUrl: '',
  };

  getEligibleTopicPrerequisites(currentTopicName: string): void {
    this.eligibleTopicNamesForPrerequisites = [];
    this.tempEligibleTopicNamesForPrerequisites = [];
    this.prerequisiteInput = '';
    let topicNames = Object.keys(this.topicNameToPrerequisiteTopicNames);

    for (let topicName of topicNames) {
      if (
        topicName !== currentTopicName &&
        this.topicNameToPrerequisiteTopicNames[currentTopicName].indexOf(
          topicName
        ) === -1
      ) {
        this.eligibleTopicNamesForPrerequisites.push(topicName);
      }
    }
    this.tempEligibleTopicNamesForPrerequisites =
      this.eligibleTopicNamesForPrerequisites;
    this.currentTopicOnEdit = currentTopicName;
  }

  onPrerequisiteInputChange(): void {
    this.tempEligibleTopicNamesForPrerequisites =
      this.eligibleTopicNamesForPrerequisites.filter(option =>
        option.includes(this.prerequisiteInput)
      );
  }

  getClassroomData(classroomId: string): void {
    if (this.classroomEditorMode) {
      return;
    }

    if (
      this.tempClassroomData &&
      this.tempClassroomData.getClassroomId() === classroomId &&
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
          cloneDeep(response.classroomDict)
        );
        this.tempClassroomData = ExistingClassroomData.createClassroomFromDict(
          cloneDeep(response.classroomDict)
        );

        this.contextService.setCustomEntityContext(
          AppConstants.ENTITY_TYPE.CLASSROOM,
          classroomId
        );

        this.classroomDataIsChanged = false;
        this.eligibleTopicNamesForPrerequisites = [];
        this.tempEligibleTopicNamesForPrerequisites = [];

        this.existingClassroomNames = this.classroomIdToClassroomNameIndex.map(
          classroomMapping => classroomMapping.classroom_name
        );
        const index = this.existingClassroomNames.indexOf(
          this.tempClassroomData.getClassroomName()
        );
        this.existingClassroomNames.splice(index, 1);

        this.classroomDetailsIsShown = true;
        this.classroomViewerMode = true;

        this.classroomAdminDataService.existingClassroomNames =
          this.existingClassroomNames;

        this.classroomAdminDataService.validateClassroom(
          this.tempClassroomData,
          this.classroomData
        );
        this.allValidationErrors =
          this.classroomAdminDataService.getAllClassroomValidationErrors();
        this.saveClassroomValidationErrors =
          this.getSaveClassroomValidationErrors();
        this.setTopicDependencyByTopicName(
          this.tempClassroomData.getTopicIdToPrerequisiteTopicId()
        );
        this.updateThumbnailAndBannerParameters(
          this.tempClassroomData.getThumbnailData(),
          this.tempClassroomData.getBannerData()
        );
      },
      errorResponse => {
        if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse) !== -1) {
          this.alertsService.addWarning('Failed to get classroom data');
        }
      }
    );
    this.getAllTopicsToClassroomRelation();
  }

  getAllClassroomIdToClassroomNameIndex(): void {
    this.classroomBackendApiService
      .getAllClassroomDisplayInfoDictAsync()
      .then(response => {
        this.pageIsInitialized = true;
        this.classroomIdToClassroomNameIndex = response;
        this.classroomCount = response.length;
      });
  }

  getAllTopicsToClassroomRelation(): void {
    this.classroomBackendApiService.getAllTopicsToClassroomRelation().then(
      response => {
        this.topicsToClassroomRelation = response;
        this.filteredTopicsToClassroomRelation = this.getAvailableTopics();
      },
      errorResponse => {
        if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse) !== -1) {
          this.alertsService.addWarning(
            'Failed to get topics and classrooms relation'
          );
        }
      }
    );
  }

  getAvailableTopics(): TopicClassroomRelationDict[] {
    return this.topicsToClassroomRelation.filter(
      value =>
        value.classroom_name === null &&
        !this.topicNames.includes(value.topic_name)
    );
  }

  filterTopicsByName(searchTerm: string): void {
    const availableTopicNames = this.getAvailableTopics();
    if (!searchTerm) {
      this.filteredTopicsToClassroomRelation = availableTopicNames;
      return;
    }
    this.filteredTopicsToClassroomRelation = availableTopicNames.filter(
      value =>
        value.topic_name
          .toLocaleLowerCase()
          .indexOf(searchTerm.toLocaleLowerCase()) > -1
    );
  }

  updateThumbnailAndBannerParameters(
    thumbnailData: ImageData,
    bannerData: ImageData
  ): void {
    this.thumbnailParameters.previewImageUrl = '';
    this.bannerParameters.previewImageUrl = '';
    this.thumbnailParameters.filename = thumbnailData.filename;
    this.thumbnailParameters.bgColor = thumbnailData.bg_color;
    this.bannerParameters.filename = bannerData.filename;
    this.bannerParameters.bgColor = bannerData.bg_color;
  }

  updateThumbnailData(thumbnailData: ImageUploaderData): void {
    this.tempClassroomData.setThumbnailData({
      filename: thumbnailData.filename,
      bg_color: thumbnailData.bg_color || 'transparent',
      size_in_bytes: thumbnailData.image_data.size,
      image_data: thumbnailData.image_data,
    });
    this.updateClassroomField();
  }

  updateBannerData(bannerData: ImageUploaderData): void {
    this.tempClassroomData.setBannerData({
      filename: bannerData.filename,
      bg_color: bannerData.bg_color || 'transparent',
      size_in_bytes: bannerData.image_data.size,
      image_data: bannerData.image_data,
    });
    this.updateClassroomField();
  }

  updateClassroomField(): void {
    this.filteredTopicsToClassroomRelation = this.getAvailableTopics();
    const classroomNameIsChanged =
      this.tempClassroomData.getClassroomName() !==
      this.classroomData.getClassroomName();
    const classroomUrlIsChanged =
      this.tempClassroomData.getClassroomUrlFragment() !==
      this.classroomData.getClassroomUrlFragment();
    const classroomTopicListIntroIsChanged =
      this.tempClassroomData.getTopicListIntro() !==
      this.classroomData.getTopicListIntro();
    const classroomCourseDetailsIsChanged =
      this.tempClassroomData.getCourseDetails() !==
      this.classroomData.getCourseDetails();
    const classroomTeaserTextIsChanged =
      this.tempClassroomData.getTeaserText() !==
      this.classroomData.getTeaserText();
    const classroomThumbnailIsChanged =
      this.tempClassroomData.getThumbnailData().filename !==
      this.classroomData.getThumbnailData().filename;
    const classroomBannerIsChanged =
      this.tempClassroomData.getBannerData().filename !==
      this.classroomData.getBannerData().filename;
    const classroomPublicationStatusIsChanged =
      this.tempClassroomData.getIsPublished() !==
      this.classroomData.getIsPublished();
    const classroomDiagnosticTestStatusIsChanged =
      this.tempClassroomData.getIsDiagnosticTestEnabled() !==
      this.classroomData.getIsDiagnosticTestEnabled();

    this.classroomAdminDataService.validateClassroom(
      this.tempClassroomData,
      this.classroomData
    );
    this.allValidationErrors =
      this.classroomAdminDataService.getAllClassroomValidationErrors();
    this.saveClassroomValidationErrors =
      this.getSaveClassroomValidationErrors();
    const topicDependencyIsChanged =
      JSON.stringify(
        this.tempClassroomData.getTopicIdToPrerequisiteTopicId()
      ) !==
      JSON.stringify(this.classroomData.getTopicIdToPrerequisiteTopicId());

    if (
      classroomNameIsChanged ||
      classroomUrlIsChanged ||
      classroomCourseDetailsIsChanged ||
      classroomTopicListIntroIsChanged ||
      topicDependencyIsChanged ||
      classroomTeaserTextIsChanged ||
      classroomBannerIsChanged ||
      classroomThumbnailIsChanged ||
      classroomPublicationStatusIsChanged ||
      classroomDiagnosticTestStatusIsChanged
    ) {
      this.classroomDataIsChanged = true;
    } else {
      this.classroomDataIsChanged = false;
    }
  }

  convertClassroomDictToBackendForm(
    classroomDict: ClassroomDict
  ): ClassroomBackendDict {
    return {
      classroom_id: classroomDict.classroomId,
      name: classroomDict.name,
      url_fragment: classroomDict.urlFragment,
      course_details: classroomDict.courseDetails,
      teaser_text: classroomDict.teaserText,
      topic_list_intro: classroomDict.topicListIntro,
      topic_id_to_prerequisite_topic_ids:
        classroomDict.topicIdToPrerequisiteTopicIds,
      is_published: classroomDict.isPublished,
      is_diagnostic_test_enabled: classroomDict.isDiagnosticTestEnabled,
      thumbnail_data: classroomDict.thumbnailData,
      banner_data: classroomDict.bannerData,
    };
  }

  saveClassroomData(classroomId: string): void {
    if (!this.canSaveClassroom()) {
      return;
    }
    this.classroomDataSaveInProgress = true;
    this.updateClassroomData(classroomId).then(() => {
      this.openClassroomInViewerMode();
      this.classroomDataIsChanged = false;
    });
  }

  async updateClassroomData(classroomId: string): Promise<void> {
    const backendDict = this.convertClassroomDictToBackendForm(
      this.tempClassroomData.getClassroomDict()
    );
    this.classroomBackendApiService
      .updateClassroomDataAsync(classroomId, backendDict)
      .then(
        () => {
          this.classroomData = cloneDeep(this.tempClassroomData);
          this.classroomDataSaveInProgress = false;
        },
        () => {
          this.tempClassroomData = cloneDeep(this.classroomData);
          this.setTopicDependencyByTopicName(
            this.tempClassroomData.getTopicIdToPrerequisiteTopicId()
          );
        }
      );
  }

  deleteClassroom(classroomId: string): void {
    let modalRef: NgbModalRef = this.ngbModal.open(
      DeleteClassroomConfirmModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalRef.result.then(
      () => {
        this.classroomBackendApiService
          .deleteClassroomAsync(classroomId)
          .then(() => {
            let classroomIndexToDelete =
              this.classroomIdToClassroomNameIndex.find(
                classroomMapping =>
                  classroomMapping.classroom_id === classroomId
              )?.classroom_index;

            this.classroomIdToClassroomNameIndex =
              this.classroomIdToClassroomNameIndex.filter(
                classroomMapping =>
                  classroomMapping.classroom_id !== classroomId
              );

            this.classroomIdToClassroomNameIndex =
              this.classroomIdToClassroomNameIndex.map(classroomMapping => {
                if (
                  classroomIndexToDelete &&
                  classroomMapping.classroom_index > classroomIndexToDelete
                ) {
                  return {
                    ...classroomMapping,
                    classroom_index: classroomMapping.classroom_index - 1,
                  };
                }
                return classroomMapping;
              });
            this.classroomCount--;
          });
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  openClassroomInEditorMode(): void {
    this.thumbnailParameters.disabled = false;
    this.bannerParameters.disabled = false;
    this.classroomViewerMode = false;
    this.classroomEditorMode = true;
  }

  openClassroomInViewerMode(): void {
    this.thumbnailParameters.disabled = true;
    this.bannerParameters.disabled = true;
    this.classroomViewerMode = true;
    this.classroomEditorMode = false;
  }

  closeClassroomConfigEditor(): void {
    if (this.classroomDataIsChanged) {
      let modalRef: NgbModalRef = this.ngbModal.open(
        ClassroomEditorConfirmModalComponent,
        {
          backdrop: 'static',
        }
      );
      modalRef.result.then(
        () => {
          this.tempClassroomData = cloneDeep(this.classroomData);
          this.setTopicDependencyByTopicName(
            this.tempClassroomData.getTopicIdToPrerequisiteTopicId()
          );

          this.classroomDataIsChanged = false;
          this.classroomAdminDataService.reinitializeErrorMsgs();
          this.openClassroomInViewerMode();
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        }
      );
    } else {
      this.openClassroomInViewerMode();
    }
    this.removeNewTopicInputField();
  }

  createNewClassroom(): void {
    this.classroomViewerMode = false;
    this.classroomDetailsIsShown = false;
    let modalRef: NgbModalRef = this.ngbModal.open(
      CreateNewClassroomModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalRef.componentInstance.existingClassroomNames =
      this.classroomIdToClassroomNameIndex.map(
        classroomMapping => classroomMapping.classroom_name
      );
    modalRef.result.then(
      classroomDict => {
        this.classroomIdToClassroomNameIndex.push({
          classroom_id: classroomDict.classroom_id,
          classroom_name: classroomDict.name,
          classroom_index: this.classroomIdToClassroomNameIndex.length,
        });
        this.classroomCount++;
      },
      () => {
        this.classroomAdminDataService.reinitializeErrorMsgs();
      }
    );
  }

  changeClassroomsOrder(): void {
    let modalRef: NgbModalRef = this.ngbModal.open(
      UpdateClassroomsOrderModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalRef.componentInstance.classroomIdToClassroomNameIndex = cloneDeep(
      this.classroomIdToClassroomNameIndex
    );
    modalRef.result.then(
      data => {
        this.classroomBackendApiService
          .updateClassroomIndexMappingAsync(data)
          .then(() => {
            this.classroomIdToClassroomNameIndex = data;
          });
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  ngOnInit(): void {
    this.getAllClassroomIdToClassroomNameIndex();
  }

  setTopicDependencyByTopicName(
    topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ): void {
    this.topicDependencyIsLoaded = false;
    let topicIds = Object.keys(topicIdToPrerequisiteTopicIds);

    this.editableTopicBackendApiService
      .getTopicIdToTopicNameAsync(topicIds)
      .then(topicIdsToTopicName => {
        this.topicNameToPrerequisiteTopicNames = {};

        for (let currentTopicId in topicIdToPrerequisiteTopicIds) {
          let currentTopicName = topicIdsToTopicName[currentTopicId];

          let prerequisiteTopicIds =
            topicIdToPrerequisiteTopicIds[currentTopicId];
          let prerequisiteTopicNames = [];

          for (let topicId of prerequisiteTopicIds) {
            prerequisiteTopicNames.push(topicIdsToTopicName[topicId]);
          }

          this.tempClassroomData.setTopicIdToTopicName(topicIdsToTopicName);

          this.topicNameToPrerequisiteTopicNames[currentTopicName] =
            prerequisiteTopicNames;
          this.topicIdsToTopicName = topicIdsToTopicName;
          this.topicNames = Object.values(this.topicIdsToTopicName);
          this.topicDependencyIsLoaded = true;
        }
      });
  }

  addTopicId(topicId: string): void {
    this.editableTopicBackendApiService
      .getTopicIdToTopicNameAsync([topicId])
      .then(
        topicIdToTopicName => {
          const topicName = topicIdToTopicName[topicId];

          this.topicIdsToTopicName[topicId] = topicName;
          this.tempClassroomData.setTopicIdToTopicName(
            this.topicIdsToTopicName
          );
          this.tempClassroomData.addNewTopicId(topicId);
          this.topicNameToPrerequisiteTopicNames[topicName] = [];
          this.topicNames.push(topicName);
          this.topicDependencyIsLoaded = true;

          this.classroomDataIsChanged = true;
          this.newTopicCanBeAdded = false;
          this.topicWithGivenIdExists = true;
          this.updateClassroomField();
        },
        () => {
          this.topicWithGivenIdExists = false;
        }
      );
  }

  showNewTopicInputField(): void {
    this.newTopicCanBeAdded = true;
  }

  removeNewTopicInputField(): void {
    this.newTopicCanBeAdded = false;
    this.topicWithGivenIdExists = true;
  }

  onNewTopicInputModelChange(topicId: string): void {
    if (!this.topicWithGivenIdExists) {
      this.topicWithGivenIdExists = true;
    }
    this.addTopicId(topicId);
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
    currentTopicName: string,
    prerequisiteTopicName: string
  ): void {
    let prerequisiteTopicNames = cloneDeep(
      this.topicNameToPrerequisiteTopicNames[currentTopicName]
    );
    let currentTopicId = this.getTopicIdFromTopicName(currentTopicName);
    let prerequisiteTopicId = this.getTopicIdFromTopicName(
      prerequisiteTopicName
    );

    if (prerequisiteTopicNames.indexOf(prerequisiteTopicName) !== -1) {
      return;
    }

    this.topicNameToPrerequisiteTopicNames[currentTopicName].push(
      prerequisiteTopicName
    );
    this.topicNameToPrerequisiteTopicNames[currentTopicName].sort();
    this.tempClassroomData.addPrerequisiteTopicId(
      currentTopicId,
      prerequisiteTopicId
    );

    this.classroomAdminDataService.validateClassroom(
      this.tempClassroomData,
      this.classroomData
    );
    this.updateClassroomField();
  }

  removeDependencyFromTopic(
    currentTopicName: string,
    prerequisiteTopicName: string
  ): void {
    let currentTopicId = this.getTopicIdFromTopicName(currentTopicName);
    let prerequisiteTopicId = this.getTopicIdFromTopicName(
      prerequisiteTopicName
    );

    this.tempClassroomData.removeDependency(
      currentTopicId,
      prerequisiteTopicId
    );

    let prerequisiteTopicNames =
      this.topicNameToPrerequisiteTopicNames[currentTopicName];
    const index = prerequisiteTopicNames.indexOf(prerequisiteTopicName);
    prerequisiteTopicNames.splice(index, 1);

    this.classroomAdminDataService.validateClassroom(
      this.tempClassroomData,
      this.classroomData
    );
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
    const topicIdToDelete =
      Object.keys(this.topicIdsToTopicName).find(
        id => this.topicIdsToTopicName[id] === topicNameToDelete
      ) || '';
    this.topicsToClassroomRelation.push({
      topic_name: topicNameToDelete,
      topic_id: topicIdToDelete,
      classroom_name: null,
      classroom_url_fragment: null,
    });
    let childTopicNodes = [];
    for (let topicName in this.topicNameToPrerequisiteTopicNames) {
      const prerequisites = this.topicNameToPrerequisiteTopicNames[topicName];
      if (prerequisites.indexOf(topicNameToDelete) !== -1) {
        childTopicNodes.push(topicName);
      }
    }

    let modalRef: NgbModalRef = this.ngbModal.open(
      DeleteTopicFromClassroomModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalRef.componentInstance.prerequisiteTopics =
      Object.values(childTopicNodes);
    modalRef.componentInstance.topicName = topicNameToDelete;
    modalRef.result.then(
      () => {
        const topicId = this.getTopicIdFromTopicName(topicNameToDelete);
        this.tempClassroomData.removeTopic(topicId);

        delete this.topicNameToPrerequisiteTopicNames[topicNameToDelete];
        delete this.topicIdsToTopicName[topicId];

        this.tempClassroomData.setTopicIdToTopicName(this.topicIdsToTopicName);

        this.topicNames = Object.keys(this.topicNameToPrerequisiteTopicNames);

        this.classroomAdminDataService.validateClassroom(
          this.tempClassroomData,
          this.classroomData
        );
        this.updateClassroomField();

        this.classroomDataIsChanged = true;

        if (this.tempClassroomData.getTopicsCount() === 0) {
          this.topicDependencyIsLoaded = false;
        }
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.topicNames, event.previousIndex, event.currentIndex);
    this.classroomDataIsChanged = true;
    let tempTopicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds = {};

    for (let topicName of this.topicNames) {
      const prerequisiteTopicNames =
        this.topicNameToPrerequisiteTopicNames[topicName];
      const topicId = this.getTopicIdFromTopicName(topicName);

      let prerequisiteTopicIds = [];
      for (let prerequisiteTopicName of prerequisiteTopicNames) {
        prerequisiteTopicIds.push(
          this.getTopicIdFromTopicName(prerequisiteTopicName)
        );
      }
      tempTopicIdToPrerequisiteTopicIds[topicId] = prerequisiteTopicIds;
    }

    this.tempClassroomData.setTopicIdToPrerequisiteTopicId(
      tempTopicIdToPrerequisiteTopicIds
    );
    this.updateClassroomField();
  }

  viewGraph(): void {
    let modalRef: NgbModalRef = this.ngbModal.open(
      TopicsDependencyGraphModalComponent,
      {
        backdrop: true,
        windowClass: 'oppia-large-modal-window',
      }
    );
    modalRef.componentInstance.topicIdToPrerequisiteTopicIds =
      this.tempClassroomData.getTopicIdToPrerequisiteTopicId();
    modalRef.componentInstance.topicIdToTopicName = this.topicIdsToTopicName;

    modalRef.result.then(
      () => {},
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  toggleDiagnosticTestStatus(): void {
    this.tempClassroomData.setIsDiagnosticTestEnabled(
      !this.tempClassroomData.getIsDiagnosticTestEnabled()
    );
    this.updateClassroomField();
  }

  togglePublicationStatus(): void {
    this.tempClassroomData.setIsPublished(
      !this.tempClassroomData.getIsPublished()
    );
    this.updateClassroomField();
  }

  canSaveClassroom(): boolean {
    return this.getSaveClassroomValidationErrors().length === 0;
  }

  getSaveClassroomValidationErrors(): string[] {
    if (this.tempClassroomData.getIsPublished()) {
      return this.allValidationErrors;
    }
    return this.classroomAdminDataService.getSaveClassroomValidationErrors();
  }

  getPrerequisiteLength(topicName: string): number {
    return this.topicNameToPrerequisiteTopicNames[topicName].length;
  }

  ngOnDestory(): void {
    this.contextService.removeCustomEntityContext();
  }
}
