// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for PlayerTopicNameService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {
  ReadOnlyTopic,
  ReadOnlyTopicBackendDict,
} from 'domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {PlayerTopicNameService} from './player-topic-name.service';

describe('PlayerTopicNameService', () => {
  let service: PlayerTopicNameService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let fetchSpy: jasmine.Spy;

  const createTopic = (topicName: string): ReadOnlyTopic =>
    ReadOnlyTopic.createFromBackendDict({
      subtopics: [],
      skill_descriptions: {},
      uncategorized_skill_ids: [],
      degrees_of_mastery: {},
      canonical_story_dicts: [],
      additional_story_dicts: [],
      topic_name: topicName,
      topic_id: 'topic1',
      topic_description: 'Description',
      practice_tab_is_displayed: false,
      meta_tag_content: 'content',
      page_title_fragment_for_web: 'title',
      classroom_name: 'math',
    } as ReadOnlyTopicBackendDict);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PlayerTopicNameService);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    fetchSpy = spyOn(
      topicViewerBackendApiService,
      'fetchTopicDataAsync'
    ).and.resolveTo(createTopic('Topic Name 1'));
  });

  it('should fetch the topic name from the backend', async () => {
    const topicName = await service.getTopicNameAsync('topic1', 'classroom1');

    expect(topicName).toBe('Topic Name 1');
    expect(fetchSpy).toHaveBeenCalledOnceWith('topic1', 'classroom1');
  });

  it('should share one backend request between concurrent callers', async () => {
    const [first, second] = await Promise.all([
      service.getTopicNameAsync('topic1', 'classroom1'),
      service.getTopicNameAsync('topic1', 'classroom1'),
    ]);

    expect(first).toBe('Topic Name 1');
    expect(second).toBe('Topic Name 1');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should reuse the result for later callers', async () => {
    await service.getTopicNameAsync('topic1', 'classroom1');
    const topicName = await service.getTopicNameAsync('topic1', 'classroom1');

    expect(topicName).toBe('Topic Name 1');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should fetch again for a different topic or classroom', async () => {
    fetchSpy.and.callFake(async (topicFragment: string) =>
      createTopic(`Name of ${topicFragment}`)
    );

    expect(await service.getTopicNameAsync('topic1', 'classroom1')).toBe(
      'Name of topic1'
    );
    expect(await service.getTopicNameAsync('topic2', 'classroom1')).toBe(
      'Name of topic2'
    );
    expect(await service.getTopicNameAsync('topic1', 'classroom2')).toBe(
      'Name of topic1'
    );
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('should reject when the backend request fails', async () => {
    fetchSpy.and.returnValue(Promise.reject(new Error('404')));

    await expectAsync(
      service.getTopicNameAsync('topic1', 'classroom1')
    ).toBeRejectedWithError('404');
  });

  it('should not cache a failed request, so that it can be retried', async () => {
    fetchSpy.and.returnValues(
      Promise.reject(new Error('404')),
      Promise.resolve(createTopic('Topic Name 1'))
    );

    await expectAsync(
      service.getTopicNameAsync('topic1', 'classroom1')
    ).toBeRejected();
    const topicName = await service.getTopicNameAsync('topic1', 'classroom1');

    expect(topicName).toBe('Topic Name 1');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
