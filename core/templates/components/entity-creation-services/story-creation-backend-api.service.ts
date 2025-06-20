// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CreateNewStoryModalComponent} from 'pages/topic-editor-page/modal-templates/create-new-story-modal.component';
import {TopicEditorStateService} from 'pages/topic-editor-page/services/topic-editor-state.service';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {LoaderService} from 'services/loader.service';

interface StoryCreationResponse {
  storyId: string;
}

@Injectable({
  providedIn: 'root',
})
export class StoryCreationBackendApiService {
  constructor(
    private alertsService: AlertsService,
    private http: HttpClient,
    private imageLocalStorageService: ImageLocalStorageService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private topicEditorStateService: TopicEditorStateService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  STORY_EDITOR_URL_TEMPLATE = '/story_editor/<story_id>';
  STORY_CREATOR_URL_TEMPLATE = '/topic_editor_story_handler/<topic_id>';
  storyCreationInProgress = false;

  private _createStory(
    createStoryUrl: string,
    body: FormData,
    successCallback: (value: StoryCreationResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    this.http
      .post<StoryCreationResponse>(createStoryUrl, body)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback({
              storyId: response.storyId,
            });
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  async createStoryAsync(
    createStoryUrl: string,
    body: FormData
  ): Promise<StoryCreationResponse> {
    return new Promise((resolve, reject) => {
      this._createStory(createStoryUrl, body, resolve, reject);
    });
  }

  createNewCanonicalStory(): void {
    if (this.storyCreationInProgress) {
      return;
    }

    const modalRef = this.ngbModal.open(CreateNewStoryModalComponent, {
      backdrop: 'static',
    });
    modalRef.result.then(
      newlyCreatedStory => {
        if (!newlyCreatedStory.isValid()) {
          throw new Error('Story fields cannot be empty');
        }
        this.storyCreationInProgress = true;
        this.alertsService.clearWarnings();
        let topic = this.topicEditorStateService.getTopic();
        this.loaderService.showLoadingScreen('Creating story');
        let createStoryUrl = this.urlInterpolationService.interpolateUrl(
          this.STORY_CREATOR_URL_TEMPLATE,
          {
            topic_id: topic.getId(),
          }
        );
        let imagesData = this.imageLocalStorageService.getStoredImagesData();
        let bgColor = this.imageLocalStorageService.getThumbnailBgColor();
        let postData = {
          title: newlyCreatedStory.title,
          description: newlyCreatedStory.description,
          story_url_fragment: newlyCreatedStory.urlFragment,
          thumbnailBgColor: bgColor,
          filename: imagesData[0].filename,
        };

        let body = new FormData();
        body.append('payload', JSON.stringify(postData));
        body.append('image', imagesData[0].imageBlob);

        this.createStoryAsync(createStoryUrl, body).then(
          response => {
            this.windowRef.nativeWindow.location.href =
              this.urlInterpolationService.interpolateUrl(
                this.STORY_EDITOR_URL_TEMPLATE,
                {
                  story_id: response.storyId,
                }
              );
          },
          () => {
            this.loaderService.hideLoadingScreen();
            this.imageLocalStorageService.flushStoredImagesData();
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
}
