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
 * @fileoverview Component for the state version history button.
 */

import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StateVersionHistoryModalComponent } from 'pages/exploration-editor-page/modal-templates/state-version-history-modal.component';
import { StateDiffData, VersionHistoryService } from 'pages/exploration-editor-page/services/version-history.service';

@Component({
  selector: 'oppia-state-version-history',
  templateUrl: './state-version-history.component.html'
})
export class StateVersionHistoryComponent {
  constructor(
    private versionHistoryService: VersionHistoryService,
    private ngbModal: NgbModal
  ) {}

  canShowExploreVersionHistoryButton(): boolean {
    return this.versionHistoryService.canShowBackwardStateDiffData();
  }

  getLastEditedCommitterUsername(): string {
    return (
      this.versionHistoryService.getBackwardStateDiffData().committerUsername
    );
  }

  getLastEditedVersionNumber(): number | null {
    return (
      this.versionHistoryService.getBackwardStateDiffData().oldVersionNumber
    );
  }

  onClickExploreVersionHistoryButton(): void {
    const modalRef: NgbModalRef = this.ngbModal.open(
      StateVersionHistoryModalComponent, {
        backdrop: true,
        windowClass: 'metadata-diff-modal',
        size: 'xl'
      });

    const stateDiffData: StateDiffData = (
      this.versionHistoryService.getBackwardStateDiffData());
    modalRef.componentInstance.newState = stateDiffData.newState;
    modalRef.componentInstance.oldState = stateDiffData.oldState;
    if (stateDiffData.newState && stateDiffData.newState.name) {
      modalRef.componentInstance.newStateName = stateDiffData.newState.name;
    }
    if (stateDiffData.oldState && stateDiffData.oldState.name) {
      modalRef.componentInstance.oldStateName = stateDiffData.oldState.name;
    }
    modalRef.componentInstance.committerUsername = (
      stateDiffData.committerUsername);
    modalRef.componentInstance.oldVersion = stateDiffData.oldVersionNumber;

    modalRef.result.then(() => {
      this.versionHistoryService
        .setCurrentPositionInStateVersionHistoryList(0);
    }, () => {
      this.versionHistoryService
        .setCurrentPositionInStateVersionHistoryList(0);
    });
  }
}
