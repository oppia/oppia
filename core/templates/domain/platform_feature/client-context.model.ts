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
 * @fileoverview Factory model for ClientContext.
 */

export interface ClientContextBackendDict {
  'platform_type': string;
  'browser_type': string;
}

/**
 * Represents the client side information that is used to evaluate the value
 * of feature flags. This is used only in the frontend feature value retrieval.
 */
export class ClientContext {
  readonly platformType: string;
  readonly browserType: string;

  constructor(platformType: string, browserType: string) {
    this.platformType = platformType;
    this.browserType = browserType;
  }

  static create(platformType: string, browserType: string): ClientContext {
    return new ClientContext(platformType, browserType);
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {ClientContextBackendDict} - The dict representation of the
   * instance.
   */
  toBackendDict(): ClientContextBackendDict {
    return {
      platform_type: this.platformType,
      browser_type: this.browserType,
    };
  }
}
