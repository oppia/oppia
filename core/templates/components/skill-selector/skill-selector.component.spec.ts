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
 * @fileoverview Unit tests for SkillSelectorComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {UserService} from 'services/user.service';
import {SkillFilteringService} from 'domain/skill/skill-filtering.service';
import {SkillSelectorComponent} from './skill-selector.component';

// Mock Service to isolate component tests
class MockSkillFilteringService {
  checkIfEmpty(skills: Object[]): boolean {
    return true;
  }
  checkTopicIsNotEmpty(topicName: string, categorizedSkills: any): boolean {
    return true;
  }
  searchInSubtopicSkills(input: any, searchText: string): any {
    return input;
  }
  searchInUntriagedSkillSummaries(summary: any, exclude: any, text: any): any {
    return summary;
  }
  updateSkillsListOnSubtopicFilterChange(
    skills: any,
    subDict: any,
    topicList: any
  ): any {
    return skills;
  }
  updateSkillsListOnTopicFilterChange(
    skills: any,
    initSubDict: any,
    subDict: any,
    topicList: any
  ): any {
    return {
      subTopicFilterDict: subDict,
      currCategorizedSkills: skills,
    };
  }
  computeAugmentedTopicFilterList(
    list: any,
    dict: any,
    skills: any,
    text: any
  ): any {
    return {
      augmentedTopicFilterList: list,
      augmentedSubTopicFilterDict: dict,
    };
  }
}

describe('SkillSelectorComponent', () => {
  let component: SkillSelectorComponent;
  let fixture: ComponentFixture<SkillSelectorComponent>;
  let userService: UserService;
  let skillFilteringService: SkillFilteringService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillSelectorComponent],
      providers: [
        UserService,
        {
          provide: SkillFilteringService,
          useClass: MockSkillFilteringService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillSelectorComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    skillFilteringService = TestBed.inject(SkillFilteringService);

    // Setup basic inputs
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
      },
    };
  });

  beforeEach(() => {
    spyOn(userService, 'canUserAccessTopicsAndSkillsDashboard').and.returnValue(
      Promise.resolve(true)
    );
  });

  it('should initialize and setup filters on ngOnInit', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.topicFilterList.length).toBeGreaterThan(0);
    expect(component.subTopicFilterDict.topic1).toBeDefined();
  }));

  it('should delegate checkIfEmpty to service', () => {
    const spy = spyOn(skillFilteringService, 'checkIfEmpty');
    component.checkIfEmpty([]);
    expect(spy).toHaveBeenCalled();
  });

  it('should delegate checkTopicIsNotEmpty to service', () => {
    const spy = spyOn(skillFilteringService, 'checkTopicIsNotEmpty');
    component.checkTopicIsNotEmpty('topic1');
    expect(spy).toHaveBeenCalled();
  });

  it('should delegate searchInSubtopicSkills to service', () => {
    const spy = spyOn(skillFilteringService, 'searchInSubtopicSkills');
    component.searchInSubtopicSkills([], 'search');
    expect(spy).toHaveBeenCalled();
  });

  it('should delegate searchInUntriagedSkillSummaries to service', () => {
    const spy = spyOn(skillFilteringService, 'searchInUntriagedSkillSummaries');
    component.untriagedSkillSummaries = [];
    component.searchInUntriagedSkillSummaries('search');
    expect(spy).toHaveBeenCalled();
  });

  it('should delegate updateSkillsListOnSubtopicFilterChange to service', () => {
    const spy = spyOn(
      skillFilteringService,
      'updateSkillsListOnSubtopicFilterChange'
    );
    component.updateSkillsListOnSubtopicFilterChange();
    expect(spy).toHaveBeenCalled();
  });

  it('should delegate updateSkillsListOnTopicFilterChange to service', () => {
    const spy = spyOn(
      skillFilteringService,
      'updateSkillsListOnTopicFilterChange'
    ).and.callThrough();
    component.updateSkillsListOnTopicFilterChange();
    expect(spy).toHaveBeenCalled();
  });

  it('should delegate refreshFilterLists to service', () => {
    const spy = spyOn(
      skillFilteringService,
      'computeAugmentedTopicFilterList'
    ).and.callThrough();
    component.refreshFilterLists();
    expect(spy).toHaveBeenCalled();
  });

  it('should clear all filters and update list', () => {
    const spy = spyOn(component, 'updateSkillsListOnTopicFilterChange');
    component.topicFilterList = [{topicName: 't1', checked: true}];

    component.clearAllFilters();

    expect(component.topicFilterList[0].checked).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('should set selected skill id', () => {
    spyOn(component.selectedSkillIdChange, 'emit');
    component.selectedSkill = 's1';
    component.setSelectedSkillId();
    expect(component.selectedSkillIdChange.emit).toHaveBeenCalledWith('s1');
  });

  it('should refresh filter lists when skillFilterText is set', () => {
    const spy = spyOn(component, 'refreshFilterLists');
    component.skillFilterText = 'abc';
    expect(spy).toHaveBeenCalled();
  });
});
