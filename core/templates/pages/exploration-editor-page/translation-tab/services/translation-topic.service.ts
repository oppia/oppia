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
 * @fileoverview A service that maintains a record of which topic
 * in the translation tab is currently active.
 */

import {EventEmitter, Injectable} from '@angular/core';

import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import {
  ContributionOpportunitiesService,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/services/contribution-opportunities.service';
import {LoggerService} from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root',
})
export class TranslationTopicService {
  // This property is initialized using async methods
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  // The active topic is tracked by its ID rather than by its name, since
  // topic names can change.
  private activeTopicId!: string;
  private _activeTopicChangedEventEmitter = new EventEmitter<void>();

  constructor(
    private ContributionOpportunitiesService: ContributionOpportunitiesService,
    private loggerService: LoggerService
  ) {}

  getActiveTopicId(): string {
    return this.activeTopicId;
  }

  setActiveTopicId(newActiveTopicId: string): void {
    this.ContributionOpportunitiesService.getTranslatableTopicsAsync().then(
      topics => {
        if (
          newActiveTopicId !==
            ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL &&
          !topics.some(topic => topic.id === newActiveTopicId)
        ) {
          this.loggerService.error(
            `Invalid active topic ID: ${newActiveTopicId}`
          );
          return;
        }
        this.activeTopicId = newActiveTopicId;
        this._activeTopicChangedEventEmitter.emit();
      }
    );
  }

  get onActiveTopicChanged(): EventEmitter<void> {
    return this._activeTopicChangedEventEmitter;
  }
}
