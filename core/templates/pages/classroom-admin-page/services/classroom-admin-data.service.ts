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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ClassroomData, ValidateClassroomFieldResponse } from '../existing-classroom-admin.model';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';


@Injectable({
  providedIn: 'root'
})
export class ClassroomAdminDataService {
  constructor(
    private classroomBackendApiService: ClassroomBackendApiService
  ) {}

  classroom!: ClassroomData;
  existingClassroomNames: string[];
  urlFragmentIsDuplicate: boolean;

  namevalidationResponse: ValidateClassroomFieldResponse = {
    type: '',
    result: false
  };

  urlValidationResponse: ValidateClassroomFieldResponse = {
    type: '',
    result: false
  };

  onClassroomNameChange(classroom: ClassroomData): void {
    this.namevalidationResponse = classroom.IsClassroomNameValid();

    if (!this.namevalidationResponse.result) {
      return;
    }

    if (
      this.existingClassroomNames.indexOf(
        classroom.getClassroomName()) !== -1
    ) {
      this.namevalidationResponse = {
        type: 'A classroom with this name already exists.',
        result: false
      };
      return;
    }

    this.namevalidationResponse = {
      type: '',
      result: true
    };
  }

  onClassroomUrlChange(
      classroom: ClassroomData,
      existingClassroomUrl: string
  ): void {
    this.urlValidationResponse = classroom.IsClassroomUrlFragmentIsValid();

    if (!this.urlValidationResponse.result) {
      return;
    }

    this.classroomBackendApiService.doesClassroomWithUrlFragmentExistAsync(
      classroom.getClassroomUrlFragment()
    ).then((response: boolean) => {
      if (
        response && (
          classroom.getClassroomUrlFragment() !==
            existingClassroomUrl)
      ) {
        this.urlValidationResponse = {
          type: 'A classroom with this name already exists.',
          result: false
        };
        return;
      }

      this.urlValidationResponse = {
        type: '',
        result: true
      };
    });
  }

  reinitializeClassroomValidationFields(): void {
    this.namevalidationResponse.type = '';
    this.namevalidationResponse.result = false;
    this.urlValidationResponse.type = '';
    this.urlValidationResponse.result = false;
  }
}

angular.module('oppia').factory('ClassroomAdminDataService',
  downgradeInjectable(ClassroomAdminDataService));
