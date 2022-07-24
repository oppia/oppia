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
 * @fileoverview Component for skill mastery modal.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-skill-mastery-modal',
  templateUrl: './skill-mastery-modal.component.html'
})
export class SkillMasteryModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  @Input() skillId: string = '';
  @Input() userIsLoggedIn: boolean = false;
  @Input() masteryPerSkillMapping: {
    [key: string]: number;
  } = {};

  @Output() openConceptCardModal = new EventEmitter<[string]>();

  masteryChange: number = 0;

  constructor(
    private ngbActiveModal: NgbActiveModal,
  ) {
    super(ngbActiveModal);
  }

  conceptCardModalOpen(): void {
    this.openConceptCardModal.emit([this.skillId]);
  }

  ngOnInit(): void {
    if (this.userIsLoggedIn) {
      this.masteryChange = this.masteryPerSkillMapping[(
        this.skillId as string)];
    }
  }
}

angular.module('oppia').directive('oppiaSkillMasteryModal',
  downgradeComponent({
    component: SkillMasteryModalComponent
  }) as angular.IDirectiveFactory);
