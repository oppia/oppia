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

import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {ShortSkillSummary} from 'core/templates/domain/skill/short-skill-summary.model';
import {SkillSummary} from 'core/templates/domain/skill/skill-summary.model';
import {CategorizedSkills} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {
  SkillFilteringService,
  SubTopicFilterDict,
} from 'domain/skill/skill-filtering.service';
import cloneDeep from 'lodash/cloneDeep';
import {GroupedSkillSummaries} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {UserService} from 'services/user.service';

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
  @Input() skillIdsToExclude: Set<string> = new Set();
  @Output() selectedSkillIdChange: EventEmitter<string> = new EventEmitter();
  currCategorizedSkills!: CategorizedSkills;
  selectedSkill!: string;
  _skillFilterText: string = '';
  get skillFilterText(): string {
    return this._skillFilterText;
  }
  set skillFilterText(val: string) {
    this._skillFilterText = val;
    this.refreshFilterLists();
  }

  topicFilterList: {topicName: string; checked: boolean}[] = [];
  subTopicFilterDict: SubTopicFilterDict = {};
  augmentedTopicFilterList: {topicName: string; checked: boolean}[] = [];
  augmentedSubTopicFilterDict: SubTopicFilterDict = {};
  initialSubTopicFilterDict: SubTopicFilterDict = {};
  userCanEditSkills: boolean = false;

  constructor(
    private userService: UserService,
    private skillFilteringService: SkillFilteringService
  ) {}

  ngOnInit(): void {
    this.currCategorizedSkills = this.categorizedSkills;
    if (this.currCategorizedSkills) {
      for (let topicName in this.currCategorizedSkills) {
        let topicNameDict = {
          topicName: topicName,
          checked: false,
        };
        this.topicFilterList.push(topicNameDict);
        this.augmentedTopicFilterList.push(topicNameDict);
        let subTopics = this.currCategorizedSkills[topicName];
        this.subTopicFilterDict[topicName] = [];
        this.augmentedSubTopicFilterDict[topicName] = [];
        for (let subTopic in subTopics) {
          let subTopicNameDict = {
            subTopicName: subTopic,
            checked: false,
          };
          this.subTopicFilterDict[topicName].push(subTopicNameDict);
          this.augmentedSubTopicFilterDict[topicName].push(subTopicNameDict);
        }
      }
    }
    this.initialSubTopicFilterDict = cloneDeep(this.subTopicFilterDict);

    this.userService
      .canUserAccessTopicsAndSkillsDashboard()
      .then(canUserAccessTopicsAndSkillsDashboard => {
        this.userCanEditSkills = canUserAccessTopicsAndSkillsDashboard;
      });
  }

  checkIfEmpty(skills: Object[]): boolean {
    return this.skillFilteringService.checkIfEmpty(skills);
  }

  checkTopicIsNotEmpty(topicName: string): boolean {
    return this.skillFilteringService.checkTopicIsNotEmpty(
      topicName,
      this.currCategorizedSkills
    );
  }

  setSelectedSkillId(): void {
    this.selectedSkillIdChange.emit(this.selectedSkill);
  }

  updateSkillsListOnSubtopicFilterChange(): void {
    this.currCategorizedSkills =
      this.skillFilteringService.updateSkillsListOnSubtopicFilterChange(
        this.categorizedSkills,
        this.subTopicFilterDict,
        this.topicFilterList
      );
  }

  updateSkillsListOnTopicFilterChange(): void {
    const result =
      this.skillFilteringService.updateSkillsListOnTopicFilterChange(
        this.categorizedSkills,
        this.initialSubTopicFilterDict,
        this.subTopicFilterDict,
        this.topicFilterList
      );

    this.subTopicFilterDict = result.subTopicFilterDict;
    this.currCategorizedSkills = result.currCategorizedSkills;
  }

  searchInSubtopicSkills(
    input: ShortSkillSummary[],
    searchText: string
  ): ShortSkillSummary[] {
    return this.skillFilteringService.searchInSubtopicSkills(input, searchText);
  }

  searchInUntriagedSkillSummaries(searchText: string): SkillSummary[] {
    return this.skillFilteringService.searchInUntriagedSkillSummaries(
      this.untriagedSkillSummaries,
      this.skillIdsToExclude,
      searchText
    );
  }

  refreshFilterLists(): void {
    const result = this.skillFilteringService.computeAugmentedTopicFilterList(
      this.topicFilterList,
      this.subTopicFilterDict,
      this.categorizedSkills,
      this.skillFilterText
    );

    this.augmentedTopicFilterList = result.augmentedTopicFilterList;
    this.augmentedSubTopicFilterDict = result.augmentedSubTopicFilterDict;
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
