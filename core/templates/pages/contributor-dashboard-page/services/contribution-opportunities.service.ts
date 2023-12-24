// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */
import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { ContributionOpportunitiesBackendApiService } from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { SkillOpportunity } from 'domain/opportunity/skill-opportunity.model';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { LoginRequiredModalContent } from 'pages/contributor-dashboard-page/modal-templates/login-required-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export interface SkillOpportunitiesDict {
  opportunities: SkillOpportunity[];
  more: boolean;
}

export interface ExplorationOpportunitiesDict {
  opportunities: ExplorationOpportunitySummary[];
  more: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesService {
  constructor(
    private readonly contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService,
      private readonly modalService: NgbModal) {}

  private _reloadOpportunitiesEventEmitter = new EventEmitter<void>();
  private _removeOpportunitiesEventEmitter = new EventEmitter<string[]>();
  private _pinnedOpportunitiesChanged: EventEmitter<
    Record<string, string>> = new EventEmitter();

  private _unpinnedOpportunitiesChanged: EventEmitter<
    Record<string, string>> = new EventEmitter();
  // These properties are initialized using async methods
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1

  private _skillOpportunitiesCursor!: string;
  private _translationOpportunitiesCursor!: string;
  private _voiceoverOpportunitiesCursor!: string;
  private _moreSkillOpportunitiesAvailable: boolean = true;
  private _moreTranslationOpportunitiesAvailable: boolean = true;
  private _moreVoiceoverOpportunitiesAvailable: boolean = true;

  private async _getSkillOpportunitiesAsync(cursor: string):
  Promise<SkillOpportunitiesDict> {
    return this.contributionOpportunitiesBackendApiService
      .fetchSkillOpportunitiesAsync(cursor)
      .then(({ opportunities, nextCursor, more }) => {
        this._skillOpportunitiesCursor = nextCursor;
        this._moreSkillOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
  }

  private async _getTranslationOpportunitiesAsync(
      languageCode: string, topicName: string, cursor: string) {
    return this.contributionOpportunitiesBackendApiService
      .fetchTranslationOpportunitiesAsync(languageCode, topicName, cursor)
      .then(({ opportunities, nextCursor, more }) => {
        this._translationOpportunitiesCursor = nextCursor;
        this._moreTranslationOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
  }

  private async _getTranslatableTopicNamesAsync() {
    return this.contributionOpportunitiesBackendApiService
      .fetchTranslatableTopicNamesAsync();
  }

  showRequiresLoginModal(): void {
    this.modalService.open(LoginRequiredModalContent);
  }

  async getSkillOpportunitiesAsync(): Promise<SkillOpportunitiesDict> {
    return this._getSkillOpportunitiesAsync('');
  }

  async getTranslationOpportunitiesAsync(
      languageCode: string, topicName: string):
  Promise<ExplorationOpportunitiesDict> {
    return this._getTranslationOpportunitiesAsync(
      languageCode, topicName, '');
  }

  async getMoreSkillOpportunitiesAsync():
      Promise<SkillOpportunitiesDict> {
    if (this._moreSkillOpportunitiesAvailable) {
      return this._getSkillOpportunitiesAsync(this._skillOpportunitiesCursor);
    }
    throw new Error('No more skill opportunities available.');
  }

  async getMoreTranslationOpportunitiesAsync(
      languageCode: string, topicName: string):
  Promise<ExplorationOpportunitiesDict> {
    if (this._moreTranslationOpportunitiesAvailable) {
      return this._getTranslationOpportunitiesAsync(
        languageCode, topicName, this._translationOpportunitiesCursor);
    }
    throw new Error('No more translation opportunities available.');
  }

  async getReviewableTranslationOpportunitiesAsync(
      topicName: string,
      languageCode?: string):
  Promise<ExplorationOpportunitiesDict> {
    return this.contributionOpportunitiesBackendApiService
      .fetchReviewableTranslationOpportunitiesAsync(topicName, languageCode)
      .then(({ opportunities }) => {
        return {
          opportunities: opportunities,
          more: false
        };
      });
  }

  async getTranslatableTopicNamesAsync(): Promise<string[]> {
    return this._getTranslatableTopicNamesAsync();
  }

  get reloadOpportunitiesEventEmitter(): EventEmitter<void> {
    return this._reloadOpportunitiesEventEmitter;
  }

  async pinReviewableTranslationOpportunityAsync(
      topicName: string,
      languageCode: string,
      explorationId: string):
    Promise<void> {
    this.pinnedOpportunitiesChanged.emit(
      {topicName, languageCode, explorationId});
    return this.contributionOpportunitiesBackendApiService
      .pinTranslationOpportunity(
        languageCode,
        topicName,
        explorationId);
  }

  async unpinReviewableTranslationOpportunityAsync(
      topicName: string,
      languageCode: string,
      explorationId: string):
  Promise<void> {
    this.unpinnedOpportunitiesChanged.emit(
      {topicName, languageCode, explorationId});
    return this.contributionOpportunitiesBackendApiService
      .unpinTranslationOpportunity(
        languageCode,
        topicName);
  }

  get removeOpportunitiesEventEmitter(): EventEmitter<string[]> {
    return this._removeOpportunitiesEventEmitter;
  }

  get pinnedOpportunitiesChanged(): EventEmitter<
  Record<string, string>> {
    return this._pinnedOpportunitiesChanged;
  }

  get unpinnedOpportunitiesChanged(): EventEmitter<
  Record<string, string>> {
    return this._unpinnedOpportunitiesChanged;
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesService',
  downgradeInjectable(ContributionOpportunitiesService));
