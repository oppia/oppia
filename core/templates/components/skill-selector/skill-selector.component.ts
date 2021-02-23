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
 * @fileoverview Controller for the select skill viewer.
 */

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CategorizedSkills } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { SkillSummary } from 'core/templates/domain/skill/skill-summary.model';
import { downgradeComponent } from '@angular/upgrade/static';
import { GroupedSkillSummaries } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { FilterForMatchingSubstringPipe } from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import { ShortSkillSummary } from 'core/templates/domain/skill/ShortSkillSummaryObjectFactory';

require('domain/utilities/url-interpolation.service.ts');

@Component({
  selector: 'skill-selector',
  templateUrl: './skill-selector.component.html',
  styleUrls: []
})
export class SkillSelectorComponent implements OnInit {
  // If countOfSkillsToPrioritize > 0, then sortedSkillSummaries should
  // have the initial 'countOfSkillsToPrioritize' entries of skills with
  // the same priority.
  @Input() sortedSkillSummaries: GroupedSkillSummaries;
  @Input() selectedSkillId: string;
  @Input() countOfSkillsToPrioritize: number;
  @Input() categorizedSkills: CategorizedSkills;
  @Input() untriagedSkillSummaries: SkillSummary[];
  @Input() allowSkillsFromOtherTopics: boolean;
  @Output() selectedSkillIdChanged: EventEmitter<string> = new EventEmitter();
  selectedSkill = null;
  skillFilterText = '';

  topicFilterList = [];
  subTopicFilterDict: { [topicName: string]:
     { subTopicName: string; checked: boolean }[] } = {};
  intialSubTopicFilterDict = {};
  private filterForMatchingSubtringPipe: FilterForMatchingSubstringPipe = (
    new FilterForMatchingSubstringPipe()
  );

  constructor() {}

  ngOnInit(): void {
    for (let topicName in this.categorizedSkills) {
      var topicNameDict = {
        topicName: topicName,
        checked: false
      };
      this.topicFilterList.push(topicNameDict);
      var subTopics = this.categorizedSkills[topicName];
      this.subTopicFilterDict[topicName] = [];
      for (let subTopic in subTopics) {
        var subTopicNameDict = {
          subTopicName: subTopic,
          checked: false
        };
        this.subTopicFilterDict[topicName].push(subTopicNameDict);
      }
    }
    this.intialSubTopicFilterDict = angular.copy(this.subTopicFilterDict);
  }

  checkIfEmpty(skills: string[]): boolean {
    return skills.length === 0;
  }

  checkTopicIsNotEmpty(topicName: string): boolean {
    for (let key in this.categorizedSkills[topicName]) {
      if (Object.keys(this.categorizedSkills[topicName][key]).length) {
        return true;
      }
    }
    return false;
  }

  setSelectedSkillId(): void {
    this.selectedSkillIdChanged.emit(this.selectedSkill);
  }

  // The folowing function is called when the subtopic filter changes.
  // This updates the list of Skills displayed in the selector.
  updateSkillsListOnSubtopicFilterChange(): void {
    var updatedSkillsDict = {};
    var isAnySubTopicChecked = false;
    for (let topicName in this.subTopicFilterDict) {
      var subTopics = this.subTopicFilterDict[topicName];
      for (var i = 0; i < subTopics.length; i++) {
        if (subTopics[i].checked) {
          if (!updatedSkillsDict.hasOwnProperty(topicName)) {
            updatedSkillsDict[topicName] = {};
          }
          var tempCategorizedSkills = this.categorizedSkills;
          var subTopicName = subTopics[i].subTopicName;
          updatedSkillsDict[topicName][subTopicName] =
            tempCategorizedSkills[topicName][subTopicName];
          isAnySubTopicChecked = true;
        }
      }
    }
    if (!isAnySubTopicChecked) {
      // If no subtopics are checked in the subtop filter, we have
      // to display all the skills from checked topics.
      var isAnyTopicChecked = false;
      for (var i = 0; i < this.topicFilterList.length; i++) {
        if (this.topicFilterList[i].checked) {
          var tempCategorizedSkills = this.categorizedSkills;
          var topicName:string = this.topicFilterList[i].topicName;
          updatedSkillsDict[topicName] = tempCategorizedSkills[topicName];
          isAnyTopicChecked = true;
        }
      }
      if (isAnyTopicChecked) {
        this.categorizedSkills = angular.copy(updatedSkillsDict);
      }
    } else {
      this.categorizedSkills = angular.copy(updatedSkillsDict);
    }
  }

  // The folowing function is called when the topic filter changes.
  // First, the subtopic filter is updated according to the changed
  // topic filter list. Then the main Skills list is updated.
  updateSkillsListOnTopicFilterChange(): void {
    var updatedSubTopicFilterList = {};
    var isAnyTopicChecked = false;
    for (var i = 0; i < this.topicFilterList.length; i++) {
      if (this.topicFilterList[i].checked) {
        var topicName = this.topicFilterList[i].topicName;
        updatedSubTopicFilterList[topicName] = (
          angular.copy(this.intialSubTopicFilterDict[topicName]));
        isAnyTopicChecked = true;
      }
    }
    if (!isAnyTopicChecked) {
      // If there are no topics checked on topic filter, we have to
      // display subtopics from all the topics in the subtopic filter.
      for (var topic in this.intialSubTopicFilterDict) {
        if (!this.subTopicFilterDict.hasOwnProperty(topic)) {
          this.subTopicFilterDict[topic] = (
            angular.copy(this.intialSubTopicFilterDict[topic]));
        }
      }
    } else {
      this.subTopicFilterDict =
         angular.copy(updatedSubTopicFilterList);
    }
    // After we update the subtopic filter list, we need to update
    // the main skills list.
    this.updateSkillsListOnSubtopicFilterChange();
  }

  searchInSubtopicSkills(input: ShortSkillSummary[], searchText: string): ShortSkillSummary[] {
    let skills: string[] = input.map(val => {
      return val.getDescription()
    })
    let filteredSkills = this.filterForMatchingSubtringPipe.transform(skills, searchText)
    return input.filter(val => {
      return filteredSkills.includes(val.description)
    })
  }

  searchInUntriagedSkillSummaries(searchText: string): SkillSummary[] {
    let skills: string[] = this.untriagedSkillSummaries.map(val => {
      return val.description
    })
    let filteredSkills = this.filterForMatchingSubtringPipe.transform(skills, searchText)
    return this.untriagedSkillSummaries.filter(val => {
      return filteredSkills.includes(val.description)
    })
  }

  clearAllFilters(): void {
    for (var i = 0; i < this.topicFilterList.length; i++) {
      this.topicFilterList[i].checked = false;
    }
    for (let topicName in this.subTopicFilterDict) {
      var length = this.subTopicFilterDict[topicName].length;
      for (var j = 0; j < length; j++) {
        this.subTopicFilterDict[topicName][j].checked = false;
      }
    }
    this.updateSkillsListOnTopicFilterChange();
  }
}

angular.module('oppia').directive(
  'skillSelector', downgradeComponent(
    { component: SkillSelectorComponent }
  )
);
