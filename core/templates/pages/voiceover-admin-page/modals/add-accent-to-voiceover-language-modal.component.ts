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
 * @fileoverview Close language accent removal confirmation modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {
  VoiceoverBackendApiService, LanguageAccentToDescription,
  LanguageCodesMapping, LanguageAccentMasterList,
  VoiceArtistIdToLanguageMapping, VoiceArtistIdToVoiceArtistName,
  ExplorationIdToFilenames
} from 'domain/voiceover/voiceover-backend-api.service';
import { AudioPlayerService } from 'services/audio-player.service';
import { ContextService } from 'services/context.service';

@Component({
  selector: 'oppia-add-accent-to-voiceover-language-modal',
  templateUrl: './add-accent-to-voiceover-language-modal.component.html'
})
export class AddAccentToVoiceoverLanguageModalComponent
  extends ConfirmOrCancelModal {
  languageCode: string = '';
  languageAccentCode: string = '';
  voiceArtistId: string = '';
  voiceArtistName: string = '';
  languageAccentCodes = {};
  updateButtonIsDisabled: boolean = true;
  explorationIdsToFilenames: ExplorationIdToFilenames = {};
  pageIsInitialized = false;
  currentFilename = '';

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private audioPlayerService: AudioPlayerService,
    private contextService: ContextService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    console.log(this.voiceArtistId);
    this.voiceoverBackendApiService.fetchVoiceoversForVoiceArtistAsync(
      this.voiceArtistId, this.languageCode
    ).then(explorationIdToFilenames => {
      this.explorationIdsToFilenames = explorationIdToFilenames;
      console.log(this.explorationIdsToFilenames);
      this.pageIsInitialized = true;
    });
  }

  update(): void {
    this.ngbActiveModal.close(this.languageAccentCode);
  }

  close(): void {
    this.ngbActiveModal.close();
  }

  addLanguageAccentCodeSupport(languageAccentCode) {
    this.languageAccentCode = languageAccentCode;
    this.updateButtonIsDisabled = false;
  }

  playAudio(filename: string, explorationId: string): void {
    this.currentFilename = filename;
    this.contextService.explorationId = explorationId;
    this.audioPlayerService.stop();

    this.audioPlayerService.loadAsync(filename).then(() => {
      this.audioPlayerService.play();
    });
  }

  pauseAudio(): void {
    this.currentFilename = '';
    this.audioPlayerService.stop();
  }
}
