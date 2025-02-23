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
 * @fileoverview Backend services to get learner groups syllabus items
 * from backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  LearnerGroupSyllabus,
  LearnerGroupSyllabusBackendDict,
} from './learner-group-syllabus.model';
import {
  LearnerGroupUserProgress,
  LearnerGroupUserProgressBackendDict,
} from './learner-group-user-progress.model';

interface SyllabusFilterDetails {
  description: string;
  itemsName: string;
  masterList: {
    id: string;
    text: string;
  }[];
  selection: string;
  defaultValue: string;
  summary: string;
}

export interface SyllabusSelectionDetails {
  [key: string]: SyllabusFilterDetails;
  types: SyllabusFilterDetails;
  categories: SyllabusFilterDetails;
  languageCodes: SyllabusFilterDetails;
}

export interface LearnerGroupSyllabusFilter {
  keyword: string;
  type: string;
  category: string;
  languageCode: string;
  learnerGroupId: string;
}

@Injectable({
  providedIn: 'root',
})
export class LearnerGroupSyllabusBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async searchNewSyllabusItemsAsync(
    syllabusFilter: LearnerGroupSyllabusFilter
  ): Promise<LearnerGroupSyllabus> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = '/learner_group_search_syllabus_handler';

      const filterData = {
        search_keyword: syllabusFilter.keyword,
        search_type: syllabusFilter.type,
        search_category: syllabusFilter.category,
        search_language_code: syllabusFilter.languageCode,
        learner_group_id: syllabusFilter.learnerGroupId,
      };

      this.http
        .get<LearnerGroupSyllabusBackendDict>(learnerGroupUrl, {
          params: filterData,
        })
        .toPromise()
        .then(matchingSyllabus => {
          resolve(LearnerGroupSyllabus.createFromBackendDict(matchingSyllabus));
        });
    });
  }

  async fetchLearnersProgressInAssignedSyllabus(
    learnerGroupId: string,
    learnerUsernames: string[]
  ): Promise<LearnerGroupUserProgress[]> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = this.urlInterpolationService.interpolateUrl(
        '/learner_group_user_progress_handler/<learner_group_id>',
        {
          learner_group_id: learnerGroupId,
        }
      );

      this.http
        .get<LearnerGroupUserProgressBackendDict[]>(learnerGroupUrl, {
          params: {
            learner_usernames: JSON.stringify(learnerUsernames),
          },
        })
        .toPromise()
        .then(usersProgressInfo => {
          resolve(
            usersProgressInfo.map(progressInfo =>
              LearnerGroupUserProgress.createFromBackendDict(progressInfo)
            )
          );
        });
    });
  }

  async fetchLearnerSpecificProgressInAssignedSyllabus(
    learnerGroupId: string
  ): Promise<LearnerGroupUserProgress> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = this.urlInterpolationService.interpolateUrl(
        '/learner_group_learner_specific_progress_handler/' +
          '<learner_group_id>',
        {
          learner_group_id: learnerGroupId,
        }
      );

      this.http
        .get<LearnerGroupUserProgressBackendDict>(learnerGroupUrl)
        .toPromise()
        .then(progressInfo => {
          resolve(LearnerGroupUserProgress.createFromBackendDict(progressInfo));
        });
    });
  }

  async fetchLearnerGroupSyllabus(
    learnerGroupId: string
  ): Promise<LearnerGroupSyllabus> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = this.urlInterpolationService.interpolateUrl(
        '/learner_group_syllabus_handler/<learner_group_id>',
        {
          learner_group_id: learnerGroupId,
        }
      );

      this.http
        .get<LearnerGroupSyllabusBackendDict>(learnerGroupUrl)
        .toPromise()
        .then(syllabusInfo => {
          resolve(LearnerGroupSyllabus.createFromBackendDict(syllabusInfo));
        });
    });
  }
}
