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
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TopicsAndSkillsDashboardDomainConstants } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants';

export interface ITopicSummaryBackendDict {
    'id': string;
    'name': string;
    'classroom': string;
    'language_code': string;
    'description': string;
    'version': number;
    'is_published': boolean;
    'canonical_story_count': number;
    'additional_story_count': number;
    'uncategorized_skill_count': number;
    'subtopic_count': number;
    'total_skill_count': number;
    'topic_model_created_on': number;
    'topic_model_last_updated': number;
  }

  interface ISkillSummaryBackendDict {
    'id': string;
    'description': string;
    'language_code': string;
    'version': number;
    'misconception_count': number;
    'worked_examples_count': number;
    'skill_model_created_on': number;
    'skill_model_last_updated': number;
  }

  interface ITopicsAndSkillsDashboardDataBackendDict {
    'all_classroom_names': string[];
    'untriaged_skill_summary_dicts': ISkillSummaryBackendDict[];
    'mergeable_skill_summary_dicts': ISkillSummaryBackendDict[];
    'topic_summary_dicts': ITopicSummaryBackendDict[];
    'can_delete_topic': boolean;
    'can_create_topic': boolean;
    'can_delete_skill': boolean;
    'can_create_Skill': boolean;
  }

@Injectable({
  providedIn: 'root'
})

export class TopicsAndSkillsDashboardBackendApiService {
  constructor(private http: HttpClient) {}

  fetchDashboardData(): Promise<ITopicsAndSkillsDashboardDataBackendDict> {
    return this.http.get<ITopicsAndSkillsDashboardDataBackendDict>(
      '/topics_and_skills_dashboard/data').toPromise();
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
