// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * topic rights domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface ITopicRights {
  isPublished: () => boolean;
  canEditTopic: () => boolean;
  canPublishTopic: () => boolean;
}

export class TopicRights {
  _published: boolean;
  _canPublishTopic: boolean;
  _canEditTopic: boolean;

  constructor(
      published: boolean, canPublishTopic: boolean, canEditTopic: boolean) {
    this._published = published;
    this._canPublishTopic = canPublishTopic;
    this._canEditTopic = canEditTopic;
  }

  canEditTopic(): boolean {
    return this._canEditTopic;
  }
  isPublished(): boolean {
    return this._published;
  }
  canPublishTopic(): boolean {
    return this._canPublishTopic;
  }
  canEditName(): boolean {
    return this._canPublishTopic;
  }
  markTopicAsPublished(): void {
    if (this._canPublishTopic) {
      this._published = true;
    } else {
      throw new Error('User is not allowed to publish this topic.');
    }
  }
  markTopicAsUnpublished(): void {
    if (this._canPublishTopic) {
      this._published = false;
    } else {
      throw new Error('User is not allowed to unpublish this topic.');
    }
  }
  // Reassigns all values within this topic to match the existing
  // topic rights. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this topic rights.
  copyFromTopicRights(otherTopicRights: ITopicRights) {
    this._published = otherTopicRights.isPublished();
    this._canEditTopic = otherTopicRights.canEditTopic();
    this._canPublishTopic = otherTopicRights.canPublishTopic();
  }
}

@Injectable({
  providedIn: 'root'
})
export class TopicRightsObjectFactory {
  // This function takes a JSON object which represents a backend
  // topic python dict.
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'topicRightsBackendObject' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(topicRightsBackendObject: any) {
    return new TopicRights(
      topicRightsBackendObject.published,
      topicRightsBackendObject.can_publish_topic,
      topicRightsBackendObject.can_edit_topic
    );
  }

  // This creates an interstitial topic rights object which acts as a
  // placeholder until the actual topic rights object is fetched from
  // the backend. Since it is acting as a placeholder, it should be valid and
  // hence the most restrictive rights are given to the object.
  createInterstitialRights(): TopicRights {
    return new TopicRights(false, false, false);
  }
}

angular.module('oppia').factory(
  'TopicRightsObjectFactory',
  downgradeInjectable(TopicRightsObjectFactory));
