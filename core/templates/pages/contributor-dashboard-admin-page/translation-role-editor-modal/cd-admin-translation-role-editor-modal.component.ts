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
 * @fileoverview Component for editing a user's translation contribution rights.
 */

import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ContributorDashboardAdminBackendApiService } from '../services/contributor-dashboard-admin-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import constants from 'assets/constants';

@Component({
  selector: 'cd-admin-translation-role-editor-modal',
  templateUrl: './cd-admin-translation-role-editor-modal.component.html',
})

export class CdAdminTranslationRoleEditorModal implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() assignedLanguageIds: string[] = [];
  @Input() languageIdToName!: {[languageId: string]: string};
  @Input() username!: string;
  // Set to null when there is no language left in the list of languages to be
  // updated. If this value is null, it also means that the 'Add' button
  // should be disabled.
  selectedLanguageId: string | null = null;
  languageIdInUpdate: string | null = null;
  languageIdsForSelection: string[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private contributorDashboardAdminBackendApiService:
      ContributorDashboardAdminBackendApiService,
    private alertsService: AlertsService
  ) {}

  private updateLanguageIdsForSelection(): void {
    this.languageIdsForSelection = Object.keys(this.languageIdToName).filter(
      languageId => !this.assignedLanguageIds.includes(languageId));
    this.selectedLanguageId = this.languageIdsForSelection[0];
  }

  addLanguage(): void {
    if (this.selectedLanguageId === null) {
      throw new Error('Expected selectedLanguageId to be non-null.');
    }
    this.assignedLanguageIds.push(this.selectedLanguageId);
    this.languageIdInUpdate = this.selectedLanguageId;
    this.selectedLanguageId = null;
    this.contributorDashboardAdminBackendApiService
      .addContributionReviewerAsync(
        constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
        this.username, this.languageIdInUpdate).then(()=> {
        this.languageIdInUpdate = null;
        this.updateLanguageIdsForSelection();
      }, errorMessage => {
        if (this.languageIdInUpdate !== null) {
          let languageIdIndex = this.assignedLanguageIds.indexOf(
            this.languageIdInUpdate);
          this.assignedLanguageIds.splice(languageIdIndex, 1);
        }
        this.alertsService.addWarning(
          errorMessage || 'Error communicating with server.');
      });
  }

  removeLanguageId(languageIdToRemove: string): void {
    let languageIdIndex = this.assignedLanguageIds.indexOf(
      languageIdToRemove);
    this.languageIdInUpdate = languageIdToRemove;
    this.contributorDashboardAdminBackendApiService
      .removeContributionReviewerAsync(
        this.username,
        constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
        languageIdToRemove).then(() => {
        this.assignedLanguageIds.splice(languageIdIndex, 1);
        this.languageIdInUpdate = null;
        this.updateLanguageIdsForSelection();
      }, errorMessage => {
        this.alertsService.addWarning(
          errorMessage || 'Error communicating with server.');
      });
  }

  close(): void {
    this.activeModal.close();
  }

  ngOnInit(): void {
    this.updateLanguageIdsForSelection();
  }
}
