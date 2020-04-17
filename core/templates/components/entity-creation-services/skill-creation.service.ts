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

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';
import { AlertsService } from 'services/alerts.service';
import { SkillCreationBackendApiService } from
  'domain/skill/skill-creation-backend-api.service.ts';
import { CommonEventsService } from 'services/common-events.service';

interface SkillCreationResponse {
  skillId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillCreationService {
  CREATE_NEW_SKILL_URL_TEMPLATE = '/skill_editor/<skill_id>';
  skillCreationInProgress = false;

  constructor(
    private alertsService: AlertsService,
    private commonEventsService: CommonEventsService,
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
    this.commonEventsService.setLoadingMessage('Creating skill');
    this.skillCreationBackendApiService.createSkill(
      description, rubrics, explanation, linkedTopicIds
    ).then((response: SkillCreationResponse) => {
      // TODO(srijanreddy98): Replace window with angular router
      window.location.href = this.urlInterpolationService.interpolateUrl(
        this.CREATE_NEW_SKILL_URL_TEMPLATE, {
          skill_id: response.skillId
        });
    }, function() {
      this.commonEventsService.setLoadingMessage('');
    });
  }
}
angular.module('oppia').factory('SkillCreationService',
  downgradeInjectable(SkillCreationService));
