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
 * @fileoverview Service to check for the network & internet connection.
 */

import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { delay, retryWhen, switchMap, tap } from 'rxjs/operators';
// eslint-disable-next-line oppia/disallow-httpclient
import { HttpClient } from '@angular/common/http';
import { downgradeInjectable } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';

/**
 * Instance of this interface is used to report current connection status.
 */
export interface ConnectionState {
  // "True" if browser has network connection. Determined by Window
  // objects "online" / "offline" events.
  hasNetworkConnection: boolean;
  // "True" if browser has Internet access. Determined by sending
  // periodically GET requests to the server.
  hasInternetAccess: boolean;
}

export interface ConnectionCheckResponse {
  isInternetConnected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private INTERNET_CONNECTIVITY_CHECK_INTERVAL_MILLISECS: number = 3500;
  private MAX_MILLISECS_TO_WAIT_UNTIL_NEXT_CONNECTIVITY_CHECK: number = 7000;
  private checkConnectionUrl: string = '/connectivity/check';

  private _connectionStateChangeEventEmitter = (
    new EventEmitter<ConnectionState>());

  private currentState: ConnectionState = {
    hasInternetAccess: true,
    hasNetworkConnection: window.navigator.onLine
  };
  private httpSubscription: Subscription;


  constructor(
      private windowRef: WindowRef,
      private http: HttpClient,
      private ngZone: NgZone) {
    this.httpSubscription = new Subscription();
  }

  checkInternetState(): void {
    // This function is used to check Internet connection status.
    // It sends a periodic GET request to the server to check if the
    // browser has Internet access and emits the current state of the
    // connection.
    this.ngZone.runOutsideAngular(() => {
      this.httpSubscription.add(timer(
        0, this.INTERNET_CONNECTIVITY_CHECK_INTERVAL_MILLISECS)
        .pipe(
          switchMap(() => {
            if (this.currentState.hasNetworkConnection) {
              return this.http.get<ConnectionCheckResponse>(
                this.checkConnectionUrl).toPromise();
            }
          }),
          retryWhen(errors => errors.pipe(
            tap(val => {
              this.currentState.hasInternetAccess = false;
              this._connectionStateChangeEventEmitter.emit(this.currentState);
            }),
            delay(this.MAX_MILLISECS_TO_WAIT_UNTIL_NEXT_CONNECTIVITY_CHECK)
          )
          )
        ).subscribe(result => {
          this.currentState.hasInternetAccess = true;
          this._connectionStateChangeEventEmitter.emit(this.currentState);
        }));
    });
  }

  checkNetworkState(): void {
    // This function is used to check Network connection status.
    // It checks if the browser is connected to the network or not
    // and then emits the current state of the connection.
    this.windowRef.nativeWindow.ononline = () => {
      this.currentState.hasNetworkConnection = true;
      this._connectionStateChangeEventEmitter.emit(this.currentState);
    };

    this.windowRef.nativeWindow.onoffline = () => {
      this.currentState.hasNetworkConnection = false;
      this.currentState.hasInternetAccess = false;
      this._connectionStateChangeEventEmitter.emit(this.currentState);
    };
  }

  /**
   * Monitor Network & Internet connection status by subscribing to this
   * observable.
   */
  get onInternetStateChange(): EventEmitter<ConnectionState> {
    return this._connectionStateChangeEventEmitter;
  }
}

angular.module('oppia').factory(
  'ConnectionService',
  downgradeInjectable(ConnectionService));
