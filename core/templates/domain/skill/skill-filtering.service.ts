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
 * @fileoverview Service for filtering skills by topic and search text.
 */

import {Injectable} from '@angular/core';
import {ShortSkillSummary} from 'core/templates/domain/skill/short-skill-summary.model';
import {SkillSummary} from 'core/templates/domain/skill/skill-summary.model';
import {CategorizedSkills} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {FilterForMatchingSubstringPipe} from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import cloneDeep from 'lodash/cloneDeep';

export interface SubTopicFilterDict {
  [topicName: string]: {subTopicName: string; checked: boolean}[];
}

@Injectable({
  providedIn: 'root',
})
export class SkillFilteringService {
  constructor(
    private filterForMatchingSubstringPipe: FilterForMatchingSubstringPipe
  ) {}

  checkIfEmpty(skills: Object[]): boolean {
    return skills.length === 0;
  }

  checkTopicIsNotEmpty(
    topicName: string,
    categorizedSkills: CategorizedSkills
  ): boolean {
    for (let key in categorizedSkills[topicName]) {
      if (Object.keys(categorizedSkills[topicName][key]).length) {
        return true;
      }
    }
    return false;
  }

  searchInSubtopicSkills(
    input: ShortSkillSummary[],
    searchText: string
  ): ShortSkillSummary[] {
    let skills: string[] = input.map(val => {
      return val.getDescription();
    });
    let filteredSkills = this.filterForMatchingSubstringPipe.transform(
      skills,
      searchText
    );
    return input.filter(val => {
      return filteredSkills.includes(val.description);
    });
  }

  searchInUntriagedSkillSummaries(
    untriagedSkillSummaries: SkillSummary[],
    skillIdsToExclude: Set<string>,
    searchText: string
  ): SkillSummary[] {
    let skills: string[] = untriagedSkillSummaries
      .filter(val => !skillIdsToExclude.has(val.id))
      .map(val => {
        return val.description;
      });
    let filteredSkills = this.filterForMatchingSubstringPipe.transform(
      skills,
      searchText
    );
    return untriagedSkillSummaries.filter(val => {
      return filteredSkills.includes(val.description);
    });
  }

  updateSkillsListOnSubtopicFilterChange(
    categorizedSkills: CategorizedSkills,
    subTopicFilterDict: SubTopicFilterDict,
    topicFilterList: {topicName: string; checked: boolean}[]
  ): CategorizedSkills {
    let updatedSkillsDict: CategorizedSkills = {};
    let isAnySubTopicChecked: boolean = false;

    for (let topicName in subTopicFilterDict) {
      var subTopics = subTopicFilterDict[topicName];
      for (var i = 0; i < subTopics.length; i++) {
        if (subTopics[i].checked) {
          if (!updatedSkillsDict.hasOwnProperty(topicName)) {
            updatedSkillsDict[topicName] = {uncategorized: []};
          }
          let tempCategorizedSkills: CategorizedSkills = categorizedSkills;
          let subTopicName: string = subTopics[i].subTopicName;
          updatedSkillsDict[topicName][subTopicName] =
            tempCategorizedSkills[topicName][subTopicName];
          isAnySubTopicChecked = true;
        }
      }
    }

    if (!isAnySubTopicChecked) {
      let isAnyTopicChecked: boolean = false;
      for (var i = 0; i < topicFilterList.length; i++) {
        if (topicFilterList[i].checked) {
          let tempCategorizedSkills: CategorizedSkills = categorizedSkills;
          let topicName: string = topicFilterList[i].topicName;
          updatedSkillsDict[topicName] = tempCategorizedSkills[topicName];
          isAnyTopicChecked = true;
        }
      }
      if (isAnyTopicChecked) {
        return cloneDeep(updatedSkillsDict);
      } else {
        return cloneDeep(categorizedSkills);
      }
    } else {
      return cloneDeep(updatedSkillsDict);
    }
  }

  updateSkillsListOnTopicFilterChange(
    categorizedSkills: CategorizedSkills,
    initialSubTopicFilterDict: SubTopicFilterDict,
    subTopicFilterDict: SubTopicFilterDict,
    topicFilterList: {topicName: string; checked: boolean}[]
  ): {
    subTopicFilterDict: SubTopicFilterDict;
    currCategorizedSkills: CategorizedSkills;
  } {
    let updatedSubTopicFilterList: SubTopicFilterDict = {};
    let isAnyTopicChecked: boolean = false;
    let newSubTopicFilterDict = cloneDeep(subTopicFilterDict);

    for (var i = 0; i < topicFilterList.length; i++) {
      if (topicFilterList[i].checked) {
        let topicName = topicFilterList[i].topicName;
        updatedSubTopicFilterList[topicName] = cloneDeep(
          initialSubTopicFilterDict[topicName]
        );
        isAnyTopicChecked = true;
      }
    }

    if (!isAnyTopicChecked) {
      for (let topic in initialSubTopicFilterDict) {
        if (!newSubTopicFilterDict.hasOwnProperty(topic)) {
          newSubTopicFilterDict[topic] = cloneDeep(
            initialSubTopicFilterDict[topic]
          );
        }
      }
    } else {
      newSubTopicFilterDict = cloneDeep(updatedSubTopicFilterList);
    }

    const currCategorizedSkills = this.updateSkillsListOnSubtopicFilterChange(
      categorizedSkills,
      newSubTopicFilterDict,
      topicFilterList
    );

    return {
      subTopicFilterDict: newSubTopicFilterDict,
      currCategorizedSkills: currCategorizedSkills,
    };
  }

  computeAugmentedTopicFilterList(
    topicFilterList: {topicName: string; checked: boolean}[],
    subTopicFilterDict: SubTopicFilterDict,
    categorizedSkills: CategorizedSkills,
    skillFilterText: string
  ): {
    augmentedTopicFilterList: {topicName: string; checked: boolean}[];
    augmentedSubTopicFilterDict: SubTopicFilterDict;
  } {
    if (!skillFilterText) {
      return {
        augmentedTopicFilterList: topicFilterList,
        augmentedSubTopicFilterDict: subTopicFilterDict,
      };
    }

    const augmentedTopicFilterList = [];
    const augmentedSubTopicFilterDict: SubTopicFilterDict = {};

    for (const topic of topicFilterList) {
      const topicName = topic.topicName;
      const matchingSubtopics = subTopicFilterDict[topicName]
        ? subTopicFilterDict[topicName].filter(subtopic =>
            this.checkSubtopicHasMatchingSkills(
              topicName,
              subtopic.subTopicName,
              categorizedSkills,
              skillFilterText
            )
          )
        : [];

      if (matchingSubtopics.length > 0) {
        augmentedTopicFilterList.push(topic);
        augmentedSubTopicFilterDict[topicName] = matchingSubtopics;
      } else if (
        !subTopicFilterDict[topicName] &&
        this.checkTopicHasMatchingSkills(
          topicName,
          categorizedSkills,
          skillFilterText
        )
      ) {
        augmentedTopicFilterList.push(topic);
      }
    }

    return {
      augmentedTopicFilterList,
      augmentedSubTopicFilterDict,
    };
  }

  checkTopicHasMatchingSkills(
    topicName: string,
    categorizedSkills: CategorizedSkills,
    skillFilterText: string
  ): boolean {
    if (!skillFilterText) {
      return true;
    }
    if (!categorizedSkills) {
      return false;
    }

    const topicSkills = categorizedSkills[topicName];
    for (const subTopicName in topicSkills) {
      if (
        this.checkSubtopicHasMatchingSkills(
          topicName,
          subTopicName,
          categorizedSkills,
          skillFilterText
        )
      ) {
        return true;
      }
    }
    return false;
  }

  checkSubtopicHasMatchingSkills(
    topicName: string,
    subTopicName: string,
    categorizedSkills: CategorizedSkills,
    skillFilterText: string
  ): boolean {
    if (!skillFilterText) {
      return true;
    }
    if (!categorizedSkills) {
      return false;
    }
    const skills = categorizedSkills[topicName][subTopicName];
    return this.searchInSubtopicSkills(skills, skillFilterText).length > 0;
  }
}
