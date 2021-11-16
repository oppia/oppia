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
  // These properties are initialized using async methods
  // and we need to do non-null assertion, for more information see
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

  private async _getVoiceoverOpportunitiesAsync(
      languageCode: string, cursor: string) {
    return this.contributionOpportunitiesBackendApiService
      .fetchVoiceoverOpportunitiesAsync(languageCode, cursor)
      .then(({ opportunities, nextCursor, more }) => {
        this._voiceoverOpportunitiesCursor = nextCursor;
        this._moreVoiceoverOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
  }

  private async _getAllTopicNamesAsync() {
    return this.contributionOpportunitiesBackendApiService
      .fetchAllTopicNamesAsync();
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
    return this._getTranslationOpportunitiesAsync(languageCode, topicName, '');
  }

  async getVoiceoverOpportunitiesAsync(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    return this._getVoiceoverOpportunitiesAsync(languageCode, '');
  }

  async getMoreSkillOpportunitiesAsync(): Promise<SkillOpportunitiesDict> {
    if (this._moreSkillOpportunitiesAvailable) {
      return this._getSkillOpportunitiesAsync(this._skillOpportunitiesCursor);
    }
  }

  async getMoreTranslationOpportunitiesAsync(
      languageCode: string, topicName: string):
  Promise<ExplorationOpportunitiesDict> {
    if (this._moreTranslationOpportunitiesAvailable) {
      return this._getTranslationOpportunitiesAsync(
        languageCode, topicName, this._translationOpportunitiesCursor);
    }
  }

  async getMoreVoiceoverOpportunitiesAsync(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    if (this._moreVoiceoverOpportunitiesAvailable) {
      return this._getVoiceoverOpportunitiesAsync(
        languageCode, this._voiceoverOpportunitiesCursor);
    }
  }
  async getAllTopicNamesAsync(): Promise<string[]> {
    return this._getAllTopicNamesAsync();
  }

  get reloadOpportunitiesEventEmitter(): EventEmitter<void> {
    return this._reloadOpportunitiesEventEmitter;
  }

  get removeOpportunitiesEventEmitter(): EventEmitter<string[]> {
    return this._removeOpportunitiesEventEmitter;
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesService',
  downgradeInjectable(ContributionOpportunitiesService));
