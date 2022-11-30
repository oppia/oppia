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
 * @fileoverview Service which handles opening and closing
 * the training modal used for unresolved answers.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Injectable } from '@angular/core';
import { AlertsService } from 'services/alerts.service';
import { ExternalSaveService } from 'services/external-save.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TrainingModalComponent } from './training-modal.component';
import { InteractionAnswer } from 'interactions/answer-defs';

interface FinishTrainingResult {
  answer: InteractionAnswer;
  interactionId: string;
  answerIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class TrainingModalService {
  constructor(
    private alertsService: AlertsService,
    private externalSaveService: ExternalSaveService,
    private ngbModal: NgbModal,
  ) { }

  private _finishTrainingCallbackEmitter = new EventEmitter();

  get onFinishTrainingCallback(): EventEmitter<FinishTrainingResult> {
    return this._finishTrainingCallbackEmitter;
  }

  /**
  * Opens unresolved answer trainer modal for given answer.
  * @param {Object} unhandledAnswer - The answer to be trained.
  * @param {requestCallback} finishTrainingCallback - Function to call when
      answer has been trained.
  */
  openTrainUnresolvedAnswerModal(
      unhandledAnswer: InteractionAnswer,
      interactionId: string,
      answerIndex: number): void {
    this.alertsService.clearWarnings();

    let modalRef: NgbModalRef = this.ngbModal.open(TrainingModalComponent, {
      backdrop: 'static',
      windowClass: 'skill-select-modal',
      size: 'xl'
    });

    modalRef.componentInstance.unhandledAnswer = unhandledAnswer;
    modalRef.componentInstance.finishTrainingCallback.subscribe(
      () => {
        let finishTrainingResult: FinishTrainingResult = {
          answer: unhandledAnswer,
          interactionId: interactionId,
          answerIndex: answerIndex
        };

        this.onFinishTrainingCallback.emit(finishTrainingResult);
      });

    modalRef.result.then(() => { }, () => { });


    // Save the modified training data externally in state content.
    this.externalSaveService.onExternalSave.emit();
  }
}

angular.module('oppia').factory('TrainingModalService',
  downgradeInjectable(TrainingModalService));
