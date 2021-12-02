// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to notify about creation of topic and obtain
 * topic_id.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ImageData } from 'domain/skill/skill-creation-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { TopicEditorStateService } from 'pages/topic-editor-page/services/topic-editor-state.service';
import { NewlyCreatedStory } from 'domain/topic/newly-created-story.model';

interface StoryCreationResponse {
  storyId: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoryCreationBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private topicEditorStateService: TopicEditorStateService
  ) { }

  STORY_CREATOR_URL_TEMPLATE: string = '/topic_editor_story_handler/<topic_id>';

  _createStory(
      newlyCreatedStory: NewlyCreatedStory, imagesData: ImageData[],
      bgColor: string,
      successCallback: (value: StoryCreationResponse) => void,
      errorCallback: (reason: string) => void): void {
    let postData = {
      title: newlyCreatedStory.title,
      description: newlyCreatedStory.description,
      story_url_fragment: newlyCreatedStory.urlFragment,
      thumbnailBgColor: bgColor,
      filename: imagesData[0].filename
    };
    let topic = this.topicEditorStateService.getTopic();
    let createStoryUrl = this.urlInterpolationService.interpolateUrl(
      this.STORY_CREATOR_URL_TEMPLATE, {
        topic_id: topic.getId()
      }
    );
    let body = new FormData();
    body.append('payload', JSON.stringify(postData));
    body.append('image', imagesData[0].imageBlob);

    this.http.post<StoryCreationResponse>(
      createStoryUrl, body).toPromise()
      .then(response => {
        if (successCallback) {
          successCallback({
            storyId: response.storyId
          });
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error.error);
        }
      });
  }

  async createStoryAsync(
      newlyCreatedStory: NewlyCreatedStory, imagesData: ImageData[],
      bgColor: string): Promise<StoryCreationResponse> {
    return new Promise((resolve, reject) => {
      this._createStory(
        newlyCreatedStory, imagesData, bgColor, resolve, reject);
    });
  }
}

angular.module('oppia').factory('StoryCreationBackendApiService',
  downgradeInjectable(StoryCreationBackendApiService));
