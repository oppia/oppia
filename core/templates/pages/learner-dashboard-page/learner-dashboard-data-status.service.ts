// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that help to handle the data of learner dashboard
 * to different components.
 */


import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NonExistentExplorations } from 'domain/learner_dashboard/non-existent-explorations.model';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { CollectionSummary } from 'pages/collection-player-page/collection-player-page.component';

interface LearnerDashboardCollectionsData {
  completedCollectionsList: CollectionSummary[];
  incompleteCollectionsList: CollectionSummary[];
  collectionPlaylist: CollectionSummary[];
  completedToIncompleteCollections: string[];
}


interface LearnerDashboardExplorationsData {
  completedExplorationsList: LearnerExplorationSummary[];
  incompleteExplorationsList: LearnerExplorationSummary[];
  explorationPlaylist: LearnerExplorationSummary[];
  numberOfNonexistentExplorations: NonExistentExplorations;
  subscriptionList: ProfileSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardDataStatusService {
  private _learnerDashboardExplorationDataEventEmitter = (
    new EventEmitter<LearnerDashboardExplorationsData>());

  private _learnerDashboardCollectionsDataEventEmitter = (
    new EventEmitter<LearnerDashboardCollectionsData>());


  get learnerDashbaordExplorationData():
     EventEmitter<LearnerDashboardExplorationsData> {
    return this._learnerDashboardExplorationDataEventEmitter;
  }

  get learnerDashbaordCollectionsData():
  EventEmitter<LearnerDashboardCollectionsData> {
    return this._learnerDashboardCollectionsDataEventEmitter;
  }
}

angular.module('oppia').factory('DiagnosticTestPlayerStatusService',
  downgradeInjectable(LearnerDashboardDataStatusService));
