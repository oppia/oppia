// Copyright 2024 The Oppia Authors. All Rights Reserved.
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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {UserService} from 'services/user.service';
import {ContributorDashboardAdminPageComponent} from './contributor-dashboard-admin-page.component';
import {ContributorDashboardAdminBackendApiService} from './services/contributor-dashboard-admin-backend-api.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {UserInfo} from 'domain/user/user-info.model';

class MockPlatformFeatureService {
  status = {
    CdAdminDashboardNewUi: {
      isEnabled: false,
    },
  };
}

describe('ContributorDashboardAdminPageComponent', () => {
  let fixture: ComponentFixture<ContributorDashboardAdminPageComponent>;
  let component: ContributorDashboardAdminPageComponent;
  let userService: UserService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let contributorDashboardAdminBackendApiService: ContributorDashboardAdminBackendApiService;
  let userInfo: UserInfo;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ContributorDashboardAdminPageComponent],
      providers: [
        UserService,
        ContributorDashboardAdminBackendApiService,

        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContributorDashboardAdminPageComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    contributorDashboardAdminBackendApiService = TestBed.inject(
      ContributorDashboardAdminBackendApiService
    );

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
      isQuestionCoordinator: () => true,
      isTranslationCoordinator: () => true,
      canCreateCollections: () => true,
      getPreferredSiteLanguageCode: () => 'en',
      getUsername: () => 'username1',
      getEmail: () => 'tester@example.org',
      isLoggedIn: () => true,
    } as UserInfo;
  });

  it('should fetch user info when initialized', fakeAsync(() => {
    const userInfoSpy = spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );

    component.ngOnInit();
    tick();

    expect(userInfoSpy).toHaveBeenCalled();
  }));

  it('should account for feature flag when initialized', fakeAsync(() => {
    mockPlatformFeatureService.status.CdAdminDashboardNewUi.isEnabled = true;

    component.ngOnInit();
    tick();

    expect(component.isNewUiEnabled).toBeTrue();
  }));

  it('should not set translation admin flag when user is not translation admin', fakeAsync(() => {
    const nonTranslationAdminUserInfo = {
      ...userInfo,
      isTranslationAdmin: () => false,
    } as UserInfo;

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(nonTranslationAdminUserInfo)
    );

    component.ngOnInit();
    tick();

    expect(component.UserIsTranslationAdmin).toBe(false);
  }));

  it('should not set question categories when user is neither question admin nor coordinator', fakeAsync(() => {
    const nonQuestionUserInfo = {
      ...userInfo,
      isQuestionAdmin: () => false,
      isQuestionCoordinator: () => false,
      isTranslationAdmin: () => true,
    } as UserInfo;

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(nonQuestionUserInfo)
    );

    component.ngOnInit();
    tick();

    expect(component.CD_USER_RIGHTS_CATEGORIES).toEqual({
      REVIEW_TRANSLATION: 'translation',
    });
  }));

  describe('on clicking add rights button ', () => {
    it('should successfully update the rights of the user', fakeAsync(() => {
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync'
      ).and.returnValue(Promise.resolve());
      const addContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1',
      };

      component.submitAddContributionRightsForm(addContributionRightsAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(component.statusMessage).toBe('Success.');
    }));

    it(
      'should not send request to backend if a task ' +
        'is still running in the queue',
      fakeAsync(() => {
        // Setting task running to be true.
        component.taskRunningInBackground = true;
        const contributorDashboardAdminBackendApiServiceSpy = spyOn(
          contributorDashboardAdminBackendApiService,
          'addContributionReviewerAsync'
        ).and.returnValue(Promise.resolve());
        const addContributionRightsAction = {
          category: 'translation',
          isValid: () => true,
          languageCode: 'en',
          username: 'user1',
        };

        component.submitAddContributionRightsForm(addContributionRightsAction);
        tick();

        expect(
          contributorDashboardAdminBackendApiServiceSpy
        ).not.toHaveBeenCalled();
      })
    );

    it('should not update the rights of the user in case of a backend error', fakeAsync(() => {
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync'
      ).and.returnValue(
        Promise.reject(
          'User user1 already has rights' +
            ' to review translation in language code en'
        )
      );
      const addContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1',
      };

      component.submitAddContributionRightsForm(addContributionRightsAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(component.statusMessage).toBe(
        'Server error: User user1 already has rights' +
          ' to review translation in language code en'
      );
    }));

    it('should throw error when category is null', fakeAsync(() => {
      const addContributionRightsAction = {
        category: null,
        isValid: () => true,
        languageCode: 'en',
        username: 'user1',
      };

      expect(() => {
        component.submitAddContributionRightsForm(addContributionRightsAction);
      }).toThrowError('Category cannot be null');
    }));
  });

  describe('in the add contribution rights section ', () => {
    it(
      'should return true if there are no validation errors ' +
        'when updating user rights for category translation',
      fakeAsync(() => {
        component.ngOnInit();
        // Setting category to be translation.
        component.formData.addContributionReviewer.category = 'translation';
        component.formData.addContributionReviewer.languageCode = 'en';
        component.formData.addContributionReviewer.username = 'user1';

        const result = component.formData.addContributionReviewer.isValid();

        expect(result).toBe(true);
      })
    );

    it(
      'should return true if there are no validation errors ' +
        'when updating user rights for category voiceover',
      fakeAsync(() => {
        component.ngOnInit();
        // Setting category to be voiceover.
        component.formData.addContributionReviewer.category = 'voiceOver';
        component.formData.addContributionReviewer.username = 'user1';

        const result = component.formData.addContributionReviewer.isValid();

        expect(result).toBe(true);
      })
    );

    it(
      'should return false if there are validation errors ' +
        'when updating user rights',
      fakeAsync(() => {
        component.ngOnInit();
        // Setting category to be null.
        component.formData.addContributionReviewer.category = null;
        component.formData.addContributionReviewer.username = 'user1';

        const result = component.formData.addContributionReviewer.isValid();

        expect(result).toBe(false);
      })
    );

    it(
      'should return false if user name is empty ' +
        'when updating user rights',
      fakeAsync(() => {
        component.ngOnInit();
        // Setting username to be empty.
        component.formData.addContributionReviewer.username = '';

        const result = component.formData.addContributionReviewer.isValid();

        expect(result).toBe(false);
      })
    );

    it(
      'should return false if category is translation but ' +
        'languageCode is null when updating user rights',
      fakeAsync(() => {
        component.ngOnInit();
        component.formData.addContributionReviewer.category = 'translation';
        component.formData.addContributionReviewer.username = 'user1';
        component.formData.addContributionReviewer.languageCode = null;

        const result = component.formData.addContributionReviewer.isValid();

        expect(result).toBe(false);
      })
    );
  });

  describe('on clicking view contributors button ', () => {
    it(
      'should successfully show rights of a user given the ' + 'username',
      fakeAsync(() => {
        // Note that username is filter criterion here.
        const viewContributionReviewersAction = {
          category: 'category',
          filterCriterion: 'username',
          isValid: () => true,
          languageCode: 'en',
          username: 'user1',
        };
        const viewContributorsResponse = {
          can_review_questions: true,
          can_review_translation_for_language_codes: ['en', 'es'],
          can_review_voiceover_for_language_codes: ['en', 'es'],
          can_submit_questions: true,
        };
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(userInfo)
        );
        spyOn(
          contributorDashboardAdminBackendApiService,
          'contributionReviewerRightsAsync'
        ).and.returnValue(Promise.resolve(viewContributorsResponse));

        expect(component.contributionReviewersDataFetched).toBe(false);

        component.ngOnInit();
        tick();

        component.submitViewContributorUsersForm(
          viewContributionReviewersAction
        );
        tick();

        expect(component.contributionReviewersDataFetched).toBe(true);
        expect(component.statusMessage).toBe('Success.');
      })
    );

    it(
      'should successfully show users given the ' + 'contributor rights',
      fakeAsync(() => {
        // Note that rights is filter criterion here.
        const viewContributionReviewersAction = {
          category: 'category',
          filterCriterion: 'role',
          isValid: () => true,
          languageCode: 'en',
          username: 'user1',
        };
        const viewContributorsResponse = {
          usernames: ['user1'],
        };
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(userInfo)
        );
        spyOn(
          contributorDashboardAdminBackendApiService,
          'viewContributionReviewersAsync'
        ).and.returnValue(Promise.resolve(viewContributorsResponse));

        expect(component.contributionReviewersResult).toEqual({});
        expect(component.contributionReviewersDataFetched).toBe(false);

        component.ngOnInit();
        tick();
        component.submitViewContributorUsersForm(
          viewContributionReviewersAction
        );
        tick();

        expect(component.contributionReviewersResult.usernames).toEqual(
          viewContributorsResponse.usernames
        );
        expect(component.contributionReviewersDataFetched).toBe(true);
        expect(component.statusMessage).toBe('Success.');
      })
    );

    it(
      'should not send request to backend if a task ' +
        'is still running in the queue',
      fakeAsync(() => {
        // Setting task running to be true.
        component.taskRunningInBackground = true;
        const viewContributorsResponse = {
          usernames: ['user1'],
        };
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(userInfo)
        );
        const contributorDashboardAdminBackendApiServiceSpy = spyOn(
          contributorDashboardAdminBackendApiService,
          'viewContributionReviewersAsync'
        ).and.resolveTo(viewContributorsResponse);
        const viewContributionReviewersAction = {
          category: 'category',
          filterCriterion: 'username',
          isValid: () => true,
          languageCode: 'en',
          username: 'user1',
        };
        expect(component.contributionReviewersDataFetched).toBe(false);

        component.ngOnInit();
        tick();
        component.submitViewContributorUsersForm(
          viewContributionReviewersAction
        );
        tick();

        expect(
          contributorDashboardAdminBackendApiServiceSpy
        ).not.toHaveBeenCalled();
        expect(component.contributionReviewersDataFetched).toBe(false);
      })
    );

    it('should handle backend failure appropriately', fakeAsync(() => {
      const viewContributionReviewersAction = {
        category: 'category',
        filterCriterion: 'username',
        isValid: () => true,
        languageCode: 'en',
        username: 'random',
      };

      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync'
      ).and.returnValue(Promise.reject('Invalid username: random'));

      component.submitViewContributorUsersForm(viewContributionReviewersAction);
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(component.statusMessage).toBe(
        'Server error: Invalid username: random'
      );
    }));

    it('should throw error when category is null for role filter', fakeAsync(() => {
      const viewContributionReviewersAction = {
        category: null,
        filterCriterion: 'role',
        isValid: () => true,
        languageCode: 'en',
        username: 'user1',
      };

      expect(() => {
        component.submitViewContributorUsersForm(
          viewContributionReviewersAction
        );
      }).toThrowError('Category cannot be null');
    }));

    it(
      'should only populate REVIEW_TRANSLATION result when ' +
        'user does not have REVIEW_QUESTION category',
      fakeAsync(() => {
        const translationOnlyUserInfo = {
          ...userInfo,
          isTranslationAdmin: () => true,
          isQuestionAdmin: () => false,
          isQuestionCoordinator: () => false,
        } as UserInfo;
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(translationOnlyUserInfo)
        );
        spyOn(
          contributorDashboardAdminBackendApiService,
          'contributionReviewerRightsAsync'
        ).and.returnValue(
          Promise.resolve({
            can_review_questions: true,
            can_review_translation_for_language_codes: ['en'],
            can_review_voiceover_for_language_codes: [],
            can_submit_questions: true,
          })
        );

        component.ngOnInit();
        tick();

        component.submitViewContributorUsersForm({
          category: 'category',
          filterCriterion: 'username',
          isValid: () => true,
          languageCode: 'en',
          username: 'user1',
        });
        tick();

        expect(
          component.contributionReviewersResult.REVIEW_TRANSLATION
        ).toBeDefined();
        expect(
          component.contributionReviewersResult.REVIEW_QUESTION
        ).toBeUndefined();
      })
    );

    it(
      'should not populate REVIEW_TRANSLATION result when ' +
        'user does not have REVIEW_TRANSLATION category',
      fakeAsync(() => {
        const questionOnlyUserInfo = {
          ...userInfo,
          isTranslationAdmin: () => false,
          isQuestionAdmin: () => true,
          isQuestionCoordinator: () => true,
        } as UserInfo;
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(questionOnlyUserInfo)
        );
        spyOn(
          contributorDashboardAdminBackendApiService,
          'contributionReviewerRightsAsync'
        ).and.returnValue(
          Promise.resolve({
            can_review_questions: true,
            can_review_translation_for_language_codes: ['en'],
            can_review_voiceover_for_language_codes: [],
            can_submit_questions: true,
          })
        );

        component.ngOnInit();
        tick();

        component.submitViewContributorUsersForm({
          category: 'category',
          filterCriterion: 'username',
          isValid: () => true,
          languageCode: 'en',
          username: 'user1',
        });
        tick();

        expect(
          component.contributionReviewersResult.REVIEW_TRANSLATION
        ).toBeUndefined();
        expect(component.contributionReviewersResult.REVIEW_QUESTION).toBe(
          true
        );
        expect(component.contributionReviewersResult.SUBMIT_QUESTION).toBe(
          true
        );
      })
    );
  });

  describe('on clicking remove rights button ', () => {
    it('should successfully remove the rights of the user', fakeAsync(() => {
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync'
      ).and.returnValue(Promise.resolve());
      const removeContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        method: 'all',
        username: 'user1',
      };

      component.ngOnInit();
      component.submitRemoveContributionRightsForm(
        removeContributionRightsAction
      );
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(component.statusMessage).toBe('Success.');
    }));

    it(
      'should not send request to backend if a task ' +
        'is still running in the queue',
      fakeAsync(() => {
        // Setting task running to be true.
        component.taskRunningInBackground = true;
        const contributorDashboardAdminBackendApiServiceSpy = spyOn(
          contributorDashboardAdminBackendApiService,
          'removeContributionReviewerAsync'
        ).and.returnValue(Promise.resolve());
        const removeContributionRightsAction = {
          category: 'translation',
          isValid: () => true,
          languageCode: 'en',
          method: 'all',
          username: 'user1',
        };

        component.ngOnInit();
        component.submitRemoveContributionRightsForm(
          removeContributionRightsAction
        );
        tick();

        expect(
          contributorDashboardAdminBackendApiServiceSpy
        ).not.toHaveBeenCalled();
      })
    );

    it('should not remove the rights of the user in case of a backend error', fakeAsync(() => {
      const contributorDashboardAdminBackendApiServiceSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync'
      ).and.returnValue(Promise.reject('Invalid username: random'));
      const removeContributionRightsAction = {
        category: 'translation',
        isValid: () => true,
        languageCode: 'en',
        method: 'all',
        username: 'random',
      };

      component.ngOnInit();
      component.submitRemoveContributionRightsForm(
        removeContributionRightsAction
      );
      tick();

      expect(contributorDashboardAdminBackendApiServiceSpy).toHaveBeenCalled();
      expect(component.statusMessage).toBe(
        'Server error: Invalid username: random'
      );
    }));

    it('should throw error when category is null', fakeAsync(() => {
      const removeContributionRightsAction = {
        category: null,
        isValid: () => true,
        languageCode: 'en',
        method: 'all',
        username: 'user1',
      };

      expect(() => {
        component.submitRemoveContributionRightsForm(
          removeContributionRightsAction
        );
      }).toThrowError('Category cannot be null');
    }));
  });

  describe("on clicking 'View Translation Stats' button ", () => {
    it(
      'should successfully show the Translation contribution ' + 'stats',
      fakeAsync(() => {
        const contributorDashboardAdminBackendApiServiceSpy = spyOn(
          contributorDashboardAdminBackendApiService,
          'viewTranslationContributionStatsAsync'
        ).and.returnValue(
          Promise.resolve({
            translation_contribution_stats: [],
          })
        );
        const viewTranslationAction = {
          isValid: () => true,
          username: 'user1',
        };

        component.ngOnInit();
        component.submitViewTranslationContributionStatsForm(
          viewTranslationAction
        );
        tick();

        expect(
          contributorDashboardAdminBackendApiServiceSpy
        ).toHaveBeenCalled();
        expect(component.statusMessage).toBe('Success.');
      })
    );

    it(
      'should not send request to backend if a task ' +
        'is still running in the queue',
      fakeAsync(() => {
        // Setting task running to be true.
        component.taskRunningInBackground = true;
        const contributorDashboardAdminBackendApiServiceSpy = spyOn(
          contributorDashboardAdminBackendApiService,
          'viewTranslationContributionStatsAsync'
        ).and.returnValue(Promise.resolve());
        const viewTranslationAction = {
          isValid: () => true,
          username: 'user1',
        };

        component.ngOnInit();
        component.submitViewTranslationContributionStatsForm(
          viewTranslationAction
        );
        tick();

        expect(
          contributorDashboardAdminBackendApiServiceSpy
        ).not.toHaveBeenCalled();
      })
    );

    it(
      'should show error message in case of ' + 'backend error',
      fakeAsync(() => {
        spyOn(
          contributorDashboardAdminBackendApiService,
          'viewTranslationContributionStatsAsync'
        ).and.returnValue(Promise.reject('Internal Server Error.'));
        const viewTranslationAction = {
          isValid: () => true,
          username: 'user1',
        };

        component.ngOnInit();
        component.submitViewTranslationContributionStatsForm(
          viewTranslationAction
        );
        tick();

        expect(component.statusMessage).toBe(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  // Note that 'refreshFormData()' is called whenever a change
  // is detected in any of the forms.
  describe('on validating form data ', () => {
    describe('in the view contributor dashboard users section ', () => {
      it(
        'should return true if there are no validation errors ' +
          'when fetching user rights with filter criterion as ' +
          'rights and category as voiceover',
        fakeAsync(() => {
          component.ngOnInit();

          // Note that rights is filter criterion here.
          component.formData.viewContributionReviewers.filterCriterion = 'role';
          component.formData.viewContributionReviewers.category = 'voiceOver';
          component.formData.viewContributionReviewers.username = 'user1';

          const result = component.formData.viewContributionReviewers.isValid();

          expect(result).toBe(true);
        })
      );

      it(
        'should return false if there are no validation errors ' +
          'when fetching user rights',
        fakeAsync(() => {
          component.ngOnInit();

          // Note that rights is filter criterion here.
          component.formData.viewContributionReviewers.filterCriterion = 'role';
          // Setting category to null.
          component.formData.viewContributionReviewers.category = null;

          const result = component.formData.viewContributionReviewers.isValid();

          expect(result).toBe(false);
        })
      );

      it(
        'should return true if there are no validation errors ' +
          'when fetching user rights with filter criterion as ' +
          'rights and category as translation',
        fakeAsync(() => {
          component.ngOnInit();

          // Note that rights is filter criterion here.
          component.formData.viewContributionReviewers.filterCriterion = 'role';
          component.formData.viewContributionReviewers.category = 'translation';
          component.formData.viewContributionReviewers.languageCode = 'en';
          component.formData.viewContributionReviewers.username = 'user1';

          const result = component.formData.viewContributionReviewers.isValid();

          expect(result).toBe(true);
        })
      );

      it(
        'should return true if there are no validation errors ' +
          'when fetching user rights with filter criterion as ' +
          'username',
        fakeAsync(() => {
          component.ngOnInit();

          // Note that username is filter criterion here.
          component.formData.viewContributionReviewers.filterCriterion =
            'username';
          component.formData.viewContributionReviewers.username = 'user1';

          const result = component.formData.viewContributionReviewers.isValid();

          expect(result).toBe(true);
        })
      );

      it(
        'should return false if there are validation errors ' +
          'when fetching user rights with filter criterion as ' +
          'username but username is empty',
        fakeAsync(() => {
          component.ngOnInit();

          // Note that username is filter criterion here.
          component.formData.viewContributionReviewers.filterCriterion =
            'username';
          // Setting username to empty.
          component.formData.viewContributionReviewers.username = '';

          const result = component.formData.viewContributionReviewers.isValid();

          expect(result).toBe(false);
        })
      );

      it('should return false when filter criterion is neither role nor username', fakeAsync(() => {
        component.ngOnInit();

        // Setting filter criterion to an unknown value.
        component.formData.viewContributionReviewers.filterCriterion =
          'unknown';

        const result = component.formData.viewContributionReviewers.isValid();

        expect(result).toBe(false);
      }));

      it('should return false when category is translation but languageCode is null', fakeAsync(() => {
        component.ngOnInit();

        component.formData.viewContributionReviewers.filterCriterion = 'role';
        component.formData.viewContributionReviewers.category = 'translation';
        component.formData.viewContributionReviewers.languageCode = null;

        const result = component.formData.viewContributionReviewers.isValid();

        expect(result).toBe(false);
      }));
    });

    describe('in the view translation contribution stats section ', () => {
      it(
        'should return true if there are no validation errors ' +
          'when fetching translation stats',
        fakeAsync(() => {
          component.ngOnInit();
          component.formData.viewTranslationContributionStats.username =
            'user1';

          const result =
            component.formData.viewTranslationContributionStats.isValid();

          expect(result).toBe(true);
        })
      );

      it(
        'should return false if there are validation errors ' +
          'when fetching translation stats',
        fakeAsync(() => {
          component.ngOnInit();

          // Setting user name as empty.
          component.formData.viewTranslationContributionStats.username = '';

          const result =
            component.formData.viewTranslationContributionStats.isValid();

          expect(result).toBe(false);
        })
      );
    });

    describe('in the remove contribution rights section ', () => {
      it(
        'should return true if there are no validation errors ' +
          'when removing user rights for all categories',
        fakeAsync(() => {
          component.ngOnInit();

          // Setting method to all.
          component.formData.removeContributionReviewer.category = 'all';
          component.formData.removeContributionReviewer.languageCode = 'en';
          component.formData.removeContributionReviewer.username = 'user1';
          component.formData.removeContributionReviewer.method = 'all';

          const result =
            component.formData.removeContributionReviewer.isValid();

          expect(result).toBe(true);
        })
      );

      it(
        'should return true if there are no validation errors ' +
          'when removing user rights for category translation',
        fakeAsync(() => {
          component.ngOnInit();
          // Setting category to translation.
          component.formData.removeContributionReviewer.category =
            'translation';
          component.formData.removeContributionReviewer.languageCode = 'en';
          component.formData.removeContributionReviewer.username = 'user1';
          component.formData.removeContributionReviewer.method = 'specific';

          const result =
            component.formData.removeContributionReviewer.isValid();

          expect(result).toBe(true);
        })
      );

      it(
        'should return true if there are no validation errors ' +
          'when removing user rights for category voiceover',
        fakeAsync(() => {
          component.ngOnInit();
          // Setting category to voiceover.
          component.formData.removeContributionReviewer.category = 'voiceOver';
          component.formData.removeContributionReviewer.username = 'user1';
          component.formData.removeContributionReviewer.method = 'specific';

          const result =
            component.formData.removeContributionReviewer.isValid();

          expect(result).toBe(true);
        })
      );

      it(
        'should return false if there are validation errors ' +
          'when removing user rights',
        fakeAsync(() => {
          component.ngOnInit();
          // Setting category to be null.
          component.formData.removeContributionReviewer.category = null;
          component.formData.removeContributionReviewer.username = 'user1';
          component.formData.removeContributionReviewer.method = 'specific';

          const result =
            component.formData.removeContributionReviewer.isValid();

          expect(result).toBe(false);
        })
      );

      it(
        'should return false if username is empty ' +
          'when removing user rights',
        fakeAsync(() => {
          component.ngOnInit();
          component.formData.removeContributionReviewer.category =
            'translation';
          component.formData.removeContributionReviewer.username = '';
          component.formData.removeContributionReviewer.method = 'specific';

          const result =
            component.formData.removeContributionReviewer.isValid();

          expect(result).toBe(false);
        })
      );

      it(
        'should return false if category is translation but ' +
          'languageCode is null when removing user rights',
        fakeAsync(() => {
          component.ngOnInit();
          component.formData.removeContributionReviewer.category =
            'translation';
          component.formData.removeContributionReviewer.username = 'user1';
          component.formData.removeContributionReviewer.languageCode = null;
          component.formData.removeContributionReviewer.method = 'specific';

          const result =
            component.formData.removeContributionReviewer.isValid();

          expect(result).toBe(false);
        })
      );
    });
  });

  it("should clear result when calling 'clearResults'", () => {
    component.contributionReviewersDataFetched = true;
    component.contributionReviewersResult = {
      usernames: ['property1', 'property2'],
      REVIEW_TRANSLATION: ['property3', 'property4'],
      REVIEW_QUESTION: true,
      SUBMIT_QUESTION: true,
    };

    component.clearResults();

    expect(component.contributionReviewersDataFetched).toBe(false);
    expect(component.contributionReviewersResult).toEqual({});
  });
});
