// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Automatic voiceover regeneration confirmation modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {Voiceover} from 'domain/exploration/voiceover.model';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {AlertsService} from 'services/alerts.service';

@Component({
  selector: 'oppia-automatic-voiceover-regeneration-confirm-modal',
  templateUrl:
    './automatic-voiceover-regeneration-confirm-modal.component.html',
})
export class AutomaticVoiceoverRegenerationConfirmModalComponent extends ConfirmOrCancelModal {
  explorationId!: string;
  explorationVersion!: number;
  stateName!: string;
  contentId!: string;
  languageAccentCode!: string;
  isAutomaticVoiceoverPresent!: boolean;
  isAutomaticVoiceoverGenerating: boolean = false;
  modalHeader!: string;
  buttonTextForGenerate!: string;
  buttonTextDuringGeneration!: string;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private alertsService: AlertsService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    if (this.isAutomaticVoiceoverPresent) {
      this.modalHeader = 'Are you sure you want to regenerate voiceover?';
      this.buttonTextForGenerate = 'Regenerate';
      this.buttonTextDuringGeneration = 'Regenerating';
    } else {
      this.modalHeader = 'Are you sure you want to generate voiceover?';
      this.buttonTextForGenerate = 'Generate';
      this.buttonTextDuringGeneration = 'Generating';
    }
  }

  regenerateAndClose(): void {
    this.isAutomaticVoiceoverGenerating = true;
    this.voiceoverBackendApiService
      .generateAutomaticVoiceoverAsync(
        this.explorationId,
        this.explorationVersion,
        this.stateName,
        this.contentId,
        this.languageAccentCode
      )
      .then(response => {
        let voiceover = new Voiceover(
          response.filename,
          response.fileSizeBytes,
          response.needsUpdate,
          response.durationSecs
        );
        this.isAutomaticVoiceoverGenerating = false;

        this.ngbActiveModal.close({
          voiceover: voiceover,
          sentenceTokenWithDurations: response.sentenceTokenWithDurations,
        });
      })
      .catch(errorResponse => {
        this.alertsService.addWarning(errorResponse.error);
        this.isAutomaticVoiceoverGenerating = false;
        this.ngbActiveModal.close();
      });
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }
}
