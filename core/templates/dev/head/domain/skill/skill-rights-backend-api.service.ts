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
 * @fileoverview Service to change the rights of skills in the backend.
 */

import { cloneDeep } from "lodash";
import { downgradeInjectable } from "@angular/upgrade/static";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ISkillRightBackendInterface } from "./SkillRightsObjectFactory";
import { SkillEditorPageConstants } from 'pages/skill-editor-page/skill-editor-page.constants.ts';
import { UrlInterpolationService } from "domain/utilities/url-interpolation.service";

@Injectable({
  providedIn: 'root'
})

export class SkillRightsBackendApiService {
  skillRightsCache: any = null;
  skillRightBackendDict:ISkillRightBackendInterface = null;
  
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient) { }

  _fetchSkillRights(skillId, successCallback, errorCallback) {
    let skillRightsUrl = this.urlInterpolationService.interpolateUrl(
      SkillEditorPageConstants.SKILL_RIGHTS_URL_TEMPLATE, {
      skill_id: skillId
    });

    this.http.get(skillRightsUrl, { observe: 'response' }).toPromise().then((response) => {
      let responseData = response.body;
      if (successCallback) {
        successCallback(responseData);
      }
    }, function (errorResponse) {
      if (errorCallback) {
        errorCallback(errorResponse.body);
      }
    });
  };

  _isCached(skillId) {
    return this.skillRightsCache.hasOwnProperty(skillId);
  };

  fetchSkillRights(skillId: string) {
    return new Promise((resolve, reject) => {
      this._fetchSkillRights(skillId, resolve, reject);
    });
  }

  loadSkillRights(skillId:string) {
    return new Promise((resolve, reject) => {
      if (this._isCached(skillId)) {
        if(resolve) {
          resolve(this.skillRightsCache[skillId]);
        }
      } else {
          this._fetchSkillRights(skillId, (skillRights:ISkillRightBackendInterface) => {
            this.skillRightsCache[skillId] = skillRights;
            if(resolve) {
              resolve(this.skillRightsCache[skillId]);
            }
          }, reject);
        }
    });
  }
  isCached(skillId:string) {
    return this._isCached(skillId);
  }
  cacheSkillRights(skillId:string, skillRights) {
    this.skillRightsCache.skillId = cloneDeep(skillRights);
  }
  
}
angular.module('oppia').factory(
  'SkillRightsBackendApiService', downgradeInjectable(SkillRightsBackendApiService));




// require('domain/utilities/url-interpolation.service.ts');

// angular.module('oppia').factory('SkillRightsBackendApiService', [
//   '$http', '$q', 'UrlInterpolationService', 'SKILL_RIGHTS_URL_TEMPLATE',
//   function($http, $q, UrlInterpolationService, SKILL_RIGHTS_URL_TEMPLATE) {
//     // Maps previously loaded skill rights to their IDs.
//     var skillRightsCache = {};

//     var _fetchSkillRights = function(skillId, successCallback,
//         errorCallback) {
//       var skillRightsUrl = UrlInterpolationService.interpolateUrl(
//         SKILL_RIGHTS_URL_TEMPLATE, {
//           skill_id: skillId
//         });

//       $http.get(skillRightsUrl).then(function(response) {
//         var responseData = response.data;
//         if (successCallback) {
//           successCallback({
//             skill_id: responseData.skill_id,
//             can_edit_skill_description: responseData.can_edit_skill_description
//           });
//         }
//       }, function(errorResponse) {
//         if (errorCallback) {
//           errorCallback(errorResponse.data);
//         }
//       });
//     };

//     var _isCached = function(skillId) {
//       return skillRightsCache.hasOwnProperty(skillId);
//     };

//     return {
//       /**
//        * Gets a skill's rights, given its ID.
//        */
//       fetchSkillRights: function(skillId) {
//         return $q(function(resolve, reject) {
//           _fetchSkillRights(skillId, resolve, reject);
//         });
//       },

//       /**
//        * Behaves exactly as fetchSkillRights (including callback
//        * behavior and returning a promise object), except this function will
//        * attempt to see whether the given skill rights has been
//        * cached. If it has not yet been cached, it will fetch the skill
//        * rights from the backend. If it successfully retrieves the skill
//        * rights from the backend, it will store it in the cache to avoid
//        * requests from the backend in further function calls.
//        */
//       loadSkillRights: function(skillId) {
//         return $q(function(resolve, reject) {
//           if (_isCached(skillId)) {
//             if (resolve) {
//               resolve(skillRightsCache[skillId]);
//             }
//           } else {
//             _fetchSkillRights(skillId, function(skillRights) {
//               skillRightsCache[skillId] = skillRights;
//               if (resolve) {
//                 resolve(skillRightsCache[skillId]);
//               }
//             }, reject);
//           }
//         });
//       },

//       /**
//        * Returns whether the given skill rights is stored within the
//        * local data cache or if it needs to be retrieved from the backend
//        * upon a laod.
//        */
//       isCached: function(skillId) {
//         return _isCached(skillId);
//       },

//       /**
//        * Replaces the current skill rights in the cache given by the
//        * specified skill ID with a new skill rights object.
//        */
//       cacheSkillRights: function(skillId, skillRights) {
//         skillRightsCache[skillId] = angular.copy(skillRights);
//       }
//     };
//   }
// ]);
