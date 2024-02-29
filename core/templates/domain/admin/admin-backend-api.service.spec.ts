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
 * @fileoverview Unit tests for AdminBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { AdminPageData, AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { PlatformParameterFilterType } from 'domain/platform-parameter/platform-parameter-filter.model';
import { PlatformParameter } from 'domain/platform-parameter/platform-parameter.model';
import { CsrfTokenService } from 'services/csrf-token.service';
import { Schema } from 'services/schema-default-value.service';

describe('Admin backend api service', () => {
  let abas: AdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let adminBackendResponse = {
    role_to_actions: {
      guest: ['action for guest']
    },
    topic_summaries: [
      {
        topic_model_created_on: 1591196558882.194,
        uncategorized_skill_count: 0,
        name: 'Empty Topic',
        additional_story_count: 0,
        total_skill_count: 0,
        version: 1,
        canonical_story_count: 0,
        subtopic_count: 0,
        description: '',
        id: 'VqgPTpt7JyJy',
        topic_model_last_updated: 1591196558882.2,
        language_code: 'en',
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#C6DCDA',
        total_published_node_count: 0,
        can_edit_topic: true,
        is_published: false,
        url_fragment: '',
        total_upcoming_chapters_count: 1,
        total_overdue_chapters_count: 1,
        total_chapter_counts_for_each_story: [5, 4],
        published_chapter_counts_for_each_story: [3, 4]
      }
    ],
    updatable_roles: ['TOPIC_MANAGER'],
    human_readable_roles: {
      TOPIC_MANAGER: 'topic manager'
    },
    demo_collections: [],
    config_properties: {
      classroom_pages_data: {
        schema: {
          type: 'list'
        } as Schema,
        value: {
          name: 'math',
          url_fragment: 'math',
          course_details: '',
          topic_list_intro: '',
          topic_ids: []
        },
        description: 'The details for each classroom page.'
      }
    },
    demo_exploration_ids: ['19'],
    demo_explorations: [
      [
        '0',
        'welcome.yaml'
      ]
    ],
    viewable_roles: ['TOPIC_MANAGER'],
    platform_params_dicts: [{
      name: 'dummy_parameter',
      description: 'This is a dummy platform parameter.',
      data_type: 'string',
      rules: [{
        filters: [{
          type: PlatformParameterFilterType.PlatformType,
          conditions: [['=', 'Web'] as [string, string]]
        }],
        value_when_matched: ''
      }],
      rule_schema_version: 1,
      default_value: ''
    }]
  };
  let adminDataObject: AdminPageData;
  let configPropertyValues = {
    classroom_pages_data: {
      course_details: 'fds',
      name: 'mathfas',
      topic_ids: [],
      topic_list_intro: 'fsd',
      url_fragment: 'mathfsad',
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    abas = TestBed.get(AdminBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    adminDataObject = {
      demoExplorations: adminBackendResponse.demo_explorations,
      demoCollections: adminBackendResponse.demo_collections,
      demoExplorationIds: adminBackendResponse.demo_exploration_ids,
      updatableRoles: adminBackendResponse.updatable_roles,
      roleToActions: adminBackendResponse.role_to_actions,
      configProperties: adminBackendResponse.config_properties,
      viewableRoles: adminBackendResponse.viewable_roles,
      humanReadableRoles: adminBackendResponse.human_readable_roles,
      topicSummaries: adminBackendResponse.topic_summaries.map(
        dict => CreatorTopicSummary.createFromBackendDict(dict)),
      platformParameters: adminBackendResponse.platform_params_dicts.map(
        dict => PlatformParameter.createFromBackendDict(dict))
    };

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the data.', fakeAsync(() => {
    abas.getDataAsync().then((adminData) => {
      expect(adminData).toEqual(adminDataObject);
    });

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(adminBackendResponse);

    flushMicrotasks();
  }));

  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      abas.getDataAsync().then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('GET');

      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );

  // Test cases for Admin Roles Tab.
  it('should get the data of user given the username' +
    'when calling viewUsersRoleAsync', fakeAsync(() => {
    let username = 'validUser';
    let result = {
      validUser: 'ADMIN'
    };
    abas.viewUsersRoleAsync(username).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/adminrolehandler?filter_criterion=username&username=validUser');
    expect(req.request.method).toEqual('GET');

    req.flush(
      { validUser: 'ADMIN'},
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should get the data of user given the role' +
    'when calling fetchUsersAssignedToRoleAsync', fakeAsync(() => {
    let role = 'ADMIN';
    let result = {
      usernames: ['validUser']
    };
    abas.fetchUsersAssignedToRoleAsync(role).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/adminrolehandler?filter_criterion=role&role=ADMIN');
    expect(req.request.method).toEqual('GET');

    req.flush(
      { usernames: ['validUser'] },
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle failing request when calling ' +
      'fetchUsersAssignedToRoleAsync', fakeAsync(() => {
    let role = 'invalidRole';
    abas.fetchUsersAssignedToRoleAsync(role).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/adminrolehandler?filter_criterion=role&role=invalidRole');
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'Invalid role!'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Invalid role!');
  }));

  it('should fail to get the data of user when user does' +
    'not exists when calling viewUsersRoleAsync', fakeAsync(() => {
    let username = 'InvalidUser';
    abas.viewUsersRoleAsync(username).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/adminrolehandler' +
      '?filter_criterion=username&username=InvalidUser');
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'User with given username does not exist'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist');
  }
  ));

  it('should add the role to the user given the name' +
    'when calling addUserRoleAsync', fakeAsync(() => {
    let newRole = 'ADMIN';
    let username = 'validUser';
    let payload = {
      role: newRole,
      username: username,
    };
    abas.addUserRoleAsync(newRole, username).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminrolehandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to add the role to user when user does' +
    'not exists when calling addUserRoleAsync', fakeAsync(() => {
    let newRole = 'ADMIN';
    let username = 'InvalidUser';
    let payload = {
      role: newRole,
      username: username,
    };
    abas.addUserRoleAsync(newRole, username).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminrolehandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { error: 'User with given username does not exist'},
      { status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist');
  }
  ));

  describe('removeUserRoleAsync', () => {
    it('should remove the role from the user', fakeAsync(() => {
      let roleToRemove = 'MODERATOR';
      let username = 'validUser';

      abas.removeUserRoleAsync(roleToRemove, username).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminrolehandler?role=MODERATOR&username=validUser');
      expect(req.request.method).toEqual('DELETE');

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let roleToRemove = 'MODERATOR';
      let username = 'invalidUser';

      abas.removeUserRoleAsync(roleToRemove, username).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminrolehandler?role=MODERATOR&username=invalidUser');
      expect(req.request.method).toEqual('DELETE');

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  describe('assignManagerToTopicAsync', () => {
    it('should make request to assign user to a topic', fakeAsync(() => {
      let topicID = 'topic1234';
      let username = 'validUser';
      let payload = {
        topic_id: topicID,
        username: username,
        action: 'assign'
      };
      abas.assignManagerToTopicAsync(username, topicID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/topicmanagerrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let topicID = 'topic1234';
      let username = 'invalidUser';
      let payload = {
        topic_id: topicID,
        username: username,
        action: 'assign'
      };
      abas.assignManagerToTopicAsync(username, topicID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/topicmanagerrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  describe('deassignManagerFromTopicAsync', () => {
    it('should make request to deassign user from topic', fakeAsync(() => {
      let topicID = 'topic1234';
      let username = 'validUser';
      let payload = {
        topic_id: topicID,
        username: username,
        action: 'deassign'
      };
      abas.deassignManagerFromTopicAsync(username, topicID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/topicmanagerrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let topicID = 'topic1234';
      let username = 'invalidUser';
      let payload = {
        topic_id: topicID,
        username: username,
        action: 'deassign'
      };
      abas.deassignManagerFromTopicAsync(username, topicID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/topicmanagerrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  describe('assignTranslationCoordinator', () => {
    it('should make request to assign user to a language', fakeAsync(() => {
      let languageID = 'en';
      let username = 'validUser';
      let payload = {
        language_id: languageID,
        username: username,
        action: 'assign'
      };
      abas.assignTranslationCoordinator(username, languageID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/translationcoordinatorrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let languageID = 'en';
      let username = 'invalidUser';
      let payload = {
        language_id: languageID,
        username: username,
        action: 'assign'
      };
      abas.assignTranslationCoordinator(username, languageID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/translationcoordinatorrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  describe('deassignTranslationCoordinator', () => {
    it('should make request to deassign user from language', fakeAsync(() => {
      let languageID = 'en';
      let username = 'validUser';
      let payload = {
        language_id: languageID,
        username: username,
        action: 'deassign'
      };
      abas.deassignTranslationCoordinator(username, languageID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/translationcoordinatorrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let languageID = 'en';
      let username = 'invalidUser';
      let payload = {
        language_id: languageID,
        username: username,
        action: 'deassign'
      };
      abas.deassignTranslationCoordinator(username, languageID).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/translationcoordinatorrolehandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  describe('markUserBannedAsync', () => {
    it('should make request to mark a user banned', fakeAsync(() => {
      let username = 'validUser';
      let payload = {
        username: username
      };
      abas.markUserBannedAsync(username).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/bannedusershandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let username = 'invalidUser';
      let payload = { username };

      abas.markUserBannedAsync(username).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/bannedusershandler');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  describe('unmarkUserBannedAsync', () => {
    it('should make a request to unmark a banned user', fakeAsync(() => {
      let username = 'validUser';
      abas.unmarkUserBannedAsync(username).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/bannedusershandler?username=validUser');
      expect(req.request.method).toEqual('DELETE');

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let username = 'invalidUser';
      abas.unmarkUserBannedAsync(username).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/bannedusershandler?username=invalidUser');
      expect(req.request.method).toEqual('DELETE');

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  // Test cases for Admin Misc Tab.
  it('should clear search index when calling clearSearchIndexAsync',
    fakeAsync(() => {
      abas.clearSearchIndexAsync()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should fail to clear search index when calling clearSearchIndexAsync',
    fakeAsync(() => {
      abas.clearSearchIndexAsync()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush({
        error: 'Failed to clear search index.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Failed to clear search index.');
    }
    ));

  it('should regenerate topic related oppurtunities when' +
    'calling regenerateOpportunitiesRelatedToTopicAsync', fakeAsync(() => {
    let action = 'regenerate_topic_related_opportunities';
    let topicId = 'topic_1';
    let payload = {
      action: action,
      topic_id: topicId
    };

    abas.regenerateOpportunitiesRelatedToTopicAsync(
      topicId
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to regenerate topic related oppurtunities when' +
    'calling regenerateOpportunitiesRelatedToTopicAsync', fakeAsync(() => {
    let action = 'regenerate_topic_related_opportunities';
    let topicId = 'InvalidId';
    let payload = {
      action: action,
      topic_id: topicId
    };

    abas.regenerateOpportunitiesRelatedToTopicAsync(
      topicId
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  it('should successfully rollback exploration', fakeAsync(() => {
    let action = 'rollback_exploration_to_safe_state';
    let expId = '123';
    let payload = {
      action: action,
      exp_id: expId
    };

    abas.rollbackExplorationToSafeState(expId).then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should report failure when rolling back exploration', fakeAsync(() => {
    let action = 'rollback_exploration_to_safe_state';
    let expId = '123';
    let payload = {
      action: action,
      exp_id: expId
    };

    abas.rollbackExplorationToSafeState(expId).then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }));

  it('should upload topic similarities when calling' +
    'uploadTopicSimilaritiesAsync', fakeAsync(() => {
    let action = 'upload_topic_similarities';
    let data = 'topic_similarities.csv';
    let payload = {
      action: action,
      data: data
    };

    abas.uploadTopicSimilaritiesAsync(data)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to upload topic similarities when calling' +
    'uploadTopicSimilaritiesAsync', fakeAsync(() => {
    let action = 'upload_topic_similarities';
    let data = 'topic_similarities.csv';
    let payload = {
      action: action,
      data: data
    };

    abas.uploadTopicSimilaritiesAsync(data)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to upload data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to upload data.');
  }
  ));

  it('should send dummy mail to admin when calling' +
    'sendDummyMailToAdminAsync', fakeAsync(() => {
    abas.sendDummyMailToAdminAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/senddummymailtoadminhandler');
    expect(req.request.method).toEqual('POST');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to send dummy mail to admin when calling' +
  'sendDummyMailToAdminAsync', fakeAsync(() => {
    abas.sendDummyMailToAdminAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/senddummymailtoadminhandler');
    expect(req.request.method).toEqual('POST');
    req.flush({
      error: 'Failed to send dummy mail.'
    }, {
      status: 400, statusText: 'Bad Request'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to send dummy mail.');
  }
  ));

  it('should update the username of oppia account given' +
    'the name when calling updateUserNameAsync', fakeAsync(() => {
    let oldUsername = 'old name';
    let newUsername = 'new name';
    abas.updateUserNameAsync(oldUsername, newUsername)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/updateusernamehandler');
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to update the username of oppia account when username' +
    'does not exist when calling updateUserNameAsync', fakeAsync(() => {
    let oldUsername = 'Invalid name';
    let newUsername = 'Invalid name';
    abas.updateUserNameAsync(oldUsername, newUsername)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/updateusernamehandler');
    expect(req.request.method).toEqual('PUT');
    req.flush({
      error: 'Failed to update username.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to update username.');
  }
  ));

  it('should get the data of number of pending delete requests' +
    'when calling getNumberOfPendingDeletionRequestAsync', fakeAsync(() => {
    abas.getNumberOfPendingDeletionRequestAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/numberofdeletionrequestshandler');
    expect(req.request.method).toEqual('GET');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should grant super admin privileges to user', fakeAsync(() => {
    abas.grantSuperAdminPrivilegesAsync('abc')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/adminsuperadminhandler');
    expect(req.request.body).toEqual({username: 'abc'});
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should revoke super admin privileges to user', fakeAsync(() => {
    abas.revokeSuperAdminPrivilegesAsync('abc')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/adminsuperadminhandler?username=abc');
    expect(req.request.method).toEqual('DELETE');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to get the data of number of pending deleter requests' +
  'when calling getNumberOfPendingDeletionRequestAsync', fakeAsync(() => {
    abas.getNumberOfPendingDeletionRequestAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/numberofdeletionrequestshandler');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  it('should get the data of models related to the user given the' +
    'userId when calling getModelsRelatedToUserAsync', fakeAsync(() => {
    let userId = 'validId';
    let result = {
      related_models_exist: true
    };
    abas.getModelsRelatedToUserAsync(userId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/verifyusermodelsdeletedhandler' +
      '?user_id=validId');
    expect(req.request.method).toEqual('GET');

    req.flush({
      related_models_exist: true
    }, {
      status: 200, statusText: 'Success.'
    });
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      result.related_models_exist);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to get the data of models related to the user given the' +
    'userId when calling getModelsRelatedToUserAsync', fakeAsync(() => {
    let userId = 'InvalidId';
    abas.getModelsRelatedToUserAsync(userId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/verifyusermodelsdeletedhandler' +
      '?user_id=InvalidId');
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'User does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('User does not exist.');
  }
  ));

  it('should delete the user account given the userId and' +
    'username when calling deleteUserAsync', fakeAsync(() => {
    let userId = 'validId';
    let username = 'validUsername';

    abas.deleteUserAsync(userId, username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/deleteuserhandler' +
      '?user_id=validId&username=validUsername');
    expect(req.request.method).toEqual('DELETE');

    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to delete the user account given the userId and' +
    'username when calling deleteUserAsync', fakeAsync(() => {
    let userId = 'InvalidId';
    let username = 'InvalidUsername';

    abas.deleteUserAsync(userId, username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/deleteuserhandler' +
      '?user_id=InvalidId&username=InvalidUsername');
    expect(req.request.method).toEqual('DELETE');

    req.flush({
      error: 'User does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('User does not exist.');
  }
  ));

  // Test cases for Admin Config Tab.
  it('should revert specified config property to default' +
    'value given the config property ID when calling' +
    'revertConfigPropertyAsync', fakeAsync(() => {
    let action = 'revert_config_property';
    let configPropertyId = 'classroom_pages_data';
    let payload = {
      action: action,
      config_property_id: configPropertyId
    };

    abas.revertConfigPropertyAsync(
      configPropertyId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to revert specified config property to default' +
    'value when given config property ID is invalid when calling' +
    'revertConfigPropertyAsync', fakeAsync(() => {
    let action = 'revert_config_property';
    let configPropertyId = 'InvalidId';
    let payload = {
      action: action,
      config_property_id: configPropertyId
    };

    abas.revertConfigPropertyAsync(
      configPropertyId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'Config property does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Config property does not exist.');
  }
  ));

  it('should save the new config properties given the new' +
    'config property when calling' +
    'saveConfigPropertiesAsync', fakeAsync(() => {
    let action = 'save_config_properties';
    let payload = {
      action: action,
      new_config_property_values: configPropertyValues
    };

    abas.saveConfigPropertiesAsync(
      configPropertyValues).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to save the new config properties when given new' +
    'config property is invalid when calling' +
    'saveConfigPropertiesAsync', fakeAsync(() => {
    let action = 'save_config_properties';
    let payload = {
      action: action,
      new_config_property_values: configPropertyValues
    };
    abas.saveConfigPropertiesAsync(
      configPropertyValues).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'Config property does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Config property does not exist.');
  }
  ));

  // Tests for Admin Dev Mode Activities Tab.
  it('should generate dummy explorations', fakeAsync(() => {
    let action = 'generate_dummy_explorations';
    let numDummyExpsToGenerate = 2;
    let numDummyExpsToPublish = 1;
    let payload = {
      action: action,
      num_dummy_exps_to_generate: numDummyExpsToGenerate,
      num_dummy_exps_to_publish: numDummyExpsToPublish
    };

    abas.generateDummyExplorationsAsync(
      numDummyExpsToGenerate, numDummyExpsToPublish
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should handle generate dummy explorations ' +
    'request failure', fakeAsync(() => {
    let action = 'generate_dummy_explorations';
    let numDummyExpsToGenerate = 2;
    let numDummyExpsToPublish = 1;
    let payload = {
      action: action,
      num_dummy_exps_to_generate: numDummyExpsToGenerate,
      num_dummy_exps_to_publish: numDummyExpsToPublish
    };

    abas.generateDummyExplorationsAsync(
      numDummyExpsToGenerate, numDummyExpsToPublish
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  it('should generate dummy blogs', fakeAsync(()=> {
    let action = 'generate_dummy_blog_post';
    let blogPostTitle = 'Education';
    let payload = {
      action,
      blog_post_title: blogPostTitle,
    };
    abas.generateDummyBlogPostAsync(blogPostTitle)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should handle generate dummy blog request failure', fakeAsync(() => {
    let action = 'generate_dummy_blog_post';
    let blogPostTitle = 'Education';
    let payload = {
      action,
      blog_post_title: blogPostTitle,
    };
    abas.generateDummyBlogPostAsync(blogPostTitle)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  it('should reload exploration', fakeAsync(() => {
    let action = 'reload_exploration';
    let explorationId = 'exp1';
    let payload = {
      action: action,
      exploration_id: explorationId
    };

    abas.reloadExplorationAsync(
      explorationId
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should handle reload exploration request failure', fakeAsync(() => {
    let action = 'reload_exploration';
    let explorationId = 'exp1';
    let payload = {
      action: action,
      exploration_id: explorationId
    };

    abas.reloadExplorationAsync(
      explorationId
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  it('should generate dummy new structures data', fakeAsync(() => {
    let action = 'generate_dummy_new_structures_data';
    let payload = {
      action: action,
    };

    abas.generateDummyNewStructuresDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should handle generate dummy new structures data ' +
    'request failure', fakeAsync(() => {
    let action = 'generate_dummy_new_structures_data';
    let payload = {
      action: action,
    };

    abas.generateDummyNewStructuresDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  it('should generate dummy new skill data', fakeAsync(() => {
    let action = 'generate_dummy_new_skill_data';
    let payload = {
      action: action,
    };

    abas.generateDummyNewSkillDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should handle generate dummy new skill data ' +
    'request failure', fakeAsync(() => {
    let action = 'generate_dummy_new_skill_data';
    let payload = {
      action: action,
    };

    abas.generateDummyNewSkillDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  it('should generate dummy classroom data', fakeAsync(() => {
    let action = 'generate_dummy_classroom';
    let payload = {
      action: action,
    };

    abas.generateDummyClassroomDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should handle generate dummy new classroom data request failure',
    fakeAsync(() => {
      let action = 'generate_dummy_classroom';
      let payload = {
        action: action,
      };

      abas.generateDummyClassroomDataAsync()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/adminhandler');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({
        error: 'Failed to get data.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
    }));

  it('should reload collection', fakeAsync(() => {
    let action = 'reload_collection';
    let collectionId = 'exp1';
    let payload = {
      action: action,
      collection_id: collectionId
    };

    abas.reloadCollectionAsync(
      collectionId
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should handle reload collection request failure', fakeAsync(() => {
    let action = 'reload_collection';
    let collectionId = 'exp1';
    let payload = {
      action: action,
      collection_id: collectionId
    };

    abas.reloadCollectionAsync(
      collectionId
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      error: 'Failed to get data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
  }
  ));

  describe('updateBlogPostDataAsync', () => {
    it('should make request to upload blog post', fakeAsync(() => {
      let authorUsername = 'validUser';
      let blogPostId = 'sampleid1234';
      let publishedOn = '05/06/2000';
      abas.updateBlogPostDataAsync(
        authorUsername, blogPostId, publishedOn)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/updateblogpostdatahandler');
      expect(req.request.method).toEqual('PUT');

      req.flush(
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call fail handler if the request fails', fakeAsync(() => {
      let authorUsername = 'validUser';
      let blogPostId = 'sampleid1234';
      let publishedOn = '05/06/2000';
      abas.updateBlogPostDataAsync(
        authorUsername, blogPostId, publishedOn)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/updateblogpostdatahandler');
      expect(req.request.method).toEqual('PUT');

      req.flush(
        { error: 'User with given username does not exist'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'User with given username does not exist');
    }));
  });

  describe('retrieveExplorationInteractionIdsAsync', () => {
    it('should get interaction IDs if exploration exists'
      , fakeAsync(() => {
        let expId = '123';
        let result = {
          interactions: [{id: 'EndExploration'}]
        };

        abas.retrieveExplorationInteractionIdsAsync(expId)
          .then(successHandler, failHandler);

        let req = httpTestingController.expectOne(
          '/interactions?exp_id=123');
        expect(req.request.method).toEqual('GET');

        req.flush(
          { interactions: [{id: 'EndExploration'}]},
          { status: 200, statusText: 'Success.'});
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(result);
        expect(failHandler).not.toHaveBeenCalled();
      }));

    it('should fail to get interaction IDs if exploration does not exist'
      , fakeAsync(() => {
        let expId = 'invalidExpId';

        abas.retrieveExplorationInteractionIdsAsync(expId)
          .then(successHandler, failHandler);

        let req = httpTestingController.expectOne(
          '/interactions?exp_id=invalidExpId');
        expect(req.request.method).toEqual('GET');

        req.flush({
          error: 'Exploration does not exist'
        }, {
          status: 400, statusText: 'Bad Request'
        });
        flushMicrotasks();

        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalledWith('Exploration does not exist');
      }));
  });
});
