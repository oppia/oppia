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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { ContributionOpportunitiesBackendApiService } from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { SkillOpportunity } from 'domain/opportunity/skill-opportunity.model';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesService {
    skillOpportunitiesCursor = null;
    translationOpportunitiesCursor = null;
    private voiceoverOpportunitiesCursor = null;
    moreSkillOpportunitiesAvailable : boolean = true;
    moreTranslationOpportunitiesAvailable: boolean = true;
    moreVoiceoverOpportunitiesAvailable: boolean = true;

    constructor(
        private contributionOpportunitiesBackendApiService:
        ContributionOpportunitiesBackendApiService,
        private urlInterpolationService: UrlInterpolationService,
        private ngbModal: NgbModal
    ) {}

  private _reloadOpportunitiesEventEmitter = new EventEmitter<void>();
  private _removeOpportunitiesEventEmitter = new EventEmitter<void>();

  private _getSkillOpportunities(cursor):
      Promise<{ more: boolean; opportunities: SkillOpportunity[] }> {
    return this.contributionOpportunitiesBackendApiService
      .fetchSkillOpportunitiesAsync(cursor)
      .then(({opportunities, nextCursor, more}) => {
        this.skillOpportunitiesCursor = nextCursor;
        this.moreSkillOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
  }

  private _getTranslationOpportunities(languageCode, cursor):
   Promise<{ more: boolean; opportunities: ExplorationOpportunitySummary[] }> {
    return this.contributionOpportunitiesBackendApiService
      .fetchTranslationOpportunitiesAsync(
        languageCode, cursor)
      .then(({opportunities, nextCursor, more}) => {
        this.translationOpportunitiesCursor = nextCursor;
        this.moreTranslationOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
  }

  private _getVoiceoverOpportunities(languageCode, cursor):
   Promise<{ more: boolean; opportunities: ExplorationOpportunitySummary[] }> {
    return this.contributionOpportunitiesBackendApiService
      .fetchVoiceoverOpportunitiesAsync(languageCode, cursor).then(
        function({opportunities, nextCursor, more}) {
          this.voiceoverOpportunitiesCursor = nextCursor;
          this.moreVoiceoverOpportunitiesAvailable = more;
          return {
            opportunities: opportunities,
            more: more
          };
        });
  }

  private _showRequiresLoginModal(): void {
    this.ngbModal.open({
      templateUrl: this.urlInterpolationService.getDirectiveTemplateUrl(
        '/pages/community-dashboard-page/modal-templates/' +
                'login-required-modal.directive.html'),
      backdrop: 'static',
      controller: [
        '$controller', '$scope', '$uibModalInstance',
        function($controller, $scope, $uibModalInstance) {
          $controller('ConfirmOrCancelModalController', {
            $scope: $scope,
            $uibModalInstance: $uibModalInstance
          });
        }]
    }).result.then(function() {
    }, function() {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  async getSkillOpportunitiesAsync() {
    return this._getSkillOpportunities('');
  }

  async getTranslationOpportunitiesAsync(languageCode) {
    return this._getTranslationOpportunities(languageCode, '');
  }

  async getVoiceoverOpportunities(languageCode) {
    return this._getVoiceoverOpportunities(languageCode, '');
  }

  async getMoreSkillOpportunitiesAsync() {
    if (this.moreSkillOpportunitiesAvailable) {
      return this._getSkillOpportunities(this.skillOpportunitiesCursor);
    }
  }

  async getMoreTranslationOpportunitiesAsync(languageCode) {
    if (this.moreTranslationOpportunitiesAvailable) {
      return this._getTranslationOpportunities(
        languageCode, this.translationOpportunitiesCursor);
    }
  }

  async getMoreVoiceoverOpportunitiesAsync(languageCode) {
    if (this.moreVoiceoverOpportunitiesAvailable) {
      return this._getVoiceoverOpportunities(
        languageCode, this.voiceoverOpportunitiesCursor);
    }
  }


  get removeOpportunitiesEventEmitter(): EventEmitter<void> {
    return this._removeOpportunitiesEventEmitter;
  }

  get reloadOpportunitiesEventEmitter(): EventEmitter<void> {
    return this._reloadOpportunitiesEventEmitter;
  }

  showRequiresLoginModal(): () => void {
    return this.showRequiresLoginModal;
  }
}

angular.module('oppia').factory('ContributionOpportunitiesService',
  downgradeInjectable(ContributionOpportunitiesService));

