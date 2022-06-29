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
 * @fileoverview Unit tests for the Contributor dashboard admin page.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserService } from 'services/user.service';
import { UserInfo } from 'domain/user/user-info.model';
import { ContributorDashboardAdminBackendApiService } from './services/contributor-dashboard-admin-backend-api.service';

describe('Contributor dashboard admin page ', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let userService: UserService = null;
  let contributorDashboardAdminBackendApiService:
    ContributorDashboardAdminBackendApiService = null;

  let userInfo: UserInfo = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    directive = $injector.get('contributorDashboardAdminPageDirective')[0];
    userService = $injector.get('UserService');
    contributorDashboardAdminBackendApiService = $injector.get(
      'ContributorDashboardAdminBackendApiService');

    userInfo = {
      _roles: ['USER_ROLE'],
      _isModerator: true,
      _isCurriculumAdmin: false,
      _isTopicManager: false,
      _isSuperAdmin: false,
      _canCreateCollections: true,
      _preferredSiteLanguageCode: 'en',
      _username: 'username1',
      _email: 'tester@example.org',
      _isLoggedIn: true,
      isModerator: () => true,
      isCurriculumAdmin: () => false,
      isSuperAdmin: () => false,
      isTopicManager: () => false,
      isTranslationAdmin: () => true,
      isQuestionAdmin: () => true,
      canCreateCollections: () => true,
      getPreferredSiteLanguageCode: () =>'en',
      getUsername: () => 'username1',
      getEmail: () => 'tester@example.org',
      isLoggedIn: () => true
    } as UserInfo;

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
  }));

  it('should fetch user info when initialized', fakeAsync(function() {
    const userInfoSpy = spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfo));

    ctrl.$onInit();
    tick();

    expect(userInfoSpy).toHaveBeenCalled();
  }));

  describe('on clicking add rights button ', () => {
    it('should successfully update the rights of the user', fakeAsync(() => {
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));
      const addContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      ctrl.submitAddContributionRightsForm(addContributionRightsAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(ctrl.statusMessage).toBe('Success.');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      ctrl.taskRunningInBackground = true;
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));
      const addContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };

      ctrl.submitAddContributionRightsForm(addContributionRightsAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy)
        .not.toHaveBeenCalled();
    }));
  });

  describe('in the add contribution rights section ', () => {
    it('should return true if there are no validation errors ' +
      'when updating user rights for category translation', fakeAsync(() => {
      ctrl.$onInit();
      // Setting category to be translation.
      ctrl.formData.addContributionReviewer.category = 'translation';
      ctrl.formData.addContributionReviewer.languageCode = 'en';
      ctrl.formData.addContributionReviewer.username = 'user1';
      $scope.$apply();

      const result = ctrl.formData.addContributionReviewer.isValid();

      expect(result).toBe(true);
    }));

    it('should return true if there are no validation errors ' +
      'when updating user rights for category voiceover', fakeAsync(() => {
      ctrl.$onInit();
      // Setting category to be voiceover.
      ctrl.formData.addContributionReviewer.category = 'voiceOver';
      ctrl.formData.addContributionReviewer.username = 'user1';
      $scope.$apply();

      const result = ctrl.formData.addContributionReviewer.isValid();

      expect(result).toBe(true);
    }));

    it('should return false if there are validation errors ' +
      'when updating user rights', fakeAsync(() => {
      ctrl.$onInit();
      // Setting category to be null.
      ctrl.formData.addContributionReviewer.category = null;
      ctrl.formData.addContributionReviewer.username = 'user1';
      $scope.$apply();

      const result = ctrl.formData.addContributionReviewer.isValid();

      expect(result).toBe(false);
    }));

    it('should return false if user name is empty ' +
      'when updating user rights', fakeAsync(() => {
      ctrl.$onInit();
      // Setting username to be empty.
      ctrl.formData.addContributionReviewer.username = '';
      $scope.$apply();

      const result = ctrl.formData.addContributionReviewer.isValid();

      expect(result).toBe(false);
    }));
  });

  describe('on clicking view contributors button ', () => {
    it('should successfully show rights of a user given the ' +
      'username', fakeAsync(() => {
      // Note that username is filter criterion here.
      const viewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'username',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };
      const viewContributorsResponse = {
        can_review_questions: true,
        can_review_translation_for_language_codes: ['en', 'es'],
        can_review_voiceover_for_language_codes: ['en', 'es'],
        can_submit_questions: true
      };
      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue(Promise.resolve(userInfo));
      spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync')
        .and.returnValue(Promise.resolve(viewContributorsResponse));

      expect(ctrl.contributionReviewersDataFetched).toBe(undefined);

      ctrl.$onInit();
      tick();

      ctrl.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(ctrl.contributionReviewersDataFetched).toBe(true);
      expect(ctrl.statusMessage).toBe('Success.');
    }));

    it('should successfully show users given the ' +
      'contributor rights', fakeAsync(() => {
      // Note that rights is filter criterion here.
      const viewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'role',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };
      const viewContributorsResponse = {
        usernames: ['user1']
      };
      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue(Promise.resolve(userInfo));
      spyOn(
        contributorDashboardAdminBackendApiService,
        'viewContributionReviewersAsync')
        .and.returnValue(Promise.resolve(viewContributorsResponse));

      expect(ctrl.contributionReviewersResult).toEqual(undefined);
      expect(ctrl.contributionReviewersDataFetched).toBe(undefined);

      ctrl.$onInit();
      tick();
      ctrl.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(ctrl.contributionReviewersResult.usernames)
        .toEqual(viewContributorsResponse.usernames);
      expect(ctrl.contributionReviewersDataFetched).toBe(true);
      expect(ctrl.statusMessage).toBe('Success.');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      ctrl.taskRunningInBackground = true;
      const viewContributorsResponse = {
        usernames: ['user1']
      };
      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue(Promise.resolve(userInfo));
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'viewContributionReviewersAsync')
        .and.resolveTo(viewContributorsResponse);
      const viewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'username',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1'
      };
      expect(ctrl.contributionReviewersDataFetched).toBe(undefined);

      ctrl.$onInit();
      tick();
      ctrl.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy)
        .not.toHaveBeenCalled();
      expect(ctrl.contributionReviewersDataFetched).toBe(false);
    }));
  });

  describe('on clicking remove rights button ', () => {
    it('should successfully remove the rights of the user', fakeAsync(() => {
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));
      const removeContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        method: 'all',
        username: 'user1'
      };

      ctrl.$onInit();
      $scope.$apply();
      ctrl.submitRemoveContributionRightsForm(
        removeContributionRightsAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(ctrl.statusMessage).toBe('Success.');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      ctrl.taskRunningInBackground = true;
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync')
        .and.returnValue(Promise.resolve(null));
      const removeContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        method: 'all',
        username: 'user1'
      };

      ctrl.$onInit();
      $scope.$apply();
      ctrl.submitRemoveContributionRightsForm(
        removeContributionRightsAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy)
        .not.toHaveBeenCalled();
    }));
  });

  describe('on clicking \'View Translation Stats\' button ', () => {
    it('should successfully show the Translation contribution ' +
      'stats', fakeAsync(() => {
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'viewTranslationContributionStatsAsync')
        .and.returnValue(Promise.resolve({
          translation_contribution_stats: []
        }));
      const viewTranslationAction = {
        isValid: () => true,
        username: 'user1'
      };

      ctrl.$onInit();
      $scope.$apply();
      ctrl.submitViewTranslationContributionStatsForm(viewTranslationAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(ctrl.statusMessage).toBe('Success.');
    }));

    it('should not send request to backend if a task ' +
      'is still running in the queue', fakeAsync(() => {
      // Setting task running to be true.
      ctrl.taskRunningInBackground = true;
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'viewTranslationContributionStatsAsync')
        .and.returnValue(Promise.resolve(null));
      const viewTranslationAction = {
        isValid: () => true,
        username: 'user1'
      };

      ctrl.$onInit();
      $scope.$apply();
      ctrl.submitViewTranslationContributionStatsForm(viewTranslationAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy)
        .not.toHaveBeenCalled();
    }));

    it('should show error message in case of ' +
      'backend error', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminBackendApiService,
        'viewTranslationContributionStatsAsync')
        .and.returnValue(Promise.reject('Internal Server Error.'));
      const viewTranslationAction = {
        isValid: () => true,
        username: 'user1'
      };

      ctrl.$onInit();
      $scope.$apply();
      ctrl.submitViewTranslationContributionStatsForm(viewTranslationAction);
      tick();

      expect(ctrl.statusMessage)
        .toBe('Server error: Internal Server Error.');
    }));
  });

  // Note that 'refreshFormData()' is called whenever a change
  // is detected in any of the forms.
  describe('on validating form data ', () => {
    describe('in the view contributor dashboard users section ', () => {
      it('should return true if there are no validation errors ' +
        'when fetching user rights with filter criterion as ' +
        'rights and category as voiceover', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Note that rights is filter criterion here.
        ctrl.formData.viewContributionReviewers.filterCriterion = 'role';
        ctrl.formData.viewContributionReviewers.category = 'voiceOver';
        ctrl.formData.viewContributionReviewers.username = 'user1';
        $scope.$apply();

        const result = ctrl.formData.viewContributionReviewers.isValid();

        expect(result).toBe(true);
      }));

      it('should return false if there are no validation errors ' +
        'when fetching user rights', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Note that rights is filter criterion here.
        ctrl.formData.viewContributionReviewers.filterCriterion = 'role';
        // Setting category to null.
        ctrl.formData.viewContributionReviewers.category = null;
        $scope.$apply();

        const result = ctrl.formData.viewContributionReviewers.isValid();

        expect(result).toBe(false);
      }));

      it('should return true if there are no validation errors ' +
        'when fetching user rights with filter criterion as ' +
        'rights and category as translation', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Note that rights is filter criterion here.
        ctrl.formData.viewContributionReviewers.filterCriterion = 'role';
        ctrl.formData.viewContributionReviewers.category = 'translation';
        ctrl.formData.viewContributionReviewers.languageCode = 'en';
        ctrl.formData.viewContributionReviewers.username = 'user1';
        $scope.$apply();

        const result = ctrl.formData.viewContributionReviewers.isValid();

        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when fetching user rights with filter criterion as ' +
        'username', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Note that username is filter criterion here.
        ctrl.formData.viewContributionReviewers.filterCriterion = (
          'username');
        ctrl.formData.viewContributionReviewers.username = 'user1';
        $scope.$apply();

        const result = ctrl.formData.viewContributionReviewers.isValid();

        expect(result).toBe(true);
      }));
    });

    describe('in the view translation contribution stats section ', () => {
      it('should return true if there are no validation errors ' +
        'when fetching translation stats', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        ctrl.formData.viewTranslationContributionStats.username = 'user1';
        $scope.$apply();

        const result = ctrl.formData.viewTranslationContributionStats.isValid();

        expect(result).toBe(true);
      }));

      it('should return false if there are validation errors ' +
        'when fetching translation stats', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Setting user name as empty.
        ctrl.formData.viewTranslationContributionStats.username = '';
        $scope.$apply();

        const result = ctrl.formData.viewTranslationContributionStats.isValid();

        expect(result).toBe(false);
      }));
    });

    describe('in the remove contribution rights section ', () => {
      it('should return true if there are no validation errors ' +
        'when removing user rights for all categories', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Setting method to all.
        ctrl.formData.removeContributionReviewer.category = 'all';
        ctrl.formData.removeContributionReviewer.languageCode = 'en';
        ctrl.formData.removeContributionReviewer.username = 'user1';
        ctrl.formData.removeContributionReviewer.method = 'all';
        $scope.$apply();

        const result = ctrl.formData.removeContributionReviewer.isValid();

        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when removing user rights for category translation', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Setting category to translation.
        ctrl.formData.removeContributionReviewer.category = 'translation';
        ctrl.formData.removeContributionReviewer.languageCode = 'en';
        ctrl.formData.removeContributionReviewer.username = 'user1';
        ctrl.formData.removeContributionReviewer.method = 'specific';
        $scope.$apply();

        const result = ctrl.formData.removeContributionReviewer.isValid();

        expect(result).toBe(true);
      }));

      it('should return true if there are no validation errors ' +
        'when removing user rights for category voiceover', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Setting category to voiceover.
        ctrl.formData.removeContributionReviewer.category = 'voiceOver';
        ctrl.formData.removeContributionReviewer.username = 'user1';
        ctrl.formData.removeContributionReviewer.method = 'specific';
        $scope.$apply();

        const result = ctrl.formData.removeContributionReviewer.isValid();

        expect(result).toBe(true);
      }));

      it('should return false if there are validation errors ' +
        'when removing user rights', fakeAsync(() => {
        ctrl.$onInit();
        $scope.$apply();
        // Setting category to be null.
        ctrl.formData.removeContributionReviewer.category = null;
        ctrl.formData.removeContributionReviewer.username = 'user1';
        ctrl.formData.removeContributionReviewer.method = 'specific';
        $scope.$apply();

        const result = ctrl.formData.removeContributionReviewer.isValid();

        expect(result).toBe(false);
      }));
    });
  });

  it('should clear result when calling \'clearResults\'', () => {
    ctrl.contributionReviewersDataFetched = true;
    ctrl.contributionReviewersResult = {
      property1: 'property1',
      property2: 'property2'
    };

    ctrl.clearResults();

    expect(ctrl.contributionReviewersDataFetched).toBe(false);
    expect(ctrl.contributionReviewersResult).toEqual({});
  });
});
