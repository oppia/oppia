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

export enum ETopicSortOptions {
  IncreasingCreatedOn = 'Newly Created',
  DecreasingCreatedOn = 'Oldest Created',
  IncreasingUpdatedOn = 'Most Recently Updated',
  DecreasingUpdatedOn = 'Least Recently Updated',
}

export enum ETopicPublishedOptions {
  All = 'All',
  Published = 'Published',
  NotPublished = 'Not Published'
}

export class TopicsAndSkillsDashboardPageConstants {
  public static EVENT_TYPE_TOPIC_CREATION_ENABLED = 'topicCreationEnabled';

  public static EVENT_TYPE_SKILL_CREATION_ENABLED = 'skillCreationEnabled';

  public static EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED =
    'topicsAndSkillsDashboardReinitialized';

  public static SKILL_DESCRIPTION_STATUS_VALUES = {
    STATUS_UNCHANGED: 'unchanged',
    STATUS_CHANGED: 'changed',
    STATUS_DISABLED: 'disabled'
  };
  public static TOPIC_SORT_OPTIONS = ETopicSortOptions;
  public static TOPIC_PUBLISHED_OPTIONS = ETopicPublishedOptions;
  public static TOPIC_FILTER_CLASSROOM_ALL = 'All';
}
