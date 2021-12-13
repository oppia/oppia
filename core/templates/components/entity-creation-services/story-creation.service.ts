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
 * @fileoverview Modal and functionality for the create story button.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AlertsService } from 'services/alerts.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { LoaderService } from 'services/loader.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CreateNewStoryModalComponent } from 'pages/topic-editor-page/modal-templates/create-new-story-modal.component';
import { StoryCreationBackendApiService } from './story-creation-backend-api.service';
import { ContextService } from 'services/context.service';

@Injectable({
  providedIn: 'root'
})
export class StoryCreationService {
  STORY_EDITOR_URL_TEMPLATE: string = '/story_editor/<story_id>';
  storyCreationInProgress: boolean = false;

  constructor(
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private alertsService: AlertsService,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private loaderService: LoaderService,
    private storyCreationBackendApiService: StoryCreationBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  createNewCanonicalStory(): void {
    if (this.storyCreationInProgress) {
      return;
    }
    this.contextService.setImageSaveDestinationToLocalStorage();
    let modalRef = this.ngbModal.open(CreateNewStoryModalComponent, {
      backdrop: 'static',
      windowClass: 'create-new-story',
    });

    modalRef.result.then((newlyCreatedStory) => {
      if (!newlyCreatedStory.isValid()) {
        throw new Error('Story fields cannot be empty');
      }
      this.storyCreationInProgress = true;
      this.alertsService.clearWarnings();
      this.loaderService.showLoadingScreen('Creating story');
      let newTab = this.windowRef.nativeWindow;
      let imagesData = this.imageLocalStorageService.getStoredImagesData();
      let bgColor = this.imageLocalStorageService.getThumbnailBgColor();
      this.storyCreationBackendApiService.createStoryAsync(
        newlyCreatedStory, imagesData, bgColor).then((response) => {
        this.storyCreationInProgress = false;
        this.contextService.resetImageSaveDestination();
        newTab.location.href = this.urlInterpolationService.interpolateUrl(
          this.STORY_EDITOR_URL_TEMPLATE, {
            story_id: response.storyId
          });
      }, (errorResponse) => {
        this.storyCreationInProgress = false;
        this.loaderService.hideLoadingScreen();
        this.imageLocalStorageService.flushStoredImagesData();
        this.alertsService.addWarning(errorResponse.error);
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }
}

angular.module('oppia').factory('StoryCreationService',
  downgradeInjectable(StoryCreationService));
