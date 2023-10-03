// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for feedback updates page.
 */

import { FeedbackThreadSummary } from
  'domain/feedback_thread/feedback-thread-summary.model';

import { FeedbackUpdatesPageComponent } from './feedback-updates-page.component';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MaterialModule } from 'modules/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, EventEmitter, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AlertsService } from 'services/alerts.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { FeedbackUpdatesBackendApiService } from 'domain/feedback_updates/feedback-updates-backend-api.service';
import { SortByPipe } from 'filters/string-utility-filters/sort-by.pipe';
import { UserService } from 'services/user.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { PageTitleService } from 'services/page-title.service';
import { UrlService } from 'services/contextual/url.service';
import { UserInfo } from 'domain/user/user-info.model';

@Pipe({name: 'slice'})
class MockSlicePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

@Component({selector: 'background-banner', template: ''})
class BackgroundBannerComponentStub {
}


@Component({selector: 'loading-dots', template: ''})
class LoadingDotsComponentStub {
}

describe('Feedback updates page', () => {
  let component: FeedbackUpdatesPageComponent;
  let fixture: ComponentFixture<FeedbackUpdatesPageComponent>;
  let alertsService: AlertsService;
  let csrfTokenService: CsrfTokenService;
  let dateTimeFormatService: DateTimeFormatService;
  let focusManagerService: FocusManagerService;
  let feedbackUpdatesBackendApiService:
      FeedbackUpdatesBackendApiService;
  let windowDimensionsService: WindowDimensionsService;
  let mockResizeEmitter: EventEmitter<void>;
  let userService: UserService;
  let translateService: TranslateService;
  let pageTitleService: PageTitleService;
  let urlService: UrlService;

  let threadSummaryList = [{
    status: 'open',
    original_author_id: '1',
    last_updated_msecs: 1000,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Biology',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  },
  {
    status: 'open',
    original_author_id: '2',
    last_updated_msecs: 1001,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Algebra',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  },
  {
    status: 'open',
    original_author_id: '3',
    last_updated_msecs: 1002,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Three Balls',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  },
  {
    status: 'open',
    original_author_id: '4',
    last_updated_msecs: 1003,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Zebra',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  }
  ];

  let FeedbackUpdatesData = {
    thread_summaries: threadSummaryList,
    number_of_unread_threads: 10,
  };

  let userInfo = {
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
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    isTranslationCoordinator: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('when succesfully fetching feedback updates data', () => {
    beforeEach(async(() => {
      mockResizeEmitter = new EventEmitter();
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          MaterialModule,
          FormsModule,
          HttpClientTestingModule
        ],
        declarations: [
          FeedbackUpdatesPageComponent,
          MockTranslatePipe,
          SortByPipe,
          MockSlicePipe,
          MockTrunctePipe,
          BackgroundBannerComponentStub,
          LoadingDotsComponentStub,
        ],
        providers: [
          AlertsService,
          DateTimeFormatService,
          FocusManagerService,
          FeedbackUpdatesBackendApiService,
          {
            provide: WindowDimensionsService,
            useValue: {
              isWindowNarrow: () => true,
              getResizeEvent: () => mockResizeEmitter,
            }
          },
          UrlInterpolationService,
          UserService,
          PageTitleService,
          {
            provide: TranslateService,
            useClass: MockTranslateService
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(FeedbackUpdatesPageComponent);
      component = fixture.componentInstance;

      alertsService = TestBed.inject(AlertsService);
      csrfTokenService = TestBed.inject(CsrfTokenService);
      dateTimeFormatService = TestBed.inject(DateTimeFormatService);
      focusManagerService = TestBed.inject(FocusManagerService);
      windowDimensionsService = TestBed.inject(WindowDimensionsService);
      feedbackUpdatesBackendApiService =
        TestBed.inject(FeedbackUpdatesBackendApiService);
      userService = TestBed.inject(UserService);
      translateService = TestBed.inject(TranslateService);
      pageTitleService = TestBed.inject(PageTitleService);
      urlService = TestBed.inject(UrlService);

      spyOn(csrfTokenService, 'getTokenAsync').and.callFake(async() => {
        return Promise.resolve('sample-csrf-token');
      });

      spyOn(userService, 'getProfileImageDataUrl').and.returnValue(
        ['profile-image-url-png', 'profile-image-url-webp']);

      spyOn(
        feedbackUpdatesBackendApiService,
        'fetchFeedbackUpdatesDataAsync')
        .and.returnValue(Promise.resolve({
          numberOfUnreadThreads: FeedbackUpdatesData.
            number_of_unread_threads,
          threadSummaries: (
            FeedbackUpdatesData.thread_summaries.map(
              threadSummary => FeedbackThreadSummary
                .createFromBackendDict(threadSummary))),
          paginatedThreadsList: []
        }));

      spyOn(urlService, 'getUrlParams').and.returnValue({
        active_tab: 'learner-groups',
      });

      component.ngOnInit();
      flush();
      fixture.detectChanges();
    }));

    it('should initialize correctly component properties after its' +
    ' initialization and get data from backend', fakeAsync(() => {
      spyOn(userService, 'getUserInfoAsync').and
        .callFake(async() => {
          return Promise.resolve(userInfo as UserInfo);
        });
      component.ngOnInit();
      flush();

      expect(component.profilePicturePngDataUrl).toEqual(
        'profile-image-url-png');
      expect(component.profilePictureWebpDataUrl).toEqual(
        'profile-image-url-webp');
      expect(component.username).toBe(userInfo.getUsername());
      expect(component.windowIsNarrow).toBeTrue();
    }));

    it('should get default profile pictures when username is null',
      fakeAsync(() => {
        let userInfo = {
          getUsername: () => null,
          isSuperAdmin: () => true,
          getEmail: () => 'test_email@example.com'
        };
        spyOn(userService, 'getUserInfoAsync')
          .and.resolveTo(userInfo as UserInfo);
        component.ngOnInit();
        flush();

        expect(component.profilePicturePngDataUrl).toEqual(
          '/assets/images/avatar/user_blue_150px.png');
        expect(component.profilePictureWebpDataUrl).toEqual(
          '/assets/images/avatar/user_blue_150px.webp');
      }));

    it('should check whether window is narrow on resizing the screen', () => {
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

      expect(component.windowIsNarrow).toBeTrue();

      mockResizeEmitter.emit();

      expect(component.windowIsNarrow).toBeFalse();
    });

    it('should set focus without scroll on browse lesson btn', fakeAsync(() => {
      const focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');
      spyOn(userService, 'getUserInfoAsync').and
        .callFake(async() => {
          return Promise.resolve(userInfo as UserInfo);
        });

      component.ngOnInit();
      flush();

      expect(focusSpy).toHaveBeenCalledWith('ourLessonsBtn');
    }));

    it('should subscribe to onLangChange upon initialisation and set page ' +
    'title whenever language changes', fakeAsync(() => {
      spyOn(component.directiveSubscriptions, 'add');
      spyOn(translateService.onLangChange, 'subscribe');
      spyOn(component, 'setPageTitle');

      component.ngOnInit();
      flush();

      expect(component.directiveSubscriptions.add).toHaveBeenCalled();
      expect(translateService.onLangChange.subscribe).toHaveBeenCalled();

      translateService.onLangChange.emit();

      expect(component.setPageTitle).toHaveBeenCalled();
    }));

    it('should obtain translated page title and set it', () => {
      spyOn(translateService, 'instant').and.callThrough();
      spyOn(pageTitleService, 'setDocumentTitle');

      component.setPageTitle();

      expect(translateService.instant).toHaveBeenCalledWith(
        'I18N_FEEDBACK_UPDATES_PAGE_TITLE');
      expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
        'I18N_FEEDBACK_UPDATES_PAGE_TITLE');
    });

    it('should get static image url', () => {
      let imagePath = '/path/to/image.png';

      expect(component.getStaticImageUrl(imagePath)).toBe(
        '/assets/images/path/to/image.png');
    });

    it('should get user profile image png data url correctly', () => {
      expect(component.getauthorPicturePngDataUrl('username')).toBe(
        'profile-image-url-png');
    });

    it('should get user profile image webp data url correctly', () => {
      expect(component.getauthorPictureWebpDataUrl('username')).toBe(
        'profile-image-url-webp');
    });

    it('should show username popover based on its length', () => {
      expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
      expect(component.showUsernamePopover('abc')).toBe('none');
    });

    it('should change feedback sorting options by last update msecs when' +
      ' changing sorting type', () => {
      expect(component.isCurrentFeedbackSortDescending).toBe(true);
      expect(component.currentFeedbackThreadsSortType).toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('lastUpdatedMsecs');

      expect(component.isCurrentFeedbackSortDescending).toBe(false);
    });

    it('should change feedback sorting options by exploration when changing' +
      ' sorting type', () => {
      component.setFeedbackSortingOptions('exploration');

      expect(component.currentFeedbackThreadsSortType).toBe('exploration');
      expect(component.isCurrentFeedbackSortDescending).toBe(true);
    });

    it('should sort feedback updates given sorting property as last updated' +
      ' in ascending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration') as
           NodeListOf<HTMLElement>;

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      const expectedInnerText = ['Biology', 'Algebra', 'Three Balls', 'Zebra'];
      feedbackListNameNodes.forEach((titleNode, index: number) => {
        expect(titleNode.innerText).toBe(expectedInnerText[index]);
      });
    }));

    it('should sort feedback updates given sorting property as last updated' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('lastUpdatedMsecs');

      expect(component.isCurrentFeedbackSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration') as
           NodeListOf<HTMLElement>;

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      const expectedInnerText = ['Zebra', 'Three Balls', 'Algebra', 'Biology'];
      feedbackListNameNodes.forEach((titleNode, index: number) => {
        expect(titleNode.innerText).toBe(expectedInnerText[index]);
      });
    }));

    it('should sort feedback updates given sorting property as exploration' +
      ' in ascending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('explorationTitle');

      expect(component.currentFeedbackThreadsSortType)
        .toBe('explorationTitle');
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('explorationTitle');

      tick();
      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration') as
           NodeListOf<HTMLElement>;

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      const expectedInnerText = ['Algebra', 'Biology', 'Three Balls', 'zebra'];
      feedbackListNameNodes.forEach((titleNode, index: number) => {
        expect(titleNode.innerText).toBe(expectedInnerText[index]);
      });
    }));

    it('should sort feedback updates given sorting property as exploration' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('explorationTitle');

      expect(component.currentFeedbackThreadsSortType)
        .toBe('explorationTitle');
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('explorationTitle');

      component.setFeedbackSortingOptions('explorationTitle');

      expect(component.isCurrentFeedbackSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration') as
           NodeListOf<HTMLElement>;

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      const expectedInnerText = ['Zebra', 'Three Balls', 'Biology', 'Algebra'];
      feedbackListNameNodes.forEach((titleNode, index: number) => {
        expect(titleNode.innerText).toBe(expectedInnerText[index]);
      });
    }));

    it('should get messages in the thread from the backend when a thread is' +
      ' selected', fakeAsync(() => {
      let threadStatus = 'open';
      let explorationId = 'exp1';
      let threadId = 'thread_1';
      let explorationTitle = 'Exploration Title';
      let threadMessages = [{
        message_id: 1,
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        created_on_msecs: 1200
      }];
      const threadSpy = spyOn(
        feedbackUpdatesBackendApiService, 'onClickThreadAsync')
        .and.returnValue(Promise.resolve(threadMessages));

      expect(component.numberOfUnreadThreads).toBe(10);
      expect(component.loadingFeedback).toBe(false);

      component.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);

      expect(component.loadingFeedback).toBe(true);

      tick();
      fixture.detectChanges();

      expect(component.loadingFeedback).toBe(false);
      expect(component.feedbackThreadActive).toBe(true);
      expect(component.numberOfUnreadThreads).toBe(6);
      expect(component.messageSummaries.length).toBe(1);
      expect(threadSpy).toHaveBeenCalled();
    }));

    it('should set a new section as active when fetching message summary' +
      ' list from backend', fakeAsync(() => {
      let threadStatus = 'open';
      let explorationId = 'exp1';
      let threadId = 'thread_1';
      let explorationTitle = 'Exploration Title';
      let threadMessages = [{
        message_id: 1,
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        created_on_msecs: 1200
      }];
      const threadSpy = spyOn(
        feedbackUpdatesBackendApiService, 'onClickThreadAsync')
        .and.returnValue(Promise.resolve(threadMessages));

      expect(component.numberOfUnreadThreads).toBe(10);
      expect(component.loadingFeedback).toBe(false);

      component.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);

      expect(component.loadingFeedback).toBe(true);

      tick();
      fixture.detectChanges();

      expect(component.loadingFeedback).toBe(false);
      expect(component.feedbackThreadActive).toBe(true);
      expect(component.numberOfUnreadThreads).toBe(6);
      expect(component.messageSummaries.length).toBe(1);
      expect(threadSpy).toHaveBeenCalled();
    }));

    it('should show all threads when a thread is not selected',
      fakeAsync(() => {
        let threadStatus = 'open';
        let explorationId = 'exp1';
        let threadId = 'thread_1';
        let explorationTitle = 'Exploration Title';
        let threadMessages = [{
          message_id: 1,
          text: 'Feedback 1',
          updated_status: 'open',
          suggestion_html: 'An instead of a',
          current_content_html: 'A orange',
          description: 'Suggestion for english grammar',
          author_username: 'username2',
          created_on_msecs: 1200
        }];

        const threadSpy =
          spyOn(feedbackUpdatesBackendApiService, 'onClickThreadAsync')
            .and.returnValue(Promise.resolve(threadMessages));

        expect(component.numberOfUnreadThreads).toBe(10);
        expect(component.loadingFeedback).toBe(false);

        component.onClickThread(
          threadStatus, explorationId, threadId, explorationTitle);

        expect(component.loadingFeedback).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.loadingFeedback).toBe(false);
        expect(component.feedbackThreadActive).toBe(true);
        expect(component.numberOfUnreadThreads).toBe(6);
        expect(component.messageSummaries.length).toBe(1);
        expect(threadSpy).toHaveBeenCalled();

        component.showAllThreads();

        expect(component.feedbackThreadActive).toBe(false);
        expect(component.numberOfUnreadThreads).toBe(6);
      }));

    it('should add a new message in a thread when there is a thread selected',
      fakeAsync(() => {
        let threadStatus = 'open';
        let explorationId = 'exp1';
        let threadId = 'thread_1';
        let explorationTitle = 'Exploration Title';
        let message = 'This is a new message';
        let threadMessages = [{
          message_id: 1,
          text: 'Feedback 1',
          updated_status: 'open',
          suggestion_html: 'An instead of a',
          current_content_html: 'A orange',
          description: 'Suggestion for english grammar',
          author_username: 'username2',
          created_on_msecs: 1200
        }];

        const threadSpy = spyOn(
          feedbackUpdatesBackendApiService, 'onClickThreadAsync')
          .and.returnValue(Promise.resolve(threadMessages));

        const addMessageSpy = spyOn(
          feedbackUpdatesBackendApiService, 'addNewMessageAsync')
          .and.returnValue(Promise.resolve());

        expect(component.numberOfUnreadThreads).toBe(10);
        expect(component.loadingFeedback).toBe(false);

        component.onClickThread(
          threadStatus, explorationId, threadId, explorationTitle);

        expect(component.loadingFeedback).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.loadingFeedback).toBe(false);
        expect(component.feedbackThreadActive).toBe(true);
        expect(component.numberOfUnreadThreads).toBe(6);
        expect(component.messageSummaries.length).toBe(1);
        expect(threadSpy).toHaveBeenCalled();

        component.addNewMessage(threadId, message);

        expect(component.messageSendingInProgress).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.messageSendingInProgress).toBe(false);
        expect(addMessageSpy).toHaveBeenCalled();
      }));

    it('should get css classes based on status', () => {
      expect(component.getLabelClass('open')).toBe('badge badge-info');
      expect(component.getLabelClass('compliment')).toBe('badge badge-success');
      expect(component.getLabelClass('another')).toBe('badge badge-secondary');
    });

    it('should get human readable status from provided status', () => {
      expect(component.getHumanReadableStatus('open')).toBe('Open');
      expect(component.getHumanReadableStatus('compliment')).toBe('Compliment');
      expect(component.getHumanReadableStatus('not_actionable')).toBe(
        'Not Actionable');
    });

    it('should get formatted date string from the timestamp in milliseconds',
      () => {
        // This corresponds to Fri, 2 Apr 2021 09:45:00 GMT.
        let NOW_MILLIS = 1617393321345;
        spyOn(dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
          .withArgs(NOW_MILLIS).and.returnValue('4/2/2021');

        expect(component.getLocaleAbbreviatedDatetimeString(NOW_MILLIS))
          .toBe('4/2/2021');
      });

    it('should sanitize given png base64 data and generate url', () => {
      let result = component.decodePngURIData('%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');

      fixture.detectChanges();

      expect(result).toBe('шеллы');
    });
  });

  describe('when fetching dashboard data fails', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          MaterialModule,
          FormsModule,
          HttpClientTestingModule
        ],
        declarations: [
          FeedbackUpdatesPageComponent,
          MockTranslatePipe,
          SortByPipe,
          MockSlicePipe,
          MockTrunctePipe,
          BackgroundBannerComponentStub,
          LoadingDotsComponentStub,
        ],
        providers: [
          AlertsService,
          CsrfTokenService,
          FeedbackUpdatesBackendApiService,
          UserService,
          PageTitleService,
          {
            provide: TranslateService,
            useClass: MockTranslateService
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(FeedbackUpdatesPageComponent);
      component = fixture.componentInstance;
      alertsService = TestBed.inject(AlertsService);
      csrfTokenService = TestBed.inject(CsrfTokenService);
      feedbackUpdatesBackendApiService =
        TestBed.inject(FeedbackUpdatesBackendApiService);
      userService = TestBed.inject(UserService);
      translateService = TestBed.inject(TranslateService);
      pageTitleService = TestBed.inject(PageTitleService);

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        Promise.resolve('sample-csrf-token'));

      spyOn(userService, 'getProfileImageDataUrl').and.returnValue(
        ['default-image-url-png', 'default-image-url-webp']);

      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo as UserInfo));
    }));

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should show an alert warning when fails to get feedback updates data',
      fakeAsync(() => {
        const fetchDataSpy = spyOn(
          feedbackUpdatesBackendApiService,
          'fetchFeedbackUpdatesDataAsync')
          .and.rejectWith(404);
        const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

        component.ngOnInit();

        tick(1000);
        fixture.detectChanges();

        expect(alertsSpy).toHaveBeenCalledWith(
          'Failed to get feedback updates data');
        expect(fetchDataSpy).toHaveBeenCalled();
        flush();
      }));

    it('should unsubscribe upon component destruction', () => {
      spyOn(component.directiveSubscriptions, 'unsubscribe');

      component.ngOnDestroy();

      expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
    });
  });
});
