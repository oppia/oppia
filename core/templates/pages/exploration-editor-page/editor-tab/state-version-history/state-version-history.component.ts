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

import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {StateVersionHistoryModalComponent} from 'pages/exploration-editor-page/modal-templates/state-version-history-modal.component';
import {
  StateDiffData,
  VersionHistoryService,
} from 'pages/exploration-editor-page/services/version-history.service';

@Component({
  selector: 'oppia-state-version-history',
  templateUrl: './state-version-history.component.html',
})
export class StateVersionHistoryComponent {
  @Input() validationErrorIsShown!: boolean;

  constructor(
    private versionHistoryService: VersionHistoryService,
    private ngbModal: NgbModal
  ) {}

  canShowExploreVersionHistoryButton(): boolean {
    return this.versionHistoryService.canShowBackwardStateDiffData();
  }

  getLastEditedCommitterUsername(): string {
    return this.versionHistoryService.getBackwardStateDiffData()
      .committerUsername;
  }

  getLastEditedVersionNumber(): number {
    const lastEditedVersionNumber =
      this.versionHistoryService.getBackwardStateDiffData().oldVersionNumber;
    if (lastEditedVersionNumber === null) {
      // A null value for lastEditedVersionNumber marks the end of the version
      // history for a particular state. This is impossible here because this
      // function 'getLastEditedVersionNumber' is called only when
      // canShowExploreVersionHistoryButton() returns true. This function will
      // not return true when we reach the end of the version history list.
      throw new Error('The value of last edited version number cannot be null');
    }
    return lastEditedVersionNumber;
  }

  onClickExploreVersionHistoryButton(): void {
    const modalRef: NgbModalRef = this.ngbModal.open(
      StateVersionHistoryModalComponent,
      {
        backdrop: true,
        windowClass: 'metadata-diff-modal',
        size: 'xl',
      }
    );

    const stateDiffData: StateDiffData =
      this.versionHistoryService.getBackwardStateDiffData();

    // Explanation for why diffData.newState can be null:
    // It is explained in VersionHistoryService as to why the values of
    // newState or oldState can be null. This is because they are elements of
    // the list fetchedStateData whose last element can be null which marks
    // the end of the version history of that particular state.
    if (stateDiffData.newState) {
      modalRef.componentInstance.newState = stateDiffData.newState;
      if (stateDiffData.newState.name === null) {
        // The state name is null before having a state
        // (please refer to the implementation of State object from
        // StateObjectFactory.ts). This cannot happen here because
        // all the states will be properly defined and will have a name during
        // version history navigation.
        throw new Error('State name cannot be null');
      }
      modalRef.componentInstance.newStateName = stateDiffData.newState.name;
    }
    if (stateDiffData.oldState) {
      modalRef.componentInstance.oldState = stateDiffData.oldState;
      if (stateDiffData.oldState.name === null) {
        // The state name is null before having a state
        // (please refer to the implementation of State object from
        // StateObjectFactory.ts). This cannot happen here because
        // all the states will be properly defined and will have a name during
        // version history navigation.
        throw new Error('State name cannot be null');
      }
      modalRef.componentInstance.oldStateName = stateDiffData.oldState.name;
    }
    modalRef.componentInstance.committerUsername =
      stateDiffData.committerUsername;
    modalRef.componentInstance.oldVersion = stateDiffData.oldVersionNumber;

    modalRef.result.then(
      () => {
        this.versionHistoryService.setCurrentPositionInStateVersionHistoryList(
          0
        );
      },
      () => {
        this.versionHistoryService.setCurrentPositionInStateVersionHistoryList(
          0
        );
      }
    );
  }
}
