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
 * @fileoverview Unit tests for FeedbackSessionInfoService.
 */

import {NavigationEnd, NavigationStart, Router} from '@angular/router';
import {TestBed} from '@angular/core/testing';
import {Subject} from 'rxjs';

import {FeedbackSessionInfoService} from 'services/feedback-session-info.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockRouter {
  private routerEventsSubject = new Subject<NavigationEnd | NavigationStart>();
  events = this.routerEventsSubject.asObservable();

  emitNavigationEnd(url: string, urlAfterRedirects: string): void {
    this.routerEventsSubject.next(new NavigationEnd(1, url, urlAfterRedirects));
  }

  emitNavigationStart(url: string): void {
    this.routerEventsSubject.next(new NavigationStart(1, url));
  }
}

class MockI18nLanguageCodeService {
  languageCode: string | null = 'fr';

  getCurrentI18nLanguageCode(): string | null {
    return this.languageCode;
  }
}

class MockWindowRef {
  errorSpy = jasmine.createSpy('error');
  warnSpy = jasmine.createSpy('warn');
  logSpy = jasmine.createSpy('log');
  infoSpy = jasmine.createSpy('info');
  debugSpy = jasmine.createSpy('debug');

  nativeWindow = {
    console: {
      error: this.errorSpy,
      warn: this.warnSpy,
      log: this.logSpy,
      info: this.infoSpy,
      debug: this.debugSpy,
    },
    navigator: {
      userAgent: 'Mock user agent',
    },
    innerWidth: 1024,
    innerHeight: 768,
    location: {
      href: 'https://www.example.com/lesson',
    },
    document: {
      title: 'Mock page title',
      documentElement: {
        dir: 'ltr',
      },
    },
  };
}

describe('FeedbackSessionInfoService', () => {
  let feedbackSessionInfoService: FeedbackSessionInfoService;
  let mockRouter: MockRouter;
  let mockWindowRef: MockWindowRef;
  let mockI18nLanguageCodeService: MockI18nLanguageCodeService;

  beforeEach(() => {
    Object.defineProperty(FeedbackSessionInfoService, 'consolePatched', {
      value: false,
      writable: true,
    });
    Object.defineProperty(FeedbackSessionInfoService, 'activeInstance', {
      value: null,
      writable: true,
    });
    mockRouter = new MockRouter();
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      providers: [
        FeedbackSessionInfoService,
        {
          provide: Router,
          useValue: mockRouter,
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService,
        },
      ],
    });

    feedbackSessionInfoService = TestBed.inject(FeedbackSessionInfoService);
    mockI18nLanguageCodeService = TestBed.inject(
      I18nLanguageCodeService
    ) as MockI18nLanguageCodeService;
  });

  it('should collect environment information in session info', () => {
    const sessionInfo = feedbackSessionInfoService.getSessionInfo();

    expect(sessionInfo.environment_json).toEqual({
      client_time_msecs: jasmine.any(Number),
      timezone_offset_mins: jasmine.any(Number),
      user_agent: 'Mock user agent',
      viewport: {
        width: 1024,
        height: 768,
      },
      page: {
        url: 'https://www.example.com/lesson',
        title: 'Mock page title',
      },
      locale: {
        language_code: 'fr',
        direction: 'ltr',
      },
    });
  });

  it('should fall back to English and record rtl page direction', () => {
    mockI18nLanguageCodeService.languageCode = null;
    mockWindowRef.nativeWindow.document.documentElement.dir = 'rtl';

    const sessionInfo = feedbackSessionInfoService.getSessionInfo();

    expect(sessionInfo.environment_json.locale).toEqual({
      language_code: 'en',
      direction: 'rtl',
    });
  });

  it('should return copies of recorded session info arrays', () => {
    feedbackSessionInfoService.recordConsoleError('Initial error');
    const sessionInfo = feedbackSessionInfoService.getSessionInfo();

    sessionInfo.console_logs_json.push({
      error_message: 'Mutated error',
      log_level: 'error',
      timestamp_msecs: 1,
    });

    expect(
      feedbackSessionInfoService.getSessionInfo().console_logs_json
    ).toEqual([
      {
        error_message: 'Initial error',
        log_level: 'error',
        stack_trace: undefined,
        timestamp_msecs: jasmine.any(Number),
      },
    ]);
  });

  it('should record console errors with default and explicit log levels', () => {
    feedbackSessionInfoService.recordConsoleError('Default error');
    feedbackSessionInfoService.recordConsoleError(
      'Warning message',
      'Warning stack',
      'warn'
    );

    expect(
      feedbackSessionInfoService.getSessionInfo().console_logs_json
    ).toEqual([
      {
        error_message: 'Default error',
        log_level: 'error',
        stack_trace: undefined,
        timestamp_msecs: jasmine.any(Number),
      },
      {
        error_message: 'Warning message',
        log_level: 'warn',
        stack_trace: 'Warning stack',
        timestamp_msecs: jasmine.any(Number),
      },
    ]);
  });

  it('should record console messages from patched console methods', () => {
    mockWindowRef.nativeWindow.console.error('Wrapped error');

    expect(mockWindowRef.errorSpy).toHaveBeenCalledWith('Wrapped error');
    expect(
      feedbackSessionInfoService.getSessionInfo().console_logs_json
    ).toEqual([
      {
        error_message: 'Wrapped error',
        log_level: 'error',
        stack_trace: undefined,
        timestamp_msecs: jasmine.any(Number),
      },
    ]);
  });

  it('should only patch console methods once', () => {
    const originalErrorMethod = mockWindowRef.nativeWindow.console.error;

    new FeedbackSessionInfoService(
      TestBed.inject(Router),
      TestBed.inject(WindowRef),
      TestBed.inject(I18nLanguageCodeService)
    );

    expect(mockWindowRef.nativeWindow.console.error).toBe(originalErrorMethod);
  });

  it('should stringify supported console message values', () => {
    const stackError = new Error('Stacked error');
    const messageOnlyError = new Error('Message only error');
    messageOnlyError.stack = undefined;
    const circularObject: {name: string; self?: object} = {
      name: 'circular',
    };
    circularObject.self = circularObject;
    const objectWithError = {
      error: stackError,
    };
    const valueWithUndefinedJson = {
      toJSON: () => undefined,
    };

    feedbackSessionInfoService.recordConsoleMessage('debug', [
      'text',
      5,
      true,
      null,
      undefined,
      stackError,
      messageOnlyError,
      circularObject,
      objectWithError,
      valueWithUndefinedJson,
      circularObject,
    ]);

    const consoleMessage =
      feedbackSessionInfoService.getSessionInfo().console_logs_json[0];
    expect(consoleMessage.log_level).toEqual('debug');
    expect(consoleMessage.stack_trace).toEqual(stackError.stack);
    expect(consoleMessage.error_message).toContain(
      'text 5 true null undefined'
    );
    expect(consoleMessage.error_message).toContain('Stacked error');
    expect(consoleMessage.error_message).toContain('Message only error');
    expect(consoleMessage.error_message).toContain(
      '{"name":"circular","self":"[Circular]"}'
    );
    expect(consoleMessage.error_message).toContain(
      '{"error":"Error: Stacked error'
    );
    expect(consoleMessage.error_message).toContain('[object Object]');
    expect(consoleMessage.error_message).toContain('[Circular]');
  });

  it('should cap console errors to the latest entries', () => {
    for (let i = 0; i < 26; i++) {
      feedbackSessionInfoService.recordConsoleError('Error ' + i);
    }

    const consoleErrors =
      feedbackSessionInfoService.getSessionInfo().console_logs_json;

    expect(consoleErrors.length).toEqual(25);
    expect(consoleErrors[0].error_message).toEqual('Error 1');
    expect(consoleErrors[24].error_message).toEqual('Error 25');
  });

  it('should record failed requests and cap them to the latest entries', () => {
    for (let i = 0; i < 26; i++) {
      feedbackSessionInfoService.recordFailedRequest(
        '/url-' + i,
        'POST',
        500,
        i,
        'Server Error',
        'Request failed'
      );
    }

    const failedRequests =
      feedbackSessionInfoService.getSessionInfo().failed_requests_json;

    expect(failedRequests.length).toEqual(25);
    expect(failedRequests[0]).toEqual({
      url: '/url-1',
      method: 'POST',
      status_code: 500,
      timestamp_msecs: 1,
      status_text: 'Server Error',
      error_message: 'Request failed',
    });
    expect(failedRequests[24].url).toEqual('/url-25');
  });

  it('should record only navigation end events and cap them', () => {
    mockRouter.emitNavigationStart('/ignored');
    for (let i = 0; i < 6; i++) {
      mockRouter.emitNavigationEnd('/url-' + i, '/redirected-url-' + i);
    }

    const navigationHistory =
      feedbackSessionInfoService.getSessionInfo().navigation_history_json;

    expect(navigationHistory.length).toEqual(5);
    expect(navigationHistory[0]).toEqual({
      path: '/redirected-url-1',
      timestamp_msecs: jasmine.any(Number),
    });
    expect(navigationHistory[4].path).toEqual('/redirected-url-5');
  });
});
