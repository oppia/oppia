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
 * @fileoverview Modal component asking user whether to select appropriate
 * changes for the translation.
 */

import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ChangeListService } from 'pages/exploration-editor-page/services/change-list.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';

@Component({
  selector: 'oppia-mark-translations-as-needing-update-modal',
  templateUrl: './mark-translations-as-needing-update-modal.component.html'
})
export class MarkTranslationsAsNeedingUpdateModalComponent
  extends ConfirmOrCancelModal {
  @Input() contentId!: string;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private changeListService: ChangeListService,
    private stateEditorService: StateEditorService,
    private explorationStatesService: ExplorationStatesService
  ) {
    super(ngbActiveModal);
  }

  markNeedsUpdate(): void {
    this.changeListService.markTranslationsAsNeedingUpdate(this.contentId);
    let stateName = this.stateEditorService.getActiveStateName();
    let state = this.explorationStatesService.getState(stateName);
    let recordedVoiceovers = state.recordedVoiceovers;
    if (recordedVoiceovers.hasUnflaggedVoiceovers(this.contentId)) {
      recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
        this.contentId);
      this.explorationStatesService.saveRecordedVoiceovers(
        stateName, recordedVoiceovers);
    }
    this.ngbActiveModal.close();
  }

  removeTranslations(): void {
    this.changeListService.removeTranslations(this.contentId);
    let stateName = this.stateEditorService.getActiveStateName();
    let state = this.explorationStatesService.getState(stateName);
    let recordedVoiceovers = state.recordedVoiceovers;
    if (recordedVoiceovers.hasUnflaggedVoiceovers(this.contentId)) {
      recordedVoiceovers.deleteContentId(this.contentId);
      this.explorationStatesService.saveRecordedVoiceovers(
        stateName, recordedVoiceovers);
    }
    this.ngbActiveModal.close();
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }
}
