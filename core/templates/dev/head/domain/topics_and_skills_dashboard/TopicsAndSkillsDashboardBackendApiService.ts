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
oppia.constant('MERGE_SKILLS_URL', '/merge_skills_handler');

oppia.factory('TopicsAndSkillsDashboardBackendApiService', [
  '$http', 'MERGE_SKILLS_URL', function($http, MERGE_SKILLS_URL) {
    var _fetchDashboardData = function() {
      return $http.get('/topics_and_skills_dashboard/data');
    };

    var _mergeSkills = function(oldSkillId, newSkillId) {
      var mergeSkillsData = {
        old_skill_id: oldSkillId,
        new_skill_id: newSkillId
      };
      return $http.post(MERGE_SKILLS_URL, mergeSkillsData);
    };

    return {
      fetchDashboardData: _fetchDashboardData,
      mergeSkills: _mergeSkills
    };
  }
]);
