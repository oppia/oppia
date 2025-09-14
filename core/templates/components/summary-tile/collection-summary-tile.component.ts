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

import {Component, Input, OnInit, OnDestroy} from '@angular/core';

import {AppConstants} from 'app.constants';
import {CollectionSummaryTileConstants} from 'components/summary-tile/collection-summary-tile.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UserService} from 'services/user.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {UrlService} from 'services/contextual/url.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'oppia-collection-summary-tile',
  templateUrl: './collection-summary-tile.component.html',
})
export class CollectionSummaryTileComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() getCollectionId!: string;
  @Input() getCollectionTitle!: string;
  @Input() getLastUpdatedMsec!: number;
  @Input() getObjective!: string;
  @Input() getNodeCount!: string;
  @Input() getCategory!: string;
  @Input() getThumbnailIconUrl!: string;
  @Input() getThumbnailBgColor!: string;
  @Input() isPlaylistTile: boolean = false;
  @Input() isLinkedToEditorPage: boolean = false;
  @Input() showLearnerDashboardIconsIfPossible!: string;
  @Input() isContainerNarrow: boolean = false;
  @Input() isOwnedByCurrentUser: boolean = false;
  @Input() mobileCutoffPx!: number;

  userIsLoggedIn: boolean = false;
  collectionIsCurrentlyHoveredOver: boolean = false;
  defaultEmptyTitle!: string;
  activityTypeCollection!: string;
  mobileCardToBeShown: boolean = false;
  resizeSubscription!: Subscription;
  // A null value for 'relativeLastUpdatedDateTime' indicates that
  // getLastUpdatedMsecs received after component interactions
  // is empty or does not exist.
  relativeLastUpdatedDateTime: string | null = null;

  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private userService: UserService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
    if (!this.mobileCutoffPx) {
      this.mobileCutoffPx = 0;
    }
    this.checkIfMobileCardToBeShown();
    this.defaultEmptyTitle = CollectionSummaryTileConstants.DEFAULT_EMPTY_TITLE;
    this.activityTypeCollection = AppConstants.ACTIVITY_TYPE_COLLECTION;
    this.resizeSubscription = this.windowDimensionsService
      .getResizeEvent()
      .subscribe(event => {
        this.checkIfMobileCardToBeShown();
      });
    this.relativeLastUpdatedDateTime = this.getRelativeLastUpdatedDateTime();
  }

  ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  checkIfMobileCardToBeShown(): void {
    let mobileViewActive =
      this.windowDimensionsService.getWidth() < this.mobileCutoffPx;
    let currentPageUrl = this.urlService.getPathname();
    this.mobileCardToBeShown =
      mobileViewActive && currentPageUrl === '/community-library';
  }

  getLastUpdatedDatetime(): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      this.getLastUpdatedMsec
    );
  }

  getRelativeLastUpdatedDateTime(): string | null {
    if (this.getLastUpdatedMsec) {
      return this.dateTimeFormatService.getRelativeTimeFromNow(
        this.getLastUpdatedMsec
      );
    }
    return null;
  }

  getCollectionLink(): string | null {
    let targetUrl = this.isLinkedToEditorPage
      ? CollectionSummaryTileConstants.COLLECTION_EDITOR_URL
      : CollectionSummaryTileConstants.COLLECTION_VIEWER_URL;
    return this.urlInterpolationService.interpolateUrl(targetUrl, {
      collection_id: this.getCollectionId,
    });
  }

  getCompleteThumbnailIconUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      this.getThumbnailIconUrl
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setHoverState(hoverState: boolean): void {
    this.collectionIsCurrentlyHoveredOver = hoverState;
  }
}
