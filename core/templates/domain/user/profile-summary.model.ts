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
 * @fileoverview Frontend model for subscriber summary.
 */

export interface SubscriberSummaryBackendDict {
  'subscriber_picture_data_url': string;
  'subscriber_username': string;
  'subscriber_impact': number;
}

export interface CreatorSummaryBackendDict {
  'creator_picture_data_url': string;
  'creator_username': string;
  'creator_impact': number;
}

export class ProfileSummary {
  constructor(
    public pictureDataUrl: string,
    public username: string,
    public impact: number) { }

  static createFromSubscriberBackendDict(
      sumamryBackendDict: SubscriberSummaryBackendDict): ProfileSummary {
    return new ProfileSummary(
      sumamryBackendDict.subscriber_picture_data_url,
      sumamryBackendDict.subscriber_username,
      sumamryBackendDict.subscriber_impact);
  }

  static createFromCreatorBackendDict(
      sumamryBackendDict: CreatorSummaryBackendDict): ProfileSummary {
    return new ProfileSummary(
      sumamryBackendDict.creator_picture_data_url,
      sumamryBackendDict.creator_username,
      sumamryBackendDict.creator_impact);
  }
}
