import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ClassroomBackendApiService } from '../../domain/classroom/classroom-backend-api.service';


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
  ) {}
  classroomCount: number;
  selectedClassroomDict;
  updatedClassroomDict;
  classroomIdToClassroomName;
  classroomId;
  classroomName;
  urlFragment;
  courseDetails;
  topicListintro;
  topicIds;
  topicIdToPrerequisiteTopicIds;
  currentClassroomTopicIds;
  currentClassroomTopicsGraph;
  pageInitialized: boolean = false;
  classroomDataChanged: boolean = false;
  classroomDetailsIsShown: boolean = false;
  classroomViewerMode: boolean = false;
  classroomEditorMode: boolean = false;
  newTopicIdInput: boolean = false;

  getClassroomData(classroomId: string) {
    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then(
      response => {

        if (this.classroomEditorMode) {
          this.closeClassroomConfigEditor();
        }

        if (this.classroomId === classroomId && this.classroomViewerMode) {
          this.classroomDetailsIsShown = false;
          this.classroomViewerMode = false;
          return;
        }
        this.selectedClassroomDict = response.classroomDict;
        this.updatedClassroomDict = response.classroomDict;
        this.classroomDataChanged = false;
        this.classroomDetailsIsShown = true;
        this.classroomViewerMode = true;

        this.classroomId = this.selectedClassroomDict.classroomId;
        this.classroomName = this.selectedClassroomDict.name;
        this.urlFragment = this.selectedClassroomDict.urlFragment;
        this.courseDetails = this.selectedClassroomDict.courseDetails;
        this.topicListintro = this.selectedClassroomDict.topicListIntro;
        this.topicIds = Object.keys(
          this.selectedClassroomDict.topicIdToPrerequisiteTopicIds);
        this.topicIdToPrerequisiteTopicIds = (
          this.selectedClassroomDict.topicIdToPrerequisiteTopicIds);
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
    this.updatedClassroomDict.topicListIntro = this.topicListintro;
    this.classroomDataChanged = true;
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


  saveClassroomData(classroomId: string) {
    let backendDict = this.convertClassroomDictToBackendForm(
      this.updatedClassroomDict);
    this.classroomBackendApiService.updateClassroomDataAsync(
      classroomId, backendDict).then(() => {
        this.classroomEditorMode = false;
        this.classroomViewerMode = true;
      });
  }

  deleteClassroom(classroomId: string): void {
    this.classroomBackendApiService.deleteClassroomAsync(classroomId).then(
      () => {
        delete this.classroomIdToClassroomName[classroomId];
        this.classroomCount--;
      }
    );
  }

  getNewClassroomId(): void {
    this.classroomBackendApiService.getNewClassroomIdAsync().then();
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

  openClassroomViewer() {

  }

  openClassroomConfigEditor() {
    this.classroomViewerMode = false;
    this.classroomEditorMode = true;
  }

  closeClassroomConfigEditor() {
    this.classroomEditorMode = false;
    this.classroomViewerMode = true;
  }

  openTopicsDependencyGraphEditor() {

  }

  closeTopicsDependencyGraphEditor() {

  }

  createNewClassroom() {
    this.classroomBackendApiService.getNewClassroomIdAsync().then(
      newClassroomId => {
        console.log(newClassroomId);
        console.log('nikhil')

        this.updatedClassroomDict = {
          classroomId: newClassroomId,
          name: '',
          urlFragment: '',
          courseDetails: '',
          topicListintro: '',
          topicIdToPrerequisiteTopicIds: {}
        }

        this.classroomIdToClassroomName[newClassroomId] = '';
        this.classroomId = newClassroomId;
        this.classroomName = '';
        this.urlFragment = '';
        this.courseDetails = '';
        this.topicListintro = '';
        this.topicIds = []
        this.topicIdToPrerequisiteTopicIds = {}

        this.classroomEditorMode = true;
        this.classroomDetailsIsShown = true;
      }
    );
  }

  ngOnInit(): void {
    this.getAllClassroomIdToClassroomName();
  }


}

angular.module('oppia').directive(
  'oppiaClassroomAdminPage', downgradeComponent(
    {component: ClassroomAdminPageComponent}));
