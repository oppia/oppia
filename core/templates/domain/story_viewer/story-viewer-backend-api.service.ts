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

import {HttpClient} from '@angular/common/http';
import {Injectable, EventEmitter} from '@angular/core';

import {
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict,
} from 'domain/summary/learner-exploration-summary.model';
import {
  StoryPlaythrough,
  StoryPlaythroughBackendDict,
} from 'domain/story_viewer/story-playthrough.model';
import {StoryViewerDomainConstants} from 'domain/story_viewer/story-viewer-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  ChapterProgressSummary,
  ChapterProgressSummaryBackendDict,
} from 'domain/exploration/chapter-progress-summary.model';

interface StoryChapterCompletionBackendResponse {
  next_node_id: string;
  ready_for_review_test: boolean;
  summaries: LearnerExplorationSummaryBackendDict[];
}

export interface StoryChapterCompletionResponse {
  nextNodeId: string;
  readyForReviewTest: boolean;
  summaries: LearnerExplorationSummary[];
}

export interface StoryDataDict {
  topicName: string;
  storyTitle: string;
}

@Injectable({
  providedIn: 'root',
})
export class StoryViewerBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _storyDataEventEmitter = new EventEmitter<StoryDataDict>();

  _fetchStoryData(
    topicUrlFragment: string,
    classroomUrlFragment: string,
    storyUrlFragment: string,
    successCallback: (value: StoryPlaythrough) => void,
    errorCallback: (reason: string) => void
  ): void {
    let storyDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryViewerDomainConstants.STORY_DATA_URL_TEMPLATE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
        story_url_fragment: storyUrlFragment,
      }
    );

    this.http
      .get<StoryPlaythroughBackendDict>(storyDataUrl)
      .toPromise()
      .then(
        data => {
          if (successCallback) {
            let storyPlaythrough = StoryPlaythrough.createFromBackendDict(data);
            successCallback(storyPlaythrough);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  _recordChapterCompletion(
    topicUrlFragment: string,
    classroomUrlFragment: string,
    storyUrlFragment: string,
    nodeId: string,
    successCallback: (value: StoryChapterCompletionResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    let chapterCompletionUrl = this.urlInterpolationService.interpolateUrl(
      StoryViewerDomainConstants.STORY_PROGRESS_URL_TEMPLATE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
        story_url_fragment: storyUrlFragment,
        node_id: nodeId,
      }
    );
    this.http
      .post<StoryChapterCompletionBackendResponse>(chapterCompletionUrl, {})
      .toPromise()
      .then(
        data => {
          successCallback({
            summaries: data.summaries.map(expSummary =>
              LearnerExplorationSummary.createFromBackendDict(expSummary)
            ),
            nextNodeId: data.next_node_id,
            readyForReviewTest: data.ready_for_review_test,
          });
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        }
      );
  }

  async fetchStoryDataAsync(
    topicUrlFragment: string,
    classroomUrlFragment: string,
    storyUrlFragment: string
  ): Promise<StoryPlaythrough> {
    return new Promise((resolve, reject) => {
      this._fetchStoryData(
        topicUrlFragment,
        classroomUrlFragment,
        storyUrlFragment,
        resolve,
        reject
      );
    });
  }

  async recordChapterCompletionAsync(
    topicUrlFragment: string,
    classroomUrlFragment: string,
    storyUrlFragment: string,
    nodeId: string
  ): Promise<StoryChapterCompletionResponse> {
    return new Promise((resolve, reject) => {
      this._recordChapterCompletion(
        topicUrlFragment,
        classroomUrlFragment,
        storyUrlFragment,
        nodeId,
        resolve,
        reject
      );
    });
  }

  async fetchProgressInStoriesChapters(
    username: string,
    storyIds: string[]
  ): Promise<ChapterProgressSummary[]> {
    return new Promise((resolve, reject) => {
      const chaptersProgressUrl = this.urlInterpolationService.interpolateUrl(
        '/user_progress_in_stories_chapters_handler/<username>',
        {
          username: username,
        }
      );

      this.http
        .get<ChapterProgressSummaryBackendDict[]>(chaptersProgressUrl, {
          params: {
            story_ids: JSON.stringify(storyIds),
          },
        })
        .toPromise()
        .then(chaptersProgressInfo => {
          resolve(
            chaptersProgressInfo.map(progressInfo =>
              ChapterProgressSummary.createFromBackendDict(progressInfo)
            )
          );
        });
    });
  }

  get onSendStoryData(): EventEmitter<StoryDataDict> {
    return this._storyDataEventEmitter;
  }
}
