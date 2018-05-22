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

oppia.factory('ExtractImageFilenamesFromStateService', ['HtmlEscaperService',
  function(HtmlEscaperService) {
    var INTERACTION_TYPE_MULTIPLE_CHOICE = 'MultipleChoiceInput';
    var INTERACTION_TYPE_ITEM_SELECTION = 'ItemSelectionInput';
    var INTERACTION_TYPE_IMAGE_CLICK_INPUT = 'ImageClickInput';

    var filenamesInState = [];
    var _getAllHtmlOfState = function(state) {
      var _allHtmlInTheState = [];
      // The order of the imagenames extracted is same as they appea in a state
      // . The images should be preloaded in the following order --- content,
      // customizationArgs of interactions, feedback of outcomes(including
      // feedback of default outcome if any), hints, solution if any.
      var stateContentHtml = state.content.getHtml();
      _allHtmlInTheState.push(stateContentHtml);

      if (state.interaction.id === INTERACTION_TYPE_MULTIPLE_CHOICE ||
        state.interaction.id === INTERACTION_TYPE_ITEM_SELECTION ) {
        var customizationArgsHtml = '';
        state.interaction.customizationArgs.choices.value.forEach(
          function(value) {
            customizationArgsHtml = customizationArgsHtml.concat(value);
          });
        _allHtmlInTheState.push(customizationArgsHtml);
      }

      state.interaction.answerGroups.forEach(function(answerGroup) {
        var answerGroupHtml = answerGroup.outcome.feedback.getHtml();
        _allHtmlInTheState.push(answerGroupHtml);
      });

      if (state.interaction.defaultOutcome !== null) {
        var defaultOutcomeHtml = state.interaction.defaultOutcome.feedback
          .getHtml();
        if (defaultOutcomeHtml !== '') {
          _allHtmlInTheState.push(defaultOutcomeHtml);
        }
      }

      state.interaction.hints.forEach(function(hint) {
        var hintHtml = hint.hintContent.getHtml();
        _allHtmlInTheState.push(hintHtml);
      });
      if (state.interaction.solution !== null) {
        var solutionHtml = state.interaction.solution.explanation.getHtml();
        _allHtmlInTheState.push(solutionHtml);
      }
      return _allHtmlInTheState;
    };

    var _extractFilepathValueFromOppiaNonInteractiveImageTag = function(
        strHtml) {
      var filenames = [];
      var dummyElement = document.createElement('div');
      dummyElement.innerHTML = HtmlEscaperService.escapedStrToUnescapedStr(
        strHtml);

      var imageTagList = dummyElement.getElementsByTagName(
        'oppia-noninteractive-image');
      for (i = 0; i < imageTagList.length; i++) {
        filenames.push(imageTagList[i].getAttribute('filepath-with-value'));
      }
      // The name in the array is stored as '"image.png"'. We need to remove
      // the inverted commas. We remove the first and the last character from
      // the string (name).
      for (var x in filenames) {
        filenames[x] = filenames[x].slice(1, filenames[x].length - 1);
      }
      return filenames;
    };

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
      getImageFilenamesInState: function(state) {
        return _getImageFilenamesInState(state);
      }
    };
  }]);
