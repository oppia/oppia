// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend api service for fetching the admin data;
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AdminPageConstants } from
  'pages/admin-page/admin-page.constants';
import {
  TopicSummary,
  TopicSummaryBackendDict
} from 'domain/topic/topic-summary.model';
import {
  ComputationData,
  ComputationDataBackendDict,
} from 'domain/admin/computation-data.model';
import {
  Job,
  JobDataBackendDict,
} from 'domain/admin/job.model';
import {
  JobStatusSummary,
  JobStatusSummaryBackendDict,
} from 'domain/admin/job-status-summary.model';
import {
  PlatformParameter,
  PlatformParameterBackendDict
} from 'domain/platform_feature/platform-parameter.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';


interface UserRolesBackendResponse {
  [role: string]: string;
}

interface RoleGraphDataBackendResponse {
  nodes: {
    [role: string]: string;
  };
  links: {
    target: string;
    source: string;
  }[];
}

interface ConfigPropertiesBackendResponse {
  [property: string]: Object;
}

interface JobOutputBackendResponse {
  output: string[];
}

interface ViewContributionBackendResponse {
  usernames: string[];
}

interface ContributionRightsBackendResponse {
  'can_review_questions': boolean,
  'can_review_translation_for_language_codes': string[],
  'can_review_voiceover_for_language_codes': string[],
  'can_submit_questions': boolean
}

interface MemoryCacheProfileBackendResponse {
  'peak_allocation': string,
  'total_allocation': string,
  'total_keys_stored': string
}

interface PendingDeletionRequestBackendResponse {
  'number_of_pending_deletion_models': string
}

interface ModelsRelatedToUserBackendResponse {
  'related_models_exist': boolean
}

interface SignupEmailContent {
  'html_body': string,
  'subject': string
}

interface ClassroomPageData {
  'name': string,
  'topic_ids': string[],
  'course_details': string,
  'url_fragment': string,
  'topic_list_intro': string
}

interface VmidSharedSecretKeyMapping {
  'shared_secret_key': string,
  'vm_id': string
}

interface ConfigPropertyValues {
  'always_ask_learners_for_answer_details': boolean,
  'classroom_page_is_accessible': boolean,
  'classroom_pages_data': ClassroomPageData,
  'classroom_promos_are_enabled': boolean,
  'contributor_can_suggest_questions': boolean,
  'contributor_dashboard_is_enabled': boolean,
  'contributor_dashboard_reviewer_emails_is_enabled': boolean,
  'email_footer': string,
  'email_sender_name': string,
  'enable_admin_notifications_for_reviewer_shortage': boolean,
  'featured_translation_languages': string[],
  'high_bounce_rate_task_minimum_exploration_starts': number,
  'high_bounce_rate_task_state_bounce_rate_creation_threshold': number,
  'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold': number,
  'is_improvements_tab_enabled': boolean,
  'max_number_of_explorations_in_math_svgs_batch': number,
  'max_number_of_suggestions_per_reviewer': number,
  'max_number_of_svgs_in_math_svgs_batch': number,
  'notification_user_ids_for_failed_tasks': string[],
  'notify_admins_suggestions_waiting_too_long_is_enabled': boolean,
  'oppia_csrf_secret': string,
  'promo_bar_enabled': boolean,
  'promo_bar_message': string,
  'record_playthrough_probability': number,
  'signup_email_content': SignupEmailContent,
  'unpublish_exploration_email_html_body': string,
  'vmid_shared_secret_key_mapping': VmidSharedSecretKeyMapping,
  'whitelisted_exploration_ids_for_playthroughs': string[]
}

export interface AdminPageDataBackendDict {
  'demo_explorations': string[][];
  'demo_collections': string[][];
  'demo_exploration_ids': string[];
  'one_off_job_status_summaries': JobStatusSummaryBackendDict[];
  'human_readable_current_time': string;
  'audit_job_status_summaries': JobStatusSummaryBackendDict[];
  'updatable_roles': UserRolesBackendResponse;
  'role_graph_data': RoleGraphDataBackendResponse;
  'config_properties': ConfigPropertiesBackendResponse;
  'viewable_roles': UserRolesBackendResponse;
  'unfinished_job_data': JobDataBackendDict[];
  'recent_job_data': JobDataBackendDict[];
  'continuous_computations_data': ComputationDataBackendDict[];
  'topic_summaries': TopicSummaryBackendDict[];
  'feature_flags': PlatformParameterBackendDict[];
}

export interface AdminPageData {
  demoExplorations: string[][];
  demoCollections: string[][];
  demoExplorationIds: string[];
  oneOffJobStatusSummaries: JobStatusSummary[];
  humanReadableCurrentTime: string;
  auditJobStatusSummaries: JobStatusSummary[];
  updatableRoles: UserRolesBackendResponse;
  roleGraphData: RoleGraphDataBackendResponse;
  configProperties: ConfigPropertiesBackendResponse;
  viewableRoles: UserRolesBackendResponse;
  unfinishedJobData: Job[];
  recentJobData: Job[];
  continuousComputationsData: ComputationData[];
  topicSummaries: TopicSummary[];
  featureFlags: PlatformParameter[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async getDataAsync(): Promise<AdminPageData> {
    return new Promise((resolve, reject) => {
      this.http.get<AdminPageDataBackendDict>(
        AdminPageConstants.ADMIN_HANDLER_URL).toPromise().then(response => {
        resolve({
          demoExplorations: response.demo_explorations,
          demoCollections: response.demo_collections,
          demoExplorationIds: response.demo_exploration_ids,
          oneOffJobStatusSummaries: response.one_off_job_status_summaries.map(
            JobStatusSummary.createFromBackendDict),
          humanReadableCurrentTime: response.human_readable_current_time,
          auditJobStatusSummaries: response.audit_job_status_summaries.map(
            JobStatusSummary.createFromBackendDict),
          updatableRoles: response.updatable_roles,
          roleGraphData: response.role_graph_data,
          configProperties: response.config_properties,
          viewableRoles: response.viewable_roles,
          unfinishedJobData: response.unfinished_job_data.map(
            Job.createFromBackendDict),
          recentJobData: response.recent_job_data.map(
            Job.createFromBackendDict),
          continuousComputationsData: response.continuous_computations_data.map(
            ComputationData.createFromBackendDict),
          topicSummaries: response.topic_summaries.map(
            TopicSummary.createFromBackendDict),
          featureFlags: response.feature_flags.map(
            dict => PlatformParameter.createFromBackendDict(
              dict)
          )
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  private _postRequestAsync(
      handlerUrl:string, payload?:Object, action?:string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(
        handlerUrl, { action, ...payload }).toPromise()
        .then(response => {
          resolve(response);
        }, errorResonse => {
          reject(errorResonse.error.error);
        });
    });
  }

  // Admin Jobs Tab Services.
  async startNewJobAsync(jobType: string): Promise<void> {
    let action = 'start_new_job';
    let payload = {
      job_type: jobType
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async cancelJobAsync(jobId: string, jobType: string): Promise<void> {
    let action = 'cancel_job';
    let payload = {
      job_id: jobId,
      job_type: jobType
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async startComputationAsync(computationType: string): Promise<void> {
    let action = 'start_computation';
    let payload = {
      computation_type: computationType
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async stopComputationAsync(computationType: string): Promise<void> {
    let action = 'stop_computation';
    let payload = {
      computation_type: computationType
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async fetchJobOutputAsync(jobId: string): Promise<string[]> {
    let adminJobOutputUrl = this.urlInterpolationService.interpolateUrl(
      AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
        jobId: jobId
      });
    return new Promise((resolve, reject) => {
      this.http.get<JobOutputBackendResponse>(
        adminJobOutputUrl).toPromise().then(response => {
        resolve(Array.isArray(response.output) ? response.output.sort() : []);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  // Admin Roles Tab Services.
  async viewUsersRoleAsync(
      filterCriterion: string, role: string, username: string
  ): Promise<UserRolesBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<UserRolesBackendResponse>(
        AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          params: {
            filter_criterion: filterCriterion,
            role: role,
            username: username
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async updateUserRoleAsync(
      newRole: string, username: string, topicId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(
        AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          role: newRole,
          username: username,
          topic_id: topicId
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async addContributionReviewerAsync(
      category: string, username: string, languageCode: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(
        AdminPageConstants.ADMIN_ADD_CONTRIBUTION_RIGHTS_HANDLER, {
          category: category,
          username: username,
          language_code: languageCode
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async viewContributionReviewersAsync(
      category: string, languageCode: string
  ): Promise<ViewContributionBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<ViewContributionBackendResponse>(
        AdminPageConstants.ADMIN_GET_CONTRIBUTOR_USERS_HANDLER, {
          params: {
            category: category,
            language_code: languageCode
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async contributionReviewerRightsAsync(
      username: string): Promise<ContributionRightsBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<ContributionRightsBackendResponse>(
        AdminPageConstants.ADMIN_CONTRIBUTION_RIGHTS_HANDLER, {
          params: {
            username: username
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async removeContributionReviewerAsync(
      username: string, method: string,
      category: string, languageCode: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.ADMIN_REMOVE_CONTRIBUTION_RIGHTS_HANDLER, {
          username: username,
          removal_type: method,
          category: category,
          language_code: languageCode
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  // Admin Misc Tab Services.
  async flushMemoryCacheAsync(): Promise<void> {
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_MEMORY_CACHE_HANDLER_URL);
  }

  async clearSearchIndexAsync(): Promise<void> {
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL);
  }

  async populateExplorationStatsRegenerationCsvResultAsync(
      expIdToRegenerate: string): Promise<void> {
    let action = 'regenerate_missing_exploration_stats';
    let payload = {
      exp_id: expIdToRegenerate
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async regenerateOpportunitiesRelatedToTopicAsync(
      topicId: string): Promise<void> {
    let action = 'regenerate_topic_related_opportunities';
    let payload = {
      topic_id: topicId
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async uploadTopicSimilaritiesAsync(data: string): Promise<void> {
    let action = 'upload_topic_similarities';
    let payload = {
      data: data
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async sendDummyMailToAdminAsync(): Promise<void> {
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_SEND_DUMMY_MAIL_HANDLER_URL);
  }

  async getMemoryCacheProfileAsync(
  ): Promise<MemoryCacheProfileBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<MemoryCacheProfileBackendResponse>(
        AdminPageConstants.ADMIN_MEMORY_CACHE_HANDLER_URL, {}
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async updateUserNameAsync(
      oldUsername: string, newUsername: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        AdminPageConstants.ADMIN_UPDATE_USERNAME_HANDLER_URL, {
          old_username: oldUsername,
          new_username: newUsername
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async getNumberOfPendingDeletionRequestAsync(
  ): Promise<PendingDeletionRequestBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<PendingDeletionRequestBackendResponse>(
        AdminPageConstants.ADMIN_NUMBER_OF_DELETION_REQUEST_HANDLER_URL, {}
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async getModelsRelatedToUserAsync(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http.get<ModelsRelatedToUserBackendResponse>(
        AdminPageConstants.ADMIN_VERIFY_USER_MODELS_DELETED_HANDLER_URL, {
          params: {
            user_id: userId
          }
        }
      ).toPromise().then(response => {
        resolve(response.related_models_exist);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async deleteUserAsync(userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line dot-notation
      this.http.delete<void>(
        AdminPageConstants.ADMIN_DELETE_USER_HANDLER_URL, {
          params: {
            user_id: userId,
            username: username
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  // Admin Config Tab Services.
  async revertConfigPropertyAsync(configPropertyId: string): Promise<void> {
    let action = 'revert_config_property';
    let payload = {
      config_property_id: configPropertyId
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }

  async saveConfigPropertiesAsync(
      newConfigPropertyValues: ConfigPropertyValues): Promise<void> {
    let action = 'save_config_properties';
    let payload = {
      new_config_property_values: newConfigPropertyValues
    };
    return this._postRequestAsync (
      AdminPageConstants.ADMIN_HANDLER_URL, payload, action);
  }
}

angular.module('oppia').factory(
  'AdminBackendApiService',
  downgradeInjectable(AdminBackendApiService));
