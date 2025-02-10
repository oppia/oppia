// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Error handler for frontend.
 */

// This infrastructure file needs to use HttpClient. The general rule restricts
// such imports to only be used in backend-api.service.ts files, but we cannot
// use these here because we are explicitly specifying the dependencies of a
// provider, which cannot be done using a injectable (service).
// eslint-disable-next-line oppia/disallow-httpclient
import {HttpClient} from '@angular/common/http';
import {ErrorHandler} from '@angular/core';
import {LoggerService} from 'services/contextual/logger.service';
import firebase from 'firebase/app';

export class AppErrorHandler extends ErrorHandler {
  // AngularFire throws duplicate errors because it uses setTimeout() to manage
  // promises internally. Errors thrown from those setTimeout() calls are not
  // accessible to our code. Because of this, even though LoginPageComponent
  // catches errors thrown by AngularFire, their duplicates are treated as
  // "Unhandled Promise Rejections" and result in top-level error messages.
  //
  // To prevent these errors from interfering with end-to-end tests and from
  // polluting the server, we ignore the following list of EXPECTED error codes.
  private static readonly EXPECTED_ERROR_CODES = [
    // Users pending deletion have their Firebase accounts disabled. When they
    // try to sign in anyway, we redirect them to the /pending-account-deletion
    // page.
    'auth/user-disabled',
    // In emulator mode we use signInWithEmailAndPassword() and, if that throws
    // an 'auth/user-not-found' error, createUserWithEmailAndPassword() for
    // convenience. In production mode we use signInWithRedirect(), which
    // doesn't throw 'auth/user-not-found' because it handles both signing in
    // and creating users in the same way.
    'auth/user-not-found',
  ];

  private readonly UNHANDLED_REJECTION_STATUS_CODE_REGEX =
    /Possibly unhandled rejection: {.*"status":-1/;

  MIN_TIME_BETWEEN_ERRORS_MSEC = 5000;
  timeOfLastPostedError: number =
    Date.now() - this.MIN_TIME_BETWEEN_ERRORS_MSEC;

  constructor(
    private http: HttpClient,
    private loggerService: LoggerService
  ) {
    super();
  }

  handleError(error: Error): void {
    if (
      AppErrorHandler.EXPECTED_ERROR_CODES.includes(
        // The firebase.auth.Error is not compatible with javascript's Error type.
        // That's why explicit type conversion is used here.
        (error as unknown as firebase.auth.Error).code
      )
    ) {
      return;
    }

    // Suppress unhandled rejection errors status code -1, because -1 is the
    // status code for aborted requests.
    if (this.UNHANDLED_REJECTION_STATUS_CODE_REGEX.test(error.message)) {
      return;
    }

    let errorType = Object.prototype.toString.call(error);
    if (
      errorType !== '[object Error]' &&
      errorType !== '[object DOMException]' &&
      !(errorType instanceof Error)
    ) {
      // The error passed to this handler in some cases does not provide
      // a meaningful stack trace of the exception. Different browsers set
      // this value at different times. To ensure that the stack property is
      // populated we use try/catch.
      // see: https://web.archive.org/web/20140210004225/http://msdn.microsoft.com/en-us/library/windows/apps/hh699850.aspx
      try {
        throw new Error(`${error}`);
      } catch (errorInstance) {
        error = errorInstance;
      }
    }

    let messageAndStackTrace = [
      '',
      error.message,
      '',
      '    at URL: ' + window.location.href,
    ].join('\n');
    let timeDifference = Date.now() - this.timeOfLastPostedError;
    // To prevent an overdose of errors, throttle to at most 1 error
    // every MIN_TIME_BETWEEN_ERRORS_MSEC.
    if (timeDifference > this.MIN_TIME_BETWEEN_ERRORS_MSEC) {
      this.http
        .post('/frontend_errors', {
          error: messageAndStackTrace,
        })
        .toPromise()
        .then(
          () => {
            this.timeOfLastPostedError = Date.now();
          },
          () => {
            this.loggerService.warn('Error logging failed.');
          }
        );
    }

    this.loggerService.error(error.message);

    super.handleError(error);
  }
}

export const AppErrorHandlerProvider = {
  provide: ErrorHandler,
  useClass: AppErrorHandler,
  deps: [HttpClient, LoggerService],
};
