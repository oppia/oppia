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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { UrlInterpolationService }
  from 'domain/utilities/url-interpolation.service';
import { LearnerGroupSyllabus, LearnerGroupSyllabusBackendDict }
  from './learner-group-syllabus.model';


interface LearnerGroupSyllabusFilter {
  keyword: string;
  type: string;
  category: string;
  languageCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class LearnerGroupSyllabusBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async searchNewSyllabusItemsAsync(
      learnerGroupId: string,
      syllabusFilter: LearnerGroupSyllabusFilter
  ): Promise<LearnerGroupSyllabus> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/learner_group_search_syllabus_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );

      const filterData = {
        search_keyword: syllabusFilter.keyword,
        search_type: syllabusFilter.type,
        search_category: syllabusFilter.category,
        search_language_code: syllabusFilter.languageCode
      };

      this.http.get<LearnerGroupSyllabusBackendDict>(
        learnerGroupUrl, {
          params: filterData
        }
      ).toPromise().then(matchingSyllabus => {
        resolve(LearnerGroupSyllabus.createFromBackendDict(matchingSyllabus));
      });
    });
  }
}

angular.module('oppia').factory(
  'LearnerGroupSyllabusBackendApiService',
  downgradeInjectable(LearnerGroupSyllabusBackendApiService));
