
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
 * @fileoverview Create new classroom modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ClassroomBackendApiService } from '../../../domain/classroom/classroom-backend-api.service';


@Component({
  selector: 'oppia-create-new-classroom-modal',
  templateUrl: './create-new-classroom-modal.component.html'
})
export class CreateNewClassroomModalComponent
  extends ConfirmOrCancelModal {
  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  existingClassroomNames: string[] = [];
  newClassroomName: string = '';
  newClassroomId: string = '';
  newClassroomUrlFragment: string = '';
  newClassroomCreationInProgress: boolean = false;

  classroomNameIsTooLong: boolean = false;
  emptyClassroomName: boolean = false;
  duplicateClassroomName: boolean = false;
  classroomNameIsValid: boolean = false;

  classroomUrlFragmentIsTooLong: boolean = false;
  classroomUrlFragmentIsEmpty: boolean = false;
  classroomUrlFragmentIsDuplicate: boolean = false;
  urlFragmentRegexMatched: boolean = true;
  classroomUrlFragmentIsValid: boolean = false;

  getNewClassroomId(): void {
    this.classroomBackendApiService.getNewClassroomIdAsync().then(
      classroomId => {
        this.newClassroomId = classroomId;
      }
    );
  }

  ngOnInit(): void {
    this.getNewClassroomId();
  }

  createClassroom(classroomName: string, classroomUrlFragment: string): void {
    this.newClassroomCreationInProgress = true;
    this.classroomUrlFragmentIsDuplicate = false;
    this.classroomBackendApiService.doesClassroomWithUrlFragmentExistAsync(
      classroomUrlFragment).then(response => {
      if (response) {
        this.classroomUrlFragmentIsDuplicate = true;
        this.classroomUrlFragmentIsValid = false;
        this.newClassroomCreationInProgress = false;
        return;
      }
      let defaultClassroomDict = {
        classroom_id: this.newClassroomId,
        name: classroomName,
        url_fragment: classroomUrlFragment,
        course_details: '',
        topic_list_intro: '',
        topic_id_to_prerequisite_topic_ids: {}
      };

      this.classroomBackendApiService.updateClassroomDataAsync(
        this.newClassroomId, defaultClassroomDict).then(() => {
        this.ngbActiveModal.close(defaultClassroomDict);
        this.newClassroomCreationInProgress = false;
      });
    });
  }

  onClassroomNameChange(): void {
    this.newClassroomName = this.newClassroomName.replace(/\s+/g, ' ').trim();
    this.classroomNameIsValid = true;

    if (this.newClassroomName === '') {
      this.emptyClassroomName = true;
      this.classroomNameIsTooLong = false;
      this.duplicateClassroomName = false;
      this.classroomNameIsValid = false;
      return;
    } else {
      this.emptyClassroomName = false;
    }

    if (
      this.newClassroomName.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_NAME
    ) {
      this.classroomNameIsTooLong = true;
      this.duplicateClassroomName = false;
      this.classroomNameIsValid = false;
      return;
    } else {
      this.classroomNameIsTooLong = false;
    }

    if (this.existingClassroomNames.indexOf(this.newClassroomName) !== -1) {
      this.duplicateClassroomName = true;
      this.classroomNameIsValid = false;
    } else {
      this.duplicateClassroomName = false;
    }
  }

  onClassroomUrlFragmentChange(): void {
    this.classroomUrlFragmentIsValid = true;

    if (this.newClassroomUrlFragment === '') {
      this.classroomUrlFragmentIsEmpty = true;
      this.classroomUrlFragmentIsDuplicate = false;
      this.classroomUrlFragmentIsTooLong = false;
      this.urlFragmentRegexMatched = true;
      this.classroomUrlFragmentIsValid = false;
      return;
    } else {
      this.classroomUrlFragmentIsEmpty = false;
    }

    if (
      this.newClassroomUrlFragment.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
    ) {
      this.classroomUrlFragmentIsTooLong = true;
      this.classroomUrlFragmentIsDuplicate = false;
      this.urlFragmentRegexMatched = true;
      this.classroomUrlFragmentIsValid = false;
      return;
    } else {
      this.classroomUrlFragmentIsTooLong = false;
    }

    let validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX);
    if (validUrlFragmentRegex.test(this.newClassroomUrlFragment)) {
      this.urlFragmentRegexMatched = true;
    } else {
      this.urlFragmentRegexMatched = false;
      this.classroomUrlFragmentIsDuplicate = false;
      this.classroomUrlFragmentIsValid = false;
      return;
    }

    if (this.classroomUrlFragmentIsDuplicate) {
      this.classroomUrlFragmentIsDuplicate = false;
      this.classroomUrlFragmentIsValid = true;
    }
  }
}
