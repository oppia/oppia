// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for lesson information card modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from
// eslint-disable-next-line max-len
  'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateCard } from 'domain/state_card/state-card.model';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { LearnerExplorationSummaryBackendDict } from
// eslint-disable-next-line max-len
  'domain/summary/learner-exploration-summary.model';
import { ContextService } from
// eslint-disable-next-line max-len
  'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService, TranslationKeyType } from
// eslint-disable-next-line max-len
  'services/i18n-language-code.service';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';

 @Component({
   selector: 'oppia-lesson-information-card-modal',
   templateUrl: './lesson-information-card-modal.component.html'
 })
export class LessonInformationCardModalComponent extends ConfirmOrCancelModal {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  storyTitleTranslationKey!: string;
  storyPlaythroughObject!: StoryPlaythrough;
  storyId!: string;
  expTitleTranslationKey!: string;
  expDescTranslationKey!: string;
  displayedCard!: StateCard;
  explorationId!: string;
  expTitle!: string;
  expDesc!: string;
  contributorNames!: string[];
  hasStoryTitle!: boolean;
  chapterTitle!: string;
  chapterDesc!: string;
  chapterNumber!: string;
  numberofCheckpoints!: number;
  expInfo: LearnerExplorationSummaryBackendDict;
  startedWidth: number = 0;
  completedWidth!: number;
  separatorWidth: number = 0;
  separatorArray: number[] = [];


  constructor(
    private ngbModal: NgbModal,
    private ngbActiveModal: NgbActiveModal,
    private contextService: ContextService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.expTitle = this.expInfo.title;
    this.expDesc = this.expInfo.objective;
    this.storyId = this.urlService.getUrlParams().story_id;
    this.hasStoryTitle = (this.storyId !== undefined) ? true : false;

    this.storyTitleTranslationKey = (
      this.i18nLanguageCodeService
        .getStoryTranslationKey(
          this.storyId, TranslationKeyType.TITLE));

    this.expTitleTranslationKey = (
      this.i18nLanguageCodeService.
        getExplorationTranslationKey(
          this.explorationId, TranslationKeyType.TITLE)
    );
    this.expDescTranslationKey = (
      this.i18nLanguageCodeService.
        getExplorationTranslationKey(
          this.explorationId, TranslationKeyType.DESCRIPTION)
    );


    // The purpose of separatorArray is for the working of
    // for loop in lesson-information-card-modal.component.html.
    this.separatorArray = new Array(this.numberofCheckpoints);
    this.separatorWidth = 100 / (this.numberofCheckpoints);

    this.startedWidth = 100 / (this.numberofCheckpoints);

    if (this.completedWidth >= 99) {
      this.startedWidth = 0;
    }

    let index = this.playerPositionService.getDisplayedCardIndex();
    this.displayedCard = this.playerTranscriptService.getCard(index);
    if (this.displayedCard.isTerminal()) {
      this.completedWidth = 100;
      this.startedWidth = 0;
    }
  }

  isHackyExpTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isHackyExpDescTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expDescTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }
}
