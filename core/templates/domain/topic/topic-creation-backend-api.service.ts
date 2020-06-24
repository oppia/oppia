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

import { IImageData } from 'domain/skill/skill-creation-backend-api.service';
import { NewlyCreatedTopic } from
  'domain/topics_and_skills_dashboard/NewlyCreatedTopicObjectFactory';

export interface ITopicCreationBackend {
  name: string;
  thumbnailBgColor: string;
  description: string;
  filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class TopicCreationBackendApiService {
  constructor(private http: HttpClient) { }

  _createTopic(
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback:(reason?: any) => void,
      topic: NewlyCreatedTopic, imagesData: IImageData[],
      bgColor: string): void {
    let postData: ITopicCreationBackend = {
      name: topic.name,
      description: topic.description,
      thumbnailBgColor: bgColor,
      filename: imagesData[0].filename
    };

    let body = new FormData();
    body.append('payload', JSON.stringify(postData));
    body.append('image', imagesData[0].imageBlob);

    this.http.post(
      '/topic_editor_handler/create_new', body).toPromise()
      .then((response: { topicId: string }) => {
        if (successCallback) {
          successCallback({
            topicId: response.topicId
          });
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  createTopic(
      topic: NewlyCreatedTopic, imagesData: IImageData[],
      bgColor: string): PromiseLike<Object> {
    return new Promise((resolve, reject) => {
      this._createTopic(resolve, reject, topic, imagesData, bgColor);
    });
  }
}
angular.module('oppia').factory('TopicCreationBackendApiService',
  downgradeInjectable(TopicCreationBackendApiService));
