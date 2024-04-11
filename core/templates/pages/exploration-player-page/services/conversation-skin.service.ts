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
 * controlling behaviours such as adding cards to the stack and displaying them, or
 * submitting the answer to progress further.
 */

import {StateCard} from 'domain/state_card/state-card.model';
import {Injectable} from '@angular/core';
import {downgradeInjectable} from '@angular/upgrade/static';
import {ContentTranslationLanguageService} from '../services/content-translation-language.service';
import {ContentTranslationManagerService} from '../services/content-translation-manager.service';
import {ExplorationPlayerStateService} from '../services/exploration-player-state.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

@Injectable({
  providedIn: 'root',
})
export class ConversationSkinService {
  TIME_PADDING_MSEC = 250;
  TIME_FADEIN_MSEC = 100;
  TIME_NUM_CARDS_CHANGE_MSEC = 500;

  playerIsAnimatingToTwoCards!: boolean;
  playerIsAnimatingToOneCard!: boolean;

  constructor(
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  addAndDisplayNewCard(newCard: StateCard): void {
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

    let totalNumCards = this.playerTranscriptService.getNumCards();

    let previousSupplementalCardIsNonempty =
      totalNumCards > 1 &&
      this.isSupplementalCardNonempty(
        this.playerTranscriptService.getCard(totalNumCards - 2)
      );

    let nextSupplementalCardIsNonempty = this.isSupplementalCardNonempty(
      this.playerTranscriptService.getLastCard()
    );

    if (
      totalNumCards > 1 &&
      this.canWindowShowTwoCards() &&
      !previousSupplementalCardIsNonempty &&
      nextSupplementalCardIsNonempty
    ) {
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
      this.animateToTwoCards(function () {});
    } else if (
      totalNumCards > 1 &&
      this.canWindowShowTwoCards() &&
      previousSupplementalCardIsNonempty &&
      !nextSupplementalCardIsNonempty
    ) {
      this.animateToOneCard(() => {
        this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
      });
    } else {
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
    }
    this.playerPositionService.changeCurrentQuestion(
      this.playerPositionService.getDisplayedCardIndex()
    );
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX
    );
  }

  isPlayerAnimatingToOneCard(): boolean {
    return this.playerIsAnimatingToOneCard;
  }

  isPlayerAnimatingToTwoCards(): boolean {
    return this.playerIsAnimatingToTwoCards;
  }

  animateToTwoCards(doneCallback: () => void): void {
    this.playerIsAnimatingToTwoCards = true;
    setTimeout(
      () => {
        this.playerIsAnimatingToTwoCards = false;
        if (doneCallback) {
          doneCallback();
        }
      },
      this.TIME_NUM_CARDS_CHANGE_MSEC +
        this.TIME_FADEIN_MSEC +
        this.TIME_PADDING_MSEC
    );
  }

  animateToOneCard(doneCallback: () => void): void {
    this.playerIsAnimatingToOneCard = true;
    setTimeout(() => {
      this.playerIsAnimatingToOneCard = false;
      if (doneCallback) {
        doneCallback();
      }
    }, this.TIME_NUM_CARDS_CHANGE_MSEC);
  }

  isSupplementalCardNonempty(card: StateCard): boolean {
    return !card.isInteractionInline();
  }
}

angular
  .module('oppia')
  .factory(
    'ConversationSkinService',
    downgradeInjectable(ConversationSkinService)
  );
