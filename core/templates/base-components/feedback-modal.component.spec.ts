// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for FeedbackModalComponent.
 */

import {
  Component,
  EventEmitter,
  Input,
  Output,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {RouterTestingModule} from '@angular/router/testing';
import {FeedbackModalComponent} from './feedback-modal.component';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';
import {PageContextService} from 'services/page-context.service';
import {LearnerAnswerInfoService} from 'pages/exploration-player-page/services/learner-answer-info.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {FeedbackSessionInfoService} from 'services/feedback-session-info.service';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {FeedbackScreenshotStagingService} from 'domain/feedback/feedback-screenshot-staging.service';
import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';
import {
  FeedbackSessionInfo,
  FeedbackModalType,
} from 'domain/feedback/feedback.model';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {UserInfo} from 'domain/user/user-info.model';

@Component({
  selector: 'oppia-image-receiver',
  template: '',
})
class MockImageReceiverComponent {
  @Input() allowedImageFormats: string[] = [];
  @Input() maxImageSizeInKB: number = 0;
  @Output() fileChanged: EventEmitter<File> = new EventEmitter<File>();
}

class MockWindowRef {
  nativeWindow: {
    location: {
      href: string;
      reload: jasmine.Spy;
    };
    navigator: {userAgent: string};
    innerWidth: number;
    innerHeight: number;
    document: {title: string};
    turnstile?: {
      render: jasmine.Spy;
      reset: jasmine.Spy;
    };
  } = {
    location: {
      href: 'https://www.oppia.org/learn/math',
      reload: jasmine.createSpy('reload'),
    },
    navigator: {
      userAgent: 'test-agent',
    },
    innerWidth: 800,
    innerHeight: 600,
    document: {
      title: 'Oppia',
    },
    turnstile: {
      render: jasmine.createSpy('render').and.callFake(
        (
          _container: HTMLElement,
          options: {
            sitekey: string;
            callback: (token: string) => void;
            'error-callback': () => void;
            'expired-callback': () => void;
          }
        ) => {
          options.callback('captcha-token');
          return 'widget-id';
        }
      ),
      reset: jasmine.createSpy('reset'),
    },
  };
}

class MockUserService {
  isLoggedIn: boolean = false;
  shouldReject: boolean = false;

  getUserInfoAsync(): Promise<{isLoggedIn: () => boolean}> {
    if (this.shouldReject) {
      return Promise.reject(new Error('Failed to fetch user info.'));
    }
    return Promise.resolve({
      isLoggedIn: () => this.isLoggedIn,
    });
  }

  getLoginUrlAsync(): Promise<string> {
    return Promise.resolve('/login');
  }
}

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

const feedbackSessionInfo: FeedbackSessionInfo = {
  console_logs_json: [
    {
      error_message: 'TypeError: Something went wrong',
      log_level: 'error',
      timestamp_msecs: 1234567890,
      stack_trace: 'Error stack trace',
    },
  ],
  failed_requests_json: [
    {
      url: '/createhandler/web_feedback',
      method: 'POST',
      status_code: 500,
      timestamp_msecs: 1234567891,
      status_text: 'Internal Server Error',
      error_message: 'Request failed',
    },
  ],
  navigation_history_json: [
    {
      path: '/learn/math',
      timestamp_msecs: 1234567892,
    },
  ],
  environment_json: {
    client_time_msecs: 1234567893,
    timezone_offset_mins: -330,
    user_agent: 'Mozilla/5.0 Chrome/136.0',
    viewport: {
      width: 1920,
      height: 1080,
    },
    page: {
      url: 'http://localhost:8181/explore/test',
      title: 'Test Exploration',
    },
    locale: {
      language_code: 'en',
      direction: 'ltr',
    },
  },
};

describe('FeedbackModalComponent', () => {
  let userInfo = {
    isLoggedIn: () => true,
  } as UserInfo;
  let fixture: ComponentFixture<FeedbackModalComponent>;
  let component: FeedbackModalComponent;
  let activeModal: MockActiveModal;
  let translateService: jasmine.SpyObj<TranslateService>;
  let feedbackScreenshotStagingService: jasmine.SpyObj<FeedbackScreenshotStagingService>;
  let windowRef: MockWindowRef;
  let userService: MockUserService;
  let pageContextService: PageContextService;
  let playerPositionService: PlayerPositionService;
  let learnerAnswerInfoService: LearnerAnswerInfoService;
  let feedbackBackendApiService: FeedbackBackendApiService;
  let feedbackSessionInfoService: jasmine.SpyObj<FeedbackSessionInfoService>;
  let insertScriptService: jasmine.SpyObj<InsertScriptService>;

  const createComponent = (
    modalType: FeedbackModalType = FeedbackModalType.LESSON_FEEDBACK
  ): void => {
    fixture = TestBed.createComponent(FeedbackModalComponent);
    component = fixture.componentInstance;

    component.feedbackModalType = modalType;

    windowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    userService = TestBed.inject(UserService) as unknown as MockUserService;
    feedbackBackendApiService = TestBed.inject(FeedbackBackendApiService);
    pageContextService = TestBed.inject(PageContextService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    learnerAnswerInfoService = TestBed.inject(LearnerAnswerInfoService);

    fixture.detectChanges();
  };

  beforeEach(waitForAsync(() => {
    activeModal = new MockActiveModal();
    windowRef = new MockWindowRef();
    userService = new MockUserService();
    translateService = jasmine.createSpyObj('TranslateService', ['instant']);

    translateService.instant.and.callFake(
      (key: string, params?: {maxLength: number}) => {
        if (key === 'I18N_LESSON_FEEDBACK_DESCRIPTION_REQUIRED') {
          return 'Please add a description before submitting.';
        }

        if (key === 'I18N_LESSON_FEEDBACK_MESSAGE_TOO_LONG') {
          return `Please keep your feedback under ${params?.maxLength} characters.`;
        }

        return key;
      }
    );
    feedbackSessionInfoService = jasmine.createSpyObj(
      'FeedbackSessionInfoService',
      ['getSessionInfo']
    );

    feedbackSessionInfoService.getSessionInfo.and.returnValue(
      feedbackSessionInfo
    );
    feedbackScreenshotStagingService = jasmine.createSpyObj(
      'FeedbackScreenshotStagingService',
      ['stageScreenshotAsync', 'clearStagedScreenshot']
    );
    insertScriptService = jasmine.createSpyObj('InsertScriptService', [
      'loadScript',
    ]);
    insertScriptService.loadScript.and.callFake(
      (_scriptName: string, callback?: () => void) => {
        if (callback) {
          callback();
        }
        return true;
      }
    );

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      declarations: [
        FeedbackModalComponent,
        MockImageReceiverComponent,
        MockTranslatePipe,
      ],
      providers: [
        PageContextService,
        PlayerPositionService,
        LearnerAnswerInfoService,
        FeedbackBackendApiService,
        {
          provide: TranslateService,
          useValue: translateService,
        },
        {
          provide: FeedbackSessionInfoService,
          useValue: feedbackSessionInfoService,
        },
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: WindowRef,
          useValue: windowRef,
        },
        {
          provide: NgbActiveModal,
          useValue: activeModal,
        },
        {
          provide: FeedbackScreenshotStagingService,
          useValue: feedbackScreenshotStagingService,
        },
        {
          provide: InsertScriptService,
          useValue: insertScriptService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  it('should create the component', () => {
    createComponent();
    expect(component).toBeDefined();
  });

  it('should identify lesson feedback mode correctly', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;

    expect(component.isLessonFeedbackMode).toBe(true);
    expect(component.isLessonIssueMode).toBe(false);
    expect(component.isSiteIssueMode).toBe(false);
  });

  it('should identify lesson issue mode correctly', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;

    expect(component.isLessonIssueMode).toBe(true);
    expect(component.isLessonFeedbackMode).toBe(false);
    expect(component.isSiteIssueMode).toBe(false);
  });

  it('should identify site issue mode correctly', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;

    expect(component.isSiteIssueMode).toBe(true);
    expect(component.isLessonFeedbackMode).toBe(false);
    expect(component.isLessonIssueMode).toBe(false);
  });

  it('should throw error for invalid title modal type', () => {
    createComponent();

    component.feedbackModalType = 'invalid' as unknown as FeedbackModalType;

    expect(() => component.title).toThrowError('Invalid feedback modal type.');
  });

  it('should throw error for invalid subtitle modal type', () => {
    createComponent();

    component.feedbackModalType = 'invalid' as unknown as FeedbackModalType;

    expect(() => component.subTitle).toThrowError(
      'Invalid feedback modal type.'
    );
  });

  it('should throw error for invalid textarea placeholder modal type', () => {
    createComponent();

    component.feedbackModalType = 'invalid' as unknown as FeedbackModalType;

    expect(() => component.textarePlaceholder).toThrowError(
      'Invalid feedback modal type.'
    );
  });

  it('should show category selector only in lesson issue mode', () => {
    createComponent();

    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    expect(component.shouldShowCategorySelector).toBe(true);

    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;
    expect(component.shouldShowCategorySelector).toBe(false);

    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    expect(component.shouldShowCategorySelector).toBe(false);
  });

  it('should show screenshot upload in lesson issue and site issue modes', () => {
    createComponent();

    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    expect(component.shouldShowScreenshotUpload).toBe(true);

    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    expect(component.shouldShowScreenshotUpload).toBe(true);

    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;
    expect(component.shouldShowScreenshotUpload).toBe(false);
  });

  it('should not show technical logs in lesson feedback mode', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;

    expect(component.shouldShowTechnicalLogs).toBe(false);
  });

  it('should show technical logs in site issue mode when checkbox is enabled', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    component.showTechnicalLogsCheckbox = true;

    expect(component.shouldShowTechnicalLogs).toBe(true);
  });

  it('should show technical logs in lesson issue mode when category enables it', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.selectCategory('broken_layout_or_image');

    expect(component.shouldShowTechnicalLogs).toBe(true);
  });

  it('should not show technical logs in lesson issue mode when category disables it', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.selectCategory('typo');

    expect(component.shouldShowTechnicalLogs).toBe(false);
  });

  it('should return lesson feedback title', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;

    expect(component.title).toBe('I18N_LESSON_FEEDBACK_MODAL_TITLE');
  });

  it('should return lesson issue title', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;

    expect(component.title).toBe('I18N_REPORT_LESSON_BUG_TITLE');
  });

  it('should return site issue title', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;

    expect(component.title).toBe('I18N_FOOTER_REPORT_WEBSITE_ISSUE');
  });

  it('should return lesson feedback subtitle', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;

    expect(component.subTitle).toBe('I18N_LESSON_FEEDBACK_MODAL_SUBTITLE');
  });

  it('should return lesson issue subtitle', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;

    expect(component.subTitle).toBe('I18N_REPORT_LESSON_BUG_SUBTITLE');
  });

  it('should return site issue subtitle', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;

    expect(component.subTitle).toBe('I18N_REPORT_WEBSITE_ISSUE_SUBTITLE');
  });

  it('should return lesson feedback placeholder', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;

    expect(component.textarePlaceholder).toBe(
      'I18N_LESSON_FEEDBACK_MODAL_TEXTAREA_PLACEHOLDER'
    );
  });

  it('should return lesson issue placeholder', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;

    expect(component.textarePlaceholder).toBe(
      'I18N_REPORT_LESSON_BUG_TEXTAREA_PLACEHOLDER'
    );
  });

  it('should return site issue placeholder', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;

    expect(component.textarePlaceholder).toBe(
      'I18N_REPORT_WEBSITE_ISSUE_TEXTAREA_PLACEHOLDER'
    );
  });

  it('should fetch user login status in lesson feedback mode', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );

    component.ngOnInit();
    flushMicrotasks();

    expect(userService.getUserInfoAsync).toHaveBeenCalled();
    expect(component.isUserLoggedIn).toBe(true);
  }));

  it('should mark user as not logged in when userInfo resolves to false', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;

    const notLoggedInUserInfo = {
      isLoggedIn: () => false,
    } as UserInfo;

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(notLoggedInUserInfo)
    );

    component.ngOnInit();
    flushMicrotasks();

    expect(component.isUserLoggedIn).toBe(false);
  }));

  it('should reset showTechnicalLogsCheckbox to true on init', () => {
    createComponent();
    component.showTechnicalLogsCheckbox = false;

    component.ngOnInit();

    expect(component.showTechnicalLogsCheckbox).toBe(true);
  });

  it('should clear form error when clearFormError is called with an existing error', () => {
    createComponent();
    component.formError = 'Some error';

    component.clearFormError();

    expect(component.formError).toBeNull();
  });

  it('should remain null when clearFormError is called and error is already null', () => {
    createComponent();
    component.formError = null;

    component.clearFormError();

    expect(component.formError).toBeNull();
  });

  it('should set window location to login url when login url exists', fakeAsync(() => {
    createComponent();

    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve('/login')
    );

    component.signIn();
    flushMicrotasks();

    expect(userService.getLoginUrlAsync).toHaveBeenCalled();
    expect(windowRef.nativeWindow.location).toBe('/login');
  }));

  it('should reload page when login url is empty', fakeAsync(() => {
    createComponent();

    spyOn(userService, 'getLoginUrlAsync').and.returnValue(Promise.resolve(''));

    component.signIn();
    flushMicrotasks();

    expect(windowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));

  it('should select typo category and disable technical logs checkbox', () => {
    createComponent();
    component.selectCategory('typo');

    expect(component.category).toBe('typo');
    expect(component.showTechnicalLogsCheckbox).toBe(false);
  });

  it('should select broken_layout_or_image category and enable technical logs checkbox', () => {
    createComponent();
    component.selectCategory('broken_layout_or_image');

    expect(component.category).toBe('broken_layout_or_image');
    expect(component.showTechnicalLogsCheckbox).toBe(true);
  });

  it('should select confusing_or_incorrect_answer category and disable technical logs checkbox', () => {
    createComponent();
    component.selectCategory('confusing_or_incorrect_answer');

    expect(component.category).toBe('confusing_or_incorrect_answer');
    expect(component.showTechnicalLogsCheckbox).toBe(false);
  });

  it('should select other_or_not_sure category and enable technical logs checkbox', () => {
    createComponent();
    component.selectCategory('other_or_not_sure');

    expect(component.category).toBe('other_or_not_sure');
    expect(component.showTechnicalLogsCheckbox).toBe(true);
  });

  it('should update category when a different chip is selected', () => {
    createComponent();
    component.selectCategory('typo');
    expect(component.category).toBe('typo');

    component.selectCategory('other_or_not_sure');
    expect(component.category).toBe('other_or_not_sure');
  });

  it('should fail validation for empty feedback text', () => {
    createComponent();
    component.feedbackText = '';

    expect(component.isFormValid()).toBe(false);
    expect(component.formError).toBe(
      'Please add a description before submitting.'
    );
  });

  it('should fail validation for whitespace-only feedback', () => {
    createComponent();
    component.feedbackText = '   ';

    expect(component.isFormValid()).toBe(false);
    expect(component.formError).toBe(
      'Please add a description before submitting.'
    );
  });

  it('should fail validation when feedback exceeds max length', () => {
    createComponent();
    component.feedbackText = 'a'.repeat(
      component.MAX_REPORT_MESSAGE_LENGTH + 1
    );

    expect(component.isFormValid()).toBe(false);
    expect(component.formError).toContain('Please keep your feedback under');
  });

  it('should pass validation for valid feedback text', () => {
    createComponent();
    component.feedbackText = 'Valid feedback';

    expect(component.isFormValid()).toBe(true);
    expect(component.formError).toBeNull();
  });

  it('should pass validation for feedback at exactly the max length', () => {
    createComponent();
    component.feedbackText = 'a'.repeat(component.MAX_REPORT_MESSAGE_LENGTH);

    expect(component.isFormValid()).toBe(true);
    expect(component.formError).toBeNull();
  });

  it('should stage screenshot and show preview on success', fakeAsync(() => {
    const file = new File(['image'], 'screenshot.png', {type: 'image/png'});
    feedbackScreenshotStagingService.stageScreenshotAsync.and.returnValue(
      Promise.resolve({
        filename: 'screenshot.png',
        previewDataUrl: 'data:image/png;base64,image',
      })
    );

    createComponent();
    component.onScreenshotFileReceived(file);
    expect(component.isUploadingScreenshot).toBe(true);
    flushMicrotasks();

    expect(
      feedbackScreenshotStagingService.stageScreenshotAsync
    ).toHaveBeenCalledWith(file);
    expect(component.screenshotFilename).toBe('screenshot.png');
    expect(component.screenshotPreviewDataUrl).toBe(
      'data:image/png;base64,image'
    );
    expect(component.screenshotFileError).toBeNull();
    expect(component.isUploadingScreenshot).toBe(false);
  }));

  it('should set upload error and clear filename/preview when staging fails', fakeAsync(() => {
    const file = new File(['image'], 'screenshot.png', {type: 'image/png'});
    feedbackScreenshotStagingService.stageScreenshotAsync.and.returnValue(
      Promise.reject(new Error('Upload failed.'))
    );

    createComponent();
    component.onScreenshotFileReceived(file);
    flushMicrotasks();

    expect(component.screenshotFilename).toBeNull();
    expect(component.screenshotPreviewDataUrl).toBeNull();
    expect(component.screenshotFileError).toBe(
      'I18N_FEEDBACK_SCREENSHOT_UPLOAD_ERROR'
    );
    expect(component.isUploadingScreenshot).toBe(false);
  }));

  it('should clear an existing staged screenshot before staging a new one', fakeAsync(() => {
    const file = new File(['image'], 'new.png', {type: 'image/png'});
    feedbackScreenshotStagingService.stageScreenshotAsync.and.returnValue(
      Promise.resolve({
        filename: 'new.png',
        previewDataUrl: 'data:image/png;base64,new',
      })
    );

    createComponent();
    component.screenshotFilename = 'old.png';
    component.onScreenshotFileReceived(file);
    flushMicrotasks();

    expect(
      feedbackScreenshotStagingService.clearStagedScreenshot
    ).toHaveBeenCalledWith('old.png');
    expect(component.screenshotFilename).toBe('new.png');
  }));

  it('should clear all screenshot state and call clearStagedScreenshot', () => {
    createComponent();
    component.screenshotFilename = 'screenshot.png';
    component.screenshotPreviewDataUrl = 'data:image/png;base64,image';
    component.screenshotFileError = 'I18N_FEEDBACK_SCREENSHOT_UPLOAD_ERROR';

    component.removeScreenshot();

    expect(
      feedbackScreenshotStagingService.clearStagedScreenshot
    ).toHaveBeenCalledWith('screenshot.png');
    expect(component.screenshotFilename).toBeNull();
    expect(component.screenshotPreviewDataUrl).toBeNull();
    expect(component.screenshotFileError).toBeNull();
  });

  it('should not call clearStagedScreenshot when no screenshot is staged', () => {
    createComponent();
    component.removeScreenshot();

    expect(
      feedbackScreenshotStagingService.clearStagedScreenshot
    ).not.toHaveBeenCalled();
  });

  it('should not submit lesson feedback when form is invalid', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;
    component.feedbackText = '';

    const submitSpy = spyOn(
      feedbackBackendApiService,
      'submitLessonFeedbackAsync'
    );

    component.submit();
    tick();

    expect(submitSpy).not.toHaveBeenCalled();
  }));

  it('should not submit lesson issue when form is invalid', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.feedbackText = '';

    const submitSpy = spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    );

    component.submit();
    tick();

    expect(submitSpy).not.toHaveBeenCalled();
  }));

  it('should not submit site issue when form is invalid', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    component.feedbackText = '';

    const submitSpy = spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    );

    component.submit();
    tick();

    expect(submitSpy).not.toHaveBeenCalled();
  }));

  it('should call submitLessonFeedbackAsync with correct payload', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;
    component.feedbackText = 'Great lesson!';

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );

    const submitSpy = spyOn(
      feedbackBackendApiService,
      'submitLessonFeedbackAsync'
    ).and.returnValue(Promise.resolve());

    component.submit();
    tick();

    expect(submitSpy).toHaveBeenCalled();
  }));

  it('should close modal after successful lesson feedback submission', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;
    component.feedbackText = 'Great lesson!';

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );
    spyOn(
      feedbackBackendApiService,
      'submitLessonFeedbackAsync'
    ).and.returnValue(Promise.resolve());

    const closeSpy = spyOn(component, 'closeModal').and.callThrough();

    component.submit();
    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));

  it('should log error and not close modal when lesson feedback submission fails', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_FEEDBACK;
    component.feedbackText = 'Feedback';

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );
    spyOn(
      feedbackBackendApiService,
      'submitLessonFeedbackAsync'
    ).and.returnValue(Promise.reject(new Error('Backend failed')));

    const consoleSpy = spyOn(console, 'error');
    const closeSpy = spyOn(component, 'closeModal');

    component.submit();
    tick();

    expect(consoleSpy).toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  }));

  it('should call submitSiteAndLessonIssueReportAsync with session info when includeTechnicalLogs is true', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.feedbackText = 'Lesson issue report';
    component.includeTechnicalLogs = true;

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );
    feedbackSessionInfoService.getSessionInfo.calls.reset();

    const submitSpy = spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    component.submit();
    tick();

    expect(feedbackSessionInfoService.getSessionInfo).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalled();
  }));

  it('should not include session info when includeTechnicalLogs is false for lesson issue', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.feedbackText = 'Lesson issue';
    component.includeTechnicalLogs = false;

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );

    feedbackSessionInfoService.getSessionInfo.calls.reset();

    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    component.submit();
    tick();

    expect(feedbackSessionInfoService.getSessionInfo).not.toHaveBeenCalled();
  }));

  it('should close modal after successful lesson issue submission', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.feedbackText = 'Issue';

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );
    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    const closeSpy = spyOn(component, 'closeModal').and.callThrough();

    component.submit();
    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));

  it('should log error and not close modal when lesson issue submission fails', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.feedbackText = 'Issue';
    component.includeTechnicalLogs = false;

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(1);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );
    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.reject(new Error('Backend failed')));

    const consoleSpy = spyOn(console, 'error');
    const closeSpy = spyOn(component, 'closeModal');

    component.submit();
    tick();

    expect(consoleSpy).toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  }));

  it('should default exploration version to 0 when pageContextService returns null', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.feedbackText = 'Lesson issue';
    component.includeTechnicalLogs = false;

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(pageContextService, 'getExplorationVersion').and.returnValue(null);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Intro'
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(learnerAnswerInfoService, 'getCurrentAnswer').and.returnValue(
      'Answer'
    );
    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    expect(() => {
      component.submit();
      tick();
    }).not.toThrowError();
  }));

  it('should call submitSiteAndLessonIssueReportAsync for site issue', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    component.feedbackText = 'Site issue report';

    const submitSpy = spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    component.submit();
    tick();

    expect(submitSpy).toHaveBeenCalled();
  }));

  it('should include session info when includeTechnicalLogs is true for site issue', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    component.feedbackText = 'Site issue';
    component.includeTechnicalLogs = true;
    feedbackSessionInfoService.getSessionInfo.calls.reset();

    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    component.submit();
    tick();

    expect(feedbackSessionInfoService.getSessionInfo).toHaveBeenCalled();
  }));

  it('should not include session info when includeTechnicalLogs is false for site issue', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    component.feedbackText = 'Site issue';
    component.includeTechnicalLogs = false;
    feedbackSessionInfoService.getSessionInfo.calls.reset();
    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    component.submit();
    tick();

    expect(feedbackSessionInfoService.getSessionInfo).not.toHaveBeenCalled();
  }));

  it('should close modal after successful site issue submission', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    component.feedbackText = 'Site issue';

    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.resolve());

    const closeSpy = spyOn(component, 'closeModal').and.callThrough();

    component.submit();
    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));

  it('should log error and not close modal when site issue submission fails', fakeAsync(() => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.SITE_ISSUE;
    component.feedbackText = 'Site issue';
    component.includeTechnicalLogs = false;

    spyOn(
      feedbackBackendApiService,
      'submitSiteAndLessonIssueReportAsync'
    ).and.returnValue(Promise.reject(new Error('Backend failed')));

    const consoleSpy = spyOn(console, 'error');
    const closeSpy = spyOn(component, 'closeModal');

    component.submit();
    tick();

    expect(consoleSpy).toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  }));

  it('should reset all form fields and dismiss modal on closeModal', () => {
    createComponent();
    spyOn(activeModal, 'dismiss');

    component.screenshotFilename = 'screenshot.png';
    component.screenshotPreviewDataUrl = 'data:image/png;base64,image';
    component.feedbackText = 'Some text';
    component.category = 'typo';
    component.formError = 'Some error';
    component.includeTechnicalLogs = false;

    component.closeModal();

    expect(
      feedbackScreenshotStagingService.clearStagedScreenshot
    ).toHaveBeenCalledWith('screenshot.png');
    expect(activeModal.dismiss).toHaveBeenCalled();
    expect(component.screenshotFilename).toBeNull();
    expect(component.screenshotPreviewDataUrl).toBeNull();
    expect(component.feedbackText).toBe('');
    expect(component.category).toBeNull();
    expect(component.includeTechnicalLogs).toBe(true);
    expect(component.formError).toBeNull();
  });

  it('should expose correct default screenshot upload config', () => {
    createComponent();

    expect(component.allowedScreenshotImageFormats).toEqual([
      'png',
      'jpg',
      'jpeg',
    ]);
    expect(component.maxScreenshotSizeInKB).toBe(1024);
  });

  it('should expose correct MAX_REPORT_MESSAGE_LENGTH', () => {
    createComponent();

    expect(component.MAX_REPORT_MESSAGE_LENGTH).toBe(2500);
  });

  it('should initialize captcha for logged-out users', fakeAsync(() => {
    const captchaSpy = spyOn(
      FeedbackBackendApiService.prototype,
      'fetchCaptchaConfigAsync'
    ).and.returnValue(Promise.resolve({site_key: 'site-key'}));

    createComponent(FeedbackModalType.LESSON_ISSUE);

    flushMicrotasks();

    expect(component.isUserLoggedIn).toBe(false);
    expect(captchaSpy).toHaveBeenCalled();

    expect(insertScriptService.loadScript).toHaveBeenCalledWith(
      KNOWN_SCRIPTS.TURNSTILE,
      jasmine.any(Function)
    );

    const turnstile = windowRef.nativeWindow.turnstile;
    expect(turnstile).toBeDefined();

    if (turnstile) {
      expect(turnstile.render).toHaveBeenCalled();
    }

    expect(component.captchaToken).toBe('captcha-token');
  }));

  it('should not initialize captcha for logged-in users', fakeAsync(() => {
    userService.isLoggedIn = true;

    const captchaSpy = spyOn(
      FeedbackBackendApiService.prototype,
      'fetchCaptchaConfigAsync'
    ).and.returnValue(Promise.resolve({site_key: 'site-key'}));

    createComponent(FeedbackModalType.LESSON_ISSUE);

    flushMicrotasks();

    expect(component.isUserLoggedIn).toBe(true);
    expect(captchaSpy).not.toHaveBeenCalled();
    expect(insertScriptService.loadScript).not.toHaveBeenCalled();
  }));

  it('should initialize captcha when user info cannot be loaded', fakeAsync(() => {
    userService.shouldReject = true;

    const captchaSpy = spyOn(
      FeedbackBackendApiService.prototype,
      'fetchCaptchaConfigAsync'
    ).and.returnValue(Promise.resolve({site_key: 'site-key'}));

    createComponent(FeedbackModalType.LESSON_ISSUE);

    flushMicrotasks();

    expect(component.isUserLoggedIn).toBe(false);
    expect(captchaSpy).toHaveBeenCalled();
  }));

  it('should show an error when captcha config has no site key', fakeAsync(() => {
    spyOn(
      FeedbackBackendApiService.prototype,
      'fetchCaptchaConfigAsync'
    ).and.returnValue(Promise.resolve({site_key: null}));

    createComponent(FeedbackModalType.LESSON_ISSUE);

    flushMicrotasks();

    expect(component.captchaLoadError).toEqual(
      'Captcha is currently unavailable. Please Login to submit feedback.'
    );

    expect(insertScriptService.loadScript).not.toHaveBeenCalled();
  }));

  it('should show an error when captcha config fails to load', fakeAsync(() => {
    spyOn(
      FeedbackBackendApiService.prototype,
      'fetchCaptchaConfigAsync'
    ).and.returnValue(Promise.reject({error: 'Failed to load config.'}));

    createComponent(FeedbackModalType.LESSON_ISSUE);

    flushMicrotasks();

    expect(component.captchaLoadError).toEqual(
      'Captcha is currently unavailable, Please Login to submit feedback.'
    );

    expect(insertScriptService.loadScript).not.toHaveBeenCalled();
  }));

  it('should show an error when turnstile fails to load', fakeAsync(() => {
    windowRef.nativeWindow.turnstile = undefined;

    spyOn(
      FeedbackBackendApiService.prototype,
      'fetchCaptchaConfigAsync'
    ).and.returnValue(Promise.resolve({site_key: 'site-key'}));

    createComponent(FeedbackModalType.LESSON_ISSUE);

    flushMicrotasks();

    expect(component.captchaLoadError).toBe('Captcha failed to load.');
  }));

  it('should update captcha state from turnstile callbacks', fakeAsync(() => {
    const turnstile = windowRef.nativeWindow.turnstile;

    expect(turnstile).toBeDefined();

    if (!turnstile) {
      return;
    }

    turnstile.render.and.callFake(
      (
        _container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback': () => void;
          'expired-callback': () => void;
        }
      ) => {
        options.callback('captcha-token');
        options['expired-callback']();
        options['error-callback']();
        return 'widget-id';
      }
    );

    spyOn(
      FeedbackBackendApiService.prototype,
      'fetchCaptchaConfigAsync'
    ).and.returnValue(Promise.resolve({site_key: 'site-key'}));

    createComponent(FeedbackModalType.LESSON_ISSUE);

    flushMicrotasks();

    expect(component.captchaToken).toBe('');
    expect(component.captchaLoadError).toBe('Captcha failed to load.');
  }));

  it('should not render turnstile when captcha site key is missing', () => {
    createComponent();
    component.feedbackModalType = FeedbackModalType.LESSON_ISSUE;
    component.captchaSiteKey = null;
    component.renderTurnstile();

    const turnstile = windowRef.nativeWindow.turnstile;
    expect(turnstile).toBeDefined();

    if (turnstile) {
      expect(turnstile.render).not.toHaveBeenCalled();
    }
  });
});
