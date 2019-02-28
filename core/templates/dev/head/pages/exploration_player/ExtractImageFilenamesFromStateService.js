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
    var INTERACTION_TYPE_DRAG_AND_DROP_SORT = 'DragAndDropSortInput';

    var filenamesInState = [];

    /**
     * Gets the html from the state's content.
     * @param {object} state - The state from which the html of the content
     *                         should be returned.
     */
    var _getStateContentHtml = function(state) {
      return state.content.getHtml();
    };

    /**
     * Gets the html from the outcome of the answer groups and the default
     * outcome of the state.
     * @param {object} state - The state from which the html of the outcomes of
     *                         the answer groups should be returned.
     */
    var _getOutcomesHtml = function(state) {
      var outcomesHtml = '';
      state.interaction.answerGroups.forEach(function(answerGroup) {
        var answerGroupHtml = answerGroup.outcome.feedback.getHtml();
        outcomesHtml = outcomesHtml.concat(answerGroupHtml);
      });
      if (state.interaction.defaultOutcome !== null) {
        outcomesHtml = outcomesHtml.concat(
          state.interaction.defaultOutcome.feedback.getHtml());
      }
      return outcomesHtml;
    };

    /**
     * Gets the html from the hints in the state.
     * @param {object} state - The state whose hints' html should be returned.
     */
    var _getHintsHtml = function(state) {
      var hintsHtml = '';
      state.interaction.hints.forEach(function(hint) {
        var hintHtml = hint.hintContent.getHtml();
        hintsHtml = hintsHtml.concat(hintHtml);
      });
      return hintsHtml;
    };

    /**
     * Gets the html from the solution in the state.
     * @param {object} state - The state whose solution's html should be
     *                         returned.
     */
    var _getSolutionHtml = function(state) {
      return state.interaction.solution.explanation.getHtml();
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
          state.interaction.id === INTERACTION_TYPE_ITEM_SELECTION ||
          state.interaction.id === INTERACTION_TYPE_DRAG_AND_DROP_SORT) {
        var customizationArgsHtml = '';
        state.interaction.customizationArgs.choices.value.forEach(
          function(value) {
            customizationArgsHtml = customizationArgsHtml.concat(value);
          });
        _allHtmlInTheState.push(customizationArgsHtml);
      }

      _allHtmlInTheState.push(_getOutcomesHtml(state));

      _allHtmlInTheState.push(_getHintsHtml(state));

      if (state.interaction.solution !== null) {
        _allHtmlInTheState.push(_getSolutionHtml(state));
      }
      return _allHtmlInTheState;
    };

    /**
     * Extracts the filepath object from the filepath-value attribute of the
     * oppia-noninteractive-image tags in the strHtml(given string).
     * @param {string} strHtml - The string from which the object of
     *                           filepath should be extracted.
     */
    var _extractFilepathValueFromOppiaNonInteractiveImageTag = function(
        strHtml) {
      var filenames = [];
      var dummyElement = document.createElement('div');
      dummyElement.innerHTML = (
        HtmlEscaperService.escapedStrToUnescapedStr(strHtml));

      var imageTagList = dummyElement.getElementsByTagName(
        'oppia-noninteractive-image');
      for (var i = 0; i < imageTagList.length; i++) {
        // We have the attribute of filepath in oppia-noninteractive-image tag.
        // But it actually contains the filename only. We use the variable
        // filename instead of filepath since in the end we are retrieving the
        // filenames in the exploration.
        var filename = JSON.parse(
          imageTagList[i].getAttribute('filepath-with-value'));
        filenames.push(filename);
      }
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
      if (state.interaction.id === INTERACTION_TYPE_IMAGE_CLICK_INPUT) {
        var filename = (
          state.interaction.customizationArgs.imageAndRegions.value.imagePath);
        filenamesInState.push(filename);
      }
      var allHtmlOfState = _getAllHtmlOfState(state);
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
