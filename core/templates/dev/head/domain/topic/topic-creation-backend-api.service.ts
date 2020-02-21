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
import { downgradeInjectable } from "@angular/upgrade/static";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})

export class TopicCreationBackendApiService {
  topicDataDict: any;
  constructor(
    private http: HttpClient) { }

  _createTopic(successCallback, errorCallback, topicName, abbreviatedTopicName): void  {
    let postData = {
      name: topicName,
      abbreviated_name: abbreviatedTopicName
    }
    this.http.post(
      '/topic_editor_handler/create_new', postData).toPromise()
      .then((response:any) => {
        console.log(response);
        if (successCallback) {
          successCallback({
            topicId:response.topic_id
          });
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.body)
          console.log(errorResponse)
        }
      });
  }

  createTopic(topicName: string, abbreviatedTopicName: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._createTopic(resolve, reject, topicName, abbreviatedTopicName)
    });
  }
}
angular.module('oppia').factory('TopicCreationBackendApiService',
  downgradeInjectable(TopicCreationBackendApiService));
