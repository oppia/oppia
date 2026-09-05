// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the interaction controls (skip, continue,
 * submit buttons) in the new conversation skin. This was split out of
 * CardNavigationControlComponent so that the interaction buttons can be
 * rendered inside the tutor card, while card-to-card navigation and the
 * progress tracker remain in the fixed footer bar.
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ContinueCustomizationArgs} from 'interactions/customization-args-defs';
import {StateCard} from 'domain/state_card/state-card.model';
import {
  InteractionSpecsConstants,
  InteractionSpecsKey,
} from 'pages/interaction-specs.constants';
import {Subscription} from 'rxjs';
import {UrlService} from 'services/contextual/url.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {NewLessonPlayerConstants} from '../lesson-player-page.constants';
import {ExplorationModeService} from '../../services/exploration-mode.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {ContentTranslationManagerService} from '../../services/content-translation-manager.service';

import './card-interaction-controls.component.css';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {PageContextService} from 'services/page-context.service';
import {PlayerPositionService} from '../../services/player-position.service';

@Component({
  selector: 'oppia-card-interaction-controls',
  templateUrl: './card-interaction-controls.component.html',
  styleUrls: ['./card-interaction-controls.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition('void => *', []),
      transition('* <=> *', [
        style({opacity: 0}),
        animate(
          '1s ease',
          keyframes([style({opacity: 0}), style({opacity: 1})])
        ),
      ]),
    ]),
  ],
})
export class CardInteractionControlsComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isLearnAgainButton!: boolean;
  @Input() displayedCard!: StateCard;
  @Input() submitButtonIsShown!: boolean;
  @Input() showContinueToReviseButton!: boolean;
  skipButtonIsShown: boolean = false;
  conceptCardIsBeingShown!: boolean;
  interactionCustomizationArgs!: InteractionCustomizationArgs | null;
  interactionId!: string | null;
  helpCardHasContinueButton!: boolean;
  lastDisplayedCard!: StateCard;

  @Output() submit: EventEmitter<void> = new EventEmitter();

  @Output() clickContinueToReviseButton: EventEmitter<void> =
    new EventEmitter();

  @Output() skipQuestion: EventEmitter<void> = new EventEmitter();

  directiveSubscriptions = new Subscription();
  interactionIsInline: boolean = true;
  CONTINUE_BUTTON_FOCUS_LABEL: string =
    NewLessonPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL;

  SHOW_SUBMIT_INTERACTIONS_ONLY_FOR_MOBILE: string[] = [
    'ItemSelectionInput',
    'MultipleChoiceInput',
  ];

  constructor(
    private explorationModeService: ExplorationModeService,
    private focusManagerService: FocusManagerService,
    private playerPositionService: PlayerPositionService,
    private urlService: UrlService,
    private pageContextService: PageContextService,
    private conversationFlowService: ConversationFlowService,
    private schemaFormSubmittedService: SchemaFormSubmittedService,
    private contentTranslationManagerService: ContentTranslationManagerService
  ) {}

  ngOnChanges(): void {
    if (this.lastDisplayedCard !== this.displayedCard) {
      this.lastDisplayedCard = this.displayedCard;
      this.updateDisplayedCardInfo();
    }
  }

  ngOnInit(): void {
    this.skipButtonIsShown =
      this.pageContextService.isInDiagnosticTestPlayerPage();

    this.directiveSubscriptions.add(
      this.playerPositionService.onHelpCardAvailable.subscribe(helpCard => {
        this.helpCardHasContinueButton = helpCard.hasContinueButton;
      })
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

  skipCurrentQuestion(): void {
    this.skipQuestion.emit();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  updateDisplayedCardInfo(): void {
    this.conceptCardIsBeingShown =
      this.displayedCard.getStateName() === null &&
      !this.explorationModeService.isPresentingIsolatedQuestions();

    if (!this.conceptCardIsBeingShown) {
      this.interactionIsInline = this.displayedCard.isInteractionInline();
      this.interactionCustomizationArgs =
        this.displayedCard.getInteractionCustomizationArgs();
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
  }

  doesInteractionHaveNavSubmitButton(): boolean {
    try {
      return (
        Boolean(this.interactionId) &&
        InteractionSpecsConstants.INTERACTION_SPECS[
          this.interactionId as InteractionSpecsKey
        ].show_generic_submit_button
      );
      // We use unknown type because we are unsure of the type of error
      // that was thrown. Since the catch block cannot identify the
      // specific type of error, we are unable to further optimise the
      // code by introducing more types of errors.
    } catch (e: unknown) {
      let additionalInfo =
        '\nSubmit button debug logs:\ninterationId: ' + this.interactionId;
      if (e instanceof Error) {
        e.message += additionalInfo;
      }
      throw e;
    }
  }

  shouldContinueButtonBeShown(): boolean {
    if (this.conceptCardIsBeingShown) {
      return true;
    }

    return Boolean(
      this.interactionIsInline &&
        this.displayedCard.isCompleted() &&
        this.displayedCard.getLastOppiaResponse()
    );
  }

  onClickContinueButton(): void {
    this.conversationFlowService.showUpcomingCard();
  }

  get continueButtonCustomizationArgs(): ContinueCustomizationArgs {
    return this.interactionCustomizationArgs as ContinueCustomizationArgs;
  }
}
