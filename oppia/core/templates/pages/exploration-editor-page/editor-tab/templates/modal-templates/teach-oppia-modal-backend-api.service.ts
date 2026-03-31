// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information of review tests from the
 * backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {InteractionAnswer} from 'interactions/answer-defs';

export interface TeachOppiaModalData {
  data: {
    unresolved_answers: {answer: InteractionAnswer}[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class TeachOppiaModalBackendApiService {
  constructor(private http: HttpClient) {}

  async fetchTeachOppiaModalDataAsync(
    urlFragment: string,
    params: object
  ): Promise<TeachOppiaModalData> {
    return this.http.get<TeachOppiaModalData>(urlFragment, params).toPromise();
  }
}
