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
 * @fileoverview Unit tests for the Connection Service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConnectionService } from 'services/connection-service.service';
import { Subscription } from 'rxjs';
import { WindowRef } from 'services/contextual/window-ref.service';
import { discardPeriodicTasks, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

class MockWindowRef {
  nativeWindow = {
    ononline() {
      return;
    },
    onoffline() {
      return;
    }
  };
}

describe('Connection Service', () => {
  let connectionService: ConnectionService;
  let subscriptions: Subscription;
  let httpTestingController: HttpTestingController;
  let connectionStateSpy: jasmine.Spy;
  let mockWindowRef: MockWindowRef;
  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        ConnectionService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }]
    });
    connectionService = TestBed.get(ConnectionService);
    httpTestingController = TestBed.get(HttpTestingController);
  });
  beforeEach(() => {
    connectionStateSpy = jasmine.createSpy('stateChange');
    subscriptions = new Subscription();
    subscriptions.add(connectionService.onInternetStateChange.subscribe(
      connectionStateSpy
    ));
  });

  afterEach(() => {
    subscriptions.unsubscribe();
    httpTestingController.verify();
  });

  // Check whether the connection service is initialized correctly.
  it('should be initialized correctly', () => {
    expect(connectionService).toBeTruthy();
  });

  it('should return connection state when offline', () => {
    connectionService.checkNetworkState();
    spyOn(connectionService, 'checkNetworkState');
    mockWindowRef.nativeWindow.onoffline();
    expect(connectionStateSpy).toHaveBeenCalledWith({
      hasNetworkConnection: false,
      hasInternetAccess: false
    });
  });

  it('should return connection state when online', () => {
    connectionService.checkNetworkState();
    spyOn(connectionService, 'checkNetworkState');
    mockWindowRef.nativeWindow.ononline();
    expect(connectionStateSpy).toHaveBeenCalledWith({
      hasNetworkConnection: true,
      hasInternetAccess: true
    });
  });

  it('should send connectivity request', fakeAsync(() => {
    connectionService.checkInternetState();
    tick(100);
    discardPeriodicTasks();
    let req = httpTestingController.expectOne('/connectivity/check');
    expect(req.request.method).toEqual('GET');
    req.flush({
      isInternetConnected: true,
    });
    flushMicrotasks();
    expect(connectionStateSpy).toHaveBeenCalledWith({
      hasNetworkConnection: true,
      hasInternetAccess: true
    });
  }));

  it('should not send connectivity request', fakeAsync(() => {
    connectionService.checkInternetState();
    connectionService.checkNetworkState();
    tick(100);
    let req = httpTestingController.expectOne('/connectivity/check');
    expect(req.request.method).toEqual('GET');
    req.flush({
      isInternetConnected: true,
    });
    flushMicrotasks();
    mockWindowRef.nativeWindow.onoffline();
    tick(5000);
    mockWindowRef.nativeWindow.ononline();
    tick(8000);
    discardPeriodicTasks();
    let req2 = httpTestingController.expectOne('/connectivity/check');
    expect(req2.request.method).toEqual('GET');
    req2.flush({
      isInternetConnected: true,
    });
    flushMicrotasks();
    expect(connectionStateSpy).toHaveBeenCalledWith({
      hasNetworkConnection: true,
      hasInternetAccess: true
    });
  }));
});
