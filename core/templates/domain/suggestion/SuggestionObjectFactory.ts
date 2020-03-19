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
 * @fileoverview Factory for creating new frontend instances of suggestion
   domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { SuggestionsService } from 'services/suggestions.service';

export class Suggestion {
  suggestionType: string;
  suggestionId: string;
  threadId: string;
  targetType: string;
  targetId: string;
  status: string;
  authorName: string;
  stateName: string;
  // TODO(#7165): Replace 'any' with the exact type.
  newValue: any;
  // TODO(#7165): Replace 'any' with the exact type.
  oldValue: any;
  lastUpdatedMsecs: number;

  constructor(
      suggestionType: string, suggestionId: string, threadId: string,
      targetType: string, targetId: string, status: string, authorName: string,
      stateName: string, newValue: string, oldValue: string,
      lastUpdatedMsecs: number) {
    this.suggestionType = suggestionType;
    this.suggestionId = suggestionId;
    this.threadId = threadId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.status = status;
    this.authorName = authorName;
    this.stateName = stateName;
    this.newValue = newValue;
    this.oldValue = oldValue;
    this.lastUpdatedMsecs = lastUpdatedMsecs;
  }

  getThreadId(): string {
    return this.threadId;
  }
}

@Injectable({providedIn: 'root'})
export class SuggestionObjectFactory {
  constructor(private suggestionsService: SuggestionsService) {}
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'suggestionBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(suggestionBackendDict: any): Suggestion {
    let threadId = this.suggestionsService.getThreadIdFromSuggestionBackendDict(
      suggestionBackendDict);
    return new Suggestion(
      suggestionBackendDict.suggestion_type,
      suggestionBackendDict.suggestion_id, threadId,
      suggestionBackendDict.target_type, suggestionBackendDict.target_id,
      suggestionBackendDict.status, suggestionBackendDict.author_name,
      suggestionBackendDict.change.state_name,
      suggestionBackendDict.change.new_value,
      suggestionBackendDict.change.old_value,
      suggestionBackendDict.last_updated_msecs);
  }
}

angular.module('oppia').factory(
  'SuggestionObjectFactory',
  downgradeInjectable(SuggestionObjectFactory));
