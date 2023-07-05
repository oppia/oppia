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
 * @fileoverview Controller for the skill-selector component.
 */

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ShortSkillSummary } from 'core/templates/domain/skill/short-skill-summary.model';
import { SkillSummary } from 'core/templates/domain/skill/skill-summary.model';
import { CategorizedSkills } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { FilterForMatchingSubstringPipe } from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import cloneDeep from 'lodash/cloneDeep';
import { GroupedSkillSummaries } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { UserService } from 'services/user.service';

interface SubTopicFilterDict {
  [topicName: string]: { subTopicName: string; checked: boolean }[];
}

@Component({
  selector: 'oppia-skill-selector',
  templateUrl: './skill-selector.component.html',
})
export class SkillSelectorComponent implements OnInit {
  // If countOfSkillsToPrioritize > 0, then sortedSkillSummaries should
  // have the initial 'countOfSkillsToPrioritize' entries of skills with
  // the same priority.

  // Some properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() sortedSkillSummaries!: GroupedSkillSummaries;
  @Input() selectedSkillId!: string;
  @Input() countOfSkillsToPrioritize: number = 0;
  @Input() categorizedSkills!: CategorizedSkills;
  @Input() untriagedSkillSummaries!: SkillSummary[];
  @Input() allowSkillsFromOtherTopics!: boolean;
  @Output() selectedSkillIdChange: EventEmitter<string> = new EventEmitter();
  currCategorizedSkills!: CategorizedSkills;
  selectedSkill!: string;
  skillFilterText: string = '';
  topicFilterList: { topicName: string ; checked: boolean }[] = [];
  subTopicFilterDict: SubTopicFilterDict = {};
  initialSubTopicFilterDict: SubTopicFilterDict = {};
  userCanEditSkills: boolean = false;

  constructor(
    private filterForMatchingSubstringPipe: FilterForMatchingSubstringPipe,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currCategorizedSkills = this.categorizedSkills;
    for (let topicName in this.currCategorizedSkills) {
      let topicNameDict = {
        topicName: topicName,
        checked: false
      };
      this.topicFilterList.push(topicNameDict);
      let subTopics = this.currCategorizedSkills[topicName];
      this.subTopicFilterDict[topicName] = [];
      for (let subTopic in subTopics) {
        let subTopicNameDict = {
          subTopicName: subTopic,
          checked: false
        };
        this.subTopicFilterDict[topicName].push(subTopicNameDict);
      }
    }
    this.initialSubTopicFilterDict = cloneDeep(this.subTopicFilterDict);

    this.userService.canUserAccessTopicsAndSkillsDashboard()
      .then((canUserAccessTopicsAndSkillsDashboard) => {
        this.userCanEditSkills = canUserAccessTopicsAndSkillsDashboard;
      });
  }

  checkIfEmpty(skills: Object[]): boolean {
    return skills.length === 0;
  }

  checkTopicIsNotEmpty(topicName: string): boolean {
    for (let key in this.currCategorizedSkills[topicName]) {
      if (Object.keys(this.currCategorizedSkills[topicName][key]).length) {
        return true;
      }
    }
    return false;
  }

  setSelectedSkillId(): void {
    this.selectedSkillIdChange.emit(this.selectedSkill);
  }

  // The following function is called when the subtopic filter changes.
  // This updates the list of Skills displayed in the selector.
  updateSkillsListOnSubtopicFilterChange(): void {
    let updatedSkillsDict: CategorizedSkills = {};
    let isAnySubTopicChecked: boolean = false;
    for (let topicName in this.subTopicFilterDict) {
      var subTopics = this.subTopicFilterDict[topicName];
      for (var i = 0; i < subTopics.length; i++) {
        if (subTopics[i].checked) {
          if (!updatedSkillsDict.hasOwnProperty(topicName)) {
            updatedSkillsDict[topicName] = { uncategorized: [] };
          }
          let tempCategorizedSkills: CategorizedSkills = this.categorizedSkills;
          let subTopicName: string = subTopics[i].subTopicName;
          updatedSkillsDict[topicName][subTopicName] =
            tempCategorizedSkills[topicName][subTopicName];
          isAnySubTopicChecked = true;
        }
      }
    }
    if (!isAnySubTopicChecked) {
      // If no subtopics are checked in the subtop filter, we have
      // to display all the skills from checked topics.
      let isAnyTopicChecked: boolean = false;
      for (var i = 0; i < this.topicFilterList.length; i++) {
        if (this.topicFilterList[i].checked) {
          let tempCategorizedSkills: CategorizedSkills = this.categorizedSkills;
          let topicName: string = this.topicFilterList[i].topicName;
          updatedSkillsDict[topicName] = tempCategorizedSkills[topicName];
          isAnyTopicChecked = true;
        }
      }
      if (isAnyTopicChecked) {
        this.currCategorizedSkills = cloneDeep(updatedSkillsDict);
      } else {
        // If no filter is applied on both subtopics and topics, we
        // need to display all the skills (the original list).
        this.currCategorizedSkills = cloneDeep(this.categorizedSkills);
      }
    } else {
      this.currCategorizedSkills = cloneDeep(updatedSkillsDict);
    }
  }

  // The following function is called when the topic filter changes.
  // First, the subtopic filter is updated according to the changed
  // topic filter list. Then the main Skills list is updated.
  updateSkillsListOnTopicFilterChange(): void {
    let updatedSubTopicFilterList: SubTopicFilterDict = {};
    let isAnyTopicChecked: boolean = false;
    for (var i = 0; i < this.topicFilterList.length; i++) {
      if (this.topicFilterList[i].checked) {
        let topicName = this.topicFilterList[i].topicName;
        updatedSubTopicFilterList[topicName] = (
          cloneDeep(this.initialSubTopicFilterDict[topicName]));
        isAnyTopicChecked = true;
      }
    }
    if (!isAnyTopicChecked) {
      // If there are no topics checked on topic filter, we have to
      // display subtopics from all the topics in the subtopic filter.
      for (let topic in this.initialSubTopicFilterDict) {
        if (!this.subTopicFilterDict.hasOwnProperty(topic)) {
          this.subTopicFilterDict[topic] = (
            cloneDeep(this.initialSubTopicFilterDict[topic]));
        }
      }
    } else {
      this.subTopicFilterDict =
         cloneDeep(updatedSubTopicFilterList);
    }
    // After we update the subtopic filter list, we need to update
    // the main skills list.
    this.updateSkillsListOnSubtopicFilterChange();
  }

  searchInSubtopicSkills(input: ShortSkillSummary[], searchText: string):
  ShortSkillSummary[] {
    let skills: string[] = input.map(val => {
      return val.getDescription();
    });
    let filteredSkills = this.filterForMatchingSubstringPipe
      .transform(skills, searchText);
    return input.filter(val => {
      return filteredSkills.includes(val.description);
    });
  }

  searchInUntriagedSkillSummaries(searchText: string): SkillSummary[] {
    let skills: string[] = this.untriagedSkillSummaries.map(val => {
      return val.description;
    });
    let filteredSkills = this.filterForMatchingSubstringPipe
      .transform(skills, searchText);
    return this.untriagedSkillSummaries.filter(val => {
      return filteredSkills.includes(val.description);
    });
  }

  clearAllFilters(): void {
    for (let i = 0; i < this.topicFilterList.length; i++) {
      this.topicFilterList[i].checked = false;
    }
    for (let topicName in this.subTopicFilterDict) {
      let length: number = this.subTopicFilterDict[topicName].length;
      for (let j = 0; j < length; j++) {
        this.subTopicFilterDict[topicName][j].checked = false;
      }
    }
    this.updateSkillsListOnTopicFilterChange();
  }
}

angular.module('oppia').directive(
  'oppiaSkillSelector', downgradeComponent(
    { component: SkillSelectorComponent }
  )
);
