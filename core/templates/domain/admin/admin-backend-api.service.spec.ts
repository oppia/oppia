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
import { PlatformParameterFilterType } from 'domain/platform_feature/platform-parameter-filter.model';
import { FeatureStage, PlatformParameter } from 'domain/platform_feature/platform-parameter.model';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Admin backend api service', () => {
  let abas: AdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  let successHandler = null;
  let failHandler = null;
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
        thumbnail_bg_color: '#C6DCDA'
      }
    ],
    updatable_roles: {
      TOPIC_MANAGER: 'topic manager'
    },
    demo_collections: [],
    config_properties: {
      oppia_csrf_secret: {
        schema: {
          type: 'unicode'
        },
        value: '3WHOWnD3sy0r1wukJ2lX4vBS_YA=',
        description: 'Text used to encrypt CSRF tokens.'
      }
    },
    demo_exploration_ids: ['19'],
    demo_explorations: [
      [
        '0',
        'welcome.yaml'
      ]
    ],
    viewable_roles: {
      TOPIC_MANAGER: 'topic manager'
    },
    feature_flags: [{
      name: 'dummy_feature',
      description: 'this is a dummy feature',
      data_type: 'bool',
      rules: [{
        filters: [{
          type: PlatformParameterFilterType.ServerMode,
          conditions: [<[string, string]>['=', 'dev']]
        }],
        value_when_matched: true
      }],
      rule_schema_version: 1,
      default_value: false,
      is_feature: true,
      feature_stage: FeatureStage.DEV
    }]
  };
  let adminDataObject: AdminPageData;
  let configPropertyValues = {
    always_ask_learners_for_answer_details: false,
    classroom_pages_data: {
      course_details: 'fds',
      name: 'mathfas',
      topic_ids: [],
      topic_list_intro: 'fsd',
      url_fragment: 'mathfsad',
    },
    classroom_promos_are_enabled: false,
    contributor_can_suggest_questions: false,
    contributor_dashboard_is_enabled: true,
    contributor_dashboard_reviewer_emails_is_enabled: true,
    email_footer: 'fsdf',
    email_sender_name: 'Site Admin',
    enable_admin_notifications_for_reviewer_shortage: false,
    featured_translation_languages: [],
    high_bounce_rate_task_minimum_exploration_starts: 1001,
    high_bounce_rate_task_state_bounce_rate_creation_threshold: 0.2,
    high_bounce_rate_task_state_bounce_rate_obsoletion_threshold: 0.2,
    is_improvements_tab_enabled: false,
    max_number_of_explorations_in_math_svgs_batch: 2,
    max_number_of_suggestions_per_reviewer: 5,
    max_number_of_svgs_in_math_svgs_batch: 25,
    notification_user_ids_for_failed_tasks: [],
    notify_admins_suggestions_waiting_too_long_is_enabled: false,
    oppia_csrf_secret: 'H62T5aIngXb1PB6arDkFrAnxakpQ=',
    promo_bar_enabled: false,
    promo_bar_message: 'fasdfa',
    record_playthrough_probability: 0.2,
    signup_email_content: {
      subject: 'THIS IS A PLACEHOLDER.',
      html_body: 'THIS IS A <b>PLACEHOLDER</b> AND SHOULD BE REPLACED.'
    },
    unpublish_exploration_email_html_body: 'test',
    vmid_shared_secret_key_mapping: {
      shared_secret_key: 'aafd1a2b3c4e',
      vm_id: 'fds'
    },
    whitelisted_exploration_ids_for_playthroughs: [
      'umPkawp0L1M0-', 'oswa1m5Q3jK41']
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
      topicSummaries: adminBackendResponse.topic_summaries.map(
        CreatorTopicSummary.createFromBackendDict),
      featureFlags: adminBackendResponse.feature_flags.map(
        dict => PlatformParameter.createFromBackendDict(dict)
      )
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
    let filterCriterion = 'username';
    let role = null;
    let username = 'validUser';
    let result = {
      validUser: 'ADMIN'
    };
    abas.viewUsersRoleAsync(filterCriterion, role, username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/adminrolehandler' +
      '?filter_criterion=username&role=null&username=validUser');
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
    'when calling viewUsersRoleAsync', fakeAsync(() => {
    let filterCriterion = 'role';
    let role = 'ADMIN';
    let username = null;
    let result = {
      validUser: 'ADMIN'
    };
    abas.viewUsersRoleAsync(filterCriterion, role, username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/adminrolehandler' +
      '?filter_criterion=role&role=ADMIN&username=null');
    expect(req.request.method).toEqual('GET');

    req.flush(
      { validUser: 'ADMIN'},
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to get the data of user when user does' +
    'not exists when calling viewUsersRoleAsync', fakeAsync(() => {
    let filterCriterion = 'username';
    let role = null;
    let username = 'InvalidUser';
    abas.viewUsersRoleAsync(filterCriterion, role, username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/adminrolehandler' +
      '?filter_criterion=username&role=null&username=InvalidUser');
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

  it('should update the role of the user given the name' +
    'when calling updateUserRoleAsync', fakeAsync(() => {
    let topicId = null;
    let newRole = 'ADMIN';
    let username = 'validUser';
    let payload = {
      role: newRole,
      username: username,
      topic_id: topicId
    };
    abas.updateUserRoleAsync(newRole, username, topicId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminrolehandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to update the role of user when user does' +
    'not exists when calling updateUserRoleAsync', fakeAsync(() => {
    let topicId = null;
    let newRole = 'ADMIN';
    let username = 'InvalidUser';
    let payload = {
      role: newRole,
      username: username,
      topic_id: topicId
    };
    abas.updateUserRoleAsync(newRole, username, topicId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/adminrolehandler');
    expect(req.request.method).toEqual('POST');
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

  it('should add contribution rights to the user given the' +
    'name when calling addContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'validUser';
    let payload = {
      category: category,
      username: username,
      language_code: languageCode
    };
    abas.addContributionReviewerAsync(
      category, username, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/addcontributionrightshandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to add contribution rights to the user when user does' +
    'not exists when calling addContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'InvalidUser';
    let payload = {
      category: category,
      username: username,
      language_code: languageCode
    };
    abas.addContributionReviewerAsync(
      category, username, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/addcontributionrightshandler');
    expect(req.request.method).toEqual('POST');
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

  it('should get the data of contribution rights given the role' +
    'when calling viewContributionReviewersAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let result = ['validUsername'];
    abas.viewContributionReviewersAsync(
      category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/getcontributorusershandler' +
      '?category=voiceover&language_code=en');
    expect(req.request.method).toEqual('GET');

    req.flush(
      ['validUsername'],
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();

    category = 'question';
    languageCode = null;

    abas.viewContributionReviewersAsync(
      category, languageCode
    ).then(successHandler, failHandler);

    req = httpTestingController.expectOne(
      '/getcontributorusershandler' +
      '?category=question');
    expect(req.request.method).toEqual('GET');

    req.flush(
      ['validUsername'],
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to get the data of contribution rights when category does' +
  'not exists when calling viewContributionReviewersAsync', fakeAsync(() => {
    let category = 'InvalidCategory';
    let languageCode = 'en';
    abas.viewContributionReviewersAsync(
      category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/getcontributorusershandler' +
      '?category=InvalidCategory&language_code=en');
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'Invalid Category'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Invalid Category');
  }
  ));

  it('should get the data of contribution rights given the' +
    'username when calling contributionReviewerRightsAsync', fakeAsync(() => {
    let username = 'validUsername';
    let result = {
      can_review_questions: false,
      can_review_translation_for_language_codes: ['en'],
      can_review_voiceover_for_language_codes: [],
      can_submit_questions: false
    };
    abas.contributionReviewerRightsAsync(username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/contributionrightsdatahandler' +
      '?username=validUsername');
    expect(req.request.method).toEqual('GET');

    req.flush({
      can_review_questions: false,
      can_review_translation_for_language_codes: ['en'],
      can_review_voiceover_for_language_codes: [],
      can_submit_questions: false
    }, {
      status: 200, statusText: 'Success.'
    });
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to get the data of contribution rights when username does' +
  'not exists when calling contributionReviewerRightsAsync', fakeAsync(() => {
    let username = 'InvalidUsername';
    abas.contributionReviewerRightsAsync(username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/contributionrightsdatahandler' +
      '?username=InvalidUsername');
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'User with given username does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist.');
  }
  ));

  it('should remove all contribution rights given the username' +
    'when calling emoveContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = null;
    let username = 'validUser';
    let method = 'all';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    abas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to remove all contribution rights when user does' +
    'not exists when calling removeContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = null;
    let username = 'InvalidUser';
    let method = 'all';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    abas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'User with given username does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist.');
  }
  ));

  it('should remove specific contribution rights given the' +
    'username when calling removeContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'validUser';
    let method = 'specific';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    abas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to remove specific contribution rights when username does' +
    'not exists when calling removeContributionReviewerAsync', fakeAsync(() => {
    let category = 'voiceover';
    let languageCode = 'en';
    let username = 'InvalidUser';
    let method = 'specific';
    let payload = {
      username: username,
      removal_type: method,
      category: category,
      language_code: languageCode
    };
    abas.removeContributionReviewerAsync(
      username, method, category, languageCode
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/removecontributionrightshandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'User with given username does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist.');
  }
  ));

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

  it('should populate exploration stats when calling' +
    'populateExplorationStatsRegenerationCsvResultAsync', fakeAsync(() => {
    let action = 'regenerate_missing_exploration_stats';
    let expIdToRegenerate = '11';
    let payload = {
      action: action,
      exp_id: expIdToRegenerate
    };

    abas.populateExplorationStatsRegenerationCsvResultAsync(
      expIdToRegenerate
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

  it('should fail to populate exploration stats when calling' +
    'populateExplorationStatsRegenerationCsvResultAsync', fakeAsync(() => {
    let action = 'regenerate_missing_exploration_stats';
    let expIdToRegenerate = 'InvalidId';
    let payload = {
      action: action,
      exp_id: expIdToRegenerate
    };

    abas.populateExplorationStatsRegenerationCsvResultAsync(
      expIdToRegenerate
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
    let configPropertyId = 'promo_bar_enabled';
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
});
