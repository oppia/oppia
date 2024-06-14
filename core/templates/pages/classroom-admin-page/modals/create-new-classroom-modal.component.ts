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

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {ClassroomBackendApiService} from '../../../domain/classroom/classroom-backend-api.service';
import {NewClassroomData} from '../new-classroom.model';
import {ClassroomAdminDataService} from '../services/classroom-admin-data.service';

@Component({
  selector: 'oppia-create-new-classroom-modal',
  templateUrl: './create-new-classroom-modal.component.html',
})
export class CreateNewClassroomModalComponent extends ConfirmOrCancelModal {
  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    public classroomAdminDataService: ClassroomAdminDataService,
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  existingClassroomNames: string[] = [];
  tempClassroom!: NewClassroomData;
  classroom!: NewClassroomData;

  classroomUrlFragmentIsDuplicate: boolean = false;
  newClassroomCreationInProgress: boolean = false;

  ngOnInit(): void {
    this.tempClassroom = new NewClassroomData('', '', '');
    this.classroom = new NewClassroomData('', '', '');

    this.classroomAdminDataService.existingClassroomNames =
      this.existingClassroomNames;
  }

  createClassroom(): void {
    this.newClassroomCreationInProgress = true;
    this.classroomUrlFragmentIsDuplicate = false;

    this.classroomBackendApiService;
    const name = this.tempClassroom.getClassroomName();
    const urlFragment = this.tempClassroom.getClassroomUrlFragment();

    this.classroomBackendApiService
      .createNewClassroomAsync(name, urlFragment)
      .then(res => {
        this.ngbActiveModal.close({
          classroom_id: res.new_classroom_id,
          name: name,
          url_fragment: urlFragment,
        });
        this.newClassroomCreationInProgress = false;
      });
  }
}
