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
 * @fileoverview Unit tests for ClientContext.
 */

import { ClientContext } from
  'domain/platform_feature/client-context.model';

describe('Client Context Model', () => {
  it('should create an instance.', () => {
    const context = ClientContext.create('Web', 'Chrome');

    expect(context.platformType).toEqual('Web');
    expect(context.browserType).toEqual('Chrome');
  });

  it('should convert an instance to a dict.', () => {
    const context = ClientContext.create('Web', 'Chrome');

    expect(context.toBackendDict()).toEqual({
      platform_type: 'Web',
      browser_type: 'Chrome',
    });
  });
});
