import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ClassroomBackendApiService } from '../../domain/classroom/classroom-backend-api.service';
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
  classroomCount: number;
  selectedClassroomDict;
  updatedClassroomDict;
  classroomIdToClassroomName;

  classroomId;
  classroomName;
  urlFragment;
  courseDetails;
  topicListIntro;
  topicIds;
  topicIdToPrerequisiteTopicIds;

  pageInitialized: boolean = false;
  classroomDataChanged: boolean = false;
  classroomDetailsIsShown: boolean = false;
  classroomViewerMode: boolean = false;
  classroomEditorMode: boolean = false;
  newTopicIdInput: boolean = false;

  getClassroomData(classroomId: string) {
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
        this.classroomDataChanged = false;
        this.classroomDetailsIsShown = true;
        this.classroomViewerMode = true;

        this.updateClassroomPropertiesFromDict(
          cloneDeep(this.selectedClassroomDict));
      }
    );
  }

  getAllClassroomIdToClassroomName() {
    this.classroomBackendApiService
      .getAllClassroomIdToClassroomNameDictAsync().then(response => {
        this.pageInitialized = true;
        this.classroomIdToClassroomName = response;
        this.classroomCount = Object.keys(response).length;
      }
    );
  }

  updateClassroomName() {
    this.updatedClassroomDict.name = this.classroomName;
    this.classroomDataChanged = true;
  }

  updateUrlFragment() {
    this.updatedClassroomDict.urlFragment = this.urlFragment;
    this.classroomDataChanged = true;
  }

  updateCourseDetails() {
    this.updatedClassroomDict.courseDetails = this.courseDetails;
    this.classroomDataChanged = true;
  }

  updateTopicListIntro() {
    this.updatedClassroomDict.topicListIntro = this.topicListIntro;
    this.classroomDataChanged = true;
  }

  saveClassroomData(classroomId: string) {
    let backendDict = this.convertClassroomDictToBackendForm(
      this.updatedClassroomDict);
    this.classroomBackendApiService.updateClassroomDataAsync(
      classroomId, backendDict).then(() => {
        this.classroomEditorMode = false;
        this.classroomViewerMode = true;
        this.classroomDataChanged = false;
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
        }
      );
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  convertClassroomDictToBackendForm(classroomDict) {
    return {
      'classroom_id': classroomDict.classroomId,
      'name': classroomDict.name,
      'url_fragment': classroomDict.urlFragment,
      'course_details': classroomDict.courseDetails,
      'topic_list_intro': classroomDict.topicListIntro,
      'topic_id_to_prerequisite_topic_ids': (
        classroomDict.topicIdToPrerequisiteTopicIds)
    };
  }

  openClassroomConfigEditor() {
    this.classroomViewerMode = false;
    this.classroomEditorMode = true;
  }

  closeClassroomConfigEditor() {
    if (this.classroomDataChanged) {
      let modalRef: NgbModalRef = this.ngbModal.
        open(ClassroomEditorConfirmModalComponent, {
          backdrop: 'static'
        });
      modalRef.result.then(() => {
        this.classroomEditorMode = false;
        this.classroomViewerMode = true;
        this.classroomName = this.selectedClassroomDict.name;
        this.classroomDataChanged = false;
      })
    } else {
      this.classroomEditorMode = false;
      this.classroomViewerMode = true;
    }
  }

  createNewClassroom() {
    let modalRef: NgbModalRef = this.ngbModal.
      open(CreateNewClassroomModalComponent, {
        backdrop: 'static'
      });
    console.log(Object.values(this.classroomIdToClassroomName));
    modalRef.componentInstance.existingClassroomNames = (
      Object.values(this.classroomIdToClassroomName)
    );
    modalRef.result.then((classroomDict) => {
      this.classroomIdToClassroomName[classroomDict.classroom_id] = (
        classroomDict.name);
    });
  }

  ngOnInit(): void {
    this.getAllClassroomIdToClassroomName();
  }

  updateClassroomPropertiesFromDict(classroomDict) {
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

  addNewTopicIdToClassroom(classroomId: string) {
    this.newTopicIdInput = false;
  }

  removeTopicIdFromClassroom(classroomId) {
    this.newTopicIdInput = false;
  }

  openNewTopicIdInput() {
    this.newTopicIdInput = true;
  }
  openTopicsDependencyGraphEditor() {

  }

  closeTopicsDependencyGraphEditor() {

  }
}

angular.module('oppia').directive(
  'oppiaClassroomAdminPage', downgradeComponent(
    {component: ClassroomAdminPageComponent}));
