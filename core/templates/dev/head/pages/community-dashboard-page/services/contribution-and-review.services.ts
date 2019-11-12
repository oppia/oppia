// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching and resolving suggestions.
 */
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {HttpClient} from '@angular/common/http';
import {ExplorationEditorPageConstants} from '../../exploration-editor-page/exploration-editor-page.constants';
import {downgradeInjectable} from '@angular/upgrade/static';

export class ContributionAndReviewServices {
  constructor(private urlInterpolationService: UrlInterpolationService, private httpClient: HttpClient) {}

  _SUBMITTED_SUGGESTION_LIST_HANDLER_URL_TEMPLATE = (
      '/getsubmittedsuggestions/<target_type>/<suggestion_type>');
  _REVIEWABLE_SUGGESTIONS_HANDLER_URL_TEMPLATE = (
      '/getreviewablesuggestions/<target_type>/<suggestion_type>');
  _SUGGESTION_ACTION_HANDLER_URL = (
      '/suggestionactionhandler/exploration/<exp_id>/<thread_id>');

  _fetchSuggestions(url, onSuccess) {
    let suggestionsPromise = this.httpClient.get(url).toPromise();

    return suggestionsPromise.then((res: any) => {
      let suggestionIdToSuggestions = {};
      let targetIdToDetails = res.data.target_ids_to_opportunity_dicts;
      res.data.suggestions.forEach((suggestion) => {
        suggestionIdToSuggestions[suggestion.suggestion_id] = {
          suggestion: suggestion,
          details: targetIdToDetails[suggestion.target_id]
        };
      });
      onSuccess(suggestionIdToSuggestions);
    });
  }

  getUserCreatedTranslationSuggestions(username, onSuccess) {
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUBMITTED_SUGGESTION_LIST_HANDLER_URL_TEMPLATE, {
        target_type: 'exploration',
        suggestion_type: 'translate_content'
      });
    return this._fetchSuggestions(url, onSuccess);
  }
  getReviewableTranslationSuggestions(onSuccess) {
    let url = this.urlInterpolationService.interpolateUrl(
      this._REVIEWABLE_SUGGESTIONS_HANDLER_URL_TEMPLATE, {
        target_type: 'exploration',
        suggestion_type: 'translate_content'
      });
    return this._fetchSuggestions(url, onSuccess);
  }
  resolveSuggestion(
      targetId, threadId, action, reviewMessage, commitMessage, onSuccess) {
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUGGESTION_ACTION_HANDLER_URL, {
        exp_id: targetId,
        thread_id: threadId
      });
    return this.httpClient.put(url, {
      action: action,
      review_message: reviewMessage,
      commit_message: (
          action === ExplorationEditorPageConstants.ACTION_ACCEPT_SUGGESTION ?
              commitMessage : null)
    }).toPromise().then(function() {
      onSuccess(threadId);
    });
  }
}

angular.module('oppia').factory(
  'ContributionAndReviewServices',
  downgradeInjectable(ContributionAndReviewServices));
