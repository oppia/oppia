// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for delete misconception modal.
 */

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';

@Component({
  selector: 'delete-misconception-modal',
  templateUrl: './delete-misconception-modal.component.html',
  styleUrls: []
}) export class DeleteMisconceptionModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  skill: Skill;
  index: number;

  constructor(
    private skillEditorStateService: SkillEditorStateService,
    protected modalInstance: NgbActiveModal
  ) {
    super(modalInstance);
  }

  ngOnInit(): void {
    this.skill = this.skillEditorStateService.getSkill();
  }

  confirm(): void {
    this.modalInstance.close({
      id: this.skill.getMisconceptionAtIndex(this.index).getId()
    });
  }
}
