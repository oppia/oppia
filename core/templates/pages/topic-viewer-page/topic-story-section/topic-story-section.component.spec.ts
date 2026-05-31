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

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {UrlService} from 'services/contextual/url.service';
import {TopicFlowOrderingService} from '../services/topic-flow-ordering.service';
import {TopicStorySectionComponent} from './topic-story-section.component';

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;

  const createStoryNode = (): StoryNode =>
    StoryNode.createFromBackendDict({
      id: 'node_1',
      thumbnail_filename: 'thumbnail.png',
      title: 'Lesson 1',
      description: 'Description',
      prerequisite_skill_ids: [],
      acquired_skill_ids: ['skill_1'],
      destination_node_ids: [],
      outline: 'Outline',
      exploration_id: 'exp_1',
      outline_is_finalized: false,
      thumbnail_bg_color: '#F8BF74',
      status: 'Published',
      planned_publication_date_msecs: null,
      last_modified_msecs: null,
      first_publication_date_msecs: null,
      unpublishing_reason: null,
    });

  const createStoryNodeBackendDict = (node: StoryNode) => ({
    id: node.getId(),
    thumbnail_filename: node.getThumbnailFilename(),
    title: node.getTitle(),
    description: node.getDescription(),
    prerequisite_skill_ids: node.getPrerequisiteSkillIds(),
    acquired_skill_ids: node.getAcquiredSkillIds(),
    destination_node_ids: node.getDestinationNodeIds(),
    outline: node.getOutline(),
    exploration_id: node.getExplorationId(),
    outline_is_finalized: node.getOutlineStatus(),
    thumbnail_bg_color: node.getThumbnailBgColor(),
    status: node.getStatus(),
    planned_publication_date_msecs: node.getPlannedPublicationDateMsecs(),
    last_modified_msecs: node.getLastModifiedMsecs(),
    first_publication_date_msecs: node.getFirstPublicationDateMsecs(),
    unpublishing_reason: node.getUnpublishingReason(),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopicStorySectionComponent],
      providers: [
        TopicFlowOrderingService,
        {
          provide: UrlService,
          useValue: {
            getClassroomUrlFragmentFromLearnerUrl: () => 'math',
            getTopicUrlFragmentFromLearnerUrl: () => 'topic-frag',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;
  });

  it('should compute counts and hide non-matching nodes', () => {
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'story_1',
      title: 'Story title',
      node_titles: ['Lesson 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      description: 'Story description',
      story_is_published: true,
      completed_node_titles: [],
      url_fragment: 'story-url-fragment',
      all_node_dicts: [createStoryNodeBackendDict(createStoryNode())],
    });
    component.subtopics = [
      Subtopic.create(
        {
          id: 1,
          title: 'Practice 1',
          skill_ids: ['skill_1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          url_fragment: 'practice-1',
        },
        {
          skill_1: 'Skill 1',
        }
      ),
    ];

    component.ngOnInit();

    expect(component.lessonCount).toBe(1);
    expect(component.practiceCount).toBe(1);
    expect(component.visibleNodes.length).toBe(2);
    expect(component.shouldShowNode(component.nodes[0])).toBe(true);
  });
});
