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

oppia.factory('ExtractImageFilenamesFromStateService', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    var INTERACTION_TYPE_MULTIPLE_CHOICE = 'MultipleChoiceInput';
    var INTERACTION_TYPE_ITEM_SELECTION = 'ItemSelectionInput';
    var INTERACTION_TYPE_IMAGE_CLICK_INPUT = 'ImageClickInput';

    var filenamesInState = [];

    /**
     * Gets the html from the state's content.
     * @param {object} state - The state from which the html of the content
     *                         should be returned.
     */
    var _getStateContentHtml = function(state) {
      var stateContentHtml = state.content.getHtml();
      return stateContentHtml;
    };

    /**
     * Gets the html from the outcome of the answer groups of the state.
     * @param {object} state - The state from which the html of the outcomes of
     *                         the answer groups should be returned.
     */
    var _getOutcomeHtml = function(state) {
      var outcomeHtml = [];
      state.interaction.answerGroups.forEach(function(answerGroup) {
        var answerGroupHtml = answerGroup.outcome.feedback.getHtml();
        outcomeHtml.push(answerGroupHtml);
      });
      return outcomeHtml;
    };

    /**
     * Gets the html from the default outcome.
     * @param {object} state - The state whose default outcome's html should be
     *                         returned.
     */
    var _getDefaultOutcomeHtml = function(state) {
      var defaultOutcomeHtml = (
        state.interaction.defaultOutcome.feedback.getHtml());
      return defaultOutcomeHtml;
    };

    /**
     * Gets the html from the hints in the state.
     * @param {object} state - The state whose hints' html should be returned.
     */
    var _getHintsHtml = function(state) {
      var hintsHtml = [];
      state.interaction.hints.forEach(function(hint) {
        var hintHtml = hint.hintContent.getHtml();
        hintsHtml.push(hintHtml);
      });
      return hintsHtml;
    };

    /**
     * Gets the html from the solution in the state.
     * @param {object} state - The state whose solution's html should be
     *                         returned.
     */
    var _getSolutionHtml = function(state) {
      var solutionHtml = state.interaction.solution.explanation.getHtml();
      return solutionHtml;
    };

    /**
     * Gets all the html in a state.
     * @param {object} state - The state whose html is to be fetched.
     */
    var _getAllHtmlOfState = function(state) {
      var _allHtmlInTheState = [];
      // The order of the extracted image names is same as they appear in a
      // state. The images should be preloaded in the following order ---
      // content, customizationArgs of interactions, feedback of outcomes ()
      // including feedback of default outcome if any), hints, solution if any.

      _allHtmlInTheState.push(_getStateContentHtml(state));

      if (state.interaction.id === INTERACTION_TYPE_MULTIPLE_CHOICE ||
          state.interaction.id === INTERACTION_TYPE_ITEM_SELECTION ) {
        var customizationArgsHtml = '';
        state.interaction.customizationArgs.choices.value.forEach(
          function(value) {
            customizationArgsHtml = customizationArgsHtml.concat(value);
          });
        _allHtmlInTheState.push(customizationArgsHtml);
      }

      _allHtmlInTheState = _allHtmlInTheState.concat(_getOutcomeHtml(state));

      if (state.interaction.defaultOutcome !== null) {
        var defaultOutcomeHtml = _getDefaultOutcomeHtml(state);
        if (defaultOutcomeHtml !== '') {
          _allHtmlInTheState.push(defaultOutcomeHtml);
        }
      }

      _allHtmlInTheState = _allHtmlInTheState.concat(_getHintsHtml(state));

      if (state.interaction.solution !== null) {
        _allHtmlInTheState.push(_getSolutionHtml(state));
      }
      return _allHtmlInTheState;
    };

    /**
     * Extracts the filenames from the filepath-value attribute of the
     * oppia-noninteractive-image tags in the strHtml(given string).
     * @param {string} strHtml - The string from which the filenames of images
     *                           should be extracted.
     */
    var _extractFilepathValueFromOppiaNonInteractiveImageTag = function(
        strHtml) {
      var filenames = [];
      var dummyElement = document.createElement('div');
      dummyElement.innerHTML = (
        HtmlEscaperService.escapedStrToUnescapedStr(strHtml));

      var imageTagList = dummyElement.getElementsByTagName(
        'oppia-noninteractive-image');
      for (i = 0; i < imageTagList.length; i++) {
        filenames.push(imageTagList[i].getAttribute('filepath-with-value'));
      }
      // The name in the array is stored as '"image.png"'. We need to remove
      // the inverted commas. We remove the first and the last character from
      // the string (name).
      filenames = filenames.map(function(filename) {
        return filename.slice(1, filename.length - 1);
      });
      return filenames;
    };

    /**
     * Gets the filenames of all the images that are a part of the state.
     * @param {object} state - The state from which the filenames of the image
     *                         should be extracted.
     */
    var _getImageFilenamesInState = function(state) {
      var filenamesInState = [];
      // The Image Click Input interaction has an image whose filename is
      // directly stored in the customizationArgs.imageAndRegion.value
      // .imagePath
      if (state.interaction.id === 'INTERACTION_TYPE_IMAGE_CLICK_INPUT') {
        filenamesInState.push(
          state.interaction.customizationArgs.imageAndRegions.value.imagePath);
      }
      allHtmlOfState = _getAllHtmlOfState(state);
      allHtmlOfState.forEach(function(htmlStr) {
        filenamesInState = filenamesInState.concat(
          _extractFilepathValueFromOppiaNonInteractiveImageTag(htmlStr));
      });
      return filenamesInState;
    };

    return {
      getImageFilenamesInState: _getImageFilenamesInState
    };
  }]);
