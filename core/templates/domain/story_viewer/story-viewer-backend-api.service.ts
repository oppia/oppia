// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to get story data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { StoryViewerDomainConstants } from
  'domain/story_viewer/story-viewer-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class StoryViewerBackendApiService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  _fetchStoryData(storyId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    let storyDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryViewerDomainConstants.STORY_DATA_URL_TEMPLATE, {
        story_id: storyId
      });

    this.http.get(storyDataUrl).toPromise().then((data) => {
      if (successCallback) {
        successCallback(data);
      }
    }, (error) => {
      if (errorCallback) {
        errorCallback(error);
      }
    });
  }

  _recordChapterCompletion(storyId: string, nodeId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    let chapterCompletionUrl = this.urlInterpolationService.interpolateUrl(
      StoryViewerDomainConstants.STORY_PROGRESS_URL_TEMPLATE, {
        story_id: storyId,
        node_id: nodeId
      });
    this.http.post(chapterCompletionUrl, {}).toPromise().then((data: any) => {
      successCallback({
        summaries: data.summaries,
        nextNodeId: data.next_node_id,
        readyForReviewTest: data.ready_for_review_test});
    });
  }

  fetchStoryData(storyId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchStoryData(storyId, resolve, reject);
    });
  }

  recordChapterCompletion(storyId: string, nodeId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._recordChapterCompletion(storyId, nodeId, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'StoryViewerBackendApiService',
  downgradeInjectable(StoryViewerBackendApiService));
