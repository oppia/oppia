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
 * @fileoverview Service for exploration saving & publication functionality.
 */

import { Injectable, EventEmitter } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { PostPublishModalComponent } from 'pages/exploration-editor-page/modal-templates/post-publish-modal.component';
import { ExplorationPublishModalComponent } from 'pages/exploration-editor-page/modal-templates/exploration-publish-modal.component';
import { EditorReloadingModalComponent } from 'pages/exploration-editor-page/modal-templates/editor-reloading-modal.component';
import { ConfirmDiscardChangesModalComponent } from 'pages/exploration-editor-page/modal-templates/confirm-discard-changes-modal.component';
import { ExplorationMetadataModalComponent } from '../modal-templates/exploration-metadata-modal.component';
import { ExplorationSaveModalComponent } from '../modal-templates/exploration-save-modal.component';
import { AlertsService } from 'services/alerts.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { AutosaveInfoModalsService } from './autosave-info-modals.service';
import { ChangeListService } from './change-list.service';
import { ExplorationCategoryService } from './exploration-category.service';
import { ExplorationDataService } from './exploration-data.service';
import { ExplorationDiffService } from './exploration-diff.service';
import { ExplorationInitStateNameService } from './exploration-init-state-name.service';
import { ExplorationLanguageCodeService } from './exploration-language-code.service';
import { ExplorationObjectiveService } from './exploration-objective.service';
import { ExplorationRightsService } from './exploration-rights.service';
import { ExplorationStatesService } from './exploration-states.service';
import { ExplorationTagsService } from './exploration-tags.service';
import { ExplorationTitleService } from './exploration-title.service';
import { ExplorationWarningsService } from './exploration-warnings.service';
import { RouterService } from './router.service';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationSaveService {
  // Whether or not a save action is currently in progress
  // (request has been sent to backend but no reply received yet).
  saveIsInProgress: boolean = false;

  // This flag is used to ensure only one save exploration modal can be open
  // at any one time.
  modalIsOpen: boolean = false;

  diffData = null;
  _initExplorationPageEventEmitter = new EventEmitter<void>();

  constructor(
    private alertsService: AlertsService,
    private autosaveInfoModalsService: AutosaveInfoModalsService,
    private changeListService: ChangeListService,
    private editabilityService: EditabilityService,
    private explorationCategoryService: ExplorationCategoryService,
    private explorationDataService: ExplorationDataService,
    private explorationDiffService: ExplorationDiffService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationLanguageCodeService: ExplorationLanguageCodeService,
    private explorationObjectiveService: ExplorationObjectiveService,
    private explorationRightsService: ExplorationRightsService,
    private explorationStatesService: ExplorationStatesService,
    private explorationTagsService: ExplorationTagsService,
    private explorationTitleService: ExplorationTitleService,
    private explorationWarningsService: ExplorationWarningsService,
    private externalSaveService: ExternalSaveService,
    private logger: LoggerService,
    private ngbModal: NgbModal,
    private routerService: RouterService,
    private siteAnalyticsService: SiteAnalyticsService,
    private statesObjectFactory: StatesObjectFactory,
    private windowRef: WindowRef,
  ) { }

  showCongratulatorySharingModal(): void {
    this.ngbModal.open(PostPublishModalComponent, {
      backdrop: true
    }).result.then(() => { }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  openPublishExplorationModal(
      onStartSaveCallback: Function,
      onSaveDoneCallback: Function): Promise<void> {
    // This is resolved when modal is closed.
    return new Promise((resolve, reject) => {
      this.ngbModal.open(ExplorationPublishModalComponent, {
        backdrop: 'static',
      }).result.then(() => {
        if (onStartSaveCallback) {
          onStartSaveCallback();
        }
        this.explorationRightsService.publish().then(
          () => {
            if (onSaveDoneCallback) {
              onSaveDoneCallback();
            }

            this.showCongratulatorySharingModal();
            this.siteAnalyticsService.registerPublishExplorationEvent(
              this.explorationDataService.explorationId);
            resolve();
          });
      }, () => {
        this.alertsService.clearWarnings();
        resolve();
      });
    });
  }

  saveDraftToBackend(commitMessage: string): Promise<void> {
    // Resolved when save is done
    // (regardless of success or failure of the operation).
    return new Promise((resolve, reject) => {
      const changeList = this.changeListService.getChangeList();

      if (this.explorationRightsService.isPrivate()) {
        this.siteAnalyticsService
          .registerCommitChangesToPrivateExplorationEvent(
            this.explorationDataService.explorationId);
      } else {
        this.siteAnalyticsService.registerCommitChangesToPublicExplorationEvent(
          this.explorationDataService.explorationId);
      }

      if (this.explorationWarningsService.countWarnings() === 0) {
        this.siteAnalyticsService.registerSavePlayableExplorationEvent(
          this.explorationDataService.explorationId);
      }
      this.saveIsInProgress = true;
      this.editabilityService.markNotEditable();

      this.explorationDataService.save(
        changeList, commitMessage,
        (isDraftVersionValid, draftChanges) => {
          if (isDraftVersionValid === false &&
          draftChanges !== null &&
          draftChanges.length > 0) {
            this.autosaveInfoModalsService.showVersionMismatchModal(
              changeList);
            return;
          }

          this.logger.info(
            'Changes to this exploration were saved successfully.');

          this.changeListService.discardAllChanges().then(() => {
            this._initExplorationPageEventEmitter.emit();
            this.routerService.onRefreshVersionHistory.emit({
              forceRefresh: true
            });
            this.alertsService.addSuccessMessage('Changes saved.', 5000);
            this.saveIsInProgress = false;
            this.editabilityService.markEditable();
            resolve();
          }, () => {
            this.editabilityService.markEditable();
            resolve();
          });
        }, (errorResponse: {error: {error: string}}) => {
          this.saveIsInProgress = false;
          resolve();
          this.editabilityService.markEditable();
          const errorMessage = errorResponse.error.error;
          this.alertsService.addWarning(
            'Error! Changes could not be saved - ' + errorMessage);
        }
      );
    });
  }

  isAdditionalMetadataNeeded(): boolean {
    return (
      !this.explorationTitleService.savedMemento ||
      !this.explorationObjectiveService.savedMemento ||
      !this.explorationCategoryService.savedMemento ||
      this.explorationLanguageCodeService.savedMemento ===
      AppConstants.DEFAULT_LANGUAGE_CODE ||
      (this.explorationTagsService.savedMemento as string[]).length === 0);
  }

  async saveChangesAsync(
      onStartLoadingCallback: Function,
      onEndLoadingCallback: Function
  ): Promise<void> {
    // This is marked as resolved after modal is closed, so we can change
    // controller 'saveIsInProgress' back to false.
    return new Promise((resolve, reject) => {
      this.routerService.savePendingChanges();
      if (!this.explorationRightsService.isPrivate() &&
      this.explorationWarningsService.countWarnings() > 0) {
      // If the exploration is not private, warnings should be fixed before
      // it can be saved.
        this.alertsService.addWarning(
          this.explorationWarningsService.getWarnings()[0] as string);
        return;
      }

      this.explorationDataService.getLastSavedDataAsync().then((data) => {
        const oldStates = this.statesObjectFactory.createFromBackendDict(
          data.states).getStateObjects();
        const newStates = this.explorationStatesService.getStates()
          .getStateObjects();
        const diffGraphData = this.explorationDiffService.getDiffGraphData(
          oldStates, newStates, [{
            changeList: this.changeListService.getChangeList(),
            directionForwards: true
          }]);

        this.diffData = {
          nodes: diffGraphData.nodes,
          links: diffGraphData.links,
          finalStateIds: diffGraphData.finalStateIds,
          v1InitStateId: diffGraphData.originalStateIds[data.init_state_name],
          v2InitStateId: diffGraphData.stateIds[
          this.explorationInitStateNameService.displayed as string],
          v1States: oldStates,
          v2States: newStates
        };

        // TODO(wxy): After diff supports exploration metadata, add a check
        // to exit if changes cancel each other out.

        this.alertsService.clearWarnings();

        // If the modal is open, do not open another one.
        if (this.modalIsOpen) {
          return;
        }

        let modalInstance = this.ngbModal.open(ExplorationSaveModalComponent, {
          backdrop: 'static',
          windowClass: 'oppia-save-exploration-modal',
        });

        modalInstance.componentInstance.isExplorationPrivate = (
          this.explorationRightsService.isPrivate());
        modalInstance.componentInstance.diffData = this.diffData;

        // Modal is Opened.
        this.modalIsOpen = true;

        modalInstance.result.then((commitMessage) => {
          this.modalIsOpen = false;

          // Toggle loading dots back on for loading from backend.
          if (onStartLoadingCallback) {
            onStartLoadingCallback();
          }

          this.saveDraftToBackend(commitMessage).then(() => {
            resolve();
          });
        }, () => {
          this.alertsService.clearWarnings();
          this.modalIsOpen = false;
          resolve();
        });
      });
    });
  }

  get onInitExplorationPage(): EventEmitter<void> {
    return this._initExplorationPageEventEmitter;
  }

  showPublishExplorationModal(
      onStartLoadingCallback: Function,
      onEndLoadingCallback: Function): Promise<void> {
    // This is resolved after publishing modals are closed,
    // so we can remove the loading-dots.
    return new Promise((resolve, reject) => {
      this.siteAnalyticsService.registerOpenPublishExplorationModalEvent(
        this.explorationDataService.explorationId);
      this.alertsService.clearWarnings();

      // If the metadata has not yet been specified, open the pre-publication
      // 'add exploration metadata' modal.
      if (this.isAdditionalMetadataNeeded()) {
        const modalInstance = this.ngbModal.open(
          ExplorationMetadataModalComponent, {
            backdrop: 'static',
          });

        modalInstance.result.then((metadataList) => {
          if (metadataList.length > 0) {
            const commitMessage = (
              'Add metadata: ' + metadataList.join(', ') + '.');

            if (onStartLoadingCallback) {
              onStartLoadingCallback();
            }

            this.saveDraftToBackend(commitMessage).then(() => {
              if (onEndLoadingCallback) {
                onEndLoadingCallback();
              }
              this.openPublishExplorationModal(
                onStartLoadingCallback, onEndLoadingCallback)
                .then(() => {
                  resolve();
                });
            });
          } else {
            this.openPublishExplorationModal(
              onStartLoadingCallback, onEndLoadingCallback)
              .then(() => {
                resolve();
              });
          }
        }, () => {
          resolve();
          this.explorationTitleService.restoreFromMemento();
          this.explorationObjectiveService.restoreFromMemento();
          this.explorationCategoryService.restoreFromMemento();
          this.explorationLanguageCodeService.restoreFromMemento();
          this.explorationTagsService.restoreFromMemento();
          this.alertsService.clearWarnings();
        });
      } else {
        // No further metadata is needed. Open the publish modal immediately.
        this.openPublishExplorationModal(
          onStartLoadingCallback, onEndLoadingCallback)
          .then(() => {
            resolve();
          });
      }
    });
  }

  isExplorationSaveable(): boolean {
    return (
      this.changeListService.isExplorationLockedForEditing() &&
      !this.saveIsInProgress && (
        (
          this.explorationRightsService.isPrivate() &&
          !this.explorationWarningsService.hasCriticalWarnings()) ||
        (
          !this.explorationRightsService.isPrivate() &&
          this.explorationWarningsService.countWarnings() === 0)
      )
    );
  }

  discardChanges(): void {
    this.ngbModal.open(ConfirmDiscardChangesModalComponent, {
      backdrop: 'static',
    }).result.then(() => {
      this.alertsService.clearWarnings();
      this.externalSaveService.onExternalSave.emit();

      this.ngbModal.open(EditorReloadingModalComponent, {
        backdrop: 'static',
        keyboard: false,
        windowClass: 'oppia-loading-modal'
      }).result.then(() => { }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });

      this.changeListService.discardAllChanges().then(() => {
        this.alertsService.addSuccessMessage('Changes discarded.');
        this._initExplorationPageEventEmitter.emit();

        // The reload is necessary because, otherwise, the
        // exploration-with-draft-changes will be reloaded
        // (since it is already cached in ExplorationDataService).
        this.windowRef.nativeWindow.location.reload();
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}

angular.module('oppia').factory(
  'ExplorationSaveService', downgradeInjectable(ExplorationSaveService));
