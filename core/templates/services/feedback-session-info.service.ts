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
 * @fileoverview Service for collecting feedback-session metadata.
 */

import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {FeedbackSessionInfo} from 'domain/feedback/feedback.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {filter} from 'rxjs/operators';

type ConsoleLogLevel = 'error' | 'warn' | 'log' | 'info' | 'debug';
type ConsoleLogValue = string | number | boolean | object | null | undefined;
type WindowWithConsole = Window & {console: Console};

@Injectable({
  providedIn: 'root',
})
export class FeedbackSessionInfoService {
  private static readonly MAX_CONSOLE_ERRORS = 25;
  private static readonly MAX_FAILED_REQUESTS = 25;
  private static readonly MAX_NAVIGATION_ENTRIES = 5;
  private static consolePatched = false;
  private static activeInstance: FeedbackSessionInfoService | null = null;
  private recentConsoleErrors: FeedbackSessionInfo['console_logs_json'] = [];
  private recentFailedRequests: FeedbackSessionInfo['failed_requests_json'] =
    [];
  private recentNavigationHistory: FeedbackSessionInfo['navigation_history_json'] =
    [];

  constructor(
    private router: Router,
    private windowRef: WindowRef,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {
    FeedbackSessionInfoService.activeInstance = this;
    this.patchConsoleMethods();
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.pushNavigationEntry({
          path: event.urlAfterRedirects,
          timestamp_msecs: Date.now(),
        });
      });
  }

  private patchConsoleMethods(): void {
    if (FeedbackSessionInfoService.consolePatched) {
      return;
    }

    const nativeConsole = (this.windowRef.nativeWindow as WindowWithConsole)
      .console;
    this.wrapConsoleMethod(nativeConsole, 'error');
    this.wrapConsoleMethod(nativeConsole, 'warn');
    this.wrapConsoleMethod(nativeConsole, 'log');
    this.wrapConsoleMethod(nativeConsole, 'info');
    this.wrapConsoleMethod(nativeConsole, 'debug');
    FeedbackSessionInfoService.consolePatched = true;
  }

  private wrapConsoleMethod(
    nativeConsole: Console,
    logLevel: ConsoleLogLevel
  ): void {
    const originalMethod = nativeConsole[logLevel].bind(nativeConsole) as (
      ...args: ConsoleLogValue[]
    ) => void;

    nativeConsole[logLevel] = (...args: ConsoleLogValue[]): void => {
      FeedbackSessionInfoService.activeInstance?.recordConsoleMessage(
        logLevel,
        args
      );
      originalMethod(...args);
    };
  }

  private stringifyConsoleValue(
    value: ConsoleLogValue,
    seenObjects: Set<object>
  ): string {
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value instanceof Error) {
      return value.stack ?? value.message;
    }
    if (typeof value === 'object') {
      if (seenObjects.has(value)) {
        return '[Circular]';
      }
      const stringifiedObject = JSON.stringify(value, (_key, nestedValue) => {
        if (typeof nestedValue === 'object' && nestedValue !== null) {
          if (seenObjects.has(nestedValue)) {
            return '[Circular]';
          }
          seenObjects.add(nestedValue);
        }
        if (nestedValue instanceof Error) {
          return nestedValue.stack ?? nestedValue.message;
        }
        return nestedValue;
      });
      if (stringifiedObject !== undefined) {
        return stringifiedObject;
      }
    }
    return String(value);
  }

  private buildConsoleSummary(args: ConsoleLogValue[]): string {
    const seenObjects = new Set<object>();
    return args
      .map(arg => this.stringifyConsoleValue(arg, seenObjects))
      .join(' ');
  }

  private pushNavigationEntry(
    entry: FeedbackSessionInfo['navigation_history_json'][number]
  ): void {
    this.recentNavigationHistory.push(entry);
    if (
      this.recentNavigationHistory.length >
      FeedbackSessionInfoService.MAX_NAVIGATION_ENTRIES
    ) {
      this.recentNavigationHistory.shift();
    }
  }

  private pushConsoleLog(
    entry: FeedbackSessionInfo['console_logs_json'][number]
  ): void {
    this.recentConsoleErrors.push(entry);
    if (
      this.recentConsoleErrors.length >
      FeedbackSessionInfoService.MAX_CONSOLE_ERRORS
    ) {
      this.recentConsoleErrors.shift();
    }
  }

  private pushFailedRequest(
    entry: FeedbackSessionInfo['failed_requests_json'][number]
  ): void {
    this.recentFailedRequests.push(entry);
    if (
      this.recentFailedRequests.length >
      FeedbackSessionInfoService.MAX_FAILED_REQUESTS
    ) {
      this.recentFailedRequests.shift();
    }
  }

  recordConsoleError(
    errorMessage: string,
    stackTrace?: string,
    logLevel: ConsoleLogLevel = 'error'
  ): void {
    this.pushConsoleLog({
      error_message: errorMessage,
      log_level: logLevel,
      stack_trace: stackTrace,
      timestamp_msecs: Date.now(),
    });
  }

  recordConsoleMessage(
    logLevel: ConsoleLogLevel,
    args: ConsoleLogValue[]
  ): void {
    const errorEntry = args.find(arg => arg instanceof Error) as
      | Error
      | undefined;
    const summary = this.buildConsoleSummary(args);
    this.pushConsoleLog({
      error_message: summary,
      log_level: logLevel,
      stack_trace: errorEntry?.stack,
      timestamp_msecs: Date.now(),
    });
  }

  recordFailedRequest(
    url: string,
    method: string,
    statusCode: number,
    timestampMsecs: number,
    statusText?: string,
    errorMessage?: string
  ): void {
    this.pushFailedRequest({
      url: url,
      method: method,
      status_code: statusCode,
      timestamp_msecs: timestampMsecs,
      status_text: statusText,
      error_message: errorMessage,
    });
  }

  getSessionInfo(): FeedbackSessionInfo {
    const window = this.windowRef.nativeWindow;
    const languageCode =
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode() || 'en';
    const environmentInfo = {
      client_time_msecs: Date.now(),
      timezone_offset_mins: new Date().getTimezoneOffset(),
      user_agent: window.navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      page: {
        url: window.location.href,
        title: window.document.title,
      },
      locale: {
        language_code: languageCode,
        direction:
          window.document?.documentElement?.dir === 'rtl' ? 'rtl' : 'ltr',
      } as const,
    };
    return {
      console_logs_json: [...this.recentConsoleErrors],
      failed_requests_json: [...this.recentFailedRequests],
      navigation_history_json: [...this.recentNavigationHistory],
      environment_json: environmentInfo,
    };
  }
}
