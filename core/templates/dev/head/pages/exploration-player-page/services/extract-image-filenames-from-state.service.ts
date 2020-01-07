// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to extract image filenames in a State.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { HtmlEscaperService } from 'services/html-escaper.service';

@Injectable({
  providedIn: 'root'
})
export class ExtractImageFilenamesFromStateService {
  constructor(private htmlEscaperService: HtmlEscaperService) {}

    INTERACTION_TYPE_MULTIPLE_CHOICE = 'MultipleChoiceInput';
    INTERACTION_TYPE_ITEM_SELECTION = 'ItemSelectionInput';
    INTERACTION_TYPE_IMAGE_CLICK_INPUT = 'ImageClickInput';
    INTERACTION_TYPE_DRAG_AND_DROP_SORT = 'DragAndDropSortInput';

    filenamesInState = [];

    /**
     * Gets the html from the state's content.
     * @param {object} state - The state from which the html of the content
     *                         should be returned.
     */
    // TODO(#7165): Replace any with exact type.
    _getStateContentHtml(state: any): string {
      return state.content.getHtml();
    }

    /**
     * Gets the html from the outcome of the answer groups and the default
     * outcome of the state.
     * @param {object} state - The state from which the html of the outcomes of
     *                         the answer groups should be returned.
     */
    // TODO(#7165): Replace any with exact type.
    _getOutcomesHtml(state: any): string {
      let outcomesHtml = '';
      state.interaction.answerGroups.forEach(function(answerGroup) {
        let answerGroupHtml = answerGroup.outcome.feedback.getHtml();
        outcomesHtml = outcomesHtml.concat(answerGroupHtml);
      });
      if (state.interaction.defaultOutcome !== null) {
        outcomesHtml = outcomesHtml.concat(
          state.interaction.defaultOutcome.feedback.getHtml());
      }
      return outcomesHtml;
    }

    /**
     * Gets the html from the hints in the state.
     * @param {object} state - The state whose hints' html should be returned.
     */
    // TODO(#7165): Replace any with exact type.
    _getHintsHtml(state: any): string {
      let hintsHtml = '';
      state.interaction.hints.forEach(function(hint) {
        let hintHtml = hint.hintContent.getHtml();
        hintsHtml = hintsHtml.concat(hintHtml);
      });
      return hintsHtml;
    }

    /**
     * Gets the html from the solution in the state.
     * @param {object} state - The state whose solution's html should be
     *                         returned.
     */
    // TODO(#7165): Replace any with exact type.
    _getSolutionHtml(state: any): string {
      return state.interaction.solution.explanation.getHtml();
    }

    /**
     * Gets all the html in a state.
     * @param {object} state - The state whose html is to be fetched.
     */
    // TODO(#7165): Replace any with exact type.
    _getAllHtmlOfState(state: any): Array<string> {
      let _allHtmlInTheState = [];
      // The order of the extracted image names is same as they appear in a
      // state. The images should be preloaded in the following order ---
      // content, customizationArgs of interactions, feedback of outcomes ()
      // including feedback of default outcome if any), hints, solution if any.

      _allHtmlInTheState.push(this._getStateContentHtml(state));

      if (state.interaction.id === this.INTERACTION_TYPE_MULTIPLE_CHOICE ||
          state.interaction.id === this.INTERACTION_TYPE_ITEM_SELECTION ||
          state.interaction.id === this.INTERACTION_TYPE_DRAG_AND_DROP_SORT) {
        let customizationArgsHtml = '';
        state.interaction.customizationArgs.choices.value.forEach(
          function(value) {
            customizationArgsHtml = customizationArgsHtml.concat(value);
          });
        _allHtmlInTheState.push(customizationArgsHtml);
      }

      _allHtmlInTheState.push(this._getOutcomesHtml(state));

      _allHtmlInTheState.push(this._getHintsHtml(state));

      if (state.interaction.solution !== null) {
        _allHtmlInTheState.push(this._getSolutionHtml(state));
      }
      return _allHtmlInTheState;
    }

    /**
     * Extracts the filepath object from the filepath-value attribute of the
     * oppia-noninteractive-image tags in the strHtml(given string).
     * @param {string} strHtml - The string from which the object of
     *                           filepath should be extracted.
     */
    // TODO(#7165): Replace any with exact type.
    _extractFilepathValueFromOppiaNonInteractiveImageTag(
        strHtml: string): Array<any> {
      let filenames = [];
      let dummyElement = document.createElement('div');
      dummyElement.innerHTML = (
        this.htmlEscaperService.escapedStrToUnescapedStr(strHtml));

      let imageTagList = dummyElement.getElementsByTagName(
        'oppia-noninteractive-image');
      for (let i = 0; i < imageTagList.length; i++) {
        // We have the attribute of filepath in oppia-noninteractive-image tag.
        // But it actually contains the filename only. We use the variable
        // filename instead of filepath since in the end we are retrieving the
        // filenames in the exploration.
        let filename = JSON.parse(
          imageTagList[i].getAttribute('filepath-with-value'));
        filenames.push(filename);
      }
      return filenames;
    }

    /**
     * Gets the filenames of all the images that are a part of the state.
     * @param {object} state - The state from which the filenames of the image
     *                         should be extracted.
     */
    // TODO(#7165): Replace any with exact type.
    _getImageFilenamesInState(state: any): Array<string> {
      let filenamesInState = [];
      // The Image Click Input interaction has an image whose filename is
      // directly stored in the customizationArgs.imageAndRegion.value
      // .imagePath
      if (state.interaction.id === this.INTERACTION_TYPE_IMAGE_CLICK_INPUT) {
        let filename = (
          state.interaction.customizationArgs.imageAndRegions.value.imagePath);
        filenamesInState.push(filename);
      }
      let allHtmlOfState = this._getAllHtmlOfState(state);
      allHtmlOfState.forEach((htmlStr) => {
        filenamesInState = filenamesInState.concat(
          this._extractFilepathValueFromOppiaNonInteractiveImageTag(htmlStr));
      });
      return filenamesInState;
    }

    getImageFilenamesInState = this._getImageFilenamesInState;
}


angular.module('oppia').factory(
  'ExtractImageFilenamesFromStateService',
  downgradeInjectable(ExtractImageFilenamesFromStateService));
