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
import constants from 'assets/constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DateTimeFormatService } from 'services/date-time-format.service';

@Component({
  selector: 'oppia-information-card-modal',
  templateUrl: './information-card-modal.component.html'
})
export class InformationCardModalComponent extends ConfirmOrCancelModal {
  DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER = constants
    .DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR;
  averageRating: number;
  contributorsSummary = {};
  contributorNames;
  expInfo;
  explorationId: string;
  explorationTags;
  explorationTitle;
  infoCardBackgroundCss;
  infoCardBackgroundImageUrl;
  lastUpdatedString;
  numViews: number;
  objective;
  explorationIsPrivate: boolean;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private dateTimeFormatService: DateTimeFormatService,
    private ratingComputationService: RatingComputationService,
    private urlInterpolationService: UrlInterpolationService,
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
      (contributorUsername1, contributorUsername2) => {
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

  getExplorationTagsSummary(arrayOfTags: []): object {
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

// angular.module('oppia').controller('InformationCardModalController', [
//   '$controller', '$scope', '$uibModalInstance',
//   'DateTimeFormatService', 'RatingComputationService',
//   'UrlInterpolationService', 'expInfo',
//   'DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR',
//   function(
//       $controller, $scope, $uibModalInstance,
//       DateTimeFormatService, RatingComputationService,
//       UrlInterpolationService, expInfo,
//       DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR) {
//     $controller('ConfirmOrCancelModalController', {
//       $scope: $scope,
//       $uibModalInstance: $uibModalInstance
//     });
//     var getExplorationTagsSummary = function(arrayOfTags) {
//       var tagsToShow = [];
//       var tagsInTooltip = [];
//       var MAX_CHARS_TO_SHOW = 45;

//       for (var i = 0; i < arrayOfTags.length; i++) {
//         var newLength = (
//           tagsToShow.toString() + arrayOfTags[i]).length;

//         if (newLength < MAX_CHARS_TO_SHOW) {
//           tagsToShow.push(arrayOfTags[i]);
//         } else {
//           tagsInTooltip.push(arrayOfTags[i]);
//         }
//       }

//       return {
//         tagsToShow: tagsToShow,
//         tagsInTooltip: tagsInTooltip
//       };
//     };

//     var getLastUpdatedString = function(millisSinceEpoch) {
//       return DateTimeFormatService
//         .getLocaleAbbreviatedDatetimeString(
//           millisSinceEpoch);
//     };

//     $scope.DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER = (
//       DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);
//     $scope.averageRating = (
//       RatingComputationService.computeAverageRating(
//         expInfo.ratings));
//     var contributorsSummary = (
//       expInfo.human_readable_contributors_summary || {});
//     $scope.contributorNames = Object.keys(
//       contributorsSummary).sort(
//       function(contributorUsername1, contributorUsername2) {
//         var commitsOfContributor1 = contributorsSummary[
//           contributorUsername1].num_commits;
//         var commitsOfContributor2 = contributorsSummary[
//           contributorUsername2].num_commits;
//         return commitsOfContributor2 - commitsOfContributor1;
//       }
//     );
//     $scope.explorationId = expInfo.id;
//     $scope.explorationTags = getExplorationTagsSummary(
//       expInfo.tags);
//     $scope.explorationTitle = expInfo.title;
//     $scope.infoCardBackgroundCss = {
//       'background-color': expInfo.thumbnail_bg_color
//     };
//     $scope.titleWrapper = function() {
//       var titleHeight = (
//         document.querySelectorAll(
//           '.oppia-info-card-logo-thumbnail')[0].clientWidth - 20);
//       var titleCss = {
//         'word-wrap': 'break-word',
//         width: titleHeight.toString()
//       };
//       return titleCss;
//     };
//     $scope.infoCardBackgroundImageUrl = expInfo
//       .thumbnail_icon_url;
//     $scope.getStaticImageUrl = function(imagePath) {
//       return UrlInterpolationService.getStaticImageUrl(imagePath);
//     };
//     $scope.lastUpdatedString = getLastUpdatedString(
//       expInfo.last_updated_msec);
//     $scope.numViews = expInfo.num_views;
//     $scope.objective = expInfo.objective;
//     $scope.explorationIsPrivate = (expInfo.status === 'private');
//   }
// ]);
