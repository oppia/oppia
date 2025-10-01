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
 * @fileoverview Service for managing animations and layout transitions
 * between cards in the exploration player. This includes handling smooth
 * scrolling, card focus transitions, two-card layout animations, and
 * responsive iframe height adjustments for embedded explorations.
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
  isAnimatingToTwoCards!: boolean;
  isAnimatingToOneCard!: boolean;

  // If the exploration is iframed, send data to its parent about
  // its height so that the parent can be resized as necessary.
  lastRequestedHeight: number = 0;

  constructor(
    private focusManagerService: FocusManagerService,
    private playerTranscriptService: PlayerTranscriptService,
    private playerPositionService: PlayerPositionService,
    private windowRef: WindowRef,
    private messengerService: MessengerService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  /**
   * Schedules the transition to the next card with animation timing.
   * Scrolls to top and sets focus after the transition.
   *
   * @param {string} focusLabel - The label for the element to focus on after transition.
   * @param {Function} callback - The function to execute to trigger the transition.
   */
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
        this._scrollToTop();
      },
      0.1 * ExplorationPlayerConstants.TIME_FADEOUT_MSEC +
        ExplorationPlayerConstants.TIME_HEIGHT_CHANGE_MSEC +
        0.5 * ExplorationPlayerConstants.TIME_FADEIN_MSEC
    );
  }

  /**
   * Smoothly scrolls to the bottom of the tutor card if it is not fully visible.
   */
  scrollToBottom(): void {
    setTimeout(() => {
      const cardNavigationControl = document.querySelector(
        '.card-navigation-control'
      );

      if (!cardNavigationControl) {
        return;
      }

      const cardNavigationControlRect =
        cardNavigationControl.getBoundingClientRect();
      const cardNavigationControlBottom =
        cardNavigationControlRect.top +
        window.scrollY +
        cardNavigationControlRect.height;
      const windowBottom = window.scrollY + window.innerHeight;

      if (windowBottom < cardNavigationControlBottom) {
        const targetScrollY =
          cardNavigationControlBottom - window.innerHeight + 12;
        this.smoothScrollTo(
          targetScrollY,
          ExplorationPlayerConstants.TIME_SCROLL_MSEC,
          'easeOutQuad'
        );
      }
    }, 100);
  }

  /**
   * Triggers animation for transitioning to a two-card layout
   * (tutor + supplemental card).
   */
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

  /**
   * Triggers animation for transitioning back to a single-card layout
   * and updates the displayed card index to the latest.
   */
  animateToOneCard(): void {
    this.isAnimatingToOneCard = true;
    setTimeout(() => {
      this.isAnimatingToOneCard = false;
      let totalNumCards = this.playerTranscriptService.getNumCards();
      this.playerPositionService.setDisplayedCardIndex(totalNumCards - 1);
    }, ExplorationPlayerConstants.TIME_NUM_CARDS_CHANGE_MSEC);
  }

  /**
   * Adjusts the iframe height to fit the content and optionally scrolls.
   * Sends height change message to the parent window.
   *
   */
  adjustPageHeight(): void {
    setTimeout(() => {
      let newHeight = document.body.scrollHeight;
      if (Math.abs(this.lastRequestedHeight - newHeight) > 50.5) {
        // Sometimes setting iframe height to the exact content height
        // still produces scrollbar, so adding 50 extra px.
        newHeight += 50;
        this.messengerService.sendMessage(
          ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE,
          {
            height: newHeight,
            scroll: false,
          }
        );
        this.lastRequestedHeight = newHeight;
      }
    }, 100);
  }

  /**
   * Sets up the window resize listener to adjust iframe height dynamically
   * when the window size changes.
   */
  adjustPageHeightOnresize(): void {
    this.windowRef.nativeWindow.onresize = () => {
      this.adjustPageHeight();
    };
  }

  /**
   * Smoothly scrolls the page to the top using an easing animation.
   * @private
   */
  private _scrollToTop(): void {
    setTimeout(() => {
      this.smoothScrollTo(0, 800, 'easeOutQuart');
    });
  }

  /**
   * Smoothly scrolls the page to a specific vertical position using easing.
   *
   * @param {number} targetY - The Y-position to scroll to.
   * @param {number} duration - The duration of the scroll animation in milliseconds.
   * @param {string} [easingName='easeOutQuad'] - The name of the easing function to use.
   * @private
   */
  private smoothScrollTo(
    targetY: number,
    duration: number,
    easingName: string = 'easeOutQuad'
  ): void {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();
    type EasingName = 'easeOutQuad' | 'easeOutQuart';

    const easingFunctions: Record<EasingName, (t: number) => number> = {
      easeOutQuad: (t: number): number => t * (2 - t),
      easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
    };

    const easingFunction =
      easingFunctions[easingName as EasingName] || easingFunctions.easeOutQuad;

    const step = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;

      if (elapsedTime < duration) {
        const progress = elapsedTime / duration;
        window.scrollTo(0, startY + difference * easingFunction(progress));
        requestAnimationFrame(step);
        /* istanbul ignore else */
      } else {
        window.scrollTo(0, targetY);
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Checks whether the current window width can accommodate two cards
   * side-by-side.
   *
   * @returns {boolean} - True if two-card layout is supported; otherwise, false.
   * @private
   */
  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX
    );
  }

  /**
   * Gets whether the animation to two-card layout is in progress.
   *
   * @returns {boolean} - True if animating to two cards.
   */
  getIsAnimatingToTwoCards(): boolean {
    return this.isAnimatingToTwoCards;
  }

  /**
   * Gets whether the animation to one-card layout is in progress.
   *
   * @returns {boolean} - True if animating to one card.
   */
  getIsAnimatingToOneCard(): boolean {
    return this.isAnimatingToOneCard;
  }
}
