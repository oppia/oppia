// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for view learner group assigned syllabus tab.
 */

import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from
	'@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LearnerGroupSyllabusBackendApiService } from
  'domain/learner_group/learner-group-syllabus-backend-api.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerGroupSubtopicSummary } from
  'domain/learner_group/learner-group-subtopic-summary.model';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { LearnerGroupSyllabus } from
  'domain/learner_group/learner-group-syllabus.model';
import { LearnerGroupViewAssignedSyllabusComponent } from
  './learner-group-view-assigned-syllabus.component';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('LearnerGroupViewAssignedSyllabusComponent', () => {
	let component: LearnerGroupViewAssignedSyllabusComponent;
	let fixture: ComponentFixture<LearnerGroupViewAssignedSyllabusComponent>;
	let assetsBackendApiService: AssetsBackendApiService;
	let learnerGroupSyllabusBackendApiService:
		LearnerGroupSyllabusBackendApiService;

	const sampleSubtopicSummaryDict = {
		subtopic_id: 1,
		subtopic_title: 'subtopicTitle',
		parent_topic_id: 'topicId1',
		parent_topic_name: 'parentTopicName',
		thumbnail_filename: 'thumbnailFilename',
		thumbnail_bg_color: 'red',
		subtopic_mastery: 0.5
	};
	const sampleLearnerGroupSubtopicSummary = (
		LearnerGroupSubtopicSummary.createFromBackendDict(
			sampleSubtopicSummaryDict));

	const sampleSubtopicSummaryDict2 = {
		subtopic_id: 0,
		subtopic_title: 'subtopicTitle',
		parent_topic_id: 'topicId1',
		parent_topic_name: 'parentTopicName',
		thumbnail_filename: 'thumbnailFilename',
		thumbnail_bg_color: 'red',
		subtopic_mastery: 0.6
	};
	const sampleLearnerGroupSubtopicSummary2 = (
		LearnerGroupSubtopicSummary.createFromBackendDict(
			sampleSubtopicSummaryDict2));

	const sampleStorySummaryBackendDict = {
		id: 'story_id_0',
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
		topic_url_fragment: 'topic'
	};
	const sampleStorySummary = StorySummary.createFromBackendDict(
		sampleStorySummaryBackendDict);

	const sampleStorySummaryBackendDict2 = {
		id: 'story_id_1',
		title: 'Story Title 2',
		description: 'Story Description 2',
		node_titles: ['Chapter 2'],
		thumbnail_filename: 'image.svg',
		thumbnail_bg_color: '#F8BF74',
		story_is_published: true,
		completed_node_titles: ['Chapter 2'],
		url_fragment: 'some-story-title',
		all_node_dicts: [],
		topic_name: 'Topic',
		classroom_url_fragment: 'math',
		topic_url_fragment: 'topic'
	};

	const mockSyllabusItemsBackendDict = {
		learner_group_id: 'groupId',
		story_summary_dicts: [
			sampleStorySummaryBackendDict,
			sampleStorySummaryBackendDict2],
		subtopic_summary_dicts: [
			sampleSubtopicSummaryDict,
			sampleSubtopicSummaryDict2]
	};
	const mockSyllabusItems = LearnerGroupSyllabus.createFromBackendDict(
		mockSyllabusItemsBackendDict);

	const learnerGroupBackendDict = {
		id: 'groupId',
		title: 'title',
		description: 'description',
		facilitator_usernames: ['facilitator_username'],
		learner_usernames: [],
		invited_learner_usernames: ['username1'],
		subtopic_page_ids: ['topicId1:1'],
		story_ids: ['story_id_0']
	};
	const learnerGroup = LearnerGroupData.createFromBackendDict(
		learnerGroupBackendDict);

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			declarations: [
				LearnerGroupViewAssignedSyllabusComponent,
				MockTranslatePipe,
				MockTrunctePipe
			],
			providers: [],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();
	});

	beforeEach(() => {
		learnerGroupSyllabusBackendApiService = TestBed.inject(
			LearnerGroupSyllabusBackendApiService);
		assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
		fixture = TestBed.createComponent(LearnerGroupViewAssignedSyllabusComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		component.learnerGroup = learnerGroup;
	});

	it('should determine if displayed item is a story or a subtopic', () => {
		expect(component.isDisplayedItemStory('story-2')).toBe(true);
		expect(component.isDisplayedItemStory('subtopic-2')).toBe(false);
		expect(component.isDisplayedItemSubtopic('story-2')).toBe(false);
		expect(component.isDisplayedItemSubtopic('subtopic-2')).toBe(true);
	});

	it('should determine index of syllabus item to display', () => {
		expect(component.getIndexToDisplay('story-2')).toBe(2);
		expect(component.getIndexToDisplay('subtopic-5')).toBe(5);
	});

	it('should initialize', fakeAsync(() => {
		spyOn(
			learnerGroupSyllabusBackendApiService, 'fetchLearnerGroupSyllabus'
		).and.returnValue(Promise.resolve(mockSyllabusItems));
		expect(component.learnerGroup).toEqual(learnerGroup);

		component.ngOnInit();
		tick(100);

		expect(component.storySummaries).toEqual(mockSyllabusItems.storySummaries);
		expect(component.subtopicSummaries).toEqual(
			mockSyllabusItems.subtopicPageSummaries);
		expect(component.displayOrderOfSyllabusItems).toEqual([
			'story-0', 'story-1', 'subtopic-0', 'subtopic-1']);
	}));

	it('should get subtopic thumbnail url', () => {
		spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview')
			.and.returnValue('/topic/thumbnail/url');

		expect(
			component.getSubtopicThumbnailUrl(sampleLearnerGroupSubtopicSummary)
		).toEqual('/topic/thumbnail/url');
	});

	it('should get story thumbnail url', () => {
		spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview')
			.and.returnValue('/story/thumbnail/url');

		expect(component.getStoryThumbnailUrl(sampleStorySummary)).toEqual(
			'/story/thumbnail/url');
	});
});
