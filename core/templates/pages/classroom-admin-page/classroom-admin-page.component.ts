import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TaskEntry } from 'domain/improvements/task-entry.model';
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
  classroomDict;
  classroomDataChanged: boolean = false;

  getClassroomData(classroomId: string) {
    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then();
  }

  getAllClassroomIdToClassroomName() {
    this.classroomBackendApiService
      .getAllClassroomIdToClassroomNameDictAsync().then();
  }

  updateClassroomData(classroomId: string) {
    this.classroomBackendApiService.updateClassroomDataAsync(
      classroomId, this.classroomDict).then();
  }

  deleteClassroom(classroomId: string): void {
    this.classroomBackendApiService.deleteClassroomAsync(classroomId).then();
  }

  getNewClassroomId(): void {
    this.classroomBackendApiService.getNewClassroomIdAsync().then();
  }

  convertClassroomDictToBackendForm(classroomDict) {
    return {
      'classroomId': classroomDict.classroomId,
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

  }

  closeClassroomConfigEditor() {

  }

  openTopicsDependencyGraphEditor() {

  }

  closeTopicsDependencyGraphEditor() {

  }

  addNewTopicIdToClassroom() {

  }

  createNewClassroom() {
    let newClassroomId = this.getNewClassroomId();

  }

  validate

  ngOnInit(): void {
    this.getAllClassroomIdToClassroomName();
  }
}

angular.module('oppia').directive(
  'oppiaClassroomAdminPage', downgradeComponent(
    {component: ClassroomAdminPageComponent}));
