// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for goal list
 */

import {Component, Input, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {StoryNode} from 'domain/story/story-node.model';
@Component({
  selector: 'oppia-goal-list',
  templateUrl: './goal-list.component.html',
})
export class GoalListComponent implements OnInit {
  @Input() goalTopic!: LearnerTopicSummary;

  imgUrl: string = '';
  displayAllNodes: boolean = false;
  allCurrentNodes: number[] = [];

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.imgUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.TOPIC,
      this.goalTopic.getId(),
      this.goalTopic.getThumbnailFilename()
    );

    this.allCurrentNodes = this.goalTopic
      .getCanonicalStorySummaryDicts()
      .map(story => this.getMostRecentCompletedNode(story));
  }

  getStoryProgress(story: StorySummary): number {
    return (
      (story.getCompletedNodeTitles().length / story.getNodeTitles().length) *
      100
    );
  }

  getNodeLessonUrl(story: StorySummary, currentNode: StoryNode): string {
    const explorationId = currentNode.getExplorationId();
    if (
      !story.getClassroomUrlFragment() ||
      !story.getTopicUrlFragment() ||
      explorationId === null
    ) {
      throw new Error('Class and/or topic does not exist');
    }
    let resultUrl = this.urlInterpolationService.interpolateUrl(
      '/explore/<exp_id>',
      {exp_id: explorationId}
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'topic_url_fragment',
      story.getTopicUrlFragment() || ''
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'classroom_url_fragment',
      story.getClassroomUrlFragment() || ''
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'story_url_fragment',
      story.getUrlFragment()
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'node_id',
      currentNode.getId()
    );
    return resultUrl;
  }

  /* TODO(#18384): Is there a way to check for nodes started but not completed (progress?) */
  /* TODO(#18384): Are completed nodes added in order of completion or in order of topic sequence? */
  /* TODO(#18384): What if completed the last possible story node, but not ones prior? What would be the next node? Would the story be considered completed? */
  getMostRecentCompletedNode(story: StorySummary): number {
    const allNodes = story.getAllNodes();
    let earliestCompletedNode = 0;
    if (story.getCompletedNodeTitles().length === 0) {
      earliestCompletedNode = -1;
    } else if (story.getCompletedNodeTitles().length === allNodes.length) {
      earliestCompletedNode = allNodes.length - 1;
    } else {
      const orderedCompletedTitles = [];
      for (let i = 0; i < allNodes.length; i++) {
        if (story.isNodeCompleted(allNodes[i].getTitle())) {
          orderedCompletedTitles.push(i);
        }
      }

      let earliestNode = orderedCompletedTitles[0];
      if (orderedCompletedTitles.length > 1) {
        let currentNode = 1;
        while (earliestNode + 1 === orderedCompletedTitles[currentNode]) {
          earliestNode = orderedCompletedTitles[currentNode];
          currentNode++;
        }
      }
      if (
        earliestNode === allNodes.length - 1 &&
        orderedCompletedTitles.length !== allNodes.length
      ) {
        earliestNode = -1;
      }
      earliestCompletedNode = earliestNode;
    }
    return earliestCompletedNode + 1;
  }

  handleToggleState(updateState: boolean): void {
    this.displayAllNodes = updateState;
  }
}
