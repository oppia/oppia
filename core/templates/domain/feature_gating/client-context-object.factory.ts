// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating ClientContext domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface ClientContextBackendDict {
  'client_type': string;
  'browser_type': string;
  'app_version'?: string;
  'user_locale': string;
}

/**
 * Represents the client side information that is used to evaluate the
 * value of feature flags.
 */
export class ClientContext {
  readonly clientType: string;
  readonly browserType: string;
  readonly appVersion: string;
  readonly userLocale: string;

  constructor(
      clientType: string, browserType: string, appVersion: string,
      userLocale: string) {
    this.clientType = clientType;
    this.browserType = browserType;
    this.appVersion = appVersion;
    this.userLocale = userLocale;
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {ClientContextBackendDict} - The dict representation of the
   * instance.
   */
  toBackendDict(): ClientContextBackendDict {
    return {
      client_type: this.clientType,
      browser_type: this.browserType,
      app_version: this.appVersion,
      user_locale: this.userLocale,
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClientContextObjectFactory {
  create(
      clientType: string, browserType: string, appVersion: string,
      userLocale: string): ClientContext {
    return new ClientContext(clientType, browserType, appVersion, userLocale);
  }
}

angular.module('oppia').factory(
  'ClientContextObjectFactory',
  downgradeInjectable(ClientContextObjectFactory));
