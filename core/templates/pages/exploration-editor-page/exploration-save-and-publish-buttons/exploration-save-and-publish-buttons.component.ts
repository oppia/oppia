// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration save & publish buttons.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EditabilityService } from 'services/editability.service';
import { EntityTranslationsService } from 'services/entity-translations.services';
import { InternetConnectivityService } from 'services/internet-connectivity.service';
import { ExplorationSavePromptModalComponent } from '../modal-templates/exploration-save-prompt-modal.component';
import { ChangeListService } from '../services/change-list.service';
import { ExplorationRightsService } from '../services/exploration-rights.service';
import { ExplorationSaveService } from '../services/exploration-save.service';
import { ExplorationWarningsService } from '../services/exploration-warnings.service';
import { UserExplorationPermissionsService } from '../services/user-exploration-permissions.service';

@Component({
  selector: 'exploration-save-and-publish-buttons',
  templateUrl: './exploration-save-and-publish-buttons.component.html'
})
export class ExplorationSaveAndPublishButtonsComponent
   implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  isModalDisplayed: boolean = false;
  saveIsInProcess: boolean;
  publishIsInProcess: boolean;
  loadingDotsAreShown: boolean;
  explorationCanBePublished: boolean;
  connectedToInternet: boolean;

  constructor(
     private explorationRightsService: ExplorationRightsService,
     private editabilityService: EditabilityService,
     private entityTranslationsService: EntityTranslationsService,
     private changeListService: ChangeListService,
     private explorationWarningsService: ExplorationWarningsService,
     private explorationSaveService: ExplorationSaveService,
     private userExplorationPermissionsService:
       UserExplorationPermissionsService,
     private internetConnectivityService: InternetConnectivityService,
     private ngbModal: NgbModal,
  ) { }

  isPrivate(): boolean {
    return this.explorationRightsService.isPrivate();
  }

  isLockedByAdmin(): boolean {
    return this.editabilityService.isLockedByAdmin();
  }

  isExplorationLockedForEditing(): boolean {
    return this.changeListService.isExplorationLockedForEditing();
  }

  isEditableOutsideTutorialMode(): boolean {
    return this.editabilityService.isEditableOutsideTutorialMode() ||
       this.editabilityService.isTranslatable();
  }

  countWarnings(): number {
    return this.explorationWarningsService.countWarnings();
  }

  discardChanges(): void {
    this.explorationSaveService.discardChanges();
  }

  getChangeListLength(): number {
    let countChanges = this.changeListService.getChangeList().length;

    const MIN_CHANGES_DISPLAY_PROMPT = 50;

    if (countChanges >= MIN_CHANGES_DISPLAY_PROMPT && !this.isModalDisplayed &&
       !this.saveIsInProcess) {
      this.isModalDisplayed = true;

      this.ngbModal.open(ExplorationSavePromptModalComponent, {
        backdrop: 'static',
      }).result.then(() => {
        this.saveChanges();
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    }
    return this.changeListService.getChangeList().length;
  }

  isExplorationSaveable(): boolean {
    return this.explorationSaveService.isExplorationSaveable();
  }

  getPublishExplorationButtonTooltip(): string {
    if (!this.connectedToInternet) {
      return 'You can not publish the exploration when offline.';
    } else if (this.countWarnings() > 0) {
      return 'Please resolve the warnings before publishing.';
    } else if (this.isExplorationLockedForEditing()) {
      return 'Please save your changes before publishing.';
    } else {
      return 'Publish to Oppia Library';
    }
  }

  getSaveButtonTooltip(): string {
    if (!this.connectedToInternet) {
      return 'You can not save the exploration when offline.';
    } else if (this.explorationWarningsService.hasCriticalWarnings()) {
      return 'Please resolve the warnings.';
    } else if (this.isPrivate()) {
      return 'Save Draft';
    } else {
      return 'Publish Changes';
    }
  }

  showLoadingDots(): void {
    this.loadingDotsAreShown = true;
  }

  hideLoadingAndUpdatePermission(): void {
    this.loadingDotsAreShown = false;
    this.userExplorationPermissionsService.fetchPermissionsAsync()
      .then((permissions) => {
        this.explorationCanBePublished = permissions.canPublish;
      });
  }

  showPublishExplorationModal(): void {
    this.publishIsInProcess = true;
    this.loadingDotsAreShown = true;

    this.explorationSaveService.showPublishExplorationModal(
      this.showLoadingDots.bind(this),
      this.hideLoadingAndUpdatePermission.bind(this))
      .finally(() => {
        this.publishIsInProcess = false;
        this.loadingDotsAreShown = false;
        this.entityTranslationsService.reset();
      });
  }

  saveChanges(): void {
    this.saveIsInProcess = true;
    this.loadingDotsAreShown = true;

    this.explorationSaveService.saveChangesAsync(
      this.showLoadingDots.bind(this),
      this.hideLoadingAndUpdatePermission.bind(this))
      .then(() => {
        this.saveIsInProcess = false;
        this.loadingDotsAreShown = false;
        this.entityTranslationsService.reset();
      }, () => {});
  }

  ngOnInit(): void {
    this.saveIsInProcess = false;
    this.publishIsInProcess = false;
    this.loadingDotsAreShown = false;
    this.explorationCanBePublished = false;
    this.connectedToInternet = true;

    this.userExplorationPermissionsService.getPermissionsAsync()
      .then((permissions) => {
        this.explorationCanBePublished = permissions.canPublish;
      });

    this.directiveSubscriptions.add(
      this.userExplorationPermissionsService.onUserExplorationPermissionsFetched
        .subscribe(
          () => {
            this.userExplorationPermissionsService.getPermissionsAsync()
              .then((permissions) => {
                this.explorationCanBePublished = permissions.canPublish;
              });
          }
        )
    );

    this.directiveSubscriptions.add(
      this.internetConnectivityService.onInternetStateChange.subscribe(
        internetAccessible => {
          this.connectedToInternet = internetAccessible;
        })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'explorationSaveAndPublishButtons',
  downgradeComponent({
    component: ExplorationSaveAndPublishButtonsComponent
  }));
