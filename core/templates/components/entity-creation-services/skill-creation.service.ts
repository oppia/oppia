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
 * @fileoverview Functionality for creating a new skill.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

require('domain/utilities/url-interpolation.service.ts');
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';
require('services/alerts.service.ts');
import { AlertsService } from 'services/alerts.service';
require('domain/skill/skill-creation-backend-api.service.ts');
import { SkillCreationBackendApiService } from
  'domain/skill/skill-creation-backend-api.service.ts';
import { RootScopeService } from 'services/root-scope.service.ts';

@Injectable({
  providedIn: 'root'
})
export class SkillCreationService {
  CREATE_NEW_SKILL_URL_TEMPLATE = '/skill_editor/<skill_id>';
  skillCreationInProgress = false;

  constructor(
    private alertsService: AlertsService,
    private rootScopeService: RootScopeService,
    private skillCreationBackendApiService: SkillCreationBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
  ) { }

  createNewSkill(description, rubrics, explanation, linkedTopicIds) {
    if (this.skillCreationInProgress) {
      return;
    }
    for (let idx in rubrics) {
      rubrics[idx] = rubrics[idx].toBackendDict();
    }
    this.skillCreationInProgress = true;
    this.alertsService.clearWarnings();
    this.rootScopeService.broadCastLoadingMessageChange('Creating skill');
    // $rootScope.loadingMessage = 'Creating skill';
    this.skillCreationBackendApiService.createSkill(
      description, rubrics, explanation, linkedTopicIds
    ).then((response: any) => {
      setTimeout(function() {
        window.location = this.urlInterpolationService.interpolateUrl(
          this.CREATE_NEW_SKILL_URL_TEMPLATE, {
            skill_id: response.skillId
          });
      }, 150);
    }, function() {
      this.rootScopeService.broadCastLoadingMessageChange('');
    });
  }
}
// angular.module('oppia').factory('SkillCreationService', [
//   '$rootScope', '$timeout', '$window', 'AlertsService',
//   'SkillCreationBackendApiService', 'UrlInterpolationService',
//   function(
//       $rootScope, $timeout, $window, AlertsService,
//       SkillCreationBackendApiService, UrlInterpolationService) {
//     var CREATE_NEW_SKILL_URL_TEMPLATE = (
//       '/skill_editor/<skill_id>');
//     var skillCreationInProgress = false;

//     return {
//       createNewSkill: function(
//           description, rubrics, explanation, linkedTopicIds) {
//         if (skillCreationInProgress) {
//           return;
//         }
//         for (var idx in rubrics) {
//           rubrics[idx] = rubrics[idx].toBackendDict();
//         }
//         skillCreationInProgress = true;
//         AlertsService.clearWarnings();
//         $rootScope.loadingMessage = 'Creating skill';
//         SkillCreationBackendApiService.createSkill(
//           description, rubrics, explanation, linkedTopicIds)
//           .then(function(response) {
//             $timeout(function() {
//               $window.location = UrlInterpolationService.interpolateUrl(
//                 CREATE_NEW_SKILL_URL_TEMPLATE, {
//                   skill_id: response.skillId
//                 });
//             }, 150);
//           }, function() {
//             $rootScope.loadingMessage = '';
//           });
//       }
//     };
//   }
// ]);
angular.module('oppia').factory('SkillCreationService',
  downgradeInjectable(SkillCreationService));
