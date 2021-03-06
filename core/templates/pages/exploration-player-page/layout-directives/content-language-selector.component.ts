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
 * @fileoverview Component for the content language selector displayed when
 * playing an exploration.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ContentTranslationLanguageService } from
  'pages/exploration-player-page/services/content-translation-language.service';
import { ExplorationLanguageInfo } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { PlayerPositionService } from
  'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';
import { SwitchContentLanguageRefreshRequiredModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';

@Component({
  selector: 'content-language-selector',
  templateUrl: './content-language-selector.component.html',
  styleUrls: []
})
export class ContentLanguageSelectorComponent implements OnInit {
  constructor(
    private contentTranslationLanguageService:
      ContentTranslationLanguageService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private ngbModal: NgbModal,
    private imagePreloaderService: ImagePreloaderService
  ) {}

  selectedLanguageCode: string;
  languageOptions: ExplorationLanguageInfo[];

  ngOnInit(): void {
    this.selectedLanguageCode = (
      this.contentTranslationLanguageService.getCurrentContentLanguageCode());
    this.languageOptions = (
      this.contentTranslationLanguageService.getLanguageOptionsForDropdown());
  }

  onSelectLanguage(newLanguageCode: string): string {
    if (this.shouldPromptForRefresh()) {
      const modalRef = this.ngbModal.open(
        SwitchContentLanguageRefreshRequiredModalComponent);
      modalRef.componentInstance.languageCode = newLanguageCode;
    } else {
      this.contentTranslationLanguageService.setCurrentContentLanguageCode(
        newLanguageCode);
      this.selectedLanguageCode = newLanguageCode;
    }
    this.imagePreloaderService.restartImagePreloader(
      this.playerTranscriptService.getCard(0).getStateName());

    return this.selectedLanguageCode;
  }

  shouldDisplaySelector(): boolean {
    return (
      this.languageOptions.length > 1 &&
      this.playerPositionService.displayedCardIndex === 0);
  }

  private shouldPromptForRefresh(): boolean {
    const firstCard = this.playerTranscriptService.getCard(0);
    return firstCard.getInputResponsePairs().length > 0;
  }
}

angular.module('oppia').directive(
  'contentLanguageSelector',
  downgradeComponent({component: ContentLanguageSelectorComponent}));
