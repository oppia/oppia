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

import {
  LearnerExplorationSummaryBackendDict,
  LearnerExplorationSummary,
  LearnerExplorationSummaryObjectFactory
} from 'domain/summary/learner-exploration-summary-object.factory';
import {
  StoryPlaythroughBackendDict,
  StoryPlaythrough,
  StoryPlaythroughObjectFactory
} from 'domain/story_viewer/StoryPlaythroughObjectFactory';
import { StoryViewerDomainConstants } from
  'domain/story_viewer/story-viewer-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface StoryChapterCompletionBackendResponse {
  'next_node_id': string;
  'ready_for_review_test': boolean;
  'summaries': LearnerExplorationSummaryBackendDict[];
}

interface StoryChapterCompletionResponse {
  nextNodeId: string;
  readyForReviewTest: boolean;
  summaries: LearnerExplorationSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class StoryViewerBackendApiService {
  constructor(
    private learnerExplorationSummaryObjectFactory:
    LearnerExplorationSummaryObjectFactory,
    private http: HttpClient,
    private storyPlaythroughObjectFactory: StoryPlaythroughObjectFactory,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  _fetchStoryData(
      abbreviatedTopicName: string,
      classroomUrlFragment: string,
      storyId: string,
      successCallback: (value: StoryPlaythrough) => void,
      errorCallback: (reason: string) => void): void {
    let storyDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryViewerDomainConstants.STORY_DATA_URL_TEMPLATE, {
        abbreviated_topic_name: abbreviatedTopicName,
        classroom_url_fragment: classroomUrlFragment,
        story_id: storyId
      });

    this.http.get<StoryPlaythroughBackendDict>(
      storyDataUrl).toPromise().then(data => {
      if (successCallback) {
        let storyPlaythrough = this.storyPlaythroughObjectFactory
          .createFromBackendDict(data);
        successCallback(storyPlaythrough);
      }
    }, errorResponse => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  }

  _recordChapterCompletion(
      abbreviatedTopicName: string, classroomUrlFragment: string,
      storyId: string, nodeId: string,
      successCallback: (value: StoryChapterCompletionResponse) => void,
      errorCallback: (reason: string) => void): void {
    let chapterCompletionUrl = this.urlInterpolationService.interpolateUrl(
      StoryViewerDomainConstants.STORY_PROGRESS_URL_TEMPLATE, {
        abbreviated_topic_name: abbreviatedTopicName,
        classroom_url_fragment: classroomUrlFragment,
        story_id: storyId,
        node_id: nodeId
      });
    this.http.post<StoryChapterCompletionBackendResponse>(
      chapterCompletionUrl, {}
    ).toPromise().then(data => {
      successCallback({
        summaries: data.summaries.map(
          expSummary => this.learnerExplorationSummaryObjectFactory
            .createFromBackendDict(expSummary)),
        nextNodeId: data.next_node_id,
        readyForReviewTest: data.ready_for_review_test});
    }, errorResponse => {
      errorCallback(errorResponse.error.error);
    });
  }

  fetchStoryData(
      abbreviatedTopicName:string,
      classroomUrlFragment: string,
      storyId: string): Promise<StoryPlaythrough> {
    return new Promise((resolve, reject) => {
      this._fetchStoryData(
        abbreviatedTopicName, classroomUrlFragment, storyId, resolve, reject);
    });
  }

  recordChapterCompletion(
      abbreviatedTopicName: string,
      classroomUrlFragment: string,
      storyId: string,
      nodeId: string): Promise<StoryChapterCompletionResponse> {
    return new Promise((resolve, reject) => {
      this._recordChapterCompletion(
        abbreviatedTopicName, classroomUrlFragment, storyId,
        nodeId, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'StoryViewerBackendApiService',
  downgradeInjectable(StoryViewerBackendApiService));
