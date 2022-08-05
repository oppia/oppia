// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Functionality for the create exploration button and upload
 * modal.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { AlertsService } from 'services/alerts.service';
import { LoaderService } from 'services/loader.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UploadActivityModalComponent } from 'pages/creator-dashboard-page/modal-templates/upload-activity-modal.component';
import { ExplorationCreationBackendApiService } from './exploration-creation-backend-api.service';

 @Injectable({
   providedIn: 'root'
 })
export class ExplorationCreationService {
  CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';
  explorationCreationInProgress: boolean = false;
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private explorationCreationBackendApiService:
      ExplorationCreationBackendApiService
  ) {}

  createNewExploration(): void {
    if (this.explorationCreationInProgress) {
      return;
    }
    this.explorationCreationInProgress = true;
    this.alertsService.clearWarnings();
    this.loaderService.showLoadingScreen('Creating exploration');

    this.explorationCreationBackendApiService.registerNewExplorationAsync({})
      .then((response) => {
        this.siteAnalyticsService.registerCreateNewExplorationEvent(
          response.explorationId);
        setTimeout(() => {
          this.windowRef.nativeWindow.location.href = (
            this.urlInterpolationService.interpolateUrl(
              this.CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                exploration_id: response.explorationId
              }
            )
          );
        }, 150);
        return false;
      }, () => {
        this.loaderService.hideLoadingScreen();
        this.explorationCreationInProgress = false;
      });
  }

  showUploadExplorationModal(): void {
    this.alertsService.clearWarnings();
    this.ngbModal.open(
      UploadActivityModalComponent, {backdrop: 'static'}
    ).result.then((result) => {
      const yamlFile = result.yamlFile;

      this.loaderService.showLoadingScreen('Creating exploration');
      this.explorationCreationBackendApiService.uploadExploration(
        yamlFile
      ).then(
        (data) => {
          this.windowRef.nativeWindow.location.href = (
            this.urlInterpolationService.interpolateUrl(
              this.CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                exploration_id: data.explorationId
              }
            )
          );
        },
        (response) => {
          this.alertsService.addWarning(
            response.error || 'Error communicating with server.');
          this.loaderService.hideLoadingScreen();
        }
      );
    });
  }
}
angular.module('oppia').factory(
  'ExplorationCreationService',
  downgradeInjectable(ExplorationCreationService));
