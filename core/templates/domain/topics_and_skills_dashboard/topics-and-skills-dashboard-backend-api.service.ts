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

import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';

import {
  AssignedSkill,
  AssignedSkillBackendDict,
} from 'domain/skill/assigned-skill.model';
import {
  AugmentedSkillSummary,
  AugmentedSkillSummaryBackendDict,
} from 'domain/skill/augmented-skill-summary.model';
import {
  ShortSkillSummary,
  ShortSkillSummaryBackendDict,
} from 'domain/skill/short-skill-summary.model';
import {
  SkillSummary,
  SkillSummaryBackendDict,
} from 'domain/skill/skill-summary.model';
import {
  TopicsAndSkillsDashboardDomainConstants,
  // eslint-disable-next-line max-len
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants';
import {
  TopicsAndSkillsDashboardFilter,
  // eslint-disable-next-line max-len
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';
import {
  CreatorTopicSummary,
  CreatorTopicSummaryBackendDict,
} from 'domain/topic/creator-topic-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

interface CategorizedSkillsBackendDict {
  [topicName: string]: {
    uncategorized: ShortSkillSummaryBackendDict[];
    [subtopicName: string]: ShortSkillSummaryBackendDict[];
  };
}

export interface CategorizedSkills {
  [topicName: string]: {
    uncategorized: ShortSkillSummary[];
    [subtopicName: string]: ShortSkillSummary[];
  };
}

interface SubtopicSkills {
  [subtopicName: string]: ShortSkillSummary[];
  uncategorized: ShortSkillSummary[];
}

interface FetchTopicIdToDiagnosticTestSkillIdsBackendResponse {
  topic_id_to_diagnostic_test_skill_ids: {
    [topicId: string]: string[];
  };
}

export interface TopicIdToDiagnosticTestSkillIdsResponse {
  topicIdToDiagnosticTestSkillIds: {
    [topicId: string]: string[];
  };
}

export interface TopicsAndSkillsDashboardDataBackendDict {
  all_classroom_names: string[];
  untriaged_skill_summary_dicts: SkillSummaryBackendDict[];
  mergeable_skill_summary_dicts: SkillSummaryBackendDict[];
  topic_summary_dicts: CreatorTopicSummaryBackendDict[];
  can_delete_topic: boolean;
  can_create_topic: boolean;
  can_delete_skill: boolean;
  can_create_skill: boolean;
  total_skill_count: number;
  categorized_skills_dict: CategorizedSkillsBackendDict;
}

export interface CategorizedAndUntriagedSkillsDataBackendDict {
  untriaged_skill_summary_dicts: ShortSkillSummaryBackendDict[];
  categorized_skills_dict: CategorizedSkillsBackendDict;
}

export interface TopicsAndSkillDashboardData {
  allClassroomNames: string[];
  canDeleteTopic: boolean;
  canCreateTopic: boolean;
  canDeleteSkill: boolean;
  canCreateSkill: boolean;
  untriagedSkillSummaries: SkillSummary[];
  mergeableSkillSummaries: SkillSummary[];
  totalSkillCount: number;
  topicSummaries: CreatorTopicSummary[];
  categorizedSkillsDict: CategorizedSkills;
}

export interface CategorizedAndUntriagedSkillsData {
  untriagedSkillSummaries: ShortSkillSummary[];
  categorizedSkillsDict: CategorizedSkills;
}

export interface SkillsDashboardDataBackendDict {
  skill_summary_dicts: AugmentedSkillSummaryBackendDict[];
  next_cursor: string | null;
  more: boolean;
}

export interface SkillsDashboardData {
  skillSummaries: AugmentedSkillSummary[];
  nextCursor: string | null;
  more: boolean;
}

export interface AssignedSkillDataBackendDict {
  topic_assignment_dicts: AssignedSkillBackendDict[];
}

@Injectable({
  providedIn: 'root',
})
export class TopicsAndSkillsDashboardBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _topicsAndSkillsDashboardReinitializedEventEmitter =
    new EventEmitter<boolean>();

  async fetchDashboardDataAsync(): Promise<TopicsAndSkillDashboardData> {
    return this.http
      .get<TopicsAndSkillsDashboardDataBackendDict>(
        '/topics_and_skills_dashboard/data'
      )
      .toPromise()
      .then(
        response => {
          let categorizedSkills: CategorizedSkills = {};
          for (let topic in response.categorized_skills_dict) {
            let subtopicSkillsDict = response.categorized_skills_dict[topic];
            let subtopicSkills: SubtopicSkills = {
              uncategorized: [],
            };
            for (let subtopic in subtopicSkillsDict) {
              subtopicSkills[subtopic] = subtopicSkillsDict[subtopic].map(
                backendDict =>
                  ShortSkillSummary.createFromBackendDict(backendDict)
              );
            }
            categorizedSkills[topic] = subtopicSkills;
          }

          return {
            allClassroomNames: response.all_classroom_names,
            canCreateSkill: response.can_create_skill,
            canCreateTopic: response.can_create_topic,
            canDeleteSkill: response.can_delete_skill,
            canDeleteTopic: response.can_delete_topic,
            untriagedSkillSummaries: response.untriaged_skill_summary_dicts.map(
              backendDict => SkillSummary.createFromBackendDict(backendDict)
            ),
            mergeableSkillSummaries: response.mergeable_skill_summary_dicts.map(
              backendDict => SkillSummary.createFromBackendDict(backendDict)
            ),
            totalSkillCount: response.total_skill_count,
            topicSummaries: response.topic_summary_dicts.map(backendDict =>
              CreatorTopicSummary.createFromBackendDict(backendDict)
            ),
            categorizedSkillsDict: categorizedSkills,
          };
        },
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }

  async fetchCategorizedAndUntriagedSkillsDataAsync(): Promise<CategorizedAndUntriagedSkillsData> {
    return this.http
      .get<CategorizedAndUntriagedSkillsDataBackendDict>(
        '/topics_and_skills_dashboard/categorized_and_untriaged_skills_data'
      )
      .toPromise()
      .then(
        response => {
          let categorizedSkills: CategorizedSkills = {};
          for (let topic in response.categorized_skills_dict) {
            let subtopicSkillsDict = response.categorized_skills_dict[topic];
            let subtopicSkills: SubtopicSkills = {
              uncategorized: [],
            };
            for (let subtopic in subtopicSkillsDict) {
              subtopicSkills[subtopic] = subtopicSkillsDict[subtopic].map(
                backendDict =>
                  ShortSkillSummary.createFromBackendDict(backendDict)
              );
            }
            categorizedSkills[topic] = subtopicSkills;
          }

          return {
            untriagedSkillSummaries: response.untriaged_skill_summary_dicts.map(
              backendDict =>
                ShortSkillSummary.createFromBackendDict(backendDict)
            ),
            categorizedSkillsDict: categorizedSkills,
          };
        },
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }

  async fetchTopicAssignmentsForSkillAsync(
    skillId: string
  ): Promise<AssignedSkill[]> {
    const assignSkillDataUrl = this.urlInterpolationService.interpolateUrl(
      '/topics_and_skills_dashboard/unassign_skill/<skill_id>',
      {
        skill_id: skillId,
      }
    );
    return this.http
      .get<AssignedSkillDataBackendDict>(assignSkillDataUrl)
      .toPromise()
      .then(
        dict => {
          return dict.topic_assignment_dicts.map(backendDict =>
            AssignedSkill.createFromBackendDict(backendDict)
          );
        },
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }

  private _fetchTopicIdToDiagnosticTestSkillIdsAsync(
    topicIds: string[],
    successCallback: (value: TopicIdToDiagnosticTestSkillIdsResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    const topicIdToSkillIdsUrl = this.urlInterpolationService.interpolateUrl(
      'topic_id_to_diagnostic_test_skill_ids_handler' +
        '/?comma_separated_topic_ids=<comma_separated_topic_ids>',
      {
        comma_separated_topic_ids: topicIds.join(','),
      }
    );
    this.http
      .get<FetchTopicIdToDiagnosticTestSkillIdsBackendResponse>(
        topicIdToSkillIdsUrl
      )
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback({
              topicIdToDiagnosticTestSkillIds:
                response.topic_id_to_diagnostic_test_skill_ids,
            });
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        }
      );
  }

  async fetchTopicIdToDiagnosticTestSkillIdsAsync(
    topicIds: string[]
  ): Promise<TopicIdToDiagnosticTestSkillIdsResponse> {
    return new Promise((resolve, reject) => {
      this._fetchTopicIdToDiagnosticTestSkillIdsAsync(
        topicIds,
        resolve,
        reject
      );
    });
  }

  async fetchSkillsDashboardDataAsync(
    filter: TopicsAndSkillsDashboardFilter,
    itemsPerPage: number,
    nextCursor: string | null
  ): Promise<SkillsDashboardData> {
    return this.http
      .post<SkillsDashboardDataBackendDict>(
        TopicsAndSkillsDashboardDomainConstants.SKILL_DASHBOARD_DATA_URL,
        {
          classroom_name: filter.classroom,
          status: filter.status,
          sort: filter.sort,
          keywords: filter.keywords,
          num_skills_to_fetch: itemsPerPage,
          next_cursor: nextCursor,
        }
      )
      .toPromise()
      .then(
        response => {
          return {
            skillSummaries: response.skill_summary_dicts.map(backendDict =>
              AugmentedSkillSummary.createFromBackendDict(backendDict)
            ),
            nextCursor: response.next_cursor,
            more: response.more,
          };
        },
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }

  async mergeSkillsAsync(
    oldSkillId: string,
    newSkillId: string
  ): Promise<void> {
    let mergeSkillsData = {
      old_skill_id: oldSkillId,
      new_skill_id: newSkillId,
    };
    return this.http
      .post<void>(
        TopicsAndSkillsDashboardDomainConstants.MERGE_SKILLS_URL,
        mergeSkillsData
      )
      .toPromise()
      .then(
        response => response,
        erroResponse => {
          throw new Error(erroResponse.error.error);
        }
      );
  }

  get onTopicsAndSkillsDashboardReinitialized(): EventEmitter<boolean> {
    return this._topicsAndSkillsDashboardReinitializedEventEmitter;
  }
}
