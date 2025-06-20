// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for displaying different types of modals depending
 * on the type of response received as a result of the autosaving request.
 */

import {Injectable} from '@angular/core';

import {LocalStorageService} from 'services/local-storage.service';
import {SaveVersionMismatchModalComponent} from '../modal-templates/save-version-mismatch-modal.component';
import {SaveValidationFailModalComponent} from '../modal-templates/save-validation-fail-modal.component';
import {LostChangesModalComponent} from '../modal-templates/lost-changes-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LostChange} from 'domain/exploration/LostChangeObjectFactory';
import {ExplorationChange} from 'domain/exploration/exploration-draft.model';

@Injectable({
  providedIn: 'root',
})
export class AutosaveInfoModalsService {
  private _isModalOpen: boolean = false;
  isLostChangesModalOpen: boolean = false;

  constructor(
    private localStorageService: LocalStorageService,
    private ngbModal: NgbModal
  ) {}

  showNonStrictValidationFailModal(): void {
    const modelRef = this.ngbModal.open(SaveValidationFailModalComponent, {
      backdrop: true,
    });
    modelRef.result.then(
      () => {
        this._isModalOpen = false;
      },
      () => {
        this._isModalOpen = false;
      }
    );

    this._isModalOpen = true;
  }

  isModalOpen(): boolean {
    return this._isModalOpen;
  }

  showVersionMismatchModal(
    lostChanges: LostChange[] | ExplorationChange[]
  ): void {
    if (!this.isLostChangesModalOpen) {
      this.isLostChangesModalOpen = true;

      const modelRef = this.ngbModal.open(SaveVersionMismatchModalComponent, {
        backdrop: 'static',
        keyboard: false,
      });
      modelRef.componentInstance.lostChanges = lostChanges;
      modelRef.result.then(
        () => {
          this._isModalOpen = false;
          this.isLostChangesModalOpen = false;
        },
        () => {
          this._isModalOpen = false;
          this.isLostChangesModalOpen = false;
        }
      );
    }

    this._isModalOpen = true;
  }

  showLostChangesModal(
    lostChanges: LostChange[] | ExplorationChange[],
    explorationId: string
  ): void {
    const modelRef = this.ngbModal.open(LostChangesModalComponent, {
      backdrop: 'static',
      keyboard: false,
    });
    modelRef.componentInstance.lostChanges = lostChanges;
    modelRef.result.then(
      () => {
        this._isModalOpen = false;
      },
      () => {
        // When the user clicks on discard changes button, signal backend
        // to discard the draft and reload the page thereafter.
        this.localStorageService.removeExplorationDraft(explorationId);
        this._isModalOpen = false;
      }
    );

    this._isModalOpen = true;
  }
}
