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
 * @fileoverview Unit tests for TranslationSuggestionReviewModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslationSuggestionReviewModalComponent} from './translation-suggestion-review-modal.component';
import {ChangeDetectorRef, ElementRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {ContributionAndReviewService} from '../services/contribution-and-review.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {ThreadDataBackendApiService} from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import {UserService} from 'services/user.service';
import {UserInfo} from 'domain/user/user-info.model';
import {OverlayModule} from '@angular/cdk/overlay';
import {
  MatSnackBar,
  MatSnackBarModule,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import {of, Subject} from 'rxjs';
// This throws "TS2307". We need to
// suppress this error because rte-output-display is not strictly typed yet.
// @ts-ignore
import {RteOutputDisplayComponent} from 'rich_text_components/rte-output-display.component';
import {UndoSnackbarComponent} from 'components/custom-snackbar/undo-snackbar.component';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockChangeDetectorRef {
  detectChanges(): void {}
}

class MockMatSnackBarRef {
  instance = {message: ''};
  afterDismissed = () => of({action: '', dismissedByAction: false});
  onAction = () => of(undefined);
  dismiss = () => of(undefined);
}

class MockPlatformFeatureService {
  status = {
    CdAllowUndoingTranslationReview: {
      isEnabled: false,
    },
  };
}

describe('Translation Suggestion Review Modal Component', function () {
  let fixture: ComponentFixture<TranslationSuggestionReviewModalComponent>;
  let component: TranslationSuggestionReviewModalComponent;
  let alertsService: AlertsService;
  let contributionAndReviewService: ContributionAndReviewService;
  let languageUtilService: LanguageUtilService;
  let siteAnalyticsService: SiteAnalyticsService;
  let threadDataBackendApiService: ThreadDataBackendApiService;
  let userService: UserService;
  let activeModal: NgbActiveModal;
  let changeDetectorRef: MockChangeDetectorRef = new MockChangeDetectorRef();
  let snackBarSpy: jasmine.Spy;
  let snackBar: MatSnackBar;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, OverlayModule, MatSnackBarModule],
      declarations: [
        TranslationSuggestionReviewModalComponent,
        UndoSnackbarComponent,
      ],
      providers: [
        NgbActiveModal,
        AlertsService,
        ContributionAndReviewService,
        LanguageUtilService,
        SiteAnalyticsService,
        ThreadDataBackendApiService,
        UserService,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef,
        },
        MatSnackBar,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      TranslationSuggestionReviewModalComponent
    );
    snackBar = TestBed.inject(MatSnackBar);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    alertsService = TestBed.inject(AlertsService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    threadDataBackendApiService = TestBed.inject(ThreadDataBackendApiService);
    userService = TestBed.inject(UserService);
    contributionAndReviewService = TestBed.inject(ContributionAndReviewService);
    languageUtilService = TestBed.inject(LanguageUtilService);
    spyOn(
      siteAnalyticsService,
      'registerContributorDashboardViewSuggestionForReview'
    );
    spyOn(languageUtilService, 'getAudioLanguageDescription').and.returnValue(
      'audio_language_description'
    );

    snackBarSpy = spyOn(snackBar, 'openFromComponent').and.returnValue(
      new MockMatSnackBarRef() as unknown as MatSnackBarRef<unknown>
    );

    component.contentContainer = new ElementRef({offsetHeight: 150});
    component.translationContainer = new ElementRef({offsetHeight: 150});
    component.contentPanel = new RteOutputDisplayComponent(
      null,
      null,
      new ElementRef({offsetHeight: 200}),
      null
    );
    component.translationPanel = new RteOutputDisplayComponent(
      null,
      null,
      new ElementRef({offsetHeight: 200}),
      null
    );
  });

  describe('when initializing the modal ', () => {
    const reviewable = true;
    const subheading = 'topic_1 / story_1 / chapter_1';

    const suggestion1 = {
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      suggestion_id: 'suggestion_1',
      target_id: '1',
      target_type: 'target_type',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p><p>&nbsp;</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content</p><p>&nbsp;</p>',
    };
    const suggestion2 = {
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      suggestion_id: 'suggestion_2',
      target_id: '2',
      target_type: 'target_type',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content CHANGED</p>',
    };
    const suggestion3 = {
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      suggestion_id: 'suggestion_3',
      target_id: '3',
      target_type: 'target_type',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content CHANGED</p>',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2',
      },
    };
    const contribution3 = {
      suggestion: suggestion3,
      details: {
        topic_name: 'topic_3',
        story_title: 'story_3',
        chapter_title: 'chapter_3',
      },
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2,
      suggestion_3: contribution3,
    };
    const editedContent = {
      html: '<p>In Hindi</p>',
    };

    beforeEach(() => {
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      component.editedContent = editedContent;
    });

    it(
      'should be able to navigate to both previous suggestion and ' +
        'next suggestion if initial suggestion is in middle of list',
      () => {
        component.initialSuggestionId = 'suggestion_2';
        component.ngOnInit();

        expect(component.activeSuggestionId).toBe('suggestion_2');
        expect(component.skippedContributionIds).toEqual(['suggestion_1']);
        expect(component.remainingContributionIds).toEqual(['suggestion_3']);
      }
    );

    it(
      'should be able to navigate to only previous suggestion ' +
        'if initial suggestion is the last suggestion of the list',
      () => {
        component.initialSuggestionId = 'suggestion_3';
        component.ngOnInit();

        expect(component.activeSuggestionId).toBe('suggestion_3');
        expect(component.skippedContributionIds.sort()).toEqual([
          'suggestion_1',
          'suggestion_2',
        ]);
        expect(component.remainingContributionIds).toEqual([]);
      }
    );

    it(
      'should be able to navigate to only next suggestion ' +
        'if initial suggestion is in first suggestion of the list',
      () => {
        component.initialSuggestionId = 'suggestion_1';
        component.ngOnInit();

        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.skippedContributionIds).toEqual([]);
        expect(component.remainingContributionIds.sort()).toEqual([
          'suggestion_2',
          'suggestion_3',
        ]);
      }
    );
  });

  describe('when reviewing suggestion when flag CdAllowUndoingTranslationReview is enabled', function () {
    const reviewable = true;
    const subheading = 'topic_1 / story_1 / chapter_1';
    const suggestion1 = {
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      suggestion_id: 'suggestion_1',
      target_id: '1',
      target_type: 'target_type',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p><p>&nbsp;</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content</p><p>&nbsp;</p>',
    };

    const suggestion2 = {
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      suggestion_id: 'suggestion_2',
      target_id: '2',
      target_type: 'target_type',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content CHANGED</p>',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2',
      },
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2,
    };

    const editedContent = {
      html: '<p>In Hindi</p>',
    };

    const userInfo = new UserInfo(
      ['USER_ROLE'],
      true,
      false,
      false,
      false,
      true,
      'en',
      'username1',
      'tester@example.com',
      true
    );

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      component.editedContent = editedContent;
      mockPlatformFeatureService.status.CdAllowUndoingTranslationReview.isEnabled =
        true;
    });

    it('should call user service at initialization.', function () {
      const userInfoSpy = spyOn(
        userService,
        'getUserInfoAsync'
      ).and.returnValue(Promise.resolve(userInfo));

      const contributionRightsDataSpy = spyOn(
        userService,
        'getUserContributionRightsDataAsync'
      ).and.returnValue(
        Promise.resolve({
          can_review_translation_for_language_codes: ['ar'],
          can_review_voiceover_for_language_codes: [],
          can_review_questions: false,
          can_suggest_questions: false,
        })
      );
      component.ngOnInit();
      expect(userInfoSpy).toHaveBeenCalled();
      expect(contributionRightsDataSpy).toHaveBeenCalled();
    });

    it('should throw error if username is invalid', fakeAsync(() => {
      const defaultUserInfo = new UserInfo(
        ['GUEST'],
        false,
        false,
        false,
        false,
        false,
        null,
        null,
        null,
        false
      );
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(defaultUserInfo)
      );

      expect(() => {
        component.ngOnInit();
        tick();
      }).toThrowError();
      flush();
    }));

    it('should initialize component properties after component is initialized', function () {
      component.ngOnInit();
      expect(component.subheading).toBe(subheading);
      expect(component.reviewable).toBe(reviewable);
      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewMessage).toBe('');
    });

    it(
      'should register Contributor Dashboard view suggestion for review ' +
        'event after controller is initialized',
      function () {
        component.ngOnInit();
        expect(
          siteAnalyticsService.registerContributorDashboardViewSuggestionForReview
        ).toHaveBeenCalledWith('Translation');
      }
    );

    it('should notify user on failed suggestion update', function () {
      component.ngOnInit();
      const error = new Error('Error');
      expect(component.errorFound).toBeFalse();
      expect(component.errorMessage).toBe('');

      component.showTranslationSuggestionUpdateError(error);

      expect(component.errorFound).toBeTrue();
      expect(component.errorMessage).toBe('Invalid Suggestion: Error');
    });

    it(
      'should accept suggestion in suggestion modal service when clicking' +
        ' on accept and review next suggestion button',
      function () {
        component.ngOnInit();
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');
        // Suggestion 1's exploration_content_html matches its content_html.
        expect(component.hasExplorationContentChanged()).toBe(false);

        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardAcceptSuggestion'
        );
        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(activeModal, 'close');
        spyOn(alertsService, 'addSuccessMessage');
        spyOn(component, 'showSnackbar');
        spyOn(component, 'startCommitTimeout');

        component.reviewMessage = 'Review message example';
        component.translationUpdated = true;
        component.acceptAndReviewNext();

        expect(component.activeSuggestionId).toBe('suggestion_2');
        expect(component.activeSuggestion).toEqual(suggestion2);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');

        component.commitQueuedSuggestion();

        // Suggestion 2's exploration_content_html does not match its
        // content_html.
        expect(component.hasExplorationContentChanged()).toBe(true);
        expect(
          siteAnalyticsService.registerContributorDashboardAcceptSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'accept',
          'Review message example: ' +
            '(Note: This suggestion was submitted with reviewer edits.)',
          'hint section of "StateName" card',
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalled();

        component.reviewMessage = 'Review message example 2';
        component.translationUpdated = false;
        component.acceptAndReviewNext();

        component.commitQueuedSuggestion();

        expect(
          siteAnalyticsService.registerContributorDashboardAcceptSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '2',
          'suggestion_2',
          'accept',
          'Review message example 2',
          'hint section of "StateName" card',
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalled();
        expect(activeModal.close).toHaveBeenCalledWith([
          'suggestion_1',
          'suggestion_2',
        ]);
      }
    );

    it(
      'should set suggestion review message to auto-generated note when ' +
        'suggestion is accepted with edits and no user-supplied review message',
      fakeAsync(() => {
        component.ngOnInit();
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');

        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardAcceptSuggestion'
        );
        spyOn(component, 'resolveSuggestionAndUpdateModal');
        spyOn(component, 'startCommitTimeout');
        spyOn(component, 'showSnackbar');
        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(alertsService, 'addSuccessMessage');

        component.translationUpdated = true;
        component.acceptAndReviewNext();

        tick();

        expect(component.hasQueuedSuggestion).toBeTrue();
        expect(component.queuedSuggestion).toEqual({
          target_id: '1',
          suggestion_id: 'suggestion_1',
          action_status: 'accept',
          commit_message: 'hint section of "StateName" card',
          reviewer_message:
            '(Note: This suggestion was submitted with ' + 'reviewer edits.)',
        });
      })
    );

    it(
      'should accept the queued suggestion when the timer has expired' +
        'review button',
      () => {
        component.ngOnInit();

        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');

        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardAcceptSuggestion'
        );
        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(activeModal, 'close');
        spyOn(alertsService, 'addSuccessMessage');
        spyOn(component, 'resolveSuggestionAndUpdateModal').and.stub();
        spyOn(component, 'startCommitTimeout').and.stub();
        spyOn(component, 'showSnackbar').and.stub();

        component.acceptAndReviewNext();

        expect(component.hasQueuedSuggestion).toBeTrue();
        expect(component.queuedSuggestion).toEqual({
          target_id: '1',
          suggestion_id: 'suggestion_1',
          action_status: AppConstants.ACTION_ACCEPT_SUGGESTION,
          reviewer_message: '',
          commit_message: 'hint section of "StateName" card',
        });

        component.commitQueuedSuggestion();
      }
    );

    it('should reject the queued suggestion when the timer has expired', () => {
      component.ngOnInit();

      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');
      expect(component.isUndoFeatureEnabled).toBeTrue();

      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion'
      );
      spyOn(
        contributionAndReviewService,
        'reviewExplorationSuggestion'
      ).and.callFake(
        (
          targetId,
          suggestionId,
          action,
          reviewMessage,
          commitMessage,
          successCallback,
          errorCallback
        ) => {
          return Promise.resolve(successCallback(suggestionId));
        }
      );
      spyOn(activeModal, 'close');
      spyOn(alertsService, 'addSuccessMessage');
      spyOn(component, 'resolveSuggestionAndUpdateModal').and.stub();
      spyOn(component, 'startCommitTimeout').and.stub();
      spyOn(component, 'showSnackbar').and.stub();

      component.rejectAndReviewNext('rejected');

      expect(component.hasQueuedSuggestion).toBeTrue();
      expect(component.queuedSuggestion).toEqual({
        target_id: '1',
        suggestion_id: 'suggestion_1',
        action_status: AppConstants.ACTION_REJECT_SUGGESTION,
        reviewer_message: 'rejected',
      });

      component.commitQueuedSuggestion();
    });

    it('should undo the queued suggestion when clicked on undo button', () => {
      component.ngOnInit();
      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');
      component.resolvedSuggestionIds = ['suggestion_1'];

      component.hasQueuedSuggestion = true;
      component.queuedSuggestion = {
        target_id: '1',
        suggestion_id: 'suggestion_1',
        action_status: 'accept',
        commit_message: 'hint section of "StateName" card',
        reviewer_message:
          '(Note: This suggestion was submitted with' + 'reviewer edits.)',
      };
      component.removedSuggestion = contribution1;
      component.undoReviewAction();

      expect(component.hasQueuedSuggestion).toBeFalse();
      expect(component.queuedSuggestion).toBe(undefined);
    });

    it(
      'should allow the reviewer to fix the suggestion if the backend pre' +
        ' accept/reject validation failed',
      function () {
        const responseMessage = 'Pre accept validation failed.';

        component.ngOnInit();
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');
        spyOn(component, 'revertSuggestionResolution');
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardAcceptSuggestion'
        );
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardRejectSuggestion'
        );
        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.reject(errorCallback(responseMessage));
          }
        );
        spyOn(alertsService, 'addWarning');

        component.reviewMessage = 'Review message example';
        component.queuedSuggestion = {
          target_id: '1',
          suggestion_id: 'suggestion_1',
          action_status: 'accept',
          commit_message: 'hint section of "StateName" card',
          reviewer_message:
            '(Note: This suggestion was submitted with' + 'reviewer edits.)',
        };
        component.hasQueuedSuggestion = true;
        component.commitQueuedSuggestion();

        expect(component.revertSuggestionResolution).toHaveBeenCalled();
      }
    );

    it('should show the pop up bar when suggestion is queued', () => {
      spyOn(component, 'commitQueuedSuggestion').and.callThrough();
      component.hasQueuedSuggestion = true;
      component.showSnackbar();

      expect(snackBarSpy.calls.mostRecent().returnValue.instance.message).toBe(
        'Suggestion queued'
      );
    });

    it(
      'should commit the queued suggestion when' + ' the snackbar is dismissed',
      () => {
        const commitQueuedSuggestionSpy = spyOn(
          component,
          'commitQueuedSuggestion'
        ).and.callThrough();

        let afterDismissedObservable = new Subject<void>();
        let snackBarRefMock = {
          instance: {message: ''},
          afterDismissed: () => afterDismissedObservable.asObservable(),
          onAction: () => of(null),
        };

        snackBarSpy.and.returnValue(snackBarRefMock);

        component.showSnackbar();
        component.hasQueuedSuggestion = true;

        afterDismissedObservable.next();
        afterDismissedObservable.complete();

        expect(commitQueuedSuggestionSpy).toHaveBeenCalled();
      }
    );

    it(
      'should start commit timeout when clicking on accept and review' +
        'next suggestion button',
      () => {
        spyOn(window, 'setTimeout');
        spyOn(component, 'commitQueuedSuggestion');
        component.commitTimeout = undefined;

        component.startCommitTimeout();

        expect(window.setTimeout).toHaveBeenCalled();
        const timeoutCallback = (
          window.setTimeout as unknown as jasmine.Spy
        ).calls.mostRecent().args[0];
        expect(typeof timeoutCallback).toBe('function');

        timeoutCallback();

        expect(component.commitQueuedSuggestion).toHaveBeenCalled();
      }
    );

    it('should remove suggestion_id from resolvedSuggestionIds if it exists', () => {
      component.ngOnInit();
      component.resolvedSuggestionIds = ['suggestion_1', 'suggestion_2'];
      component.queuedSuggestion = {
        suggestion_id: 'suggestion_1',
        action_status: 'accept',
        target_id: '1',
        reviewer_message: '',
      };
      component.removedSuggestion = contribution1;

      component.revertSuggestionResolution();

      expect(component.resolvedSuggestionIds).toEqual(['suggestion_2']);
    });

    it(
      'should cancel suggestion in suggestion modal service when clicking ' +
        'on cancel suggestion button',
      function () {
        spyOn(activeModal, 'close');
        component.cancel();
        expect(activeModal.close).toHaveBeenCalledWith([]);
      }
    );

    it('should open the translation editor when the edit button is clicked', function () {
      component.editSuggestion();
      expect(component.startedEditing).toBe(true);
    });

    it('should close the translation editor when the cancel button is clicked', function () {
      component.cancelEdit();
      expect(component.startedEditing).toBe(false);
    });

    it('should expand the content area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      // The content area is contracted by default.
      expect(component.isContentExpanded).toBeFalse();
      // The content area should expand when the users clicks
      // on the 'View More' button.
      component.toggleExpansionState(0);

      expect(component.isContentExpanded).toBeTrue();
    });

    it('should contract the content area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      component.isContentExpanded = true;
      // The content area should contract when the users clicks
      // on the 'View Less' button.
      component.toggleExpansionState(0);

      expect(component.isContentExpanded).toBeFalse();
    });

    it('should expand the translation area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      // The translation area is contracted by default.
      expect(component.isTranslationExpanded).toBeFalse();
      // The translation area should expand when the users clicks
      // on the 'View More' button.
      component.toggleExpansionState(1);

      expect(component.isTranslationExpanded).toBeTrue();
    });

    it('should contract the translation area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      component.isTranslationExpanded = true;
      // The translation area should contract when the users clicks
      // on the 'View Less' button.
      component.toggleExpansionState(1);

      expect(component.isTranslationExpanded).toBeFalse();
    });

    it('should update translation when the update button is clicked', function () {
      component.ngOnInit();
      spyOn(
        contributionAndReviewService,
        'updateTranslationSuggestionAsync'
      ).and.callFake(
        (suggestionId, translationHtml, successCallback, errorCallback) => {
          return Promise.resolve(successCallback());
        }
      );

      component.updateSuggestion();

      expect(
        contributionAndReviewService.updateTranslationSuggestionAsync
      ).toHaveBeenCalledWith(
        'suggestion_1',
        component.editedContent.html,
        jasmine.any(Function),
        jasmine.any(Function)
      );
    });

    describe('isHtmlContentEqual', function () {
      it('should return true regardless of &nbsp; differences', function () {
        expect(
          component.isHtmlContentEqual(
            '<p>content</p><p>&nbsp;&nbsp;</p>',
            '<p>content</p><p> </p>'
          )
        ).toBe(true);
      });

      it('should return true regardless of new line differences', function () {
        expect(
          component.isHtmlContentEqual(
            '<p>content</p>\r\n\n<p>content2</p>',
            '<p>content</p><p>content2</p>'
          )
        ).toBe(true);
      });

      it('should return false if html content differ', function () {
        expect(
          component.isHtmlContentEqual(
            '<p>content</p>',
            '<p>content CHANGED</p>'
          )
        ).toBe(false);
      });

      it('should return false if array contents differ', function () {
        expect(
          component.isHtmlContentEqual(
            ['<p>content1</p>', '<p>content2</p>'],
            ['<p>content1</p>', '<p>content2 CHANGED</p>']
          )
        ).toBe(false);
      });

      it('should return true if array contents are equal', function () {
        expect(
          component.isHtmlContentEqual(
            ['<p>content1</p>', '<p>content2</p>'],
            ['<p>content1</p>', '<p>content2</p>']
          )
        ).toBe(true);
      });

      it('should return false if type is different', function () {
        expect(
          component.isHtmlContentEqual(
            ['<p>content1</p>', '<p>content2</p>'],
            '<p>content2</p>'
          )
        ).toBe(false);
      });
    });
  });

  describe('when reviewing suggestions with deleted opportunites when flag CdAllowUndoingTranslationReview is enabled', function () {
    const reviewable = true;
    const subheading = 'topic_1 / story_1 / chapter_1';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: 'Translation',
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };

    const deletedContribution = {
      suggestion: suggestion2,
      details: null,
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_deleted: deletedContribution,
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      mockPlatformFeatureService.status.CdAllowUndoingTranslationReview.isEnabled =
        true;
      component.ngOnInit();
    });

    it(
      'should reject suggestion in suggestion modal service when clicking ' +
        'on reject and review next suggestion button',
      function () {
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');

        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardRejectSuggestion'
        );
        spyOn(activeModal, 'close');
        spyOn(alertsService, 'addSuccessMessage');

        spyOn(component, 'startCommitTimeout');
        spyOn(component, 'showSnackbar');
        spyOn(component, 'resolveSuggestionAndUpdateModal');

        component.reviewMessage = 'Review message example';
        component.rejectAndReviewNext(component.reviewMessage);
        component.commitQueuedSuggestion();

        expect(
          siteAnalyticsService.registerContributorDashboardRejectSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'reject',
          'Review message example',
          null,
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'Suggestion rejected.'
        );
      }
    );
  });

  describe('when reviewing suggestion when flag CdAllowUndoingTranslationReview is disabled', function () {
    const reviewable = true;
    const subheading = 'topic_1 / story_1 / chapter_1';
    const suggestion1 = {
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      suggestion_id: 'suggestion_1',
      target_id: '1',
      target_type: 'target_type',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p><p>&nbsp;</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content</p><p>&nbsp;</p>',
    };

    const suggestion2 = {
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      suggestion_id: 'suggestion_2',
      target_id: '2',
      target_type: 'target_type',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content CHANGED</p>',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2',
      },
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2,
    };

    const editedContent = {
      html: '<p>In Hindi</p>',
    };

    const userInfo = new UserInfo(
      ['USER_ROLE'],
      true,
      false,
      false,
      false,
      true,
      'en',
      'username1',
      'tester@example.com',
      true
    );

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      component.editedContent = editedContent;
      mockPlatformFeatureService.status.CdAllowUndoingTranslationReview.isEnabled =
        false;
    });

    it('should call user service at initialization.', function () {
      const userInfoSpy = spyOn(
        userService,
        'getUserInfoAsync'
      ).and.returnValue(Promise.resolve(userInfo));

      const contributionRightsDataSpy = spyOn(
        userService,
        'getUserContributionRightsDataAsync'
      ).and.returnValue(
        Promise.resolve({
          can_review_translation_for_language_codes: ['ar'],
          can_review_voiceover_for_language_codes: [],
          can_review_questions: false,
          can_suggest_questions: false,
        })
      );
      component.ngOnInit();
      expect(userInfoSpy).toHaveBeenCalled();
      expect(contributionRightsDataSpy).toHaveBeenCalled();
    });

    it('should throw error if username is invalid', fakeAsync(() => {
      const defaultUserInfo = new UserInfo(
        ['GUEST'],
        false,
        false,
        false,
        false,
        false,
        null,
        null,
        null,
        false
      );
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(defaultUserInfo)
      );

      expect(() => {
        component.ngOnInit();
        tick();
      }).toThrowError();
      flush();
    }));

    it('should initialize component properties after component is initialized', function () {
      component.ngOnInit();
      expect(component.subheading).toBe(subheading);
      expect(component.reviewable).toBe(reviewable);
      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewMessage).toBe('');
    });

    it(
      'should register Contributor Dashboard view suggestion for review ' +
        'event after controller is initialized',
      function () {
        component.ngOnInit();
        expect(
          siteAnalyticsService.registerContributorDashboardViewSuggestionForReview
        ).toHaveBeenCalledWith('Translation');
      }
    );

    it('should notify user on failed suggestion update', function () {
      component.ngOnInit();
      const error = new Error('Error');
      expect(component.errorFound).toBeFalse();
      expect(component.errorMessage).toBe('');

      component.showTranslationSuggestionUpdateError(error);

      expect(component.errorFound).toBeTrue();
      expect(component.errorMessage).toBe('Invalid Suggestion: Error');
    });

    it(
      'should accept suggestion in suggestion modal service when clicking' +
        ' on accept and review next suggestion button',
      function () {
        component.ngOnInit();
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');
        // Suggestion 1's exploration_content_html matches its content_html.
        expect(component.hasExplorationContentChanged()).toBe(false);

        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardAcceptSuggestion'
        );
        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(activeModal, 'close');
        spyOn(alertsService, 'addSuccessMessage');

        component.reviewMessage = 'Review message example';
        component.translationUpdated = true;
        component.acceptAndReviewNext();

        expect(component.activeSuggestionId).toBe('suggestion_2');
        expect(component.activeSuggestion).toEqual(suggestion2);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');
        // Suggestion 2's exploration_content_html does not match its
        // content_html.
        expect(component.hasExplorationContentChanged()).toBe(true);
        expect(
          siteAnalyticsService.registerContributorDashboardAcceptSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'accept',
          'Review message example: ' +
            '(Note: This suggestion was submitted with reviewer edits.)',
          'hint section of "StateName" card',
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalled();

        component.reviewMessage = 'Review message example 2';
        component.translationUpdated = false;
        component.acceptAndReviewNext();

        expect(
          siteAnalyticsService.registerContributorDashboardAcceptSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '2',
          'suggestion_2',
          'accept',
          'Review message example 2',
          'hint section of "StateName" card',
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalled();
        expect(activeModal.close).toHaveBeenCalledWith([
          'suggestion_1',
          'suggestion_2',
        ]);
      }
    );

    it(
      'should set suggestion review message to auto-generated note when ' +
        'suggestion is accepted with edits and no user-supplied review message',
      function () {
        component.ngOnInit();
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');

        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardAcceptSuggestion'
        );
        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(alertsService, 'addSuccessMessage');

        component.translationUpdated = true;
        component.acceptAndReviewNext();

        expect(
          siteAnalyticsService.registerContributorDashboardAcceptSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'accept',
          '(Note: This suggestion was submitted with reviewer edits.)',
          'hint section of "StateName" card',
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalled();
      }
    );

    it(
      'should reject suggestion in suggestion modal service when clicking ' +
        'on reject and review next suggestion button',
      function () {
        component.ngOnInit();
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');

        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardRejectSuggestion'
        );
        spyOn(activeModal, 'close');
        spyOn(alertsService, 'addSuccessMessage');

        component.reviewMessage = 'Review message example';
        component.translationUpdated = true;
        component.rejectAndReviewNext(component.reviewMessage);

        expect(component.activeSuggestionId).toBe('suggestion_2');
        expect(component.activeSuggestion).toEqual(suggestion2);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');
        expect(
          siteAnalyticsService.registerContributorDashboardRejectSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'reject',
          'Review message example',
          null,
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalled();

        component.reviewMessage = 'Review message example 2';
        component.translationUpdated = false;
        component.rejectAndReviewNext(component.reviewMessage);

        expect(
          siteAnalyticsService.registerContributorDashboardRejectSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(alertsService.addSuccessMessage).toHaveBeenCalled();
        expect(activeModal.close).toHaveBeenCalledWith([
          'suggestion_1',
          'suggestion_2',
        ]);
      }
    );

    it(
      'should allow the reviewer to fix the suggestion if the backend pre' +
        ' accept/reject validation failed',
      function () {
        const responseMessage = 'Pre accept validation failed.';

        component.ngOnInit();
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardAcceptSuggestion'
        );
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardRejectSuggestion'
        );
        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.reject(errorCallback(responseMessage));
          }
        );
        spyOn(alertsService, 'addWarning');

        component.reviewMessage = 'Review message example';
        component.acceptAndReviewNext();

        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('Review message example');
        expect(
          siteAnalyticsService.registerContributorDashboardAcceptSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'accept',
          'Review message example',
          'hint section of "StateName" card',
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addWarning).toHaveBeenCalledWith(
          jasmine.stringContaining(responseMessage)
        );

        component.reviewMessage = 'Edited review message example';
        component.rejectAndReviewNext(component.reviewMessage);

        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('Edited review message example');
        expect(
          siteAnalyticsService.registerContributorDashboardRejectSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'reject',
          'Edited review message example',
          null,
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addWarning).toHaveBeenCalledWith(
          jasmine.stringContaining(responseMessage)
        );
      }
    );

    it(
      'should cancel suggestion in suggestion modal service when clicking ' +
        'on cancel suggestion button',
      function () {
        spyOn(activeModal, 'close');
        component.cancel();
        expect(activeModal.close).toHaveBeenCalledWith([]);
      }
    );

    it('should open the translation editor when the edit button is clicked', function () {
      component.editSuggestion();
      expect(component.startedEditing).toBe(true);
    });

    it('should close the translation editor when the cancel button is clicked', function () {
      component.cancelEdit();
      expect(component.startedEditing).toBe(false);
    });

    it('should expand the content area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      // The content area is contracted by default.
      expect(component.isContentExpanded).toBeFalse();
      // The content area should expand when the users clicks
      // on the 'View More' button.
      component.toggleExpansionState(0);

      expect(component.isContentExpanded).toBeTrue();
    });

    it('should contract the content area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      component.isContentExpanded = true;
      // The content area should contract when the users clicks
      // on the 'View Less' button.
      component.toggleExpansionState(0);

      expect(component.isContentExpanded).toBeFalse();
    });

    it('should expand the translation area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      // The translation area is contracted by default.
      expect(component.isTranslationExpanded).toBeFalse();
      // The translation area should expand when the users clicks
      // on the 'View More' button.
      component.toggleExpansionState(1);

      expect(component.isTranslationExpanded).toBeTrue();
    });

    it('should contract the translation area', () => {
      spyOn(component, 'toggleExpansionState').and.callThrough();
      component.isTranslationExpanded = true;
      // The translation area should contract when the users clicks
      // on the 'View Less' button.
      component.toggleExpansionState(1);

      expect(component.isTranslationExpanded).toBeFalse();
    });

    it('should update translation when the update button is clicked', function () {
      component.ngOnInit();
      spyOn(
        contributionAndReviewService,
        'updateTranslationSuggestionAsync'
      ).and.callFake(
        (suggestionId, translationHtml, successCallback, errorCallback) => {
          return Promise.resolve(successCallback());
        }
      );

      component.updateSuggestion();

      expect(
        contributionAndReviewService.updateTranslationSuggestionAsync
      ).toHaveBeenCalledWith(
        'suggestion_1',
        component.editedContent.html,
        jasmine.any(Function),
        jasmine.any(Function)
      );
    });

    describe('isHtmlContentEqual', function () {
      it('should return true regardless of &nbsp; differences', function () {
        expect(
          component.isHtmlContentEqual(
            '<p>content</p><p>&nbsp;&nbsp;</p>',
            '<p>content</p><p> </p>'
          )
        ).toBe(true);
      });

      it('should return true regardless of new line differences', function () {
        expect(
          component.isHtmlContentEqual(
            '<p>content</p>\r\n\n<p>content2</p>',
            '<p>content</p><p>content2</p>'
          )
        ).toBe(true);
      });

      it('should return false if html content differ', function () {
        expect(
          component.isHtmlContentEqual(
            '<p>content</p>',
            '<p>content CHANGED</p>'
          )
        ).toBe(false);
      });

      it('should return false if array contents differ', function () {
        expect(
          component.isHtmlContentEqual(
            ['<p>content1</p>', '<p>content2</p>'],
            ['<p>content1</p>', '<p>content2 CHANGED</p>']
          )
        ).toBe(false);
      });

      it('should return true if array contents are equal', function () {
        expect(
          component.isHtmlContentEqual(
            ['<p>content1</p>', '<p>content2</p>'],
            ['<p>content1</p>', '<p>content2</p>']
          )
        ).toBe(true);
      });

      it('should return false if type is different', function () {
        expect(
          component.isHtmlContentEqual(
            ['<p>content1</p>', '<p>content2</p>'],
            '<p>content2</p>'
          )
        ).toBe(false);
      });
    });
  });

  describe('when reviewing suggestions with deleted opportunites when flag CdAllowUndoingTranslationReview is disabled', function () {
    const reviewable = true;
    const subheading = 'topic_1 / story_1 / chapter_1';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: 'Translation',
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };

    const deletedContribution = {
      suggestion: suggestion2,
      details: null,
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_deleted: deletedContribution,
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      mockPlatformFeatureService.status.CdAllowUndoingTranslationReview.isEnabled =
        false;
      component.ngOnInit();
    });

    it(
      'should reject suggestion in suggestion modal service when clicking ' +
        'on reject and review next suggestion button',
      function () {
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');

        spyOn(
          contributionAndReviewService,
          'reviewExplorationSuggestion'
        ).and.callFake(
          (
            targetId,
            suggestionId,
            action,
            reviewMessage,
            commitMessage,
            successCallback,
            errorCallback
          ) => {
            return Promise.resolve(successCallback(suggestionId));
          }
        );
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardRejectSuggestion'
        );
        spyOn(activeModal, 'close');
        spyOn(alertsService, 'addSuccessMessage');

        component.reviewMessage = 'Review message example';
        component.rejectAndReviewNext(component.reviewMessage);

        expect(
          siteAnalyticsService.registerContributorDashboardRejectSuggestion
        ).toHaveBeenCalledWith('Translation');
        expect(
          contributionAndReviewService.reviewExplorationSuggestion
        ).toHaveBeenCalledWith(
          '1',
          'suggestion_1',
          'reject',
          'Review message example',
          null,
          jasmine.any(Function),
          jasmine.any(Function)
        );
        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'Suggestion rejected.'
        );
        expect(activeModal.close).toHaveBeenCalledWith(['suggestion_1']);
      }
    );
  });

  describe('when viewing suggestion', function () {
    const reviewable = false;
    const subheading = 'topic_1 / story_1 / chapter_1';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: 'Translation',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      target_type: 'target_type',
    };
    const obsoleteSuggestion = {
      suggestion_id: 'suggestion_3',
      target_id: '3',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      // This suggestion is obsolete.
      exploration_content_html: null,
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      target_type: 'target_type',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2',
      },
    };
    const contribution3 = {
      suggestion: obsoleteSuggestion,
      details: {
        topic_name: 'topic_3',
        story_title: 'story_3',
        chapter_title: 'chapter_3',
      },
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2,
      suggestion_3: contribution3,
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
    });

    it('should initialize component properties after component is initialized', fakeAsync(function () {
      const messages = [
        {
          author_username: '',
          created_on_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: 0,
          text: '',
          updated_status: '',
          updated_subject: '',
        },
        {
          author_username: 'Reviewer',
          created_on_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: 0,
          text: 'Review Message',
          updated_status: 'fixed',
          updated_subject: null,
        },
      ];

      const fetchMessagesAsyncSpy = spyOn(
        threadDataBackendApiService,
        'fetchMessagesAsync'
      ).and.returnValue(Promise.resolve({messages: messages}));

      component.ngOnInit();
      component.refreshActiveContributionState();
      tick();

      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.subheading).toBe('topic_1 / story_1 / chapter_1');
      // Suggestion 1's exploration_content_html does not match its
      // content_html.
      expect(component.hasExplorationContentChanged()).toBe(true);
      expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('suggestion_1');
      expect(component.reviewMessage).toBe('Review Message');
      expect(component.reviewer).toBe('Reviewer');
    }));

    it('should correctly determine whether the panel data is overflowing', fakeAsync(() => {
      // Pre-check.
      // The default values for the overflow states are false.
      expect(component.isContentOverflowing).toBeFalse();
      expect(component.isTranslationOverflowing).toBeFalse();
      // Setup.
      component.contentPanel.elementRef.nativeElement.offsetHeight = 100;
      component.translationPanel.elementRef.nativeElement.offsetHeight = 200;
      component.contentContainer.nativeElement.offsetHeight = 150;
      component.translationContainer.nativeElement.offsetHeight = 150;
      // Action.
      component.computePanelOverflowState();
      tick(0);
      // Expectations.
      expect(component.isContentOverflowing).toBeFalse();
      expect(component.isTranslationOverflowing).toBeTrue();
      // Change panel height to simulate changing of the modal data.
      component.contentPanel.elementRef.nativeElement.offsetHeight = 300;
      // Action.
      component.computePanelOverflowState();
      tick(0);
      // Expectations.
      expect(component.isContentOverflowing).toBeTrue();
      expect(component.isTranslationOverflowing).toBeTrue();
    }));

    it('should determine panel height after view initialization', () => {
      spyOn(component, 'computePanelOverflowState').and.callFake(() => {});

      component.ngAfterViewInit();

      expect(component.computePanelOverflowState).toHaveBeenCalled();
    });

    it('should set Obsolete review message for obsolete suggestions', fakeAsync(function () {
      const fetchMessagesAsyncSpy = spyOn(
        threadDataBackendApiService,
        'fetchMessagesAsync'
      ).and.returnValue(Promise.resolve({messages: []}));
      component.initialSuggestionId = 'suggestion_3';

      component.ngOnInit();
      component.refreshActiveContributionState();
      tick();

      expect(component.activeSuggestionId).toBe('suggestion_3');
      expect(component.activeSuggestion).toEqual(obsoleteSuggestion);
      expect(component.reviewable).toBe(reviewable);
      expect(component.subheading).toBe('topic_3 / story_3 / chapter_3');
      // Suggestion 3's exploration_content_html does not match its
      // content_html.
      expect(component.hasExplorationContentChanged()).toBe(true);
      expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('suggestion_3');
      expect(component.reviewMessage).toBe(
        AppConstants.OBSOLETE_TRANSLATION_SUGGESTION_REVIEW_MSG
      );
    }));
  });

  describe('when viewing suggestion', function () {
    const reviewable = false;
    const subheading = 'topic_1 / story_1 / chapter_1';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: 'Translation',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      target_type: 'target_type',
    };
    const obsoleteSuggestion = {
      suggestion_id: 'suggestion_3',
      target_id: '3',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      // This suggestion is obsolete.
      exploration_content_html: null,
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      target_type: 'target_type',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2',
      },
    };
    const contribution3 = {
      suggestion: obsoleteSuggestion,
      details: {
        topic_name: 'topic_3',
        story_title: 'story_3',
        chapter_title: 'chapter_3',
      },
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2,
      suggestion_3: contribution3,
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
    });

    it('should initialize component properties after component is initialized', fakeAsync(function () {
      const messages = [
        {
          author_username: '',
          created_on_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: 0,
          text: '',
          updated_status: '',
          updated_subject: '',
        },
        {
          author_username: 'Reviewer',
          created_on_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: 0,
          text: 'Review Message',
          updated_status: 'fixed',
          updated_subject: null,
        },
      ];

      const fetchMessagesAsyncSpy = spyOn(
        threadDataBackendApiService,
        'fetchMessagesAsync'
      ).and.returnValue(Promise.resolve({messages: messages}));

      component.ngOnInit();
      component.refreshActiveContributionState();
      tick();

      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.subheading).toBe('topic_1 / story_1 / chapter_1');
      // Suggestion 1's exploration_content_html does not match its
      // content_html.
      expect(component.hasExplorationContentChanged()).toBe(true);
      expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('suggestion_1');
      expect(component.reviewMessage).toBe('Review Message');
      expect(component.reviewer).toBe('Reviewer');
    }));

    it('should correctly determine whether the panel data is overflowing', fakeAsync(() => {
      // Pre-check.
      // The default values for the overflow states are false.
      expect(component.isContentOverflowing).toBeFalse();
      expect(component.isTranslationOverflowing).toBeFalse();
      // Setup.
      component.contentPanel.elementRef.nativeElement.offsetHeight = 100;
      component.translationPanel.elementRef.nativeElement.offsetHeight = 200;
      component.contentContainer.nativeElement.offsetHeight = 150;
      component.translationContainer.nativeElement.offsetHeight = 150;
      // Action.
      component.computePanelOverflowState();
      tick(0);
      // Expectations.
      expect(component.isContentOverflowing).toBeFalse();
      expect(component.isTranslationOverflowing).toBeTrue();
      // Change panel height to simulate changing of the modal data.
      component.contentPanel.elementRef.nativeElement.offsetHeight = 300;
      // Action.
      component.computePanelOverflowState();
      tick(0);
      // Expectations.
      expect(component.isContentOverflowing).toBeTrue();
      expect(component.isTranslationOverflowing).toBeTrue();
    }));

    it('should determine panel height after view initialization', () => {
      spyOn(component, 'computePanelOverflowState').and.callFake(() => {});

      component.ngAfterViewInit();

      expect(component.computePanelOverflowState).toHaveBeenCalled();
    });

    it('should set Obsolete review message for obsolete suggestions', fakeAsync(function () {
      const fetchMessagesAsyncSpy = spyOn(
        threadDataBackendApiService,
        'fetchMessagesAsync'
      ).and.returnValue(Promise.resolve({messages: []}));
      component.initialSuggestionId = 'suggestion_3';

      component.ngOnInit();
      component.refreshActiveContributionState();
      tick();

      expect(component.activeSuggestionId).toBe('suggestion_3');
      expect(component.activeSuggestion).toEqual(obsoleteSuggestion);
      expect(component.reviewable).toBe(reviewable);
      expect(component.subheading).toBe('topic_3 / story_3 / chapter_3');
      // Suggestion 3's exploration_content_html does not match its
      // content_html.
      expect(component.hasExplorationContentChanged()).toBe(true);
      expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('suggestion_3');
      expect(component.reviewMessage).toBe(
        AppConstants.OBSOLETE_TRANSLATION_SUGGESTION_REVIEW_MSG
      );
    }));
  });

  describe('when navigating through suggestions', function () {
    const reviewable = false;
    const subheading = 'topic_1 / story_1 / chapter_1';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: 'Translation',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      status: 'status',
      target_type: 'target_type',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2',
      },
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2,
    };

    const suggestionIdToContributionOne = {
      suggestion_1: contribution1,
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
    });

    it('should correctly set variables if there is only one item', () => {
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContributionOne
      );
      component.ngOnInit();

      expect(component.isFirstItem).toBeTrue();
      expect(component.isLastItem).toBeTrue();
      expect(component.remainingContributionIds.length).toEqual(0);
      expect(component.skippedContributionIds.length).toEqual(0);
    });

    it('should correctly set variables if there are multiple items', () => {
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      component.ngOnInit();

      expect(component.isFirstItem).toBeTrue();
      expect(component.isLastItem).toBeFalse();
      expect(component.remainingContributionIds.length).toEqual(1);
      expect(component.skippedContributionIds.length).toEqual(0);
    });

    it('should successfully navigate between items', () => {
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      component.ngOnInit();
      spyOn(component, 'refreshActiveContributionState').and.callThrough();

      expect(component.isFirstItem).toBeTrue();
      expect(component.isLastItem).toBeFalse();
      expect(component.remainingContributionIds).toEqual(['suggestion_2']);
      expect(component.skippedContributionIds.length).toEqual(0);
      expect(component.activeSuggestionId).toEqual('suggestion_1');

      component.goToPreviousItem();
      // As we are on the first item, goToPreviousItem shouldn't navigate.
      expect(component.isFirstItem).toBeTrue();
      expect(component.isLastItem).toBeFalse();
      expect(component.remainingContributionIds).toEqual(['suggestion_2']);
      expect(component.skippedContributionIds.length).toEqual(0);
      expect(component.activeSuggestionId).toEqual('suggestion_1');

      component.goToNextItem();

      expect(component.isFirstItem).toBeFalse();
      expect(component.isLastItem).toBeTrue();
      expect(component.remainingContributionIds.length).toEqual(0);
      expect(component.skippedContributionIds).toEqual(['suggestion_1']);
      expect(component.activeSuggestionId).toEqual('suggestion_2');
      expect(component.refreshActiveContributionState).toHaveBeenCalled();

      component.goToNextItem();
      // As we are on the last item, goToNextItem shoudn't navigate.
      expect(component.isFirstItem).toBeFalse();
      expect(component.isLastItem).toBeTrue();
      expect(component.remainingContributionIds.length).toEqual(0);
      expect(component.skippedContributionIds).toEqual(['suggestion_1']);
      expect(component.activeSuggestionId).toEqual('suggestion_2');

      component.goToPreviousItem();

      expect(component.isFirstItem).toBeTrue();
      expect(component.isLastItem).toBeFalse();
      expect(component.remainingContributionIds).toEqual(['suggestion_2']);
      expect(component.skippedContributionIds.length).toEqual(0);
      expect(component.activeSuggestionId).toEqual('suggestion_1');
      expect(component.refreshActiveContributionState).toHaveBeenCalled();
    });

    it(
      'should close the modal if the opportunity is' +
        ' deleted when navigating forward',
      () => {
        component.suggestionIdToContribution = angular.copy(
          suggestionIdToContribution
        );
        component.ngOnInit();
        spyOn(activeModal, 'close');
        component.allContributions.suggestion_2.details = null;

        component.goToNextItem();

        expect(activeModal.close).toHaveBeenCalledWith([]);
      }
    );

    it(
      'should close the modal if the opportunity is' +
        ' deleted when navigating backward',
      () => {
        component.suggestionIdToContribution = angular.copy(
          suggestionIdToContribution
        );
        component.ngOnInit();
        spyOn(activeModal, 'close');

        component.goToNextItem();

        expect(component.activeSuggestionId).toEqual('suggestion_2');
        // Delete the opportunity of the previous item.
        component.allContributions.suggestion_1.details = null;

        component.goToPreviousItem();

        expect(activeModal.close).toHaveBeenCalledWith([]);
      }
    );
  });

  describe('when set the schema constant', function () {
    const reviewable = true;
    const subheading = 'topic_1 / story_1 / chapter_1';
    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p><p>&nbsp;</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content</p><p>&nbsp;</p>',
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change_cmd: {
        content_id: 'hint_1',
        content_html: '<p>content</p>',
        translation_html: 'Tradução',
        state_name: 'StateName',
        cmd: 'edit_state_property',
        data_format: 'html',
        language_code: 'language_code',
      },
      exploration_content_html: '<p>content CHANGED</p>',
      status: 'rejected',
      author_name: 'author_name',
      language_code: 'language_code',
      last_updated_msecs: 1559074000000,
      target_type: 'target_type',
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: {
        topic_name: 'topic_1',
        story_title: 'story_1',
        chapter_title: 'chapter_1',
      },
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2',
      },
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2,
    };

    const editedContent = {
      html: '<p>In Hindi</p>',
    };

    beforeEach(fakeAsync(() => {
      component.initialSuggestionId = 'suggestion_2';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution
      );
      component.editedContent = editedContent;
      component.ngOnInit();
      tick();
    }));

    it('should get html schema', () => {
      expect(component.getHtmlSchema()).toEqual({
        type: 'html',
      });
    });

    it('should get unicode schema', () => {
      expect(component.getUnicodeSchema()).toEqual({
        type: 'unicode',
      });
    });

    it('should get set of strings schema', () => {
      expect(component.getSetOfStringsSchema()).toEqual({
        type: 'list',
        items: {
          type: 'unicode',
        },
      });
    });

    it('should invoke change detection when html is updated', () => {
      component.editedContent.html = 'old';
      spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
      component.updateHtml('new');
      expect(component.editedContent.html).toEqual('new');
    });

    it('should not invoke change detection when html is not updated', () => {
      component.editedContent.html = 'old';
      spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
      component.updateHtml('old');
      expect(component.editedContent.html).toEqual('old');
      expect(changeDetectorRef.detectChanges).toHaveBeenCalledTimes(0);
    });

    it('should check if the change cmd is deprecated', () => {
      const deprecatedCmd = 'add_translation';
      const validCmd = 'add_written_translation';

      component.activeSuggestion.change_cmd.cmd = validCmd;
      expect(component.isDeprecatedTranslationSuggestionCommand()).toBeFalse();

      component.activeSuggestion.change_cmd.cmd = deprecatedCmd;
      expect(component.isDeprecatedTranslationSuggestionCommand()).toBeTrue();
    });

    it('should check if translation contains HTML tags', () => {
      const translationWithTags = '<p>translation with tags</p>';
      const translationWithoutTags = 'translation without tags';

      component.translationHtml = translationWithTags;
      expect(component.doesTranslationContainTags()).toBeTrue();

      component.translationHtml = translationWithoutTags;
      expect(component.doesTranslationContainTags()).toBeFalse();
    });
  });

  it('should extract html related to images', () => {
    const content =
      '<oppia-noninteractive-image src="image1.jpg">' +
      'something</oppia-noninteractive-image>' +
      '<another-tag value="a"></another-tag>' +
      '<oppia-noninteractive-image src="image2.jpg"></oppia-noninteractive-image>';
    const expectedHtmlString =
      '<oppia-noninteractive-image src="image1.jpg">' +
      'something</oppia-noninteractive-image>' +
      '<oppia-noninteractive-image src="image2.jpg"></oppia-noninteractive-image>';

    const result = component.getImageInfoForSuggestion(content);

    expect(result).toEqual(expectedHtmlString);
  });
});
