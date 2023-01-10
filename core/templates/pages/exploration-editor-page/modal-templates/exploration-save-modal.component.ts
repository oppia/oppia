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
 * @fileoverview Component for exploration save modal.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AppConstants } from 'app.constants';
import { DiffNodeData } from 'components/version-diff-visualization/version-diff-visualization.component';

@Component({
  selector: 'oppia-exploration-save-modal',
  templateUrl: './exploration-save-modal.component.html'
})
export class ExplorationSaveModalComponent
  extends ConfirmOrCancelModal {
  earlierVersionHeader: string = 'Last saved';
  laterVersionHeader: string = 'New changes';
  commitMessage: string = '';
  showDiff: boolean = false;
  MAX_COMMIT_MESSAGE_LENGTH = String(AppConstants.MAX_COMMIT_MESSAGE_LENGTH);

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isExplorationPrivate!: boolean;
  @Input() diffData!: DiffNodeData;

  constructor(
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  onClickToggleDiffButton(): void {
    this.showDiff = !this.showDiff;
  }
}

angular.module('oppia').directive('oppiaExplorationSaveModal',
  downgradeComponent({
    component: ExplorationSaveModalComponent
  }) as angular.IDirectiveFactory);
