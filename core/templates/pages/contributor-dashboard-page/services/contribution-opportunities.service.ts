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

class SkillOpportunitiesDict {
  opportunities: SkillOpportunity[];
  more: boolean;
}

export class ExplorationOpportunitiesDict {
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

  public readonly reloadOpportunitiesEventEmitter = new EventEmitter<void>();
  public readonly removeOpportunitiesEventEmitter = new EventEmitter();
  private _skillOpportunitiesCursor: string = null;
  private _translationOpportunitiesCursor: string = null;
  private _voiceoverOpportunitiesCursor: string = null;
  private _moreSkillOpportunitiesAvailable = true;
  private _moreTranslationOpportunitiesAvailable = true;
  private _moreVoiceoverOpportunitiesAvailable = true;

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
      languageCode: string, cursor: string) {
    return this.contributionOpportunitiesBackendApiService
      .fetchTranslationOpportunitiesAsync(languageCode, cursor)
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
  showRequiresLoginModal(): void {
    this.modalService.open(LoginRequiredModalContent);
  }

  async getSkillOpportunitiesAsync(): Promise<SkillOpportunitiesDict> {
    return this._getSkillOpportunitiesAsync('');
  }
  async getTranslationOpportunitiesAsync(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    return this._getTranslationOpportunitiesAsync(languageCode, '');
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
  async getMoreTranslationOpportunitiesAsync(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    if (this._moreTranslationOpportunitiesAvailable) {
      return this._getTranslationOpportunitiesAsync(
        languageCode, this._translationOpportunitiesCursor);
    }
  }
  async getMoreVoiceoverOpportunitiesAsync(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    if (this._moreVoiceoverOpportunitiesAvailable) {
      return this._getVoiceoverOpportunitiesAsync(
        languageCode, this._voiceoverOpportunitiesCursor);
    }
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesService',
  downgradeInjectable(ContributionOpportunitiesService));
