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
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ConnectionService, ConnectionState } from 'services/connection-service.service';
import { Subscription } from 'rxjs';


describe('Connection Service', () => {
  let connectionService: ConnectionService;
  let subscriptions: Subscription;
  let httpTestingController: HttpTestingController;
  let connectionState: ConnectionState;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [ConnectionService]
    });
    connectionService = TestBed.get(ConnectionService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  beforeEach(() => {
    spyOnProperty(Navigator.prototype, 'onLine').and.returnValue(true);
    connectionService.checkInternetState();
    connectionService.checkNetworkState();
    subscriptions = new Subscription();
    subscriptions.add(connectionService.monitor.subscribe(
      currentState => connectionState = currentState
    ));
  });
  afterEach(() => {
    subscriptions.unsubscribe();
  });
  // Check whether the connection service is initialized correctly.
  it('should be initialized correctly', () => {
    expect(connectionService).toBeTruthy();
  });

  // Check whether the connection service is able to make a request.
  it('should be able to make a request', fakeAsync(() => {
    let req = httpTestingController.expectOne(
      '/connectivity/check');
    expect(req.request.method).toEqual('GET');
    req.flush({
      isInternetConnected: true
    });
    flushMicrotasks();
    expect(connectionState.hasInternetAccess).toBe(true);
    expect(connectionState.hasNetworkConnection).toBe(true);
  }));
});
