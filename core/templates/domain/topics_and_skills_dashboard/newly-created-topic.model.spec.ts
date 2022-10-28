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
 * @fileoverview Unit tests for NewlyCreatedTopic model.
 */

import { NewlyCreatedTopic } from
  'domain/topics_and_skills_dashboard/newly-created-topic.model';

describe('Newly Created Topic Model', () => {
  let topic: NewlyCreatedTopic;

  beforeEach(() => {
    topic = NewlyCreatedTopic.createDefault();
  });

  it('should create a new default topic for the topics dashboard', () => {
    expect(topic.description).toEqual('');
    expect(topic.name).toEqual('');
    expect(topic.pageTitleFragment).toEqual('');
  });

  it('should validate the new topic fields', () => {
    expect(topic.isValid()).toBeFalse();

    topic.description = '';
    expect(topic.isValid()).toBeFalse();

    topic.pageTitleFragment = '';
    expect(topic.isValid()).toBeFalse();

    topic.description = 'Topic description';
    expect(topic.isValid()).toBeFalse();

    topic.urlFragment = 'url-fragment';
    expect(topic.isValid()).toBeFalse();

    topic.pageTitleFragment = 'testing';
    expect(topic.isValid()).toBeFalse();

    topic.name = 'TopicName1';
    expect(topic.isValid()).toBe(true);

    // eslint-disable-next-line max-len
    topic.pageTitleFragment = (
      'testatestatestatestatestatestatestatestatestatestatestatesta'
    );
    expect(topic.isValid()).toBeFalse();
  });
});
