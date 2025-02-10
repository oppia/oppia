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
 * @fileoverview Unit tests for LearnerStorySummaryTileComponent.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LearnerStorySummaryTileComponent} from './learner-story-summary-tile.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

describe('Learner Story Summary Tile Component', () => {
  let component: LearnerStorySummaryTileComponent;
  let fixture: ComponentFixture<LearnerStorySummaryTileComponent>;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [LearnerStorySummaryTileComponent],
      providers: [UrlInterpolationService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerStorySummaryTileComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    const sampleStorySummaryBackendDict = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Chapter 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story-title',
      all_node_dicts: [],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };
    component.storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict
    );
    fixture.detectChanges();
  });

  it('should get the story link url for story page', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'interpolateUrl'
    ).and.returnValue('/learn/math/topic/story/story-title');

    component.getStoryLink();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get the next incomplete node title on init', () => {
    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Chapter 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
    };
    const sampleStorySummaryBackendDict = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Chapter 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: [],
      url_fragment: 'story-title',
      all_node_dicts: [nodeDict],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };
    component.storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict
    );
    component.ngOnInit();
    expect(component.nextIncompleteNodeTitle).toEqual('Chapter 1: Chapter 1');
  });

  it('should make the tile blurred if it is hovered', () => {
    component.cardIsHovered = true;
    component.displayArea = 'homeTab';
    expect(component.isCardHovered()).toBe(
      '-webkit-filter: blur(2px); filter: blur(2px);'
    );
  });

  it('should get story link url for exploration page on homeTab', () => {
    component.displayArea = 'homeTab';
    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'test',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
    };
    const sampleStorySummaryBackendDict = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Chapter 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story',
      all_node_dicts: [nodeDict],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };
    component.storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict
    );
    component.completedNodeCount = 0;
    expect(component.getStoryLink()).toBe(
      '/explore/test?topic_url_fragment=topic&' +
        'classroom_url_fragment=math&story_url_fragment=story&' +
        'node_id=node_1'
    );
  });

  it('should get # as story link url for story page', () => {
    const sampleStorySummaryBackendDict = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Chapter 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story-title',
      all_node_dicts: [],
      topic_name: 'Topic',
      classroom_url_fragment: undefined,
      topic_url_fragment: 'topic',
    };
    component.storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict
    );
    const urlSpy = spyOn(urlInterpolationService, 'interpolateUrl');

    component.getStoryLink();
    fixture.detectChanges();

    expect(urlSpy).not.toHaveBeenCalled();
  });

  it('should get static image url', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'getStaticImageUrl'
    ).and.returnValue('/assets/images/learner_dashboard/star.svg');

    component.getStaticImageUrl('/learner_dashboard/star.svg');
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });
});
