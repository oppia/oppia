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

import {downgradeInjectable} from '@angular/upgrade/static';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {AdminPageConstants} from 'pages/admin-page/admin-page.constants';
import {
  PlatformParameter,
  PlatformParameterBackendDict,
} from 'domain/platform-parameter/platform-parameter.model';
import {
  CreatorTopicSummary,
  CreatorTopicSummaryBackendDict,
} from 'domain/topic/creator-topic-summary.model';
import {
  SkillSummary,
  SkillSummaryBackendDict,
} from 'domain/skill/skill-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

export interface UserRolesBackendResponse {
  roles: string[];
  managed_topic_ids: string[];
  coordinated_language_ids: string[];
  banned: boolean;
}

export interface AssignedUsersBackendResponse {
  usernames: string[];
}

export interface HumanReadableRolesBackendResponse {
  [role: string]: string;
}

export interface RoleToActionsBackendResponse {
  [role: string]: string[];
}

interface PendingDeletionRequestBackendResponse {
  number_of_pending_deletion_models: string;
}

export interface ModelsRelatedToUserBackendResponse {
  related_models_exist: boolean;
}

export interface ClassroomPageData {
  name: string;
  topic_ids: string[];
  course_details: string;
  url_fragment: string;
  topic_list_intro: string;
}

export interface VmidSharedSecretKeyMapping {
  shared_secret_key: string;
  vm_id: string;
}

export interface AdminPageDataBackendDict {
  demo_explorations: string[][];
  demo_collections: string[][];
  demo_exploration_ids: string[];
  human_readable_current_time: string;
  updatable_roles: string[];
  role_to_actions: RoleToActionsBackendResponse;
  viewable_roles: string[];
  human_readable_roles: HumanReadableRolesBackendResponse;
  topic_summaries: CreatorTopicSummaryBackendDict[];
  platform_params_dicts: PlatformParameterBackendDict[];
  skill_list: SkillSummaryBackendDict[];
}

export interface AdminPageData {
  demoExplorations: string[][];
  demoCollections: string[][];
  demoExplorationIds: string[];
  updatableRoles: string[];
  roleToActions: RoleToActionsBackendResponse;
  viewableRoles: string[];
  humanReadableRoles: HumanReadableRolesBackendResponse;
  topicSummaries: CreatorTopicSummary[];
  platformParameters: PlatformParameter[];
  skillList: SkillSummary[];
}

export interface ExplorationInteractionIdsBackendResponse {
  interaction_ids: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async getDataAsync(): Promise<AdminPageData> {
    return new Promise((resolve, reject) => {
      this.http
        .get<AdminPageDataBackendDict>(AdminPageConstants.ADMIN_HANDLER_URL)
        .toPromise()
        .then(
          response => {
            resolve({
              demoExplorations: response.demo_explorations,
              demoCollections: response.demo_collections,
              demoExplorationIds: response.demo_exploration_ids,
              updatableRoles: response.updatable_roles,
              roleToActions: response.role_to_actions,
              humanReadableRoles: response.human_readable_roles,
              viewableRoles: response.viewable_roles,
              topicSummaries: response.topic_summaries.map(
                CreatorTopicSummary.createFromBackendDict
              ),
              platformParameters: response.platform_params_dicts.map(dict =>
                PlatformParameter.createFromBackendDict(dict)
              ),
              skillList: response.skill_list.map(dict =>
                SkillSummary.createFromBackendDict(dict)
              ),
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  // This is a helper function to handle all post<void>
  // requests in admin page.
  private async _postRequestAsync(
    handlerUrl: string,
    payload?: Object,
    action?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .post<void>(handlerUrl, {action, ...payload})
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  // Admin Roles Tab Services.
  async viewUsersRoleAsync(
    username: string
  ): Promise<UserRolesBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .get<UserRolesBackendResponse>(
          AdminPageConstants.ADMIN_ROLE_HANDLER_URL,
          {
            params: {
              filter_criterion: 'username',
              username: username,
            },
          }
        )
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async fetchUsersAssignedToRoleAsync(
    role: string
  ): Promise<AssignedUsersBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .get<AssignedUsersBackendResponse>(
          AdminPageConstants.ADMIN_ROLE_HANDLER_URL,
          {
            params: {
              filter_criterion: 'role',
              role: role,
            },
          }
        )
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async addUserRoleAsync(newRole: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          role: newRole,
          username: username,
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async removeUserRoleAsync(
    roleToRemove: string,
    username: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .delete<void>(AdminPageConstants.ADMIN_ROLE_HANDLER_URL, {
          params: {
            role: roleToRemove,
            username: username,
          },
        })
        .toPromise()
        .then(resolve, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async assignManagerToTopicAsync(
    username: string,
    topicId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(AdminPageConstants.TOPIC_MANAGER_ROLE_HANDLER_URL, {
          username: username,
          topic_id: topicId,
          action: 'assign',
        })
        .toPromise()
        .then(resolve, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async deassignManagerFromTopicAsync(
    username: string,
    topicId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(AdminPageConstants.TOPIC_MANAGER_ROLE_HANDLER_URL, {
          username: username,
          topic_id: topicId,
          action: 'deassign',
        })
        .toPromise()
        .then(resolve, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async assignTranslationCoordinator(
    username: string,
    languageId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(
          AdminPageConstants.TRANSLATION_COORDINATOR_ROLE_HANDLER_URL,
          {
            username: username,
            language_id: languageId,
            action: 'assign',
          }
        )
        .toPromise()
        .then(resolve, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async deassignTranslationCoordinator(
    username: string,
    languageId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(
          AdminPageConstants.TRANSLATION_COORDINATOR_ROLE_HANDLER_URL,
          {
            username: username,
            language_id: languageId,
            action: 'deassign',
          }
        )
        .toPromise()
        .then(resolve, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  // Admin Misc Tab Services.
  async clearSearchIndexAsync(): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL);
  }

  async regenerateOpportunitiesRelatedToTopicAsync(
    topicId: string
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      this.http
        .post<number>(AdminPageConstants.ADMIN_HANDLER_URL, {
          action: 'regenerate_topic_related_opportunities',
          topic_id: topicId,
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async regenerateTopicSummariesAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(AdminPageConstants.ADMIN_REGENERATE_TOPIC_SUMMARIES_URL, {})
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async rollbackExplorationToSafeState(expId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.http
        .post<{version: number}>(AdminPageConstants.ADMIN_HANDLER_URL, {
          action: 'rollback_exploration_to_safe_state',
          exp_id: expId,
        })
        .toPromise()
        .then(
          response => {
            resolve(response.version);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async uploadTopicSimilaritiesAsync(data: string): Promise<void> {
    let action = 'upload_topic_similarities';
    let payload = {
      data: data,
    };
    return this._postRequestAsync(
      AdminPageConstants.ADMIN_HANDLER_URL,
      payload,
      action
    );
  }

  async sendDummyMailToAdminAsync(): Promise<void> {
    return this._postRequestAsync(
      AdminPageConstants.ADMIN_SEND_DUMMY_MAIL_HANDLER_URL
    );
  }

  async updateUserNameAsync(
    oldUsername: string,
    newUsername: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(AdminPageConstants.ADMIN_UPDATE_USERNAME_HANDLER_URL, {
          old_username: oldUsername,
          new_username: newUsername,
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async updateBlogPostDataAsync(
    blogPostId: string,
    authorUsername: string,
    publishedOn: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(AdminPageConstants.ADMIN_UPDATE_BLOG_POST_DATA_HANDLER, {
          blog_post_id: blogPostId,
          author_username: authorUsername,
          published_on: publishedOn,
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async getNumberOfPendingDeletionRequestAsync(): Promise<PendingDeletionRequestBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .get<PendingDeletionRequestBackendResponse>(
          AdminPageConstants.ADMIN_NUMBER_OF_DELETION_REQUEST_HANDLER_URL,
          {}
        )
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async grantSuperAdminPrivilegesAsync(username: string): Promise<void> {
    return this.http
      .put<void>(AdminPageConstants.ADMIN_SUPER_ADMIN_PRIVILEGES_HANDLER_URL, {
        username,
      })
      .toPromise();
  }

  async revokeSuperAdminPrivilegesAsync(username: string): Promise<void> {
    return this.http
      .delete<void>(
        AdminPageConstants.ADMIN_SUPER_ADMIN_PRIVILEGES_HANDLER_URL,
        {
          params: {username},
        }
      )
      .toPromise();
  }

  async getModelsRelatedToUserAsync(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http
        .get<ModelsRelatedToUserBackendResponse>(
          AdminPageConstants.ADMIN_VERIFY_USER_MODELS_DELETED_HANDLER_URL,
          {
            params: {
              user_id: userId,
            },
          }
        )
        .toPromise()
        .then(
          response => {
            resolve(response.related_models_exist);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async deleteUserAsync(userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .delete<void>(AdminPageConstants.ADMIN_DELETE_USER_HANDLER_URL, {
          params: {
            user_id: userId,
            username: username,
          },
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  // Admin Dev Mode Activities Tab Services.
  async generateDummyExplorationsAsync(
    numDummyExpsToGenerate: number,
    numDummyExpsToPublish: number
  ): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_explorations',
      num_dummy_exps_to_generate: numDummyExpsToGenerate,
      num_dummy_exps_to_publish: numDummyExpsToPublish,
    });
  }

  async generateDummyTranslationOpportunitiesAsync(
    numDummyTranslationOpportunitiesToGenerate: number
  ): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_translation_opportunities',
      num_dummy_translation_opportunities_to_generate:
        numDummyTranslationOpportunitiesToGenerate,
    });
  }

  async reloadExplorationAsync(explorationId: string): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload_exploration',
      exploration_id: String(explorationId),
    });
  }

  async generateDummyNewStructuresDataAsync(): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_structures_data',
    });
  }

  async generateDummyNewSkillDataAsync(): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_skill_data',
    });
  }

  async generateDummyClassroomDataAsync(): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_classroom',
    });
  }

  async reloadCollectionAsync(collectionId: string): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload_collection',
      collection_id: String(collectionId),
    });
  }

  async markUserBannedAsync(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(AdminPageConstants.ADMIN_BANNED_USERS_HANDLER, {username})
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async unmarkUserBannedAsync(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .delete<void>(AdminPageConstants.ADMIN_BANNED_USERS_HANDLER, {
          params: {username},
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async generateDummyBlogPostAsync(blogPostTitle: string): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_blog_post',
      blog_post_title: blogPostTitle,
    });
  }

  async generateDummySuggestionQuestionsAsync(
    skillId: string,
    numberOfQuestions: number
  ): Promise<void> {
    return this._postRequestAsync(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_question_suggestions',
      skill_id: skillId,
      num_dummy_question_suggestions_generate: numberOfQuestions,
    });
  }

  async retrieveExplorationInteractionIdsAsync(
    expId: string
  ): Promise<ExplorationInteractionIdsBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .get<ExplorationInteractionIdsBackendResponse>(
          AdminPageConstants.EXPLORATION_INTERACTIONS_HANDLER,
          {
            params: {
              exp_id: expId,
            },
          }
        )
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}

angular
  .module('oppia')
  .factory(
    'AdminBackendApiService',
    downgradeInjectable(AdminBackendApiService)
  );
