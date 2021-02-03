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

class ExplorationOpportunitiesDict {
  opportunities: ExplorationOpportunitySummary[];
  more: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesService {
  constructor(
    private contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService,
      private modalService: NgbModal) {}

  reloadOpportunitiesEventEmitter = new EventEmitter<void>();
  removeOpportunitiesEventEmitter = new EventEmitter<void>();
  skillOpportunitiesCursor = null;
  translationOpportunitiesCursor = null;
  voiceoverOpportunitiesCursor = null;
  moreSkillOpportunitiesAvailable = true;
  moreTranslationOpportunitiesAvailable = true;
  moreVoiceoverOpportunitiesAvailable = true;

  private _getSkillOpportunities(cursor: string):
  Promise<SkillOpportunitiesDict> {
    return this.contributionOpportunitiesBackendApiService
      .fetchSkillOpportunitiesAsync(
        cursor).then(({ opportunities, nextCursor, more }) => {
        this.skillOpportunitiesCursor = nextCursor;
        this.moreSkillOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
  }
  private _getTranslationOpportunities(languageCode: string, cursor: string) {
    return this.contributionOpportunitiesBackendApiService
      .fetchTranslationOpportunitiesAsync(
        languageCode, cursor).then(({ opportunities, nextCursor, more }) => {
        this.translationOpportunitiesCursor = nextCursor;
        this.moreTranslationOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
  }
  private _getVoiceoverOpportunities(languageCode: string, cursor: string) {
    return this.contributionOpportunitiesBackendApiService
      .fetchVoiceoverOpportunitiesAsync(languageCode, cursor).then(
        function({ opportunities, nextCursor, more }) {
          this.voiceoverOpportunitiesCursor = nextCursor;
          this.moreVoiceoverOpportunitiesAvailable = more;
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
    return this._getSkillOpportunities('');
  }
  async getTranslationOpportunitiesAsync(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    return this._getTranslationOpportunities(languageCode, '');
  }
  async getVoiceoverOpportunities(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    return this._getVoiceoverOpportunities(languageCode, '');
  }
  async getMoreSkillOpportunitiesAsync(): Promise<SkillOpportunitiesDict> {
    if (this.moreSkillOpportunitiesAvailable) {
      return this._getSkillOpportunities(this.skillOpportunitiesCursor);
    }
  }
  async getMoreTranslationOpportunitiesAsync(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    if (this.moreTranslationOpportunitiesAvailable) {
      return this._getTranslationOpportunities(
        languageCode, this.translationOpportunitiesCursor);
    }
  }
  async getMoreVoiceoverOpportunities(languageCode: string):
  Promise<ExplorationOpportunitiesDict> {
    if (this.moreVoiceoverOpportunitiesAvailable) {
      return this._getVoiceoverOpportunities(
        languageCode, this.voiceoverOpportunitiesCursor);
    }
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesService',
  downgradeInjectable(ContributionOpportunitiesService));
