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
 * @fileoverview Component for Delete State Skill Modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {ResponsesService} from '../../services/responses.service';

@Component({
  selector: 'delete-state-skill-modal',
  templateUrl: './delete-state-skill-modal.component.html',
})
export class DeleteStateSkillModalComponent extends ConfirmOrCancelModal {
  constructor(
    ngbActiveModal: NgbActiveModal,
    private responsesService: ResponsesService
  ) {
    super(ngbActiveModal);
  }

  isAnyMisconceptionTagged(): boolean {
    let answerGroups = this.responsesService.getAnswerGroups();
    for (let answerGroup of answerGroups) {
      if (answerGroup.taggedSkillMisconceptionId) {
        return true;
      }
    }
    return false;
  }
}
