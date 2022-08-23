// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service which handles opening and closing
 * the training data editor of an answer group.
 */

import { TrainingDataEditorPanelComponent } from './training-data-editor-panel-modal.component';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { ExternalSaveService } from 'services/external-save.service';

@Injectable({
  providedIn: 'root'
})
export class TrainingDataEditorPanelService {
  constructor(
    private alertsService: AlertsService,
    private externalSaveService: ExternalSaveService,
    private ngbModal: NgbModal
  ) {}

  /**
   * Opens training data editor for currently selected answer group.
   */
  openTrainingDataEditor(): void {
    this.alertsService.clearWarnings();

    this.ngbModal.open(TrainingDataEditorPanelComponent, {
      backdrop: 'static',
    }).result.then(() => {}, () => {});

    // Save the modified training data externally in state content.
    this.externalSaveService.onExternalSave.emit();
  }
}

angular.module('oppia').factory('TrainingDataEditorPanelService',
  downgradeInjectable(TrainingDataEditorPanelService));
