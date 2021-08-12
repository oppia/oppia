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
import { InternetConnectivityService } from 'services/internet-connectivity.service';
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
    },
    navigator: {
      onLine: true
    }
  };
}

describe('Connection Service', () => {
  let internetConnectivityService: InternetConnectivityService;
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
        InternetConnectivityService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }]
    });
    internetConnectivityService = TestBed.get(InternetConnectivityService);
    httpTestingController = TestBed.get(HttpTestingController);
  });
  beforeEach(() => {
    connectionStateSpy = jasmine.createSpy('stateChange');
    subscriptions = new Subscription();
    subscriptions.add(
      internetConnectivityService.onInternetStateChange.subscribe(
        connectionStateSpy
      ));
  });

  afterEach(() => {
    subscriptions.unsubscribe();
    httpTestingController.verify();
  });

  // Check whether the connection service is initialized correctly.
  it('should be initialized correctly', () => {
    expect(internetConnectivityService).toBeTruthy();
  });

  it('should report network status false when disconnected from network',
    () => {
      internetConnectivityService.startCheckingConnection();
      spyOn(internetConnectivityService, 'startCheckingConnection');
      mockWindowRef.nativeWindow.onoffline();
      expect(connectionStateSpy).toHaveBeenCalledWith(false);
    });

  it('should report internet status as online when internet is available',
    fakeAsync(() => {
      internetConnectivityService.startCheckingConnection();
      tick(100);
      discardPeriodicTasks();
      let req = httpTestingController.expectOne('/internetconnectivityhandler');
      expect(req.request.method).toEqual('GET');
      req.flush({
        isInternetConnected: true,
      });
      flushMicrotasks();
      var internetAccessible = internetConnectivityService.isOnline();
      expect(internetAccessible).toEqual(true);
    }));

  it('should report internet status as online when reconnected after offline',
    fakeAsync(() => {
      internetConnectivityService.startCheckingConnection();
      tick(100);
      let req = httpTestingController.expectOne('/internetconnectivityhandler');
      expect(req.request.method).toEqual('GET');
      req.flush({
        isInternetConnected: true,
      });
      flushMicrotasks();
      // Disconnecting window from the network.
      // eslint-disable-next-line dot-notation
      internetConnectivityService['_connectedToNetwork'] = false;
      // Delay timer to test for the network connection again after offline.
      tick(8000);
      // Connecting window to the network.
      mockWindowRef.nativeWindow.ononline();
      tick(3000);
      discardPeriodicTasks();
      let req2 = httpTestingController.expectOne(
        '/internetconnectivityhandler');
      expect(req2.request.method).toEqual('GET');
      req2.flush({
        isInternetConnected: true,
      });
      flushMicrotasks();
      expect(connectionStateSpy).toHaveBeenCalledWith(true);
    }));
});
