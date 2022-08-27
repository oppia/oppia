// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for Invite learners modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { LearnerGroupUserInfo } from 'domain/learner_group/learner-group-user-info.model';

@Component({
  selector: 'oppia-invite-learners-modal',
  templateUrl: './invite-learners-modal.component.html'
})
export class InviteLearnersModalComponent extends ConfirmOrCancelModal {
  learnerGroupId!: string;
  invitedLearners: string[] = [];
  invitedLearnersInfo: LearnerGroupUserInfo[] = [];


  constructor(
    private ngbActiveModal: NgbActiveModal,
  ) {
    super(ngbActiveModal);
  }

  confirm(): void {
    this.ngbActiveModal.close({
      invitedLearners: this.invitedLearners,
      invitedLearnersInfo: this.invitedLearnersInfo
    });
  }

  updateNewlyInvitedLearners(invitedLearners: string[]): void {
    this.invitedLearners = invitedLearners;
  }

  updateNewlyInvitedLearnersInfo(
      invitedLearnersInfo: LearnerGroupUserInfo[]
  ): void {
    this.invitedLearnersInfo = invitedLearnersInfo;
  }
}
