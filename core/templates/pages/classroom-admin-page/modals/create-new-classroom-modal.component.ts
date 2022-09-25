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
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ClassroomBackendApiService } from '../../../domain/classroom/classroom-backend-api.service';
import { ClassroomData } from '../classroom-admin.model';


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
  newClassroom!: ClassroomData;

  classroomUrlFragmentIsDuplicate: boolean = false;
  newClassroomCreationInProgress: boolean = false;

  ngOnInit(): void {
    this.newClassroom = new ClassroomData('', '', '', '', '', {});
    this.newClassroom.classroomNameIsValid = false;
    this.newClassroom.classroomUrlFragmentIsValid = false;
    this.newClassroom.setExistingClassroomData(this.existingClassroomNames);

    // The error messages for classroom name and URL fragment, should not be
    // presented to the user when the modal is just opened.
    this.newClassroom.supressClassroomNameErrorMessages();
    this.newClassroom.supressClassroomUrlFragmentErrorMessages();
  }

  createClassroom(): void {
    this.newClassroomCreationInProgress = true;
    this.classroomUrlFragmentIsDuplicate = false;

    this.classroomBackendApiService.doesClassroomWithUrlFragmentExistAsync(
      this.newClassroom.urlFragment).then(response => {
      if (response) {
        this.classroomUrlFragmentIsDuplicate = true;
        this.newClassroom.classroomUrlFragmentIsValid = false;
        this.newClassroomCreationInProgress = false;
        return;
      }

      this.classroomBackendApiService.getNewClassroomIdAsync().then(
        classroomId => {
          const defaultClassroomDict = {
            classroom_id: classroomId,
            name: this.newClassroom.name,
            url_fragment: this.newClassroom.urlFragment,
            course_details: '',
            topic_list_intro: '',
            topic_id_to_prerequisite_topic_ids: {}
          };

          this.classroomBackendApiService.updateClassroomDataAsync(
            classroomId, defaultClassroomDict).then(() => {
            this.ngbActiveModal.close(defaultClassroomDict);
            this.newClassroomCreationInProgress = false;
          });
        }
      );
    });
  }
}
