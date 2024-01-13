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
 * @fileoverview Component for the Oppia moderator page.
 */

import { ChangeDetectorRef, Component } from '@angular/core';
import { AppConstants } from 'app.constants';
import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import isEqual from 'lodash/isEqual';
import { AlertsService } from 'services/alerts.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoaderService } from 'services/loader.service';
import { Schema } from 'services/schema-default-value.service';
import { ActivityIdTypeDict, CommitMessage,
  ExplorationDict, ModeratorPageBackendApiService }
  from './services/moderator-page-backend-api.service';

@Component({
  selector: 'oppia-moderator-page',
  templateUrl: './moderator-page.component.html'
})
export class ModeratorPageComponent {
  allCommits: CommitMessage[] = [];
  allFeedbackMessages: ThreadMessage[] = [];
  // Map of exploration ids to objects containing a single key: title.
  explorationData: ExplorationDict[] = [];

  displayedFeaturedActivityReferences: ActivityIdTypeDict[] = [];
  lastSavedFeaturedActivityReferences: ActivityIdTypeDict[] = [];

  FEATURED_ACTIVITY_REFERENCES_SCHEMA: Schema = {
    type: 'list',
    items: {
      type: 'dict',
      properties: [{
        name: 'type',
        schema: {
          type: 'unicode',
          choices: [AppConstants.ENTITY_TYPE.EXPLORATION,
            AppConstants.ENTITY_TYPE.COLLECTION]
        }
      }, {
        name: 'id',
        schema: {
          type: 'unicode'
        }
      }]
    }
  };

  constructor(
    private alertsService: AlertsService,
    private dateTimeFormatService: DateTimeFormatService,
    private loaderService: LoaderService,
    private moderatorPageBackendApiService: ModeratorPageBackendApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  updateDisplayedFeaturedActivityReferences(
      newValue: ActivityIdTypeDict[]): void {
    if (this.displayedFeaturedActivityReferences !== newValue) {
      this.displayedFeaturedActivityReferences = newValue;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.moderatorPageBackendApiService.getRecentCommitsAsync()
      .then((response) => {
        // Update the explorationData object with information about newly-
        // discovered explorations.
        let explorationIdsToExplorationData = response.exp_ids_to_exp_data;
        for (let expId in explorationIdsToExplorationData) {
          if (!this.explorationData.hasOwnProperty(expId)) {
            this.explorationData[expId] = (
              explorationIdsToExplorationData[expId]);
          }
        }
        this.allCommits = response.results;
        this.loaderService.hideLoadingScreen();
      });

    this.moderatorPageBackendApiService.getRecentFeedbackMessagesAsync()
      .then((response) => {
        this.allFeedbackMessages = response.results.map(
          d => ThreadMessage.createFromBackendDict(d));
      });

    this.moderatorPageBackendApiService.getFeaturedActivityReferencesAsync()
      .then((response) => {
        this.displayedFeaturedActivityReferences = response
          .featured_activity_references;
        this.lastSavedFeaturedActivityReferences =
          [...this.displayedFeaturedActivityReferences];
      });
  }

  getDatetimeAsString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService
      .getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
  }

  isMessageFromExploration(message: ThreadMessage): boolean {
    return message.entityType === AppConstants.ENTITY_TYPE.EXPLORATION;
  }

  getExplorationCreateUrl(explorationId: string): string {
    return '/create/' + explorationId;
  }

  getActivityCreateUrl(reference: ActivityIdTypeDict): string {
    let path: string = (
          reference.type === AppConstants.ENTITY_TYPE.EXPLORATION ?
          '/create' :
          '/create_collection');
    return path + '/' + reference.id;
  }

  isSaveFeaturedActivitiesButtonDisabled(): boolean {
    return isEqual(
      this.displayedFeaturedActivityReferences,
      this.lastSavedFeaturedActivityReferences);
  }

  saveFeaturedActivityReferences(): void {
    this.alertsService.clearWarnings();

    let activityReferencesToSave =
      [...this.displayedFeaturedActivityReferences];

    this.moderatorPageBackendApiService
      .saveFeaturedActivityReferencesAsync(activityReferencesToSave)
      .then(() => {
        this.lastSavedFeaturedActivityReferences = activityReferencesToSave;
        this.alertsService.addSuccessMessage('Featured activities saved.');
      });
  }

  getSchema(): Schema {
    return this.FEATURED_ACTIVITY_REFERENCES_SCHEMA;
  }
}
