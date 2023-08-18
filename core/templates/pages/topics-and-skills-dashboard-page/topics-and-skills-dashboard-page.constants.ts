// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the topics and skills dashboard.
 */
import { AppConstants } from 'app.constants';

export enum ETopicSortOptions {
  IncreasingCreatedOn = 'Newly Created',
  DecreasingCreatedOn = 'Oldest Created',
  IncreasingUpdatedOn = 'Most Recently Updated',
  DecreasingUpdatedOn = 'Least Recently Updated',
}

export enum ETopicNewSortingOptions {
  IncreasingCreatedOn = 'Newly Created',
  DecreasingCreatedOn = 'Oldest Created',
  IncreasingUpdatedOn = 'Most Recently Updated',
  DecreasingUpdatedOn = 'Least Recently Updated',
  DecreasingUpcomingLaunches = 'Most Upcoming Launches',
  DecreasingOverdueLaunches = 'Most Launches Behind Schedule'
}

export enum ETopicPublishedOptions {
  All = 'All',
  Published = 'Published',
  NotPublished = 'Not Published'
}

export enum ETopicStatusOptions {
  All = 'All',
  FullyPublished = 'Fully Published',
  PartiallyPublished = 'Partially Published',
  NotPublished = 'Not Published',
}

export const TopicsAndSkillsDashboardPageConstants = {
  SKILL_DESCRIPTION_STATUS_VALUES: {
    STATUS_UNCHANGED: 'unchanged',
    STATUS_CHANGED: 'changed',
    STATUS_DISABLED: 'disabled'
  },
  TOPIC_SORT_OPTIONS: (
    AppConstants.TOPIC_SKILL_DASHBOARD_SORT_OPTIONS),
  TOPIC_SORTING_OPTIONS: (
    AppConstants.TOPIC_SKILL_DASHBOARD_SORTING_OPTIONS),
  TOPIC_PUBLISHED_OPTIONS: ETopicPublishedOptions,
  TOPIC_STATUS_OPTIONS: ETopicStatusOptions,
  TOPIC_FILTER_CLASSROOM_ALL: 'All',
  SKILL_STATUS_OPTIONS: AppConstants.SKILL_STATUS_OPTIONS
} as const;
