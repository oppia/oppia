// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for an input/response pair in the learner view.
 */

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import './progress-tracker.component.css';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {SaveProgressModalComponent} from './save-progress-modal.component';
import {ProgressUrlService} from 'pages/exploration-player-page/services/progress-url.service';
import {UrlService} from 'services/contextual/url.service';
import {Subscription} from 'rxjs';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {CheckpointProgressService} from 'pages/exploration-player-page/services/checkpoint-progress.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {NewProgressReminderModalComponent} from './new-progress-reminder-modal.component';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';

@Component({
  selector: 'oppia-progress-tracker',
  templateUrl: './progress-tracker.component.html',
  styleUrls: ['./progress-tracker.component.css'],
})
export class ProgressTrackerComponent implements OnInit, OnDestroy {
  @Input() userIsLoggedIn: boolean = false;
  directiveSubscriptions = new Subscription();
  loggedOutProgressUniqueUrlId!: string | null;
  loggedOutProgressUniqueUrl!: string;
  checkpointCount: number = 0;
  completedCheckpointsCount: number = 0;
  explorationTitle: string = '';

  constructor(
    private ngbModal: NgbModal,
    private progressUrlService: ProgressUrlService,
    private urlService: UrlService,
    private playerPositionService: PlayerPositionService,
    private checkpointProgressService: CheckpointProgressService,
    private conversationFlowService: ConversationFlowService,
    private explorationEngineService: ExplorationEngineService,
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private pageContextService: PageContextService,
    private windowRef: WindowRef,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService
  ) {}

  ngOnInit(): void {
    const explorationId = this.pageContextService.getExplorationId();
    this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(
        explorationId,
        this.urlService.getExplorationVersionFromUrl(),
        this.urlService.getPidFromUrl()
      )
      .then(response => {
        this.explorationTitle = response.exploration.title;
        this.directiveSubscriptions.add(
          this.playerPositionService.onLoadedMostRecentCheckpoint.subscribe(
            () => {
              if (this.checkpointCount) {
                this.showProgressReminderModal();
              } else {
                this.checkpointCount =
                  this.checkpointProgressService.fetchCheckpointCount();
                this.showProgressReminderModal();
              }
            }
          )
        );
      });

    const urlParams = this.urlService.getUrlParams();
    this.loggedOutProgressUniqueUrlId =
      urlParams.pid || this.progressUrlService.getUniqueProgressUrlId();
    if (this.loggedOutProgressUniqueUrlId) {
      this.loggedOutProgressUniqueUrl =
        this.urlService.getOrigin() +
        '/progress/' +
        this.loggedOutProgressUniqueUrlId;
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  showProgressReminderModal(): void {
    const mostRecentlyReachedCheckpointIndex =
      this.checkpointProgressService.getMostRecentlyReachedCheckpointIndex();

    this.completedCheckpointsCount = mostRecentlyReachedCheckpointIndex - 1;

    if (this.completedCheckpointsCount === 0) {
      this.conversationFlowService.onShowProgressModal.emit();
      return;
    }
    this.openProgressReminderModal();
  }

  openProgressReminderModal(): void {
    const explorationId = this.pageContextService.getExplorationId();
    let modalRef = this.ngbModal.open(NewProgressReminderModalComponent, {
      windowClass: 'oppia-progress-reminder-modal',
    });
    this.conversationFlowService.onShowProgressModal.emit();

    let displayedCardIndex = this.playerPositionService.getDisplayedCardIndex();
    if (displayedCardIndex > 0) {
      let state = this.explorationEngineService.getState();
      let stateCard = this.explorationEngineService.getStateCardByName(
        state.name as string
      );
      if (stateCard.isTerminal()) {
        this.completedCheckpointsCount += 1;
      }
    }

    modalRef.componentInstance.checkpointCount = this.checkpointCount;
    modalRef.componentInstance.completedCheckpointsCount =
      this.completedCheckpointsCount;
    modalRef.componentInstance.explorationTitle = this.explorationTitle;

    modalRef.result.then(
      () => {
        // This callback is used for when the learner chooses to restart
        // the exploration.
        if (!this.userIsLoggedIn) {
          const url = this.urlService.getOrigin() + '/lesson/' + explorationId;
          this.windowRef.nativeWindow.location.href = url;
        } else {
          this.editableExplorationBackendApiService
            .resetExplorationProgressAsync(explorationId)
            .then(() => {
              this.windowRef.nativeWindow.location.reload();
            });
        }
      },
      () => {
        // This callback is used for when the learner chooses to resume
        // the exploration.
      }
    );
  }

  showSaveProgressModal(): void {
    const modalInstance: NgbModalRef = this.ngbModal.open(
      SaveProgressModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalInstance.componentInstance.loggedOutProgressUniqueUrlId =
      this.loggedOutProgressUniqueUrlId;
    modalInstance.componentInstance.loggedOutProgressUniqueUrl =
      this.loggedOutProgressUniqueUrl;
  }

  async saveLoggedOutProgress(): Promise<void> {
    if (!this.loggedOutProgressUniqueUrlId) {
      this.progressUrlService.setUniqueProgressUrlId().then(() => {
        this.loggedOutProgressUniqueUrlId =
          this.progressUrlService.getUniqueProgressUrlId();
        this.loggedOutProgressUniqueUrl =
          this.urlService.getOrigin() +
          '/progress/' +
          this.loggedOutProgressUniqueUrlId;
        this.showSaveProgressModal();
      });
    } else {
      this.showSaveProgressModal();
    }
  }
}
