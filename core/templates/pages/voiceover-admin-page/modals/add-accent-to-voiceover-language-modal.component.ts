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
 * @fileoverview Add language accent modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {
  VoiceoverBackendApiService,
  LanguageAccentToDescription,
  ExplorationIdToFilenames,
} from 'domain/voiceover/voiceover-backend-api.service';
import {AudioPlayerService} from 'services/audio-player.service';
import {ContextService} from 'services/context.service';

@Component({
  selector: 'oppia-add-accent-to-voiceover-language-modal',
  templateUrl: './add-accent-to-voiceover-language-modal.component.html',
})
export class AddAccentToVoiceoverLanguageModalComponent extends ConfirmOrCancelModal {
  languageCode: string = '';
  languageAccentCode: string = '';
  voiceArtistId: string = '';
  voiceArtistName: string = '';
  languageAccentCodes: LanguageAccentToDescription = {};
  updateButtonIsDisabled: boolean = true;
  explorationIdsToFilenames: ExplorationIdToFilenames = {};
  pageIsInitialized: boolean = false;
  currentFilename: string = '';

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private audioPlayerService: AudioPlayerService,
    private contextService: ContextService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.voiceoverBackendApiService
      .fetchFilenamesForVoiceArtistAsync(this.voiceArtistId, this.languageCode)
      .then(explorationIdToFilenames => {
        this.explorationIdsToFilenames = explorationIdToFilenames;
        this.pageIsInitialized = true;
      });
    setInterval(() => {
      if (!this.audioPlayerService.isPlaying()) {
        this.currentFilename = '';
      }
    }, 1000);
  }

  update(): void {
    this.pauseAudio();
    this.ngbActiveModal.close(this.languageAccentCode);
  }

  removeSelectedAccent(): void {
    this.languageAccentCode = '';
    this.updateButtonIsDisabled = false;
  }

  cancel(): void {
    this.pauseAudio();
    this.ngbActiveModal.dismiss();
  }

  addLanguageAccentCodeSupport(languageAccentCode: string): void {
    this.languageAccentCode = languageAccentCode;
    this.updateButtonIsDisabled = false;
  }

  playAudio(filename: string, explorationId: string): void {
    this.pauseAudio();

    this.contextService.explorationId = explorationId;

    this.audioPlayerService.loadAsync(filename).then(() => {
      this.currentFilename = filename;
      this.audioPlayerService.play();
    });
  }

  pauseAudio(): void {
    this.currentFilename = '';
    this.audioPlayerService.stop();
  }
}
