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
import { HtmlEscaperService } from 'services/html-escaper.service';
import { State } from 'domain/state/StateObjectFactory';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { ImageClickInputCustomizationArgs } from 'interactions/customization-args-defs';
import { EntityTranslationsService } from 'services/entity-translations.services';

@Injectable({
  providedIn: 'root'
})
export class ExtractImageFilenamesFromModelService {
  constructor(
    private htmlEscaperService: HtmlEscaperService,
    private entityTranslationsService: EntityTranslationsService,
    private contentTranslationLanguageService: ContentTranslationLanguageService
  ) {}

  INTERACTION_TYPE_MULTIPLE_CHOICE = 'MultipleChoiceInput';
  INTERACTION_TYPE_ITEM_SELECTION = 'ItemSelectionInput';
  INTERACTION_TYPE_IMAGE_CLICK_INPUT = 'ImageClickInput';
  INTERACTION_TYPE_DRAG_AND_DROP_SORT = 'DragAndDropSortInput';

  filenamesInState = [];

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
    let allHtmlOfState: string[] = state.getAllHTMLStrings();
    let htmlTranslations: string[] = (
      this.entityTranslationsService.getHtmlTranslations(
        this.contentTranslationLanguageService.getCurrentContentLanguageCode(),
        state.getAllContentIds()
      )
    );
    return [
      ...filenamesInState,
      ...this._extractFilenamesFromHtmlList(allHtmlOfState),
      ...this._extractFilenamesFromHtmlList(htmlTranslations),
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
