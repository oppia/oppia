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
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateCard } from 'domain/state_card/state-card.model';
import { LearnerExplorationSummaryBackendDict } from
  'domain/summary/learner-exploration-summary.model';
import { I18nLanguageCodeService, TranslationKeyType } from
  'services/i18n-language-code.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { DateTimeFormatService } from 'services/date-time-format.service';

interface ExplorationTagSummary {
  tagsToShow: string[];
  tagsInTooltip: string[];
}

 @Component({
   selector: 'oppia-lesson-information-card-modal',
   templateUrl: './lesson-information-card-modal.component.html'
 })
export class LessonInformationCardModalComponent extends ConfirmOrCancelModal {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  expTitleTranslationKey!: string;
  expDescTranslationKey!: string;
  displayedCard!: StateCard;
  explorationId!: string;
  expTitle!: string;
  expDesc!: string;
  contributorNames!: string[];
  checkpointCount!: number;
  expInfo: LearnerExplorationSummaryBackendDict;
  completedWidth!: number;
  separatorArray: number[] = [];
  userIsLoggedIn: boolean = false;
  infoCardBackgroundCss!: {'background-color': string};
  infoCardBackgroundImageUrl!: string;
  averageRating: number | null;
  numViews!: number;
  lastUpdatedString: string;
  explorationIsPrivate!: boolean;
  explorationTags!: ExplorationTagSummary;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlInterpolationService: UrlInterpolationService,
    private ratingComputationService: RatingComputationService,
    private dateTimeFormatService: DateTimeFormatService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.averageRating = this.ratingComputationService.computeAverageRating(
      this.expInfo.ratings);
    this.numViews = this.expInfo.num_views;
    this.lastUpdatedString = this.getLastUpdatedString(
      this.expInfo.last_updated_msec);
    this.explorationIsPrivate = (this.expInfo.status === 'private');
    this.explorationTags = this.getExplorationTagsSummary(this.expInfo.tags);
    this.explorationId = this.expInfo.id;
    this.expTitle = this.expInfo.title;
    this.expDesc = this.expInfo.objective;
    this.infoCardBackgroundCss = {
      'background-color': this.expInfo.thumbnail_bg_color
    };
    this.infoCardBackgroundImageUrl = this.expInfo.thumbnail_icon_url;

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

    // Rendering the separators in the progress bar requires
    // the number of separators.The purpose of separatorArray
    // is to provide the number of checkpoints in the template file.
    this.separatorArray = new Array(this.checkpointCount);
  }

  getExplorationTagsSummary(arrayOfTags: string[]): ExplorationTagSummary {
    let tagsToShow = [];
    let tagsInTooltip = [];
    let MAX_CHARS_TO_SHOW = 45;

    for (let i = 0; i < arrayOfTags.length; i++) {
      let newLength = (tagsToShow.toString() + arrayOfTags[i]).length;

      if (newLength < MAX_CHARS_TO_SHOW) {
        tagsToShow.push(arrayOfTags[i]);
      } else {
        tagsInTooltip.push(arrayOfTags[i]);
      }
    }

    return {
      tagsToShow: tagsToShow,
      tagsInTooltip: tagsInTooltip
    };
  }

  getLastUpdatedString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService
      .getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
  }

  getStaticImageUrl(imageUrl: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imageUrl);
  }

  titleWrapper(): object {
    let titleHeight = document.querySelectorAll(
      '.oppia-info-card-logo-thumbnail')[0].clientWidth - 20;
    let titleCss = {
      'word-wrap': 'break-word',
      width: titleHeight.toString()
    };
    return titleCss;
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

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
