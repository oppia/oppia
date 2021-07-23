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
 * @fileoverview Unit tests for the select topics component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SelectTopicsComponent } from './select-topics.component';
import { FormsModule } from '@angular/forms';

describe('Topic Selector Component', () => {
  let fixture: ComponentFixture<SelectTopicsComponent>;
  let componentInstance: SelectTopicsComponent;
  let topicSummaries = [{
    additionalStoryCount: 0,
    canEditTopic: true,
    canonicalStoryCount: 0,
    classroom: null,
    description: 'dasd',
    id: 'grVKDzKnenYL',
    isPublished: false,
    languageCode: 'en',
    name: 'asd',
    subtopicCount: 0,
    thumbnailBgColor: '#C6DCDA',
    thumbnailFilename: 'a.svg',
    topicModelCreatedOn: 1598310242241.483,
    topicModelLastUpdated: 1598310242544.855,
    totalSkillCount: 0,
    uncategorizedSkillCount: 0,
    urlFragment: 'd',
    isSelected: false,
    version: 2},
  {
    additionalStoryCount: 0,
    canEditTopic: true,
    canonicalStoryCount: 0,
    classroom: null,
    description: 'dasd',
    id: 'topic2',
    isPublished: false,
    languageCode: 'en',
    name: 'asd',
    subtopicCount: 0,
    thumbnailBgColor: '#C6DCDA',
    thumbnailFilename: 'a.svg',
    topicModelCreatedOn: 1598310242241.483,
    topicModelLastUpdated: 1598310242544.855,
    totalSkillCount: 0,
    uncategorizedSkillCount: 0,
    isSelected: false,
    urlFragment: 'd2',
  }];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        SelectTopicsComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTopicsComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.topicSummaries = topicSummaries;
    componentInstance.selectedTopicIds = [];
    componentInstance.filteredTopics = [];
    spyOn(componentInstance.selectedTopicIdsChange, 'emit');
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should allow select and deselect the topics', () => {
    componentInstance.selectOrDeselectTopic(topicSummaries[0].id);
    expect(componentInstance.selectedTopicIds).toEqual([topicSummaries[0].id]);
    expect(topicSummaries[0].isSelected).toEqual(true);
    componentInstance.selectOrDeselectTopic(topicSummaries[1].id);
    expect(componentInstance.selectedTopicIds).toEqual(
      [topicSummaries[0].id, topicSummaries[1].id]);
    expect(topicSummaries[1].isSelected).toEqual(true);
    componentInstance.selectOrDeselectTopic(topicSummaries[0].id);
    expect(componentInstance.selectedTopicIds).toEqual([topicSummaries[1].id]);
    expect(topicSummaries[0].isSelected).toEqual(false);
  });

  it('should allow filter the topics', () => {
    componentInstance.searchInTopics(topicSummaries[0].name);
    expect(componentInstance.filteredTopics[0].name).toEqual(
      topicSummaries[0].name);
    componentInstance.searchInTopics(topicSummaries[1].name);
    expect(componentInstance.filteredTopics[1].name).toEqual(
      topicSummaries[1].name);
  });

  it('should throw error if topicId is wrong and no' +
     ' topicSummaries exist', () => {
    expect(() => {
      componentInstance.selectOrDeselectTopic('');
    }).toThrowError('No Topic with given topicId exists!');
  });
});
