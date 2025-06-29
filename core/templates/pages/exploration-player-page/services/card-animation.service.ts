// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview
 */
import {Injectable} from '@angular/core';
import {ExplorationPlayerConstants} from '../current-lesson-player/exploration-player-page.constants';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {PlayerPositionService} from './player-position.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {ServicesConstants} from 'services/services.constants';
import {MessengerService} from 'services/messenger.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class CardAnimationService {
  isAnimatingToTwoCards: boolean;
  isAnimatingToOneCard: boolean;

  // If the exploration is iframed, send data to its parent about
  // its height so that the parent can be resized as necessary.
  lastRequestedHeight: number = 0;
  lastRequestedScroll: boolean = false;

  constructor(
    private focusManagerService: FocusManagerService,
    private playerTranscriptService: PlayerTranscriptService,
    private playerPositionService: PlayerPositionService,
    private windowRef: WindowRef,
    private messengerService: MessengerService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  scheduleNextCardTransition(focusLabel: string, callback: Function): void {
    setTimeout(
      () => {
        callback();
      },
      0.1 * ExplorationPlayerConstants.TIME_FADEOUT_MSEC +
        0.1 * ExplorationPlayerConstants.TIME_HEIGHT_CHANGE_MSEC
    );

    setTimeout(
      () => {
        this.focusManagerService.setFocusIfOnDesktop(focusLabel);
        this.scrollToTop();
      },
      0.1 * ExplorationPlayerConstants.TIME_FADEOUT_MSEC +
        ExplorationPlayerConstants.TIME_HEIGHT_CHANGE_MSEC +
        0.5 * ExplorationPlayerConstants.TIME_FADEIN_MSEC
    );
  }

  scrollToTop(): void {
    setTimeout(() => {
      this.smoothScrollTo(0, 800, 'easeOutQuart');
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const tutorCard = document.querySelector(
        '.conversation-skin-main-tutor-card'
      );

      if (!tutorCard) {
        return;
      }
      const tutorCardRect = tutorCard.getBoundingClientRect();
      const tutorCardBottom =
        tutorCardRect.top + window.scrollY + tutorCardRect.height;
      const windowBottom = window.scrollY + window.innerHeight;

      if (windowBottom < tutorCardBottom) {
        const targetScrollY = tutorCardBottom - window.innerHeight + 12;
        this.smoothScrollTo(
          targetScrollY,
          ExplorationPlayerConstants.TIME_SCROLL_MSEC,
          'easeOutQuad'
        );
      }
    }, 100);
  }

  private smoothScrollTo(
    targetY: number,
    duration: number,
    easingName: string = 'easeOutQuad'
  ): void {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    const easingFunctions = {
      easeOutQuad: (t: number): number => t * (2 - t),
      easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
    };

    const easingFunction =
      easingFunctions[easingName] || easingFunctions.easeOutQuad;

    const step = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;

      if (elapsedTime < duration) {
        const progress = elapsedTime / duration;
        window.scrollTo(0, startY + difference * easingFunction(progress));
        requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
      }
    };

    requestAnimationFrame(step);
  }

  animateToTwoCards(): void {
    this.isAnimatingToTwoCards = true;
    setTimeout(
      () => {
        this.isAnimatingToTwoCards = false;
      },
      ExplorationPlayerConstants.TIME_NUM_CARDS_CHANGE_MSEC +
        ExplorationPlayerConstants.TIME_FADEIN_MSEC +
        ExplorationPlayerConstants.TIME_PADDING_MSEC
    );
  }

  animateToOneCard(): void {
    this.isAnimatingToOneCard = true;
    setTimeout(() => {
      this.isAnimatingToOneCard = false;
      let totalNumCards = this.playerTranscriptService.getNumCards();
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
    }, ExplorationPlayerConstants.TIME_NUM_CARDS_CHANGE_MSEC);
  }

  updateCardLayout(callback: Function): void {
    const totalNumCards = this.playerTranscriptService.getNumCards();
    const lastCard = this.playerTranscriptService.getLastCard();
    const secondLastCard = this.playerTranscriptService.getCard(
      totalNumCards - 2
    );
    const isSupplementalCardNonempty = callback;
    const prevNonempty =
      totalNumCards > 1 && isSupplementalCardNonempty(secondLastCard);
    const nextNonempty = isSupplementalCardNonempty(lastCard);

    if (totalNumCards > 1 && this.canWindowShowTwoCards()) {
      if (!prevNonempty && nextNonempty) {
        this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
        this.animateToTwoCards();
        return;
      } else if (prevNonempty && !nextNonempty) {
        this.animateToOneCard();
        return;
      }
    }
    this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
  }

  getIsAnimatingToTwoCards(): boolean {
    return this.isAnimatingToTwoCards;
  }

  getIsAnimatingToOneCard(): boolean {
    return this.isAnimatingToOneCard;
  }

  adjustPageHeight(scroll: boolean, callback: () => void): void {
    setTimeout(() => {
      let newHeight = document.body.scrollHeight;
      if (
        Math.abs(this.lastRequestedHeight - newHeight) > 50.5 ||
        (scroll && !this.lastRequestedScroll)
      ) {
        // Sometimes setting iframe height to the exact content height
        // still produces scrollbar, so adding 50 extra px.
        newHeight += 50;
        this.messengerService.sendMessage(
          ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE,
          {
            height: newHeight,
            scroll: scroll,
          }
        );
        this.lastRequestedHeight = newHeight;
        this.lastRequestedScroll = scroll;
      }

      if (callback) {
        callback();
      }
    }, 100);
  }

  adjustPageHeightOnresize(): void {
    this.windowRef.nativeWindow.onresize = () => {
      this.adjustPageHeight(false, null);
    };
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX
    );
  }
}
