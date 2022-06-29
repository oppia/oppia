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

import { ContentTranslationLanguageService } from
  'pages/exploration-player-page/services/content-translation-language.service';
import { ContentTranslationManagerService } from
  'pages/exploration-player-page/services/content-translation-manager.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { State } from 'domain/state/StateObjectFactory';
import { Skill } from 'domain/skill/SkillObjectFactory';
import {
  DragAndDropSortInputCustomizationArgs,
  ImageClickInputCustomizationArgs,
  ItemSelectionInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgs
} from 'interactions/customization-args-defs';

type CustomizationArgsWithChoices = (
  DragAndDropSortInputCustomizationArgs |
  ItemSelectionInputCustomizationArgs |
  MultipleChoiceInputCustomizationArgs);

@Injectable({
  providedIn: 'root'
})
export class ExtractImageFilenamesFromModelService {
  constructor(
    private htmlEscaperService: HtmlEscaperService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private contentTranslationLanguageService: ContentTranslationLanguageService
  ) {}

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
  _getStateContentHtml(state: State): string {
    let languageCode = (
      this.contentTranslationLanguageService.getCurrentContentLanguageCode());
    return this.contentTranslationManagerService.getTranslatedHtml(
      state.writtenTranslations, languageCode, state.content);
  }

  /**
   * Gets the html from the outcome of the answer groups and the default
   * outcome of the state.
   * @param {object} state - The state from which the html of the outcomes of
   *                         the answer groups should be returned.
   */
  _getOutcomesHtml(state: State): string {
    let outcomesHtml = '';
    let languageCode = (
      this.contentTranslationLanguageService.getCurrentContentLanguageCode());
    state.interaction.answerGroups.forEach(answerGroup => {
      let answerGroupHtml = (
        this.contentTranslationManagerService.getTranslatedHtml(
          state.writtenTranslations, languageCode,
          answerGroup.outcome.feedback));
      outcomesHtml = outcomesHtml.concat(answerGroupHtml);
    });
    if (state.interaction.defaultOutcome !== null) {
      let defaultOutcomeHtml = (
        this.contentTranslationManagerService.getTranslatedHtml(
          state.writtenTranslations, languageCode,
          state.interaction.defaultOutcome.feedback));
      outcomesHtml = outcomesHtml.concat(defaultOutcomeHtml);
    }
    return outcomesHtml;
  }

  /**
   * Gets the html from the hints in the state.
   * @param {object} state - The state whose hints' html should be returned.
   */
  _getHintsHtml(state: State): string {
    let hintsHtml = '';
    let languageCode = (
      this.contentTranslationLanguageService.getCurrentContentLanguageCode());
    state.interaction.hints.forEach(hint => {
      let hintHtml = this.contentTranslationManagerService.getTranslatedHtml(
        state.writtenTranslations, languageCode, hint.hintContent);
      hintsHtml = hintsHtml.concat(hintHtml);
    });
    return hintsHtml;
  }

  /**
   * Gets the html from the solution in the state.
   * @param {object} state - The state whose solution's html should be
   *                         returned.
   */
  _getSolutionHtml(state: State): string | null {
    let languageCode = (
      this.contentTranslationLanguageService.getCurrentContentLanguageCode());

    // The state.interaction.solution variable threw 'Object is possibly null
    // error'. So to prevent this error there is a check to see that if
    // solution is null, which means that the solution in the state does not
    // exist. If it is null then function returns null.
    if (state.interaction.solution === null) {
      return null;
    }
    return this.contentTranslationManagerService.getTranslatedHtml(
      state.writtenTranslations, languageCode,
      state.interaction.solution.explanation);
  }

  /**
   * Gets all the html in a state.
   * @param {object} state - The state whose html is to be fetched.
   */
  _getAllHtmlOfState(state: State): string[] {
    let _allHtmlInTheState = [];
    // The order of the extracted image names is same as they appear in a
    // state. The images should be preloaded in the following order ---
    // content, customizationArgs of interactions, feedback of outcomes ()
    // including feedback of default outcome if any), hints, solution if any.

    _allHtmlInTheState.push(this._getStateContentHtml(state));

    if (
      state.interaction.id === this.INTERACTION_TYPE_MULTIPLE_CHOICE ||
      state.interaction.id === this.INTERACTION_TYPE_ITEM_SELECTION ||
      state.interaction.id === this.INTERACTION_TYPE_DRAG_AND_DROP_SORT
    ) {
      let customizationArgsHtml = '';
      let languageCode = (
        this.contentTranslationLanguageService.getCurrentContentLanguageCode()
      );
      const self = this;
      (state.interaction.customizationArgs as CustomizationArgsWithChoices)
        .choices.value.forEach(function(value) {
          customizationArgsHtml = (
            customizationArgsHtml.concat(
              self.contentTranslationManagerService.getTranslatedHtml(
                state.writtenTranslations, languageCode, value)));
        });
      _allHtmlInTheState.push(customizationArgsHtml);
    }

    _allHtmlInTheState.push(this._getOutcomesHtml(state));

    _allHtmlInTheState.push(this._getHintsHtml(state));

    let solutionHtml = this._getSolutionHtml(state);

    // If solutionHtml is not null (which means that the solution in the state
    // does exist), then add solutionHtml to _allHtmlInTheState.
    if (solutionHtml !== null) {
      _allHtmlInTheState.push(solutionHtml);
    }
    return _allHtmlInTheState;
  }

  /**
   * Extracts the filepath object from the filepath-value attribute of the
   * oppia-noninteractive-image tags in the htmlString(given string).
   * @param {string} htmlString - The string from which the object of
   *                           filepath should be extracted.
   */
  _extractFilepathValueFromOppiaNonInteractiveImageTag(
      htmlString: string
  ): string[] {
    let filenames = [];
    let unescapedHtmlString = (
      this.htmlEscaperService.escapedStrToUnescapedStr(htmlString));
    let dummyDocument = (
      new DOMParser().parseFromString(unescapedHtmlString, 'text/html'));

    let imageTagLists = [];

    // Add images that are in the base content (not embedded).
    imageTagLists.push(
      dummyDocument.getElementsByTagName('oppia-noninteractive-image'));

    // Add images that are embedded in collapsibles.
    let collapsibleTagList = dummyDocument.getElementsByTagName(
      'oppia-noninteractive-collapsible');
    for (let i = 0; i < collapsibleTagList.length; i++) {
      // Get attribute from a collapsible. If the given attribute does not
      // exist, then attribute is null which means skip the current
      // collapsible. If the attribute is not null, then add images that are
      // embedded in the given collapsible.
      let attribute = collapsibleTagList[i].getAttribute('content-with-value');
      if (attribute !== null) {
        let contentWithValue = JSON.parse(attribute);
        let collapsibleDocument = (
          new DOMParser().parseFromString(contentWithValue, 'text/html'));
        imageTagLists.push(
          collapsibleDocument.getElementsByTagName(
            'oppia-noninteractive-image'));
      }
    }

    // Add images that are embedded in tabs.
    let tabsTagList = dummyDocument.getElementsByTagName(
      'oppia-noninteractive-tabs');
    for (let i = 0; i < tabsTagList.length; i++) {
      // Get attribute from a tab. If the given attribute does not exist,
      // then attribute is null which means skip the current tab. If the
      // attribute is not null, then add images that are embedded in the given
      // tab.
      let attribute = tabsTagList[i].getAttribute('tab_contents-with-value');
      if (attribute !== null) {
        let contentsWithValue = JSON.parse(attribute);
        for (let contentWithValue of contentsWithValue) {
          let tabDocument = (
            new DOMParser().parseFromString(
              contentWithValue.content, 'text/html'));
          imageTagLists.push(
            tabDocument.getElementsByTagName('oppia-noninteractive-image'));
        }
      }
    }

    for (let imageTagList of imageTagLists) {
      for (let i = 0; i < imageTagList.length; i++) {
        // We have the attribute of filepath in oppia-noninteractive-image
        // tag. But it actually contains the filename only. We use the
        // variable filename instead of filepath since in the end we are
        // retrieving the filenames in the exploration.

        // Get filename attribute from an imageTag. If the given attribute does
        // not exist, then attribute is null which means skip the current
        // imageTag. If the attribute is not null, then add the file to
        // filenames.
        let attribute = imageTagList[i].getAttribute('filepath-with-value');
        if (attribute !== null) {
          let filename = JSON.parse(
            this.htmlEscaperService.escapedStrToUnescapedStr(
              attribute));
          filenames.push(filename);
        }
      }
    }
    return filenames;
  }

  /**
   * Extracts the SVG filename from the math-content attribute of the
   * oppia-noninteractive-math tags in the htmlString(given string).
   * @param {string} htmlString - The string from which the object of
   *                           filepath should be extracted.
   */
  _extractSvgFilenameFromOppiaNonInteractiveMathTag(
      htmlString: string
  ): string[] {
    let filenames = [];
    let unescapedHtmlString = (
      this.htmlEscaperService.escapedStrToUnescapedStr(htmlString));
    let dummyDocument = (
      new DOMParser().parseFromString(unescapedHtmlString, 'text/html'));

    let mathTagList = dummyDocument.getElementsByTagName(
      'oppia-noninteractive-math');
    for (let i = 0; i < mathTagList.length; i++) {
      // Get attribute from a mathTag. If the given attribute does not exist,
      // then attribute is null which means skip the current mathTag.
      // If the attribute is not null, then add the SVG filename to filenames.
      let attribute = mathTagList[i].getAttribute('math_content-with-value');
      if (attribute !== null) {
        let mathContentWithValue = JSON.parse(attribute);
        filenames.push(mathContentWithValue.svg_filename);
      }
    }
    return filenames;
  }

  /**
   * Gets the filenames of all the images that are a part of the state.
   * @param {object} state - The state from which the filenames of the image
   *                         should be extracted.
   */
  _getImageFilenamesInState(state: State): string[] {
    let filenamesInState = [];
    // The Image Click Input interaction has an image whose filename is
    // directly stored in the customizationArgs.imageAndRegion.value
    // .imagePath.
    if (state.interaction.id === this.INTERACTION_TYPE_IMAGE_CLICK_INPUT) {
      let filename = ((
        state.interaction.customizationArgs as ImageClickInputCustomizationArgs
      ).imageAndRegions.value.imagePath);
      filenamesInState.push(filename);
    }
    let allHtmlOfState = this._getAllHtmlOfState(state);
    return [
      ...filenamesInState,
      ...this._extractFilenamesFromHtmlList(allHtmlOfState)
    ];
  }

  /**
   * Gets the filenames of all the images that are a part of a skill.
   * @param {object} skill - The skill from which the filenames of the image
   *                         should be extracted.
   */
  _getImageFilenamesInSkill(skill: Skill): string[] {
    let htmlList = [];
    for (let misconception of skill.getMisconceptions()) {
      htmlList.push(misconception.getFeedback(), misconception.getNotes());
    }
    for (let workedExample of skill.getConceptCard().getWorkedExamples()) {
      htmlList.push(
        workedExample.getExplanation().html, workedExample.getQuestion().html);
    }
    htmlList.push(skill.getConceptCard().getExplanation().html);
    skill.getRubrics().forEach(rubric => {
      htmlList.push(...rubric.getExplanations());
    });
    return this._extractFilenamesFromHtmlList(htmlList);
  }

  _extractFilenamesFromHtmlList(htmlList: string[]): string[] {
    let filenames: string[] = [];
    htmlList.forEach((htmlStr) => {
      filenames.push(
        ...this._extractFilepathValueFromOppiaNonInteractiveImageTag(htmlStr),
        ...this._extractSvgFilenameFromOppiaNonInteractiveMathTag(htmlStr));
    });
    return filenames;
  }

  getImageFilenamesInSkill = this._getImageFilenamesInSkill;
  getImageFilenamesInState = this._getImageFilenamesInState;
}


angular.module('oppia').factory(
  'ExtractImageFilenamesFromModelService',
  downgradeInjectable(ExtractImageFilenamesFromModelService));
