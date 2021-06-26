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
 * @fileoverview Service for topics and skills dashboard page.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { CreatorTopicSummary } from
  'domain/topic/creator-topic-summary.model';
// eslint-disable-next-line max-len
import { TopicsAndSkillsDashboardFilter } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';
import { TopicsAndSkillsDashboardPageConstants } from
  // eslint-disable-next-line max-len
  'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';

@Injectable({
  providedIn: 'root'
})
export class TopicsAndSkillsDashboardPageService {
  /**
   * @param {Array} topicsArray - The original topics array
   * @param {TopicsAndSkillsDashboardFilter} filterObject -
   * the filter object values
   * @returns {Array} filteredTopics - The filtered Topics array
   */
  getFilteredTopics(
      topicsArray: CreatorTopicSummary[],
      filterObject: TopicsAndSkillsDashboardFilter): CreatorTopicSummary[] {
    let ESortOptions = TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS;
    let EPublishedOptions = (
      TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS);
    let filteredTopics = topicsArray;

    if (filterObject.keywords.length) {
      filteredTopics = topicsArray.filter((topic) => {
        for (let keyword of filterObject.keywords) {
          if (topic.name.toLowerCase().includes(keyword.toLowerCase()) ||
              topic.description.toLowerCase().includes(keyword.toLowerCase())) {
            return true;
          }
        }
        return false;
      });
    }

    if (filterObject.classroom !==
        TopicsAndSkillsDashboardPageConstants.TOPIC_FILTER_CLASSROOM_ALL) {
      filteredTopics = filteredTopics.filter((topic) => {
        if (filterObject.classroom === 'Unassigned' && !topic.classroom) {
          return true;
        }
        return (
          topic.classroom && filterObject.classroom.toLowerCase() ===
            topic.classroom.toLowerCase());
      });
    }

    if (filterObject.status !== EPublishedOptions.All) {
      filteredTopics = filteredTopics.filter((topic) => {
        if (filterObject.status === EPublishedOptions.Published &&
            topic.isPublished) {
          return true;
        } else if (
          filterObject.status === EPublishedOptions.NotPublished &&
            !topic.isPublished) {
          return true;
        }
        return false;
      });
    }

    switch (filterObject.sort) {
      case ESortOptions.IncreasingUpdatedOn:
        filteredTopics.sort((a, b) => (
          b.topicModelCreatedOn - a.topicModelCreatedOn));
        break;
      case ESortOptions.DecreasingUpdatedOn:
        filteredTopics.sort(
          (a, b) => -(b.topicModelCreatedOn - a.topicModelCreatedOn));
        break;
      case ESortOptions.IncreasingCreatedOn:
        filteredTopics.sort(
          (a, b) => (b.topicModelLastUpdated - a.topicModelLastUpdated));
        break;
      case ESortOptions.DecreasingCreatedOn:
        filteredTopics.sort(
          (a, b) => -(b.topicModelLastUpdated - a.topicModelLastUpdated));
        break;
      default:
        throw new Error('Invalid filter by sort value provided.');
    }

    return filteredTopics;
  }
}

angular.module('oppia').factory(
  'TopicsAndSkillsDashboardPageService',
  downgradeInjectable(TopicsAndSkillsDashboardPageService));
