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
  '../topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants';


@Injectable({
  providedIn: 'root'
})
export class TopicsAndSkillsDashboardBackendApiService {
  constructor(private http: HttpClient) {}

  fetchDasboardData(): Promise<any> {
    return this.http.get('/topics_and_skills_dashboard/data').toPromise();
  }

  mergeSkills(oldSkillId, newSkillId): Promise<void> {
    var mergeSkillsData = {
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
