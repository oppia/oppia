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
 * @fileoverview Component for editing user roles.
 */

import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { AlertsService } from 'services/alerts.service';


@Component({
  selector: 'oppia-translation-coordinator-role-editor-modal',
  templateUrl: './translation-coordinator-role-editor-modal.component.html',
})
export class TranslationCoordinatorRoleEditorModalComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() coordinatedLanguageIds!: string[];
  @Input() languageIdToName!: {[languageId: string]: string};
  @Input() username!: string;
  // Set to null when there is no language left in the list of languages to be
  // updated. If this value is null, it also means that the 'Add' button
  // should be disabled.
  newLanguageId: string | null = null;
  languageIdInUpdate: string | null = null;
  languageIdsForSelection: string[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private adminBackendApiService: AdminBackendApiService,
    private alertsService: AlertsService
  ) {}

  private updatelanguageIdsForSelection(): void {
    this.languageIdsForSelection = Object.keys(this.languageIdToName).filter(
      languageId => !this.coordinatedLanguageIds.includes(languageId));
    this.newLanguageId = this.languageIdsForSelection[0];
  }

  addLanguage(): void {
    if (this.newLanguageId === null) {
      throw new Error('Expected newLanguageId to be non-null.');
    }
    this.coordinatedLanguageIds.push(this.newLanguageId);
    this.languageIdInUpdate = this.newLanguageId;
    this.newLanguageId = null;
    this.adminBackendApiService.assignTranslationCoordinator(
      this.username, this.languageIdInUpdate).then(()=> {
      this.languageIdInUpdate = null;
      this.updatelanguageIdsForSelection();
    }, errorMessage => {
      if (this.languageIdInUpdate !== null) {
        let languageIdIndex = this.coordinatedLanguageIds.indexOf(
          this.languageIdInUpdate);
        this.coordinatedLanguageIds.splice(languageIdIndex, 1);
      }
      this.alertsService.addWarning(
        errorMessage || 'Error communicating with server.');
    });
  }

  removeLanguageId(languageIdToRemove: string): void {
    let languageIdIndex = this.coordinatedLanguageIds.indexOf(
      languageIdToRemove);
    this.languageIdInUpdate = languageIdToRemove;
    this.adminBackendApiService.deassignTranslationCoordinator(
      this.username, languageIdToRemove).then(() => {
      this.coordinatedLanguageIds.splice(languageIdIndex, 1);
      this.languageIdInUpdate = null;
      this.updatelanguageIdsForSelection();
    }, errorMessage => {
      this.alertsService.addWarning(
        errorMessage || 'Error communicating with server.');
    });
  }

  close(): void {
    this.activeModal.close(this.coordinatedLanguageIds);
  }

  ngOnInit(): void {
    this.updatelanguageIdsForSelection();
  }
}
