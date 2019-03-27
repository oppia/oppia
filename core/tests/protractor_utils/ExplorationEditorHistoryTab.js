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
 * @fileoverview Page object for the exploration editor's history tab, for
 * use in Protractor tests.
 */

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorHistoryTab = function() {
  /*
   * Interactive elements
   */
  var historyCheckboxSelector = element.all(by.css(
    '.protractor-test-history-checkbox-selector'));
  var historyGraph = element(by.css('.protractor-test-history-graph'));
  var stateNodes = historyGraph.all(by.css('.protractor-test-node'));
  var stateNodeBackground = function(nodeElement) {
    return nodeElement.element(by.css('.protractor-test-node-background'));
  };
  var stateNodeLabel = function(nodeElement) {
    return nodeElement.element(by.css('.protractor-test-node-label'));
  };

  /*
   * Buttons
   */
  var closeStateHistoryButton = element(
    by.css('.protractor-test-close-history-state-modal'));
  var showHistoryGraphButton = element(
    by.css('.protractor-test-show-history-graph'));
  var revertVersionButton = element.all(
    by.css('.protractor-test-revert-version'));
  var confirmRevertVersionButton = element(
    by.css('.protractor-test-confirm-revert'));

  /*
   * Links
   */
  var historyGraphLink = historyGraph.all(by.css('.protractor-test-link'));

  /*
   * Workflows
   */

  this.getHistoryGraph = function() {
    return {
      openStateHistory: function(stateName) {
        stateNodes.map(function(stateElement) {
          return stateNodeLabel(stateElement).getText();
        }).then(function(listOfNames) {
          var matched = false;
          for (var i = 0; i < listOfNames.length; i++) {
            if (listOfNames[i] === stateName) {
              stateNodes.get(i).click();
              matched = true;
            }
          }
          if (!matched) {
            throw Error(
              'State ' + stateName + ' not found by getHistoryGraph.');
          }
        });
      },
      closeStateHistory: function() {
        waitFor.elementToBeClickable(
          closeStateHistoryButton,
          'Close State History button is not clickable');
        expect(closeStateHistoryButton.isDisplayed()).toBe(true);
        closeStateHistoryButton.click();
        waitFor.invisibilityOf(
          closeStateHistoryButton,
          'Close State History button takes too long to disappear.');
      },
      deselectTwoVersions: function(versionNumber1, versionNumber2) {
        // Array starts at 0.
        historyCheckboxSelector.count().then(function(totalVersionNumber) {
          var v1Position = totalVersionNumber - versionNumber1;
          var v2Position = totalVersionNumber - versionNumber2;

          expect(historyCheckboxSelector.get(v1Position).isDisplayed())
            .toBe(true);
          historyCheckboxSelector.get(v1Position).click();

          expect(historyCheckboxSelector.get(v2Position).isDisplayed())
            .toBe(true);
          historyCheckboxSelector.get(v2Position).click();
        });
      },
      /*
       * This method selects two version's checkboxes to be compared
       *    Args:
       *        versionNumber1 (int) : history version # 1
       *        versionNumber2 (int) : history version # 2
       */
      selectTwoVersions: function(versionNumber1, versionNumber2) {
        // Array starts at 0
        historyCheckboxSelector.count().then(function(totalVersionNumber) {
          var v1Position = totalVersionNumber - versionNumber1;
          var v2Position = totalVersionNumber - versionNumber2;

          expect(historyCheckboxSelector.get(v1Position).isDisplayed())
            .toBe(true);
          historyCheckboxSelector.get(v1Position).click();

          expect(historyCheckboxSelector.get(v2Position).isDisplayed())
            .toBe(true);
          historyCheckboxSelector.get(v2Position).click();
        });
        // Click button to show graph.
        expect(showHistoryGraphButton.isDisplayed()).toBe(true);
        showHistoryGraphButton.click();
      },
      /*
       * This method compares the states in the history graph using each
       * state's color and label
       *    Args:
       *        expectedStates (list) : list of dicts of color and label of node
       *    Details of the dict
       *        dict key - color  : color of the node
       *        dict key - label  : label of the node (Note: if the node
       *                            has a secondary label,the secondary
       *                            label should appear after a space. It
       *                            may be truncated.)
       */
      expectHistoryStatesToMatch: function(expectedStates) {
        stateNodes.map(function(stateElement) {
          return {
            label: stateNodeLabel(stateElement).getText(),
            color: stateNodeBackground(stateElement).getCssValue('fill')
          };
        }).then(function(states) {
          expect(states.length).toEqual(expectedStates.length);
          // Note: we need to compare this way because the state graph is
          // sometimes generated with states in different configurations.
          states.forEach(function(element) {
            expect(expectedStates).toContain(element);
          });
        });
      },
      /*
       * This method checks for the number of deleted links(red), added links
       * (green) and the total numbers on the history graph
       *    Args:
       *        totalLinks (int) : total number of links
       *        addedLinks (int) : number of added links
       *        deletedLinks (int) : number of deleted links
       */
      expectNumberOfLinksToMatch: function(
          totalLinks, addedLinks, deletedLinks) {
        var COLOR_ADDED = 'rgb(31, 125, 31)';
        var COLOR_DELETED = 'rgb(178, 34, 34)';
        var totalCount = 0;
        var addedCount = 0;
        var deletedCount = 0;
        historyGraphLink.map(function(link) {
          link.getCssValue('stroke').then(function(linkColor) {
            totalCount++;
            if (linkColor === COLOR_ADDED) {
              addedCount++;
            } else if (linkColor === COLOR_DELETED) {
              deletedCount++;
            }
            return;
          });
        }).then(function() {
          expect(totalLinks).toEqual(totalCount);
          expect(addedLinks).toEqual(addedCount);
          expect(deletedLinks).toEqual(deletedCount);
        });
      },
      /**
       * This method compares text contents of 2 version's state contents to
       * provided text contents
       * v1 is most recent state and v2 is older state
       *    Args:
       *        v1StateContents(dict of dict) : dicts containing state details
       *                                        of v1
       *        v2StateContents(dict of dict) : dicts containing state details
       *                                        of v2
       *    Details of the dict:
       *        dict key - line # : exact line # of text
       *        dict value - dicts containg info about text and whether text is
       *                     highlighted/not highlighted
       *                     - text: the exact string of text expected on that
       *                             line
       *                     - highlighted: true or false
       */
      expectTextToMatch: function(v1StateContents, v2StateContents) {
        forms.CodeMirrorChecker(
          element.all(by.css('.CodeMirror-code')).first()
        ).expectTextToBe(v1StateContents);
        forms.CodeMirrorChecker(
          element.all(by.css('.CodeMirror-code')).last()
        ).expectTextToBe(v2StateContents);
      },
      /*
       *  This function compares regular/highlighted text contents of 2
       *  versions' state contents to provided text contents
       *  v1 is most recent state and v2 is older state
       *    Args:
       *        v1StateContents(dict) : dicts containing state details of v1
       *        v2StateContents(dict) : dicts containing state details of v2
       *    Details of the dict:
       *        dict key - text : extract of string of expected text
       *        dict key - highlighted : true or false
       */
      expectTextWithHighlightingToMatch: function(
          v1StateContents, v2StateContents) {
        forms.CodeMirrorChecker(
          element.all(by.css('.CodeMirror-code')).first()
        ).expectTextWithHighlightingToBe(v1StateContents);
        forms.CodeMirrorChecker(
          element.all(by.css('.CodeMirror-code')).last()
        ).expectTextWithHighlightingToBe(v2StateContents);
      }
    };
  };

  // This function assumes that the selected version is valid and found on the
  // first page of the exploration history.
  this.revertToVersion = function(version) {
    var versionPosition = null;
    historyCheckboxSelector.count().then(function(versionNumber) {
      // Note: there is no 'revert' link next to the current version
      versionPosition = versionNumber - version - 1;
      revertVersionButton.get(versionPosition).click();
      confirmRevertVersionButton.click();
    });
  };
};

exports.ExplorationEditorHistoryTab = ExplorationEditorHistoryTab;
