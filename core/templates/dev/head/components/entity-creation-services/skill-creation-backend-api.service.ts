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
 * @fileoverview Service for posting the skills
 */
// require('')
angular.module('oppia').factory('SkillCreationBackendService', [
  '$http', '$q',
  function($http, $q) {
    var _createSkill = function(successCallback, errorCallback,
      description, rubrics, explanation, linkedTopicIds) {
      let postData = {
        description: description,
        linked_topic_ids: linkedTopicIds,
        explanation_dict: explanation,
        rubrics: rubrics
      };
      $http.post('/skill_editor_handler/create_new', postData)
        .then(function(response) {
          let skillId = response.data.skill_id;
          if (successCallback) {
            successCallback(skillId);
          }
        }, function(errorResponse) {
          if (errorCallback) {
            errorCallback(errorResponse);
          }
        });
    };

    return {
      createSkill: function(description, rubrics, explanation, linkedTopicIds) {
        return $q(function(resolve, reject) {
          _createSkill(resolve, reject, description,
            rubrics, explanation, linkedTopicIds);
        });
      }
    };
  }
]);


// import { downgradeInjectable } from '@angular/upgrade/static';
// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Rubric } from 'domain/skill/RubricObjectFactory';
// import { UrlInterpolationService } from
//   'domain/utilities/url-interpolation.service';

// export interface postSkillDataType { 
//   description: string,
//   linked_topic_ids: string,
//   explanation_dict: string,
//   rubrics: Rubric[]
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class SkillCreationBackendApiService {
//   constructor(
//     private urlInterpolationService: UrlInterpolationService,
//     private http: HttpClient
//   ) {}

//   postSkillCreation(description, linkedTopicIds, explanation, rubric) {
//     let data = { 
//       description: description,
//       linked_topic_ids: linkedTopicIds,
//       explanation_dict: explanation,
//       rubrics: rubric
//     }
//     let promise = new Promise((resolve, reject) => {
//       this.http.post<postSkillDataType>(
//         '/skill_editor_handler/create_new',data).toPromise()
//         .then(
//           res => { // Success
//             resolve(res['data']);
//           },
//           msg => { // Error
//             reject(msg);
//           }
//         );
//     });
//     return promise;
//   }

// }

// angular.module('oppia').factory(
//   'SkillCreationBackendApiService',
//   downgradeInjectable(SkillCreationBackendApiService));
