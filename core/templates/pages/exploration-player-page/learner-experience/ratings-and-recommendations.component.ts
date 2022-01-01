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
 * @fileoverview Component for ratings and recommendations to be shown
 * on conversation skin.
 */

import { Component, Input, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { LearnerViewRatingService } from '../services/learner-view-rating.service';

interface ResultActionButton {
  type: string;
  i18nId: string;
  url: string;
}

interface QuestionPlayerConfig {
  resultActionButtons: ResultActionButton[];
  skillList: string[];
  skillDescriptions: string[];
  questionCount: number;
  questionPlayerMode: {
    modeType: string;
    passCutoff: number;
  };
  questionsSortedByDifficulty: boolean;
}

@Component({
  selector: 'oppia-ratings-and-recommendations',
  templateUrl: './ratings-and-recommendations.component.html'
})
export class RatingsAndRecommendationsComponent {
  @Input() userIsLoggedIn: boolean;
  @Input() explorationIsInPreviewMode: boolean;
  @Input() questionPlayerConfig: QuestionPlayerConfig;
  @Input() inStoryMode: boolean;
  @Input() storyViewerUrl!: string;
  @Input() collectionSummary: CollectionSummary;
  @Input() isRefresherExploration: boolean;
  @Input() recommendedExplorationSummaries: LearnerExplorationSummary[];
  @Input() parentExplorationIds: string[];
  collectionId: string;
  userRating: number;
  directiveSubscriptions = new Subscription();
  @ViewChild('feedbackPopOver') feedbackPopOver: NgbPopover;

  constructor(
    private alertsService: AlertsService,
    private learnerViewRatingService: LearnerViewRatingService,
    private urlService: UrlService,
    private userService: UserService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.collectionId = this.urlService.getCollectionIdFromExplorationUrl();

    this.directiveSubscriptions.add(
      this.learnerViewRatingService.onRatingUpdated.subscribe(() => {
        this.userRating = this.learnerViewRatingService.getUserRating();
        this.alertsService.addSuccessMessage('Rating saved!');
      })
    );

    if (!this.questionPlayerConfig) {
      this.learnerViewRatingService.init((userRating) => {
        this.userRating = userRating;
      });
    }
  }

  togglePopover(): void {
    this.feedbackPopOver.toggle();
  }

  closePopover(): void {
    this.feedbackPopOver.close();
  }

  submitUserRating(ratingValue: number): void {
    this.learnerViewRatingService.submitUserRating(ratingValue);
  }

  signIn(): void {
    this.userService.getLoginUrlAsync().then((loginUrl) => {
      if (loginUrl) {
        this.windowRef.nativeWindow.location = loginUrl;
      } else {
        this.windowRef.nativeWindow.location.reload();
      }
    });
  }
}

angular.module('oppia').directive('oppiaRatingsAndRecommendations',
  downgradeComponent({
    component: RatingsAndRecommendationsComponent
  }) as angular.IDirectiveFactory);
