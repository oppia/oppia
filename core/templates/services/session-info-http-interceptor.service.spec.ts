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
 * @fileoverview Unit tests for SessionInfoHttpInterceptorService.
 */

// eslint-disable-next-line oppia/disallow-httpclient
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {Observable, of, throwError} from 'rxjs';

import {FeedbackSessionInfoService} from 'services/feedback-session-info.service';
import {SessionInfoHttpInterceptorService} from 'services/session-info-http-interceptor.service';

class MockFeedbackSessionInfoService {
  recordFailedRequest(
    url: string,
    method: string,
    statusCode: number,
    timestampMsecs: number,
    statusText?: string,
    errorMessage?: string
  ): void {}
}

class SuccessHttpHandler implements HttpHandler {
  handle(): Observable<HttpResponse<object>> {
    return of(new HttpResponse({status: 200}));
  }
}

class ErrorHttpHandler implements HttpHandler {
  handle(): Observable<HttpResponse<object>> {
    return throwError(
      new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        url: '/test',
        error: {message: 'Backend failed'},
      })
    );
  }
}

class NetworkErrorHttpHandler implements HttpHandler {
  handle(): Observable<HttpResponse<object>> {
    return throwError(
      new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown Error',
        url: '/network-test',
        error: {message: 'Network failed'},
      })
    );
  }
}

describe('SessionInfoHttpInterceptorService', () => {
  let interceptorService: SessionInfoHttpInterceptorService;
  let feedbackSessionInfoService: MockFeedbackSessionInfoService;
  let recordFailedRequestSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FeedbackSessionInfoService,
          useClass: MockFeedbackSessionInfoService,
        },
        SessionInfoHttpInterceptorService,
      ],
    });

    interceptorService = TestBed.inject(SessionInfoHttpInterceptorService);
    feedbackSessionInfoService = TestBed.inject(
      FeedbackSessionInfoService
    ) as MockFeedbackSessionInfoService;
    recordFailedRequestSpy = spyOn(
      feedbackSessionInfoService,
      'recordFailedRequest'
    );
  });

  it('should pass successful requests without recording errors', done => {
    const request = new HttpRequest<object>('GET', '/test', {
      headers: new HttpHeaders(),
    });

    interceptorService.intercept(request, new SuccessHttpHandler()).subscribe({
      next: (event: HttpEvent<object>) => {
        expect(event).toEqual(new HttpResponse({status: 200}));
        expect(recordFailedRequestSpy).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should record failed requests', done => {
    const request = new HttpRequest<object>('GET', '/test', {
      headers: new HttpHeaders(),
    });

    interceptorService.intercept(request, new ErrorHttpHandler()).subscribe({
      error: () => {
        expect(recordFailedRequestSpy).toHaveBeenCalledWith(
          '/test',
          'GET',
          500,
          jasmine.any(Number),
          'Server Error',
          jasmine.stringContaining('500')
        );
        done();
      },
    });
  });

  it('should record network failures with status 0', done => {
    const request = new HttpRequest<object>('GET', '/network-test', {
      headers: new HttpHeaders(),
    });

    interceptorService
      .intercept(request, new NetworkErrorHttpHandler())
      .subscribe({
        error: () => {
          expect(recordFailedRequestSpy).toHaveBeenCalledWith(
            '/network-test',
            'GET',
            0,
            jasmine.any(Number),
            'Unknown Error',
            jasmine.stringContaining('0')
          );
          done();
        },
      });
  });

  it('should not record non-http errors without a failing status', done => {
    const request = new HttpRequest<object>('GET', '/plain-error', {
      headers: new HttpHeaders(),
    });

    const handler: HttpHandler = {
      handle: () => throwError(new Error('plain error')),
    };

    interceptorService.intercept(request, handler).subscribe({
      error: () => {
        expect(recordFailedRequestSpy).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
