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
 * @fileoverview Service to check for the network & Internet connection.
 */

import {EventEmitter, Injectable, NgZone} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ServerConnectionBackendApiService} from './server-connection-backend-api.service';

@Injectable({
  providedIn: 'root',
})
export class InternetConnectivityService {
  private INTERNET_CONNECTIVITY_CHECK_INTERVAL_MILLISECS: number = 3500;
  private _internetAccessible: boolean = true;
  private _connectedToNetwork: boolean;

  private _connectionStateChangeEventEmitter = new EventEmitter<boolean>();

  private connectivityCheckIntervalId: ReturnType<typeof setInterval> | null =
    null;

  constructor(
    private windowRef: WindowRef,
    private _serverConnectionBackendApiService: ServerConnectionBackendApiService,
    private ngZone: NgZone
  ) {
    this._connectedToNetwork = this.windowRef.nativeWindow.navigator.onLine;
  }

  private _emitConnectionState(internetAccessible: boolean): void {
    this.ngZone.run(() => {
      this._connectionStateChangeEventEmitter.emit(internetAccessible);
    });
  }

  private _setInternetAccessible(internetAccessible: boolean): void {
    if (this._internetAccessible === internetAccessible) {
      return;
    }
    this._internetAccessible = internetAccessible;
    this._emitConnectionState(internetAccessible);
  }

  private async _checkInternetStateOnce(): Promise<void> {
    if (!this._connectedToNetwork) {
      this._setInternetAccessible(false);
      return;
    }
    try {
      await this._serverConnectionBackendApiService.fetchConnectionCheckResultAsync();
      this._setInternetAccessible(true);
    } catch {
      this._setInternetAccessible(false);
    }
  }

  private checkInternetState(): void {
    // This function is used to check Internet connection status.
    // It sends a periodic GET request to the server to check if the
    // browser has Internet access and emits the current state of the
    // connection.
    this.ngZone.runOutsideAngular(() => {
      if (this.connectivityCheckIntervalId) {
        clearInterval(this.connectivityCheckIntervalId);
      }
      this.connectivityCheckIntervalId = setInterval(() => {
        void this._checkInternetStateOnce();
      }, this.INTERNET_CONNECTIVITY_CHECK_INTERVAL_MILLISECS);
      void this._checkInternetStateOnce();
    });
  }

  private checkNetworkState(): void {
    // This function is used to check Network connection status.
    // It checks if the browser is connected to the network or not
    // and then emits the current state of the connection.
    this.windowRef.nativeWindow.ononline = () => {
      this._connectedToNetwork = true;
    };

    this.windowRef.nativeWindow.onoffline = () => {
      this._connectedToNetwork = false;
      this._setInternetAccessible(false);
    };
  }

  startCheckingConnection(): void {
    this.checkInternetState();
    this.checkNetworkState();
  }

  isOnline(): boolean {
    return this._internetAccessible;
  }

  /**
   * Monitor Network & Internet connection status by subscribing to this
   * observable.
   */
  get onInternetStateChange(): EventEmitter<boolean> {
    return this._connectionStateChangeEventEmitter;
  }
}
