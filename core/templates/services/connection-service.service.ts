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
 * @fileoverview Service to check for the internet connection.
 */

import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { Subscription, timer, Observable } from 'rxjs';
import { delay, retryWhen, switchMap, tap } from 'rxjs/operators';
// eslint-disable-next-line oppia/disallow-httpclient
import { HttpClient } from '@angular/common/http';
import { downgradeInjectable } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';

/**
 * Instance of this interface is used to report current connection status.
 */
export interface ConnectionState {
  /**
   * "True" if browser has network connection. Determined by Window
   * objects "online" / "offline" events.
   */
  hasNetworkConnection: boolean;
  /**
   * "True" if browser has Internet access. Determined by heartbeat system
   * which periodically makes request to heartbeat Url.
   */
  hasInternetAccess: boolean;
}

export interface ConnectionCheckResponse {
  isInternetConnected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService implements OnDestroy {
  private INTERNET_CONNECTIVITY_CHECK_INTERVAL_MILLISECS: number = 4000;
  private MAX_MILLISECS_TO_WAIT_UNTIL_NEXT_CONNECTIVITY_CHECK: number = 7000;
  private checkConnectionUrl: string = '/connectivity/check';

  private _stateChangeEventEmitter = new EventEmitter<ConnectionState>();

  private currentState: ConnectionState = {
    hasInternetAccess: true,
    hasNetworkConnection: window.navigator.onLine
  };
  private httpSubscription: Subscription;


  constructor(
      private windowRef: WindowRef,
      private http: HttpClient) {
    this.httpSubscription = new Subscription();
  }


  get getStatus(): Observable<number | ConnectionCheckResponse> {
    return timer(
      0, this.INTERNET_CONNECTIVITY_CHECK_INTERVAL_MILLISECS)
      .pipe(
        switchMap(() => {
          if (this.currentState.hasNetworkConnection) {
            console.error('asd');
            return this.http.get<ConnectionCheckResponse>(
              this.checkConnectionUrl).toPromise();
          }
        }),
        retryWhen(errors => errors.pipe(
          tap(val => {
            this.currentState.hasInternetAccess = false;
            this.emitEvent();
          }),
          delay(this.MAX_MILLISECS_TO_WAIT_UNTIL_NEXT_CONNECTIVITY_CHECK)
        )
        )
      );
  }
  checkInternetState(): void {
    this.httpSubscription.add(this.getStatus.subscribe(result => {
      this.currentState.hasInternetAccess = true;
      this.emitEvent();
    }));
  }

  checkNetworkState(): void {
    this.windowRef.nativeWindow.ononline = () => {
      this.currentState.hasNetworkConnection = true;
      this.emitEvent();
    };

    this.windowRef.nativeWindow.onoffline = () => {
      this.currentState.hasNetworkConnection = false;
      this.currentState.hasInternetAccess = false;
      this.emitEvent();
    };
  }

  private emitEvent() {
    this._stateChangeEventEmitter.emit(this.currentState);
  }

  ngOnDestroy(): void {
    try {
      this.httpSubscription.unsubscribe();
    } catch (e) {
    }
  }

  /**
   * Monitor Network & Internet connection status by subscribing to this
   * observer.
   */
  get monitor(): EventEmitter<ConnectionState> {
    return this._stateChangeEventEmitter;
  }
}

angular.module('oppia').factory(
  'ConnectionService',
  downgradeInjectable(ConnectionService));
