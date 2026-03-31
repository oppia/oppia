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
 * @fileoverview Service that handles validation for the classroom data.
 */

import {Injectable} from '@angular/core';
import {
  ClassroomData,
  ExistingClassroomData,
} from '../existing-classroom.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';

@Injectable({
  providedIn: 'root',
})
export class ClassroomAdminDataService {
  constructor(private classroomBackendApiService: ClassroomBackendApiService) {}

  classroom!: ClassroomData;
  existingClassroomNames: string[] = [];

  nameValidationError: string = '';
  urlValidationError: string = '';
  topicsGraphValidationError: string = '';
  classroomValidationErrors: string[] = [];

  onClassroomNameChange(classroom: ClassroomData): void {
    this.nameValidationError = classroom.getClassroomNameValidationErrors();

    if (this.nameValidationError.length > 0) {
      return;
    }

    if (
      this.existingClassroomNames.indexOf(classroom.getClassroomName()) !== -1
    ) {
      this.nameValidationError = 'A classroom with this name already exists.';
    }
  }

  onClassroomUrlChange(
    classroom: ClassroomData,
    existingClassroomUrl: string
  ): void {
    this.urlValidationError = classroom.getClassroomUrlValidationErrors();

    if (this.urlValidationError.length > 0) {
      return;
    }

    this.classroomBackendApiService
      .doesClassroomWithUrlFragmentExistAsync(
        classroom.getClassroomUrlFragment()
      )
      .then((response: boolean) => {
        if (
          response &&
          classroom.getClassroomUrlFragment() !== existingClassroomUrl
        ) {
          this.urlValidationError =
            'A classroom with this name already exists.';
        }
      });
  }

  onTopicDependencyChange(classroom: ExistingClassroomData): void {
    this.topicsGraphValidationError = classroom.validateDependencyGraph();
  }

  validateClassroom(
    tempClassroom: ClassroomData,
    existingClassroom: ClassroomData
  ): void {
    this.onClassroomNameChange(tempClassroom);
    this.onClassroomUrlChange(
      tempClassroom,
      existingClassroom.getClassroomUrlFragment()
    );
    if (tempClassroom instanceof ExistingClassroomData) {
      this.onTopicDependencyChange(tempClassroom);
      this.classroomValidationErrors = tempClassroom.getAllValidationErrors();
    }

    tempClassroom.setClassroomValidityFlag(
      this.nameValidationError === '' &&
        this.urlValidationError === '' &&
        this.topicsGraphValidationError === ''
    );
  }

  getAllClassroomValidationErrors(): string[] {
    return this.classroomValidationErrors;
  }

  getSaveClassroomValidationErrors(): string[] {
    return [this.nameValidationError, this.urlValidationError].filter(
      error => error !== ''
    );
  }

  reinitializeErrorMsgs(): void {
    this.classroomValidationErrors = [];
    this.nameValidationError = '';
    this.urlValidationError = '';
    this.topicsGraphValidationError = '';
  }
}
