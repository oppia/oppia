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
 * @fileoverview Component for navigation in the conversation skin.
 */
import {Component, Input} from '@angular/core';
import {Subscription} from 'rxjs';
import {StateCard} from 'domain/state_card/state-card.model';
import {UrlService} from 'services/contextual/url.service';
import {PlayerPositionService} from '../../services/player-position.service';
import {PlayerTranscriptService} from '../../services/player-transcript.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {PageContextService} from 'services/page-context.service';

import './card-navigation-control.component.css';

@Component({
  selector: 'oppia-card-navigation-control',
  templateUrl: './card-navigation-control.component.html',
  styleUrls: ['./card-navigation-control.component.css'],
})
export class CardNavigationControlComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() displayedCard!: StateCard;
  @Input() userIsLoggedIn: boolean = false;
  navigationThroughCardHistoryIsEnabled: boolean = true;
  hasPrevious!: boolean;
  hasNext!: boolean;
  helpCardHasContinueButton!: boolean;
  isIframed!: boolean;
  lastDisplayedCard!: StateCard;
  progressTrackerIsVisible: boolean = false;
  directiveSubscriptions = new Subscription();

  constructor(
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private urlService: UrlService,
    private pageContextService: PageContextService,
    private conversationFlowService: ConversationFlowService
  ) {}

  ngOnChanges(): void {
    if (this.lastDisplayedCard !== this.displayedCard) {
      this.lastDisplayedCard = this.displayedCard;
      this.updateDisplayedCardInfo();
    }
  }

  ngOnInit(): void {
    this.isIframed = this.urlService.isIframed();
    this.navigationThroughCardHistoryIsEnabled =
      !this.pageContextService.isInDiagnosticTestPlayerPage();
    let pathnameArray = this.urlService.getPathname().split('/');

    if (pathnameArray.includes('lesson') && !pathnameArray.includes('embed')) {
      this.progressTrackerIsVisible = true;
    }

    this.directiveSubscriptions.add(
      this.playerPositionService.onHelpCardAvailable.subscribe(helpCard => {
        this.helpCardHasContinueButton = helpCard.hasContinueButton;
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  updateDisplayedCardInfo(): void {
    let displayedCardIndex = this.playerPositionService.getDisplayedCardIndex();
    this.hasPrevious = displayedCardIndex > 0;
    this.hasNext = !this.playerTranscriptService.isLastCard(displayedCardIndex);
  }

  moveForwardByOneCard(): void {
    this.conversationFlowService.moveForwardByOneCard();
  }

  moveBackByOneCard(): void {
    this.conversationFlowService.moveBackByOneCard();
  }
}
