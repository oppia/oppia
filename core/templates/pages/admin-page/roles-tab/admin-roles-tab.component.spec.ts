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
 * @fileoverview Tests for Admin roles tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { AdminBackendApiService, AdminPageData, ContributionRightsBackendResponse, UserRolesBackendResponse, ViewContributionBackendResponse } from 'domain/admin/admin-backend-api.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';
import { AddContributionRightsAction, AdminRolesTabComponent, RemoveContributionRightsAction, UpdateRoleAction, ViewContributionReviewersAction, ViewUserRolesAction } from './admin-roles-tab.component';

describe('Admin roles tab component ', function() {
  let component: AdminRolesTabComponent;
  let fixture: ComponentFixture<AdminRolesTabComponent>;

  let adminBackendApiService: AdminBackendApiService;
  let adminDataService: AdminDataService;
  let adminTaskManagerService: AdminTaskManagerService;
  let languageUtilService: LanguageUtilService;

  let statusMessageSpy: jasmine.Spy;
  const sampleCreatorTopicSummaryBackendDict = {
    id: 'sample_topic_id',
    name: 'Topic Name',
    subtopic_count: 5,
    canonical_story_count: 4,
    total_skill_count: 10,
    total_published_node_count: 3,
    uncategorized_skill_count: 3,
    language_code: 'en',
    description: 'description',
    version: 1,
    additional_story_count: 0,
    topic_model_created_on: 231241343,
    topic_model_last_updated: 3454354354,
    classroom: 'math',
    url_fragment: 'topic-name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    is_published: false,
    can_edit_topic: true
  };

  const sampleTopicSummary: CreatorTopicSummary = (
    CreatorTopicSummary.createFromBackendDict(
      sampleCreatorTopicSummaryBackendDict));

  const adminPageData: AdminPageData = {
    demoExplorationIds: ['expId'],
    demoExplorations: [
      [
        '0',
        'welcome.yaml'
      ]
    ],
    demoCollections: [
      ['collectionId']
    ],
    updatableRoles: {updatableRole: 'user1'},
    roleToActions: {
      Admin: ['Accept any suggestion', 'Access creator dashboard']
    },
    configProperties: {},
    viewableRoles: {
      MODERATOR: 'moderator',
      TOPIC_MANAGER: 'topic manager'
    },
    topicSummaries: [
      sampleTopicSummary
    ],
    featureFlags: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [AdminRolesTabComponent],
      providers: [
        AdminBackendApiService,
        AdminDataService,
        AdminTaskManagerService,
        LanguageUtilService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRolesTabComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    adminDataService = TestBed.inject(AdminDataService);
    adminTaskManagerService = TestBed.inject(AdminTaskManagerService);
    languageUtilService = TestBed.inject(LanguageUtilService);

    statusMessageSpy = spyOn(component.setStatusMessage, 'emit')
      .and.returnValue(null);
  });

  it('should retrieve data from the backend and ' +
    'set properties when initialized', fakeAsync(() => {
    spyOn(languageUtilService, 'getAllVoiceoverLanguageCodes')
      .and.returnValue(['en']);
    spyOn(languageUtilService, 'getAudioLanguageDescription')
      .and.returnValue('description');
    spyOn(adminDataService, 'getDataAsync').and.resolveTo(adminPageData);

    // Prechecks.
    expect(component.UPDATABLE_ROLES).toEqual({});
    expect(component.roleToActions).toBe(null);
    expect(component.VIEWABLE_ROLES).toEqual({});
    expect(component.topicSummaries).toBe(null);

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.UPDATABLE_ROLES).toBe(adminPageData.updatableRoles);
    expect(component.roleToActions).toBe(adminPageData.roleToActions);
    expect(component.VIEWABLE_ROLES).toBe(adminPageData.viewableRoles);
    expect(component.topicSummaries).toBe(adminPageData.topicSummaries);
  }));

  it('should return language description given language codes ' +
    'when calling \'getLanguageDescriptions\'', () => {
    spyOn(languageUtilService, 'getAudioLanguageDescription')
      .and.returnValue('english');

    let languageDesriptions = component.getLanguageDescriptions(['en1', 'en2']);

    expect(languageDesriptions).toEqual(['english', 'english']);
  });

  it('should check whether a language is in specific review cateogry', () => {
    // Checks for 'translation'.
    let result = component.isLanguageSpecificReviewCategory('translation');
    expect(result).toBe(true);

    // Checks for 'voiceover'.
    result = component.isLanguageSpecificReviewCategory('voiceover');
    expect(result).toBe(true);

    // Checks for 'invalidCategory'.
    result = component.isLanguageSpecificReviewCategory('invalidCategory');
    expect(result).toBe(false);
  });

  it('should clear results when ever change is detected in ' +
    'the form', fakeAsync(() => {
    const viewUserRolesAction: ViewUserRolesAction = {
      filterCriterion: 'username',
      role: 'admin',
      username: 'user1',
      isValid: () => true
    };

    const userRolesResult: UserRolesBackendResponse = {
      admin: 'admin'
    };

    spyOn(adminBackendApiService, 'viewUsersRoleAsync')
      .and.returnValue(Promise.resolve({admin: 'admin'}));

    // Prechecks.
    expect(component.userRolesResult).toBe(null);

    // Clicking on view roles button to fill form with user data.
    component.submitRoleViewForm(viewUserRolesAction);
    tick();

    expect(Object.keys(component.userRolesResult))
      .toContain(userRolesResult.admin);

    // Clearing results.
    component.clearResults();
    expect(component.userRolesResult).toEqual({});
  }));

  it('should handle error responses sent from the backend', () => {
    component.handleErrorResponse('User name does not exist.');
    expect(statusMessageSpy).toHaveBeenCalledWith(
      'Server error: User name does not exist.');
  });

  describe('on clicking view roles button ', () => {
    it('should successfully show role of a user given the ' +
      'username', fakeAsync(() => {
      // Note that username is filter criterion here.
      const viewUserRolesAction: ViewUserRolesAction = {
        filterCriterion: 'username',
        role: 'admin',
        username: 'user1',
        isValid: () => true
      };

      const userRolesResult: UserRolesBackendResponse = {
        admin: 'admin'
      };

      spyOn(adminBackendApiService, 'viewUsersRoleAsync')
        .and.returnValue(Promise.resolve({admin: 'admin'}));

      expect(component.userRolesResult).toEqual(null);

      component.submitRoleViewForm(viewUserRolesAction);
      tick();

      expect(Object.keys(component.userRolesResult))
        .toContain(userRolesResult.admin);
      expect(statusMessageSpy).toHaveBeenCalledWith('Success.');
    }));

    it('should successfully show users given the ' +
      'role name', fakeAsync(() => {
      // Note that role is filter criterion here.
      const viewUserRolesAction: ViewUserRolesAction = {
        filterCriterion: 'role',
        role: 'admin',
        username: 'user1',
        isValid: () => true
      };

      const userRolesResult: UserRolesBackendResponse = {
        admin: 'admin'
      };

      spyOn(adminBackendApiService, 'viewUsersRoleAsync')
        .and.returnValue(Promise.resolve({admin: 'admin'}));

      expect(component.userRolesResult).toEqual(null);

      component.submitRoleViewForm(viewUserRolesAction);
      tick();

      expect(Object.keys(component.userRolesResult))
        .toContain(userRolesResult.admin);
      expect(statusMessageSpy).toHaveBeenCalledWith('Success.');
    }));

    it('should not show any results if the given role is unclaimed ' +
      'by any user', fakeAsync(() => {
      // Note that role is filter criterion here.
      const viewUserRolesAction: ViewUserRolesAction = {
        filterCriterion: 'role',
        role: 'admin',
        username: 'user1',
        isValid: () => true
      };

      // Note that we are returning empty dict.
      spyOn(adminBackendApiService, 'viewUsersRoleAsync')
        .and.returnValue(Promise.resolve({}));

      expect(component.userRolesResult).toEqual(null);

      component.submitRoleViewForm(viewUserRolesAction);
      tick();

      expect(statusMessageSpy).toHaveBeenCalledWith('No results.');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'viewUsersRoleAsync')
        .and.returnValue(Promise.resolve({}));

      const viewUserRolesAction: ViewUserRolesAction = {
        filterCriterion: 'username',
        role: 'admin',
        username: 'user1',
        isValid: () => true
      };

      component.submitRoleViewForm(viewUserRolesAction);
      tick();

      expect(adminBackendServiceSpy).not.toHaveBeenCalled();
    }));
  });

  describe('on clicking update role button ', () => {
    it('should successfully update the role of the user', fakeAsync(() => {
      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'updateUserRoleAsync')
        .and.returnValue(Promise.resolve(null));

      const updateRoleAction: UpdateRoleAction = {
        newRole: 'admin',
        username: 'user1',
        topicId: 'topicId',
        isValid: () => true
      };

      component.submitUpdateRoleForm(updateRoleAction);
      tick();

      expect(adminBackendServiceSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Role of user1 successfully updated to admin');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'updateUserRoleAsync')
        .and.returnValue(Promise.resolve(null));

      const updateRoleAction: UpdateRoleAction = {
        newRole: 'admin',
        username: 'user1',
        topicId: 'topicId',
        isValid: () => true
      };

      component.submitUpdateRoleForm(updateRoleAction);
      tick();

      expect(adminBackendServiceSpy).not.toHaveBeenCalled();
    }));
  });

  describe('on clicking view contributors button ', () => {
    it('should successfully show rights of a user given the ' +
      'username', fakeAsync(() => {
      // Note that username is filter criterion here.
      const viewContributionReviewersAction: ViewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'username',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      const viewContributorsResponse: ContributionRightsBackendResponse = {
        can_review_questions: true,
        can_review_translation_for_language_codes: ['en', 'es'],
        can_review_voiceover_for_language_codes: ['en', 'es'],
        can_submit_questions: true
      };

      spyOn(adminBackendApiService, 'contributionReviewerRightsAsync')
        .and.returnValue(Promise.resolve(viewContributorsResponse));

      expect(component.contributionReviewersDataFetched).toBe(false);

      component.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(component.contributionReviewersDataFetched).toBe(true);
      expect(statusMessageSpy).toHaveBeenCalledWith('Success.');
    }));

    it('should successfully show users given the ' +
      'contributor rights', fakeAsync(() => {
      // Note that rights is filter criterion here.
      const viewContributionReviewersAction: ViewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'role',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      const viewContributorsResponse: ViewContributionBackendResponse = {
        usernames: ['user1']
      };

      spyOn(adminBackendApiService, 'viewContributionReviewersAsync')
        .and.returnValue(Promise.resolve(viewContributorsResponse));

      expect(component.contributionReviewersResult).toEqual(null);
      expect(component.contributionReviewersDataFetched).toBe(false);

      component.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(component.contributionReviewersResult.usernames)
        .toEqual(viewContributorsResponse.usernames);
      expect(component.contributionReviewersDataFetched).toBe(true);
      expect(statusMessageSpy).toHaveBeenCalledWith('Success.');
    }));

    it('should not show any results if the given rights is unclaimed ' +
      'by any user', fakeAsync(() => {
      // Note that rights is filter criterion here.
      const viewContributionReviewersAction: ViewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'role',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      const viewContributorsResponse: ViewContributionBackendResponse = {
        usernames: []
      };

      // Note that we are returning empty list.
      spyOn(adminBackendApiService, 'viewContributionReviewersAsync')
        .and.returnValue(Promise.resolve({usernames: []}));

      expect(component.contributionReviewersDataFetched).toBe(false);

      component.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(component.contributionReviewersResult.usernames)
        .toEqual(viewContributorsResponse.usernames);

      expect(statusMessageSpy).toHaveBeenCalledWith('No results.');
      expect(component.contributionReviewersDataFetched).toBe(false);
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);
      const viewContributorsResponse: ViewContributionBackendResponse = {
        usernames: ['user1']
      };

      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'viewContributionReviewersAsync')
        .and.resolveTo(viewContributorsResponse);

      const viewContributionReviewersAction: ViewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'username',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      expect(component.contributionReviewersDataFetched).toBe(false);

      component.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(adminBackendServiceSpy).not.toHaveBeenCalled();
      expect(component.contributionReviewersDataFetched).toBe(false);
    }));
  });

  describe('on clicking add rights button ', () => {
    it('should successfully update the rights of the user', fakeAsync(() => {
      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'addContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));

      const addContributionRightsAction: AddContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      component.submitAddContributionRightsForm(addContributionRightsAction);
      tick();

      expect(adminBackendServiceSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Successfully added "user1" as translation reviewer.');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'addContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));

      const addContributionRightsAction: AddContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      component.submitAddContributionRightsForm(addContributionRightsAction);
      tick();

      expect(adminBackendServiceSpy).not.toHaveBeenCalled();
    }));
  });

  describe('on clicking remove rights button ', () => {
    it('should successfully remove the rights of the user', fakeAsync(() => {
      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'removeContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));

      const removeContributionRightsAction: RemoveContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        method: 'all',
        username: 'user1'
      };

      component.submitRemoveContributionRightsForm(
        removeContributionRightsAction);
      tick();

      expect(adminBackendServiceSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Success.');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      let adminBackendServiceSpy = spyOn(
        adminBackendApiService, 'removeContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));

      const removeContributionRightsAction: RemoveContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        method: 'all',
        username: 'user1'
      };

      component.submitRemoveContributionRightsForm(
        removeContributionRightsAction);
      tick();

      expect(adminBackendServiceSpy).not.toHaveBeenCalled();
    }));
  });


  // Note that 'refreshFormData()' is called when
  // ever change is detected in any one of the
  // forms available in admin-roles-tab.
  describe('on validating form data ', () => {
    describe('in the view user roles section ', () => {
      it('should return true if there are no validation errors ' +
        'when fetching user roles', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting filter criterion to be username.
        component.formData.viewUserRoles.filterCriterion = 'username';
        component.formData.viewUserRoles.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.viewUserRoles.isValid();
        expect(result).toBe(true);
      }));

      it('should return false if there are validation errors ' +
        'when fetching user roles', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting filter criterion to be invalid.
        component.formData.viewUserRoles.filterCriterion = 'invalid';
        component.formData.viewUserRoles.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.viewUserRoles.isValid();
        expect(result).toBe(false);
      }));
    });

    describe('in the update role section ', () => {
      it('should return true if there are no validation errors ' +
        'when updating role to topic manager', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting new role to be 'TOPIC_MANAGER'.
        component.formData.updateRole.newRole = 'TOPIC_MANAGER';
        component.formData.updateRole.topicId = 'topicId';
        component.formData.updateRole.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.updateRole.isValid();
        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when updating role to any role other than topic ' +
        'manager', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting new role to be 'admin'.
        component.formData.updateRole.newRole = 'admin';
        component.formData.updateRole.topicId = 'topicId';
        component.formData.updateRole.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.updateRole.isValid();
        expect(result).toBe(true);
      }));

      it('should return false if there are validation errors ' +
        'when updating user role', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting new role to be null.
        component.formData.updateRole.newRole = null;
        fixture.detectChanges();

        let result = component.formData.updateRole.isValid();
        expect(result).toBe(false);
      }));
    });

    describe('in the view contributor dashboard users section ', () => {
      it('should return true if there are no validation errors ' +
        'when fetching user rights with filter criterion as ' +
        'rights and category as voiceOver', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Note that rights is filter criterion here.
        component.formData.viewContributionReviewers.filterCriterion = 'role';
        component.formData.viewContributionReviewers.category = 'voiceOver';
        component.formData.viewContributionReviewers.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.viewContributionReviewers.isValid();
        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when fetching user rights with filter criterion as ' +
        'rights and category as translation', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Note that rights is filter criterion here.
        component.formData.viewContributionReviewers.filterCriterion = 'role';
        component.formData.viewContributionReviewers.category = 'translation';
        component.formData.viewContributionReviewers.languageCode = 'en';
        component.formData.viewContributionReviewers.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.viewContributionReviewers.isValid();
        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when fetching user rights with filter criterion as ' +
        'username', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Note that username is filter criterion here.
        component.formData.viewContributionReviewers.filterCriterion = (
          'username');
        component.formData.viewContributionReviewers.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.viewContributionReviewers.isValid();
        expect(result).toBe(true);
      }));
    });

    describe('in the add contribution rights section ', () => {
      it('should return true if there are no validation errors ' +
        'when updating user rights for category translation', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting category to be translation.
        component.formData.addContributionReviewer.category = 'translation';
        component.formData.addContributionReviewer.languageCode = 'en';
        component.formData.addContributionReviewer.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.addContributionReviewer.isValid();
        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when updating user rights for category voicover', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting category to be voiceover.
        component.formData.addContributionReviewer.category = 'voiceOver';
        component.formData.addContributionReviewer.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.addContributionReviewer.isValid();
        expect(result).toBe(true);
      }));

      it('should return false if there are validation errors ' +
        'when updating user rights', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting category to be null.
        component.formData.addContributionReviewer.category = null;
        component.formData.addContributionReviewer.username = 'user1';
        fixture.detectChanges();

        let result = component.formData.addContributionReviewer.isValid();
        expect(result).toBe(false);
      }));
    });

    describe('in the remove contribution rights section ', () => {
      it('should return true if there are no validation errors ' +
        'when removing user rights for all categories', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting method to all.
        component.formData.removeContributionReviewer.category = 'all';
        component.formData.removeContributionReviewer.languageCode = 'en';
        component.formData.removeContributionReviewer.username = 'user1';
        component.formData.removeContributionReviewer.method = 'all';
        fixture.detectChanges();

        let result = component.formData.removeContributionReviewer.isValid();
        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when removing user rights for category translation', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting category to translation.
        component.formData.removeContributionReviewer.category = 'translation';
        component.formData.removeContributionReviewer.languageCode = 'en';
        component.formData.removeContributionReviewer.username = 'user1';
        component.formData.removeContributionReviewer.method = 'specific';
        fixture.detectChanges();

        let result = component.formData.removeContributionReviewer.isValid();
        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when removing user rights for category voicover', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting category to voiceover.
        component.formData.removeContributionReviewer.category = 'voiceOver';
        component.formData.removeContributionReviewer.username = 'user1';
        component.formData.removeContributionReviewer.method = 'specific';
        fixture.detectChanges();

        let result = component.formData.removeContributionReviewer.isValid();
        expect(result).toBe(true);
      }));

      it('should return false if there are validation errors ' +
        'when removing user rights', fakeAsync(() => {
        component.refreshFormData();
        fixture.detectChanges();

        // Setting category to be null.
        component.formData.removeContributionReviewer.category = null;
        component.formData.removeContributionReviewer.username = 'user1';
        component.formData.removeContributionReviewer.method = 'specific';
        fixture.detectChanges();

        let result = component.formData.removeContributionReviewer.isValid();
        expect(result).toBe(false);
      }));
    });
  });
});
