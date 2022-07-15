// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for navigation in the conversation skin.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StateCard } from 'domain/state_card/state-card.model';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { Subscription } from 'rxjs';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { ContentTranslationManagerService } from '../services/content-translation-manager.service';

import './progress-nav.component.css';


@Component({
  selector: 'oppia-progress-nav',
  templateUrl: './progress-nav.component.html',
  animations: [
    trigger('fadeInOut', [
      transition('void => *', []),
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('1s ease', keyframes([
          style({ opacity: 0 }),
          style({ opacity: 1 })
        ]))
      ])
    ])
  ]
})
export class ProgressNavComponent {
  @Input() isLearnAgainButton: boolean;
  @Input() displayedCard: StateCard;
  @Input() submitButtonIsShown: boolean;
  @Output() submit: EventEmitter<void> = (
    new EventEmitter());

  @Output() clickContinueButton: EventEmitter<void> = (
    new EventEmitter());

  @Output() changeCard: EventEmitter<number> = new EventEmitter();

  directiveSubscriptions = new Subscription();
  transcriptLength = 0;
  interactionIsInline = true;
  CONTINUE_BUTTON_FOCUS_LABEL = (
    ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL);

  SHOW_SUBMIT_INTERACTIONS_ONLY_FOR_MOBILE = [
    'ItemSelectionInput', 'MultipleChoiceInput'];

  displayedCardIndex: number;
  hasPrevious: boolean;
  hasNext: boolean;
  conceptCardIsBeingShown: boolean;
  interactionCustomizationArgs;
  interactionId: string;
  helpCardHasContinueButton: boolean;
  isIframed: boolean;
  lastDisplayedCard: StateCard;
  explorationId: string;
  newCardStateName: string;
  currentCardIndex: number;

  constructor(
    private browserCheckerService: BrowserCheckerService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private focusManagerService: FocusManagerService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private urlService: UrlService,
    private schemaFormSubmittedService: SchemaFormSubmittedService,
    private windowDimensionsService: WindowDimensionsService,
    private contentTranslationManagerService: ContentTranslationManagerService
  ) {}

  ngOnChanges(): void {
    if (this.lastDisplayedCard !== this.displayedCard) {
      this.lastDisplayedCard = this.displayedCard;
      this.updateDisplayedCardInfo();
    }
  }

  ngOnInit(): void {
    this.isIframed = this.urlService.isIframed();

    this.directiveSubscriptions.add(
      this.playerPositionService.onHelpCardAvailable.subscribe(
        (helpCard) => {
          this.helpCardHasContinueButton = helpCard.hasContinueButton;
        }
      )
    );
    this.directiveSubscriptions.add(
      this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.subscribe(
        () => {
          this.submit.emit();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.contentTranslationManagerService.onStateCardContentUpdate.subscribe(
        () => {
          this.updateDisplayedCardInfo();
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  updateDisplayedCardInfo(): void {
    this.transcriptLength = this.playerTranscriptService.getNumCards();
    this.displayedCardIndex = (
      this.playerPositionService.getDisplayedCardIndex());
    this.hasPrevious = this.displayedCardIndex > 0;
    this.hasNext = !this.playerTranscriptService.isLastCard(
      this.displayedCardIndex);
    this.explorationPlayerStateService.isInQuestionMode();
    this.conceptCardIsBeingShown = (
      this.displayedCard.getStateName() === null &&
      !this.explorationPlayerStateService.isInQuestionMode());
    if (!this.conceptCardIsBeingShown) {
      this.interactionIsInline = this.displayedCard.isInteractionInline();
      this.interactionCustomizationArgs = this.displayedCard
        .getInteractionCustomizationArgs();
      this.interactionId = this.displayedCard.getInteractionId();

      if (this.interactionId === 'Continue') {
        // To ensure that focus is added after all functions
        // in main thread are completely executed.
        setTimeout(() => {
          this.focusManagerService.setFocusWithoutScroll('continue-btn');
        }, 0);
      }
    }
    this.helpCardHasContinueButton = false;
    this.newCardStateName = this.displayedCard.getStateName();
  }

  doesInteractionHaveNavSubmitButton(): boolean {
    try {
      return (
        Boolean(this.interactionId) &&
        InteractionSpecsConstants.INTERACTION_SPECS[this.interactionId].
          show_generic_submit_button);
    } catch (e) {
      let additionalInfo = (
        '\nSubmit button debug logs:\ninterationId: ' +
        this.interactionId);
      e.message += additionalInfo;
      throw e;
    }
  }

  doesInteractionHaveSpecialCaseForMobile(): boolean {
    // The submit button should be shown:
    // 1. In mobile mode, if the current interaction is either
    //    ItemSelectionInput or MultipleChoiceInput.
    // 2. In desktop mode, if the current interaction is
    //    ItemSelectionInput with maximum selectable choices > 1.
    if (this.browserCheckerService.isMobileDevice()) {
      return (this.SHOW_SUBMIT_INTERACTIONS_ONLY_FOR_MOBILE.indexOf(
        this.interactionId) >= 0);
    } else {
      return (
        this.interactionId === 'ItemSelectionInput' &&
              this.interactionCustomizationArgs
                .maxAllowableSelectionCount.value > 1);
    }
  }

  validateIndexAndChangeCard(index: number): void {
    if (index >= 0 && index < this.transcriptLength) {
      this.changeCard.emit(index);
    } else {
      throw new Error('Target card index out of bounds.');
    }
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX;
  }

  shouldGenericSubmitButtonBeShown(): boolean {
    if (this.doesInteractionHaveSpecialCaseForMobile()) {
      return true;
    }

    return (this.doesInteractionHaveNavSubmitButton() && (
      this.interactionIsInline ||
      !this.canWindowShowTwoCards()
    ));
  }

  shouldContinueButtonBeShown(): boolean {
    if (this.conceptCardIsBeingShown) {
      return true;
    }

    return Boolean(
      this.interactionIsInline &&
      this.displayedCard.isCompleted() &&
      this.displayedCard.getLastOppiaResponse());
  }
}

angular.module('oppia').directive('oppiaProgressNav',
  downgradeComponent({
    component: ProgressNavComponent
  }) as angular.IDirectiveFactory);
