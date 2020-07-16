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
 * @fileoverview Service to retrieve information of topics and skills dashboard
  from the backend and to merge skills from the dashboard.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  AssignedSkillObjectFactory,
  AssignedSkill,
  AssignedSkillBackendDict
} from 'domain/skill/assigned-skill-object.factory';
import {
  AugmentedSkillSummaryObjectFactory,
  AugmentedSkillSummaryBackendDict,
  AugmentedSkillSummary
} from 'domain/skill/augmented-skill-summary-object.factory';
import {
  ShortSkillSummaryBackendDict,
  ShortSkillSummary,
  ShortSkillSummaryObjectFactory
} from 'domain/skill/ShortSkillSummaryObjectFactory';
import { SkillSummaryObjectFactory, SkillSummary, SkillSummaryBackendDict } from
  'domain/skill/skill-summary-object.factory';
import { TopicsAndSkillsDashboardDomainConstants } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants';
import {
  TopicsAndSkillsDashboardFilter
// eslint-disable-next-line max-len
} from 'domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardFilterObjectFactory';
import { TopicSummaryObjectFactory, TopicSummary, TopicSummaryBackendDict } from
  'domain/topic/TopicSummaryObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface CategorizedSkillsBackendDict {
  [topicName: string]: {
    uncategorized: ShortSkillSummaryBackendDict[];
    [subtopicName: string]: ShortSkillSummaryBackendDict[];
  };
}

interface CategorizedSkills {
  [topicName: string]: {
    uncategorized: ShortSkillSummary[];
    [subtopicName: string]: ShortSkillSummary[];
  };
}

interface TopicsAndSkillsDashboardDataBackendDict {
  'all_classroom_names': string[];
  'untriaged_skill_summary_dicts': SkillSummaryBackendDict[];
  'mergeable_skill_summary_dicts': SkillSummaryBackendDict[];
  'topic_summary_dicts': TopicSummaryBackendDict[];
  'can_delete_topic': boolean;
  'can_create_topic': boolean;
  'can_delete_skill': boolean;
  'can_create_skill': boolean;
  'total_skill_count': number;
  'categorized_skills_dict': CategorizedSkillsBackendDict;
}

interface TopicsAndSkillDashboardData {
  allClassroomNames: string[];
  canDeleteTopic: boolean;
  canCreateTopic: boolean;
  canDeleteSkill: boolean;
  canCreateSkill: boolean;
  untriagedSkillSummaries: SkillSummary[];
  mergeableSkillSummaries: SkillSummary[];
  totalSkillCount: number;
  topicSummaries: TopicSummary[];
  categorizedSkillsDict: CategorizedSkills;
}

interface SkillsDashboardDataBackendDict {
  'skill_summary_dicts': AugmentedSkillSummaryBackendDict[];
  'next_cursor': string;
  'more': boolean;
}

interface SkillsDashboardData {
  skillSummaries: AugmentedSkillSummary[];
  nextCursor: string;
  more: boolean;
}

interface AssignedSkillDataBackendDict {
  'topic_assignment_dicts': AssignedSkillBackendDict[];
}

@Injectable({
  providedIn: 'root'
})

export class TopicsAndSkillsDashboardBackendApiService {
  constructor(
    private assignedSkillObjectFactory: AssignedSkillObjectFactory,
    private augmentedSkillSummaryObjectFactory:
    AugmentedSkillSummaryObjectFactory,
    private http: HttpClient,
    private shortSkillSummaryObjectFactory: ShortSkillSummaryObjectFactory,
    private skillSummaryObjectFactory: SkillSummaryObjectFactory,
    private topicSummaryObjectFactory: TopicSummaryObjectFactory,
    private urlInterpolationService: UrlInterpolationService) {}

  fetchDashboardData(): Promise<TopicsAndSkillDashboardData> {
    return this.http.get<TopicsAndSkillsDashboardDataBackendDict>(
      '/topics_and_skills_dashboard/data').toPromise().then(response => {
      let categorizedSkills = {};
      for (let topic in response.categorized_skills_dict) {
        let subtopicSkillsDict = response.categorized_skills_dict[topic];
        let subtopicSkills = {};
        for (let subtopic in subtopicSkillsDict) {
          subtopicSkills[subtopic] = (
            subtopicSkillsDict[subtopic].map(
              backendDict => this.shortSkillSummaryObjectFactory
                .createFromBackendDict(backendDict)));
        }
        categorizedSkills[topic] = subtopicSkills;
      }

      return {
        allClassroomNames: response.all_classroom_names,
        canCreateSkill: response.can_create_skill,
        canCreateTopic: response.can_create_topic,
        canDeleteSkill: response.can_delete_skill,
        canDeleteTopic: response.can_delete_topic,
        untriagedSkillSummaries: (
          response.untriaged_skill_summary_dicts.map(
            backendDict => this.skillSummaryObjectFactory
              .createFromBackendDict(backendDict))),
        mergeableSkillSummaries: (
          response.mergeable_skill_summary_dicts.map(
            backendDict => this.skillSummaryObjectFactory
              .createFromBackendDict(backendDict))),
        totalSkillCount: response.total_skill_count,
        topicSummaries: (
          response.topic_summary_dicts.map(
            backendDict => this.topicSummaryObjectFactory
              .createFromBackendDict(backendDict))),
        categorizedSkillsDict: categorizedSkills
      };
    });
  }

  fetchTopicAssignmentsForSkill(skillId: string): Promise<AssignedSkill[]> {
    const assignSkillDataUrl = this.urlInterpolationService.interpolateUrl(
      '/topics_and_skills_dashboard/unassign_skill/<skill_id>', {
        skill_id: skillId
      });
    return this.http.get<AssignedSkillDataBackendDict>(
      assignSkillDataUrl).toPromise().then(dict => {
      return dict.topic_assignment_dicts.map(
        backendDict => this.assignedSkillObjectFactory
          .createFromBackendDict(backendDict));
    });
  }

  fetchSkillsDashboardData(
      filter: TopicsAndSkillsDashboardFilter,
      itemsPerPage, nextCursor): Promise<SkillsDashboardData> {
    return this.http.post<SkillsDashboardDataBackendDict>(
      TopicsAndSkillsDashboardDomainConstants.SKILL_DASHBOARD_DATA_URL, {
        classroom_name: filter.classroom,
        status: filter.status,
        sort: filter.sort,
        keywords: filter.keywords,
        num_skills_to_fetch: itemsPerPage,
        next_cursor: nextCursor
      }).toPromise().then(response => {
      return {
        skillSummaries: response.skill_summary_dicts.map(
          backendDict => this.augmentedSkillSummaryObjectFactory
            .createFromBackendDict(backendDict)),
        nextCursor: response.next_cursor,
        more: response.more
      };
    });
  }

  mergeSkills(oldSkillId:string, newSkillId:string): Promise<void> {
    let mergeSkillsData = {
      old_skill_id: oldSkillId,
      new_skill_id: newSkillId
    };
    return this.http.post<void>(
      TopicsAndSkillsDashboardDomainConstants.MERGE_SKILLS_URL,
      mergeSkillsData).toPromise();
  }
}
angular.module('oppia').factory(
  'TopicsAndSkillsDashboardBackendApiService',
  downgradeInjectable(TopicsAndSkillsDashboardBackendApiService));
