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
 * @fileoverview Component for information card modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DateTimeFormatService } from 'services/date-time-format.service';

import './information-card-modal.component.css';


interface ExplorationTagSummary {
  tagsToShow: string[];
  tagsInTooltip: string[];
}

@Component({
  selector: 'oppia-information-card-modal',
  templateUrl: './information-card-modal.component.html'
})
export class InformationCardModalComponent extends ConfirmOrCancelModal {
  DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER: string = (
    AppConstants.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1

  // Average rating will be 'null' if the ratings are less than the
  // minimum acceptable number of ratings. The average will
  // not be computed in this case.
  averageRating!: number | null;
  contributorsSummary: {[keys: string]: {num_commits: number}} = {};
  contributorNames!: string[];
  expInfo!: LearnerExplorationSummaryBackendDict;
  explorationId!: string;
  explorationTags!: ExplorationTagSummary;
  explorationTitle!: string;
  infoCardBackgroundCss!: { 'background-color': string };
  infoCardBackgroundImageUrl!: string;
  lastUpdatedString!: string;
  numViews!: number;
  objective!: string;
  explorationIsPrivate!: boolean;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private dateTimeFormatService: DateTimeFormatService,
    private ratingComputationService: RatingComputationService,
    private urlInterpolationService: UrlInterpolationService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.averageRating = this.ratingComputationService
      .computeAverageRating(this.expInfo.ratings);
    this.contributorsSummary = this.expInfo
      .human_readable_contributors_summary || {};
    this.contributorNames = Object.keys(
      this.contributorsSummary).sort(
      (contributorUsername1: string, contributorUsername2: string) => {
        let commitsOfContributor1 = this.contributorsSummary[
          contributorUsername1].num_commits;
        let commitsOfContributor2 = this.contributorsSummary[
          contributorUsername2].num_commits;
        return commitsOfContributor2 - commitsOfContributor1;
      }
    );

    this.explorationId = this.expInfo.id;
    this.explorationTags = this.getExplorationTagsSummary(this.expInfo.tags);
    this.explorationTitle = this.expInfo.title;
    this.infoCardBackgroundCss = {
      'background-color': this.expInfo.thumbnail_bg_color
    };
    this.infoCardBackgroundImageUrl = this.expInfo.thumbnail_icon_url;
    this.lastUpdatedString = this.getLastUpdatedString(
      this.expInfo.last_updated_msec);
    this.numViews = this.expInfo.num_views;
    this.objective = this.expInfo.objective;
    this.explorationIsPrivate = (this.expInfo.status === 'private');
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

  titleWrapper(): object {
    let titleHeight = document.querySelectorAll(
      '.oppia-info-card-logo-thumbnail')[0].clientWidth - 20;
    let titleCss = {
      'word-wrap': 'break-word',
      width: titleHeight.toString()
    };
    return titleCss;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}
