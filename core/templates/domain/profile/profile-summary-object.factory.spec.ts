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
 * @fileoverview Unit tests for Subscriber Summary Object Factory.
 */

import { ProfileSummaryObjectFactory } from
  'domain/profile/profile-summary-object.factory';

describe('Subscriber Summary object factory', () => {
  let psof: ProfileSummaryObjectFactory;

  beforeEach(() => {
    psof = new ProfileSummaryObjectFactory();
  });

  it('should correctly convert subscriber backend dict to object', () => {
    let backendDict = {
      subscriber_picture_data_url: 'path/to/img',
      subscriber_username: 'username',
      subscriber_impact: 0,
    };

    let subscriberObject = psof.createFromSubscriberBackendDict(backendDict);

    expect(subscriberObject.pictureDataUrl).toEqual('path/to/img');
    expect(subscriberObject.username).toEqual('username');
    expect(subscriberObject.impact).toEqual(0);
  });

  it('should correctly convert creator backend dict to object', () => {
    let backendDict = {
      creator_picture_data_url: 'path/to/img',
      creator_username: 'username',
      creator_impact: 0,
    };

    let creatorObject = psof.createFromCreatorBackendDict(backendDict);

    expect(creatorObject.pictureDataUrl).toEqual('path/to/img');
    expect(creatorObject.username).toEqual('username');
    expect(creatorObject.impact).toEqual(0);
  });
});
