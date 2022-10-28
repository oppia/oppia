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
 * @fileoverview Functionality for showing skill modal.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillCreationBackendApiService } from 'domain/skill/skill-creation-backend-api.service';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CreateNewSkillModalComponent } from 'pages/topics-and-skills-dashboard-page/modals/create-new-skill-modal.component';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class CreateNewSkillModalService {
  skillCreationInProgress: boolean = false;
  CREATE_NEW_SKILL_URL_TEMPLATE: string = '/skill_editor/<skill_id>';

  constructor(
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private windowRef: WindowRef,
    private imageLocalStorageService: ImageLocalStorageService,
    private skillCreationBackendApiService: SkillCreationBackendApiService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  createNewSkill(topicsIds: string[] = []): void {
    const modalRef = this.ngbModal.open(
      CreateNewSkillModalComponent, {
        windowClass: 'create-new-skill-modal',
        backdrop: 'static'
      });
    modalRef.result.then((result) => {
      if (this.skillCreationInProgress) {
        return;
      }

      let rubrics = result.rubrics;
      for (let idx in rubrics) {
        rubrics[idx] = rubrics[idx].toBackendDict();
      }
      this.skillCreationInProgress = true;
      this.alertsService.clearWarnings();
      // The window.open has to be initialized separately since if the 'open
      // new tab' action does not directly result from a user input
      // (which is not the case, if we wait for result from the backend
      // before opening a new tab), some browsers block it as a popup.
      // Here, the new tab is created as soon as the user clicks the
      // 'Create' button and filled with URL once the details are
      // fetched from the backend.
      let newTab = this.windowRef.nativeWindow.open() as WindowProxy;
      let imagesData = this.imageLocalStorageService.getStoredImagesData();
      this.skillCreationBackendApiService.createSkillAsync(
        result.description, rubrics, result.explanation,
        topicsIds, imagesData).then((response) => {
        setTimeout(() => {
          this.topicsAndSkillsDashboardBackendApiService.
            onTopicsAndSkillsDashboardReinitialized.emit(true);
          this.skillCreationInProgress = false;
          this.imageLocalStorageService.flushStoredImagesData();
          newTab.location.href =
          this.urlInterpolationService.interpolateUrl(
            this.CREATE_NEW_SKILL_URL_TEMPLATE, {
              skill_id: response.skillId
            }
          );
        }, 150);
      }, (errorMessage) => {
        this.alertsService.addWarning(errorMessage);
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }
}

angular.module('oppia').service('CreateNewSkillModalService',
  downgradeInjectable(CreateNewSkillModalService));
