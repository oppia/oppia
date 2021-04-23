// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
* @fileoverview Controller for information card modal.
*/

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { DateTimeFormatService } from 'services/date-time-format.service.ts';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service.ts';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service.ts';

@Component({
 selector: 'information-card-modal',
 styleUrls: []
})
export class InformationCardModalComponent {
  averageRating: number;
  contributorNames = {};
  explorationId: string;
  explorationTags = {};
  explorationTitle: string;
  infoCardBackgroundCss = {};
  infoCardBackgroundImageUrl: string;
  lastUpdatedString: string;
  numViews: number;
  objective: string;
  explorationIsPrivate: boolean;
  DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER: string;
  
  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private ratingComputationService: RatingComputationService,
    private urlInterpolationService: UrlInterpolationService,
    private expInfo,
    private DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR 
  ) {}
  
  ngOnInit() {
    console.log("types of expinfo and other var");
    console.log(typeof this.expInfo);
    console.log(typeof this.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);
    
    this.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER = (
      DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);
    this.averageRating = (
      RatingComputationService.computeAverageRating(
        this.expInfo.ratings));
    var contributorsSummary = (
      this.expInfo.human_readable_contributors_summary || {});
    this.contributorNames = Object.keys(
      contributorsSummary).sort(
      function(contributorUsername1, contributorUsername2) {
        var commitsOfContributor1 = contributorsSummary[
          contributorUsername1].num_commits;
        var commitsOfContributor2 = contributorsSummary[
          contributorUsername2].num_commits;
        return commitsOfContributor2 - commitsOfContributor1;
      }
    );
    
    this.explorationId = this.expInfo.id;
    this.explorationTags = this.getExplorationTagsSummary(
      this.expInfo.tags);
    this.explorationTitle = this.expInfo.title;
    this.infoCardBackgroundCss = {
      'background-color': this.expInfo.thumbnail_bg_color
    };
    this.infoCardBackgroundImageUrl = this.expInfo
      .thumbnail_icon_url;
    this.lastUpdatedString = this.getLastUpdatedString(
      this.expInfo.last_updated_msec);
    this.numViews = this.expInfo.num_views;
    this.objective = this.expInfo.objective;
    this.explorationIsPrivate = (this.expInfo.status === 'private');
  }
  
  getExplorationTagsSummary(arrayOfTags) {
    var tagsToShow = [];
    var tagsInTooltip = [];
    var MAX_CHARS_TO_SHOW = 45;

    for (var i = 0; i < arrayOfTags.length; i++) {
      var newLength = (
        tagsToShow.toString() + arrayOfTags[i]).length;

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
  
  getLastUpdatedString(millisSinceEpoch) {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch);
  }
  
  titleWrapper() {
    var titleHeight = (
      document.querySelectorAll(
        '.oppia-info-card-logo-thumbnail')[0].clientWidth - 20);
    var titleCss = {
      'word-wrap': 'break-word',
      width: titleHeight.toString()
    };
    return titleCss;
  }
  
  getStaticImageUrl(imagePath) {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}