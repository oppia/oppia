// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the learner's view of a collection.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { GuestCollectionProgressService } from 'domain/collection/guest-collection-progress.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { UserService } from 'services/user.service';
import { CollectionNode } from 'domain/collection/collection-node.model';
import { AppConstants } from 'app.constants';
import { Collection } from 'domain/collection/collection.model';
import { CollectionPlayerBackendApiService } from './services/collection-player-backend-api.service';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';

import './collection-player-page.component.css';


export interface IconParametersArray {
  thumbnailIconUrl: string;
  left: string;
  top: string;
  thumbnailBgColor: string;
}

export interface CollectionSummary {
  'is_admin': boolean;
  'summaries': string[];
  'user_email': string;
  'is_topic_manager': boolean;
  'username': boolean;
}

export interface CollectionHandler {
  'can_edit': boolean;
  'collection': Collection;
  'is_admin': boolean;
  'is_logged_in': boolean;
  'is_moderator': boolean;
  'is_super_admin': boolean;
  'is_topic_manager': boolean;
  'meta_description': string;
  'meta_name': string;
  'session_id': string;
  'user_email': string;
  'username': string;
}

@Component({
  selector: 'oppia-collection-player-page',
  templateUrl: './collection-player-page.component.html',
  styleUrls: ['./collection-player-page.component.css']
})
export class CollectionPlayerPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  collection!: Collection;
  collectionPlaythrough;
  currentExplorationId!: string;
  summaryToPreview!: LearnerExplorationSummaryBackendDict;
  pathSvgParameters!: string;
  pathIconParameters!: IconParametersArray[];
  svgHeight!: number;
  MIN_HEIGHT_FOR_PATH_SVG_PX!: number;
  EVEN_SVG_HEIGHT_OFFSET_PX!: number;
  ODD_SVG_HEIGHT_OFFSET_PX!: number;
  y!: number;
  ICON_X_MIDDLE_PX!: number;
  ICON_Y_INITIAL_PX!: number;
  ICON_Y_INCREMENT_PX!: number;
  ICON_X_LEFT_PX!: number;
  ICON_X_RIGHT_PX!: number;
  collectionId!: string;
  nextExplorationId!: string;
  allowedCollectionIdsForGuestProgress;
  collectionSummary;
  isLoggedIn: boolean = false;
  explorationCardIsShown: boolean = false;
  elementToScrollTo: string;

  constructor(
    private guestCollectionProgressService: GuestCollectionProgressService,
    private urlInterpolationService: UrlInterpolationService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private urlService: UrlService,
    private readOnlyCollectionBackendApiService:
      ReadOnlyCollectionBackendApiService,
    private pageTitleService: PageTitleService,
    private userService: UserService,
    private collectionPlayerBackendApiService:
      CollectionPlayerBackendApiService,
    private translateService: TranslateService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  togglePreviewCard(): void {
    this.explorationCardIsShown = !this.explorationCardIsShown;
  }

  getCollectionNodeForExplorationId(explorationId: string): CollectionNode {
    let collectionNode = (
      this.collection.getCollectionNodeByExplorationId(explorationId));
    if (!collectionNode) {
      this.alertsService.addWarning(
        'There was an error loading the collection.');
    }
    return collectionNode;
  }

  getNextRecommendedCollectionNodes(): CollectionNode {
    return this.getCollectionNodeForExplorationId(
      this.collectionPlaythrough.getNextExplorationId());
  }

  getCompletedExplorationNodes(): CollectionNode {
    return this.getCollectionNodeForExplorationId(
      this.collectionPlaythrough.getCompletedExplorationIds());
  }

  getNonRecommendedCollectionNodeCount(): number {
    return this.collection.getCollectionNodeCount() - (
      this.collectionPlaythrough.getNextRecommendedCollectionNodeCount() +
      this.collectionPlaythrough.getCompletedExplorationNodeCount()
    );
  }

  updateExplorationPreview(explorationId: string): void {
    this.explorationCardIsShown = true;
    this.currentExplorationId = explorationId;
    this.summaryToPreview = this.getCollectionNodeForExplorationId(
      explorationId).getExplorationSummaryObject();
  }

  // Calculates the SVG parameters required to draw the curved path.
  generatePathParameters(): void {
    // The pathSvgParameters represents the final string of SVG
    // parameters for the bezier curve to be generated. The default
    // parameters represent the first curve ie. lesson 1 to lesson 3.
    this.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
    let collectionNodeCount = this.collection.getCollectionNodeCount();
    // The sParameterExtension represents the co-ordinates following
    // the 'S' (smooth curve to) command in SVG.
    let sParameterExtension = '';
    this.pathIconParameters = this.generatePathIconParameters();
    if (collectionNodeCount === 1) {
      this.pathSvgParameters = '';
    } else if (collectionNodeCount === 2) {
      this.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
    } else {
      // The x and y here represent the co-ordinates of the control
      // points for the bezier curve (path).
      this.y = 500;
      for (let i = 1; i < Math.floor(collectionNodeCount / 2); i++) {
        let x = (i % 2) ? 30 : 470;
        sParameterExtension += x + ' ' + this.y + ', ';
        this.y += 20;
        sParameterExtension += 250 + ' ' + this.y + ', ';
        this.y += 200;
      }
      if (sParameterExtension !== '') {
        this.pathSvgParameters += ' S ' + sParameterExtension;
      }
    }
    if (collectionNodeCount % 2 === 0) {
      if (collectionNodeCount === 2) {
        this.svgHeight = this.MIN_HEIGHT_FOR_PATH_SVG_PX;
      } else {
        this.svgHeight = this.y - this.EVEN_SVG_HEIGHT_OFFSET_PX;
      }
    } else {
      if (collectionNodeCount === 1) {
        this.svgHeight = this.MIN_HEIGHT_FOR_PATH_SVG_PX;
      } else {
        this.svgHeight = this.y - this.ODD_SVG_HEIGHT_OFFSET_PX;
      }
    }
  }

  generatePathIconParameters(): IconParametersArray[] {
    let collectionNodes = this.collection.getCollectionNodes();
    let iconParametersArray = [];
    iconParametersArray.push({
      thumbnailIconUrl:
        collectionNodes[0].getExplorationSummaryObject(
        ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
      left: '225px',
      top: '35px',
      thumbnailBgColor:
        collectionNodes[0].getExplorationSummaryObject(
        ).thumbnail_bg_color
    });

    // Here x and y represent the co-ordinates for the icons in the
    // path.
    let x = this.ICON_X_MIDDLE_PX;
    let y = this.ICON_Y_INITIAL_PX;
    let countMiddleIcon = 1;

    for (let i = 1; i < this.collection.getCollectionNodeCount(); i++) {
      if (countMiddleIcon === 0 && x === this.ICON_X_MIDDLE_PX) {
        x = this.ICON_X_LEFT_PX;
        y += this.ICON_Y_INCREMENT_PX;
        countMiddleIcon = 1;
      } else if (countMiddleIcon === 1 && x === this.ICON_X_MIDDLE_PX) {
        x = this.ICON_X_RIGHT_PX;
        y += this.ICON_Y_INCREMENT_PX;
        countMiddleIcon = 0;
      } else {
        x = this.ICON_X_MIDDLE_PX;
        y += this.ICON_Y_INCREMENT_PX;
      }
      iconParametersArray.push({
        thumbnailIconUrl:
          collectionNodes[i].getExplorationSummaryObject(
          ).thumbnail_icon_url.replace(
            'subjects', 'inverted_subjects'),
        left: x + 'px',
        top: y + 'px',
        thumbnailBgColor:
          collectionNodes[i].getExplorationSummaryObject(
          ).thumbnail_bg_color
      });
    }
    return iconParametersArray;
  }

  getExplorationUrl(explorationId: string): string {
    return (
      '/explore/' + explorationId + '?collection_id=' +
      this.collectionId);
  }

  getExplorationTitlePosition(index: number): string {
    if (index % 2 === 0) {
      return '-13px';
    } else if ((index + 1) % 2 === 0 && (index + 1) % 4 !== 0) {
      return '40px';
    } else if ((index + 1) % 4 === 0) {
      return '-55px';
    }
  }

  scrollToLocation(el: string): void {
    this.elementToScrollTo = el;
    const element = document.getElementById(el);
    element.scrollIntoView({behavior: 'smooth'});
  }

  closeOnClickingOutside(): void {
    this.explorationCardIsShown = false;
    this.scrollToLocation(this.elementToScrollTo);
  }

  onClickStopPropagation($evt: Event): void {
    $evt.stopPropagation();
  }

  isCompletedExploration(explorationId: string): boolean {
    if (this.collectionPlaythrough) {
      let completedExplorationIds = (
        this.collectionPlaythrough.getCompletedExplorationIds());
      return completedExplorationIds.indexOf(explorationId) > -1;
    }
    return false;
  }

  async fetchSummaryAsync(collectionId: string): Promise<void> {
    let summary = null;
    this.collectionPlayerBackendApiService.fetchCollectionSummariesAsync(
      collectionId
    ).then((collectionSummary) => {
      summary = collectionSummary;
      if (summary) {
        this.collectionSummary = summary.summaries[0];
      }
    });
  }

  updateCollection(collection: Collection): void {
    this.collection = collection;
    if (
      this.collection !== null &&
      this.collection.getCollectionNodeCount()
    ) {
      this.generatePathParameters();
    }
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_COLLECTION_PLAYER_PAGE_TITLE', {
        collectionTitle: this.collection.getTitle()
      });
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.collection = null;
    this.collectionId = this.urlService.getCollectionIdFromUrl();
    this.explorationCardIsShown = false;
    // The pathIconParameters is an array containing the co-ordinates,
    // background color and icon url for the icons generated on the
    // path.
    this.pathIconParameters = [];
    this.MIN_HEIGHT_FOR_PATH_SVG_PX = 220;
    this.ODD_SVG_HEIGHT_OFFSET_PX = 150;
    this.EVEN_SVG_HEIGHT_OFFSET_PX = 280;
    this.ICON_Y_INITIAL_PX = 35;
    this.ICON_Y_INCREMENT_PX = 110;
    this.ICON_X_MIDDLE_PX = 225;
    this.ICON_X_LEFT_PX = 60;
    this.ICON_X_RIGHT_PX = 390;
    this.svgHeight = this.MIN_HEIGHT_FOR_PATH_SVG_PX;
    this.nextExplorationId = null;
    this.allowedCollectionIdsForGuestProgress = (
      AppConstants.ALLOWED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS);

    this.fetchSummaryAsync(this.collectionId);

    // Load the collection the learner wants to view.
    this.readOnlyCollectionBackendApiService.loadCollectionAsync(
      this.collectionId).then(
      (collection) => {
        this.updateCollection(collection);
        // The onLangChange event is initially fired before the collection is
        // loaded. Hence the first setpageTitle() call needs to made
        // manually, and the onLangChange subscription is added after
        // the collection is loaded.
        this.setPageTitle();
        this.subscribeToOnLangChange();

        // Load the user's current progress in the collection. If the
        // user is a guest, then either the defaults from the server
        // will be used or the user's local progress, if any has been
        // made and the collection is whitelisted.
        this.userService.getUserInfoAsync().then((userInfo) => {
          this.loaderService.hideLoadingScreen();
          this.isLoggedIn = userInfo.isLoggedIn();
          this.collectionPlaythrough = collection.getPlaythrough();
          this.nextExplorationId =
            this.collectionPlaythrough.getNextExplorationId();
        });
      },
      () => {
        // NOTE TO DEVELOPERS: Check the backend console for an
        // indication as to why this error occurred; sometimes the
        // errors are noisy, so they are not shown to the user.
        this.alertsService.addWarning(
          'There was an error loading the collection.');
      }
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaCollectionPlayerPage',
  downgradeComponent({
    component: CollectionPlayerPageComponent
  }) as angular.IDirectiveFactory);
