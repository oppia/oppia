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
 * @fileoverview Component for a collection summary tile.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import constants from 'assets/constants';
import { CollectionSummaryTileConstants } from 'components/summary-tile/collection-summary-tile.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { UserService } from 'services/user.service';

@Component({
  selector: 'oppia-collection-summary-tile',
  templateUrl: './collection-summary-tile.component.html',
})
export class CollectionSummaryTileComponent implements OnInit {
  @Input() getCollectionId: string;
  @Input() getCollectionTitle: string;
  @Input() getLastUpdatedMsec: number;
  @Input() getObjective: string;
  @Input() getNodeCount: string;
  @Input() getCategory: string;
  @Input() getThumbnailIconUrl: string;
  @Input() getThumbnailBgColor: string;
  @Input() isPlaylistTile: boolean;
  @Input() isLinkedToEditorPage: boolean;
  @Input() showLearnerDashboardIconsIfPossible: string;
  @Input() isContainerNarrow: boolean;
  @Input() isOwnedByCurrentUser: boolean;

  userIsLoggedIn: boolean;
  collectionIsCurrentlyHoveredOver: boolean;
  defaultEmptyTitle: string;
  activityTypeCollection: string;

  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private userService: UserService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
    this.defaultEmptyTitle = CollectionSummaryTileConstants.DEFAULT_EMPTY_TITLE;
    this.activityTypeCollection = constants.ACTIVITY_TYPE_COLLECTION;
  }

  getLastUpdatedDatetime(): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      this.getLastUpdatedMsec);
  }

  getCollectionLink(): string {
    let targetUrl = (
      this.isLinkedToEditorPage ?
        CollectionSummaryTileConstants.COLLECTION_EDITOR_URL :
        CollectionSummaryTileConstants.COLLECTION_VIEWER_URL
    );
    return this.urlInterpolationService.interpolateUrl(
      targetUrl, {
        collection_id: this.getCollectionId
      }
    );
  }

  getCompleteThumbnailIconUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      this.getThumbnailIconUrl);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setHoverState(hoverState: boolean): void {
    this.collectionIsCurrentlyHoveredOver = hoverState;
  }
}

angular.module('oppia').directive(
  'oppiaCollectionSummaryTile', downgradeComponent(
    {component: CollectionSummaryTileComponent}));
