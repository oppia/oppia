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
 * @fileoverview Component for the local navigation in the learner view.
 */

import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbModal, NgbPopover} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {AttributionService} from 'services/attribution.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {ExplorationSuccessfullyFlaggedModalComponent} from '../modals/exploration-successfully-flagged-modal.component';
import {
  FlagExplorationModalComponent,
  FlagExplorationModalResult,
} from '../modals/flag-exploration-modal.component';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {LearnerLocalNavBackendApiService} from '../services/learner-local-nav-backend-api.service';

@Component({
  selector: 'oppia-learner-local-nav',
  templateUrl: './learner-local-nav.component.html',
})
export class LearnerLocalNavComponent implements OnInit {
  canEdit: boolean = false;
  // The following property is set to null when the
  // user is not logged in.
  username: string | null = '';
  feedbackOptionIsShown: boolean = true;
  explorationId!: string;
  @ViewChild('feedbackPopOver') feedbackPopOver!: NgbPopover;

  constructor(
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private attributionService: AttributionService,
    private explorationEngineService: ExplorationEngineService,
    private loaderService: LoaderService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private userService: UserService,
    private learnerLocalNavBackendApiService: LearnerLocalNavBackendApiService
  ) {}

  showFlagExplorationModal(): void {
    this.ngbModal
      .open(FlagExplorationModalComponent, {
        backdrop: 'static',
      })
      .result.then(
        (result: FlagExplorationModalResult) => {
          this.learnerLocalNavBackendApiService
            .postReportAsync(this.explorationId, result)
            .then(
              () => {},
              error => {
                this.alertsService.addWarning(error);
              }
            );

          this.ngbModal
            .open(ExplorationSuccessfullyFlaggedModalComponent, {
              backdrop: true,
            })
            .result.then(
              () => {},
              () => {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              }
            );
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  toggleAttributionModal(): void {
    if (this.attributionService.isAttributionModalShown()) {
      this.attributionService.hideAttributionModal();
    } else {
      this.attributionService.showAttributionModal();
    }
  }

  ngOnInit(): void {
    this.explorationId = this.explorationEngineService.getExplorationId();
    let version = this.explorationEngineService.getExplorationVersion();
    if (version) {
      this.readOnlyExplorationBackendApiService
        .loadExplorationAsync(this.explorationId, version)
        .then(exploration => {
          this.canEdit = exploration.can_edit;
        });
    }
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then(userInfo => {
      this.username = userInfo.getUsername();
      if (
        this.username === null &&
        !AppConstants.ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS
      ) {
        this.feedbackOptionIsShown = false;
      }
      this.loaderService.hideLoadingScreen();
    });
  }

  togglePopover(): void {
    this.feedbackPopOver.toggle();
  }

  closePopover(): void {
    this.feedbackPopOver.close();
  }
}
