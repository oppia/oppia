import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ClassroomData } from '../classroom-admin.model';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { AppConstants } from 'app.constants';


@Injectable({
  providedIn: 'root'
})
export class ClassroomAdminDataService {

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService
  ){}
  classroom!: ClassroomData;
  existingClassroomNames: string[];
  urlFragmentIsDuplicate: boolean;

  supressClassroomNameErrorMessages(classroom: ClassroomData): void {
    classroom.classroomNameIsTooLong = false;
    classroom.emptyClassroomName = false;
    classroom.duplicateClassroomName = false;
  }

  supressClassroomUrlFragmentErrorMessages(classroom: ClassroomData): void {
    classroom.classroomUrlFragmentIsTooLong = false;
    classroom.classroomUrlFragmentIsEmpty = false;
    classroom.duplicateClassroomUrlFragment = false;
    classroom.urlFragmentRegexMatched = true;
  }

  validateName(classroom: ClassroomData) {
    this.supressClassroomNameErrorMessages(classroom);
    classroom.classroomNameIsValid = true;

    if (classroom.name === '') {
      classroom.emptyClassroomName = true;
      classroom.classroomNameIsValid = false;
      return;
    }

    if (classroom.name.length > AppConstants.MAX_CHARS_IN_CLASSROOM_NAME) {
      classroom.classroomNameIsTooLong = true;
      classroom.classroomNameIsValid = false;
      return;
    }

    if (this.existingClassroomNames.indexOf(classroom.name) !== -1) {
      classroom.duplicateClassroomName = true;
      classroom.classroomNameIsValid = false;
    }
  }

  validateUrlFragment(
      classroom: ClassroomData, existingClassroomUrlFragment: string
  ) {
    this.supressClassroomUrlFragmentErrorMessages(classroom);
    classroom.classroomUrlFragmentIsValid = true;

    if (classroom.urlFragment === '') {
      classroom.classroomUrlFragmentIsEmpty = true;
      classroom.classroomUrlFragmentIsValid = false;
      return;
    }

    if (
      classroom.urlFragment.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
    ) {
      classroom.classroomUrlFragmentIsTooLong = true;
      classroom.classroomUrlFragmentIsValid = false;
      return;
    }

    const validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX);
    if (!validUrlFragmentRegex.test(classroom.urlFragment)) {
      classroom.urlFragmentRegexMatched = false;
      classroom.classroomUrlFragmentIsValid = false;
      return;
    }

    this.classroomBackendApiService.doesClassroomWithUrlFragmentExistAsync(
      classroom.urlFragment).then((response: boolean) => {
        if (
            response && (
            classroom.urlFragment !== existingClassroomUrlFragment)
        ) {
          classroom.duplicateClassroomUrlFragment = true;
          classroom.classroomUrlFragmentIsValid = false;
          return;
        }
      })
  }
}
angular.module('oppia').factory('ClassroomAdminDataService',
  downgradeInjectable(ClassroomAdminDataService));