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
 * @fileoverview Unit tests for for CollectionSummaryTileComponent.
 */

import { async, ComponentFixture, TestBed } from
  '@angular/core/testing';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StorySummary} from 'domain/story/story-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LearnerStorySummaryTileComponent } from './learner-story-summary-tile.component';


describe('Learner Story Summary Tile Component', () => {
  let component: LearnerStorySummaryTileComponent;
  let fixture: ComponentFixture<LearnerStorySummaryTileComponent>;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        LearnerStorySummaryTileComponent,
      ],
      providers: [
        UrlInterpolationService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
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
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic'
    };
    component.storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict);
    component.topicTitle = 'Title';
    fixture.detectChanges();
  });

  it('should get the story link url for story page', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl')
      .and.returnValue('/learn/math/topic/story/story-title');

    component.getStoryLink();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
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
      classroom_url_fragment: null,
      topic_url_fragment: 'topic'
    };
    component.storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict);
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl');

    component.getStoryLink();
    fixture.detectChanges();

    expect(urlSpy).not.toHaveBeenCalled();
  });
});
