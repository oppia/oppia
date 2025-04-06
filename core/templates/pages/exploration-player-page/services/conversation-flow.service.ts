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
 * @fileoverview Service to manage the conversation flow of the exploration player,
 * controlling behaviours such as adding cards to the stack, or submitting the
 * answer to progress further.
 */

import {StateCard} from 'domain/state_card/state-card.model';
import {Injectable} from '@angular/core';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {ExplorationPlayerStateService} from './exploration-player-state.service';
import {PlayerTranscriptService} from './player-transcript.service';

@Injectable({
  providedIn: 'root',
})
export class ConversationFlowService {
  constructor(
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private playerTranscriptService: PlayerTranscriptService
  ) {}

  addNewCard(newCard: StateCard): void {
    this.playerTranscriptService.addNewCard(newCard);
    const explorationLanguageCode =
      this.explorationPlayerStateService.getLanguageCode();
    const selectedLanguageCode =
      this.contentTranslationLanguageService.getCurrentContentLanguageCode();
    if (explorationLanguageCode !== selectedLanguageCode) {
      this.contentTranslationManagerService.displayTranslations(
        selectedLanguageCode
      );
    }
  }

  isSupplementalCardNonempty(card: StateCard): boolean {
    return !card.isInteractionInline();
  }
}
