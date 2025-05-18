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
 * @fileoverview Service to send changes to a skill to the backend.
 */

import {Injectable} from '@angular/core';

import {HttpClient} from '@angular/common/http';
import {BackendChangeObject} from 'domain/editor/undo_redo/change.model';
import {SkillDomainConstants} from 'domain/skill/skill-domain.constants';
import {
  Skill,
  SkillBackendDict,
  SkillObjectFactory,
} from 'domain/skill/SkillObjectFactory';
import {SkillSummaryBackendDict} from 'domain/skill/skill-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Observable} from 'rxjs';

interface FetchSkillBackendResponse {
  skill: SkillBackendDict;
  assigned_skill_topic_data_dict: {
    [topicName: string]: string;
  };
  grouped_skill_summaries: {
    [topicName: string]: SkillSummaryBackendDict[];
  };
}

export interface FetchSkillResponse {
  skill: Skill;
  assignedSkillTopicData: {
    [topicName: string]: string;
  };
  groupedSkillSummaries: {
    [topicName: string]: SkillSummaryBackendDict[];
  };
}

interface FetchMultiSkillsBackendResponse {
  skills: SkillBackendDict[];
}

interface UpdateSkillBackendResponse {
  skill: SkillBackendDict;
}

interface DoesSkillWithDescriptionExistBackendResponse {
  skill_description_exists: boolean;
}

interface SkillAssignmentForDiagnosticTestBackendResponse {
  topic_names: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SkillBackendApiService {
  constructor(
    private http: HttpClient,
    private skillObjectFactory: SkillObjectFactory,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchSkillAsync(skillId: string): Promise<FetchSkillResponse> {
    return new Promise((resolve, reject) => {
      const skillDataUrl = this.urlInterpolationService.interpolateUrl(
        SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE,
        {
          skill_id: skillId,
        }
      );

      this.http
        .get<FetchSkillBackendResponse>(skillDataUrl)
        .toPromise()
        .then(
          response => {
            resolve({
              skill: this.skillObjectFactory.createFromBackendDict(
                response.skill
              ),
              assignedSkillTopicData: response.assigned_skill_topic_data_dict,
              // TODO(nishantwrp): Refactor this property to return SkillSummary
              // domain objects instead of backend dicts.
              groupedSkillSummaries: response.grouped_skill_summaries,
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  fetchAllSkills(): Observable<{skills: SkillBackendDict[]}> {
    return this.http.get<{skills: SkillBackendDict[]}>(
      SkillDomainConstants.FETCH_SKILLS_URL_TEMPLATE
    );
  }

  async fetchMultiSkillsAsync(skillIds: string[]): Promise<Skill[]> {
    return new Promise((resolve, reject) => {
      const skillDataUrl = this.urlInterpolationService.interpolateUrl(
        SkillDomainConstants.SKILL_DATA_URL_TEMPLATE,
        {
          comma_separated_skill_ids: skillIds.join(','),
        }
      );

      this.http
        .get<FetchMultiSkillsBackendResponse>(skillDataUrl)
        .toPromise()
        .then(
          response => {
            resolve(
              response.skills.map(backendDict => {
                return this.skillObjectFactory.createFromBackendDict(
                  backendDict
                );
              })
            );
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async deleteSkillAsync(skillId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const skillDataUrl = this.urlInterpolationService.interpolateUrl(
        SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE,
        {
          skill_id: skillId,
        }
      );

      this.http
        .delete<void>(skillDataUrl)
        .toPromise()
        .then(
          () => {
            resolve();
          },
          function (errorResponse) {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async updateSkillAsync(
    skillId: string,
    skillVersion: number,
    commitMessage: string,
    changeList: BackendChangeObject[]
  ): Promise<Skill> {
    return new Promise((resolve, reject) => {
      const editableSkillDataUrl = this.urlInterpolationService.interpolateUrl(
        SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE,
        {
          skill_id: skillId,
        }
      );

      const putData = {
        version: skillVersion,
        commit_message: commitMessage,
        change_dicts: changeList,
      };

      this.http
        .put<UpdateSkillBackendResponse>(editableSkillDataUrl, putData)
        .toPromise()
        .then(
          response => {
            resolve(
              this.skillObjectFactory.createFromBackendDict(response.skill)
            );
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  private _doesSkillWithDescriptionExist(
    description: string,
    successCallback: (value: boolean | PromiseLike<boolean>) => void,
    errorCallback: (reason?: string) => void
  ): void {
    let skillDescriptionUrl = this.urlInterpolationService.interpolateUrl(
      SkillDomainConstants.SKILL_DESCRIPTION_HANDLER_URL_TEMPLATE,
      {
        skill_description: description,
      }
    );
    this.http
      .get<DoesSkillWithDescriptionExistBackendResponse>(skillDescriptionUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.skill_description_exists);
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        }
      );
  }

  async doesSkillWithDescriptionExistAsync(
    description: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._doesSkillWithDescriptionExist(description, resolve, reject);
    });
  }

  async getTopicNamesWithGivenSkillAssignedForDiagnosticTest(
    skillId: string
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let skillAssignmentForDiagnosticTestUrl =
        this.urlInterpolationService.interpolateUrl(
          SkillDomainConstants.SKILL_ASSIGNMENT_FOR_DIAGNOSTIC_TEST_URL_TEMPLATE,
          {
            skill_id: skillId,
          }
        );

      this.http
        .get<SkillAssignmentForDiagnosticTestBackendResponse>(
          skillAssignmentForDiagnosticTestUrl
        )
        .toPromise()
        .then(
          response => {
            resolve(response.topic_names);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}
