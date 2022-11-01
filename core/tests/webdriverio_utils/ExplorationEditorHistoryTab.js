// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * use in Webdriverio tests.
 */

var forms = require('./forms.js');
var action = require('./action.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorHistoryTab = function() {
  /*
   * Interactive elements
   */
  var historyGraph = $('.e2e-test-history-graph');
  var codeMirrorElementSelector = function() {
    return $$('.CodeMirror-code');
  };
  var toastSuccessElement = $('.toast-success');
  var firstVersionDropdown = $('.e2e-test-history-version-dropdown-first');
  var secondVersionDropdown = $('.e2e-test-history-version-dropdown-second');
  var historyTableMessage = $('.e2e-test-history-table-message');
  var stateNodeBackground = function(nodeElement) {
    return nodeElement.$('.e2e-test-node-background');
  };
  var stateNodeLabel = function(nodeElement) {
    return nodeElement.$('.e2e-test-node-label');
  };

  /*
   * Buttons
   */
  var closeStateHistoryButton = $('.e2e-test-close-history-state-modal');
  var revertVersionButton = $('.e2e-test-revert-version');
  var resetGraphButton = $('.e2e-test-reset-graph');
  var historyListOptionsSelector = function() {
    return $$('.e2e-test-history-list-options');
  };
  var confirmRevertVersionButton = $('.e2e-test-confirm-revert');
  var viewMetadataHistoryButton = $('.e2e-test-view-metadata-history');
  var closeMetadataHistoryButton = $('.e2e-test-close-history-metadata-modal');

  /*
   * Display
   */
  var datesCommitsWereSavedSelector = function() {
    return $$('.e2e-test-history-tab-commit-date');
  };
  /*
   * Workflows
   */

  /*
   * This method checks if the commit dates are being displayed in
   * the "List of Changes" section of the history tab.
  */
  this.expectCommitDatesToBeDisplayed = async function() {
    var datesCommitsWereSaved = await datesCommitsWereSavedSelector();
    var numCommitDates = datesCommitsWereSaved.length;
    for (var i = 0; i < numCommitDates; i++) {
      await waitFor.visibilityOf(
        datesCommitsWereSaved[i],
        'Dates Commits Were Saved taking too long to appear');
      var date = await datesCommitsWereSaved[i].getText();
      // The dates can be of varying format
      // (see getLocaleAbbreviatedDatetimeString). To play it
      // safe and to keep it simple, we will just check if the
      // date string contains a digit.
      expect(date).toMatch(/\d/);
    }
  };

  this.getHistoryGraph = function() {
    return {
      openStateHistory: async function(stateName) {
        var stateNodes = historyGraph.$$('.e2e-test-node');
        var listOfNames = await stateNodes.map(async function(stateElement) {
          await waitFor.visibilityOf(stateNodeLabel(
            stateElement), 'State Node Label taking too long to appear');
          return await stateNodeLabel(stateElement).getText();
        });
        var matched = false;
        var stateNodes = await historyGraph.$$('.e2e-test-node');
        for (var i = 0; i < listOfNames.length; i++) {
          if (listOfNames[i] === stateName) {
            var stateNodeButton = stateNodes[i];
            await action.click('State Node Button', stateNodeButton);
            matched = true;
          }
        }
        if (!matched) {
          throw new Error(
            'State ' + stateName + ' not found by getHistoryGraph.');
        }
      },
      closeStateHistory: async function() {
        await waitFor.elementToBeClickable(
          closeStateHistoryButton,
          'Close State History button is not clickable');
        expect(await closeStateHistoryButton.isDisplayed()).toBe(true);
        await action.click(
          'Close State History Button', closeStateHistoryButton);
        await waitFor.invisibilityOf(
          closeStateHistoryButton,
          'Close State History button takes too long to disappear.');
      },
      openExplorationMetadataHistory: async function() {
        await action.click(
          'View metadata changes button', viewMetadataHistoryButton);
      },
      closeExplorationMetadataHistory: async function() {
        await waitFor.elementToBeClickable(
          closeMetadataHistoryButton,
          'Close metadata history button is not clickable');
        expect(await closeMetadataHistoryButton.isDisplayed()).toBe(true);
        await action.click(
          'Close metadata history button', closeMetadataHistoryButton);
        await waitFor.invisibilityOf(
          closeMetadataHistoryButton,
          'Close metadata history button takes too long to disappear.');
      },
      deselectVersion: async function() {
        await waitFor.invisibilityOf(
          toastSuccessElement,
          'Toast message is taking too long to disappear after saving changes');
        await action.click('Reset graph button', resetGraphButton);
      },
      /*
       * This method selects two version's checkboxes to be compared
       *    Args:
       *        versionNumber1 (int) : history version # 1
       *        versionNumber2 (int) : history version # 2
       */
      selectTwoVersions: async function(versionNumber1, versionNumber2) {
        // Array starts at 0.
        await action.matSelect(
          'Version Number1 Button', firstVersionDropdown, versionNumber1);

        await action.matSelect(
          'Version Number2 Button', secondVersionDropdown,
          versionNumber2);
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
      expectHistoryStatesToMatch: async function(expectedStates) {
        await waitFor.visibilityOf(
          historyGraph, 'History graph takes too long to be visible.');
        var stateNodes = historyGraph.$$('.e2e-test-node');
        var states = await stateNodes.map(async function(stateElement) {
          await waitFor.visibilityOf(await stateNodeLabel(
            stateElement), 'State Node Label taking too long to appear');
          var label = await stateNodeLabel(stateElement).getText();
          var color = (await stateNodeBackground(
            stateElement).getCSSProperty('fill')).value;
          return {
            label: label,
            color: color
          };
        });
        expect(states.length).toEqual(expectedStates.length);
        // Note: we need to compare this way because the state graph is
        // sometimes generated with states in different configurations.
        for (var index = 0; index < states.length; index++) {
          var state = states[index];
          expect(expectedStates).toContain(state);
        }
      },
      /*
       * This method checks for the number of deleted links(red), added links
       * (green) and the total numbers on the history graph
       *    Args:
       *        totalLinks (int) : total number of links
       *        addedLinks (int) : number of added links
       *        deletedLinks (int) : number of deleted links
       */
      expectNumberOfLinksToMatch: async function(
          totalLinks, addedLinks, deletedLinks) {
        var COLOR_ADDED = 'rgb(31,125,31)';
        var COLOR_DELETED = 'rgb(178,34,34)';
        var totalCount = 0;
        var addedCount = 0;
        var deletedCount = 0;
        var historyGraphLink = historyGraph.$$('.e2e-test-link');
        await historyGraphLink.map(async function(link) {
          var linkColor = (await link.getCSSProperty('stroke')).value;
          totalCount++;
          if (linkColor === COLOR_ADDED) {
            addedCount++;
          } else if (linkColor === COLOR_DELETED) {
            deletedCount++;
          }
          return;
        });
        expect(totalLinks).toEqual(totalCount);
        expect(addedLinks).toEqual(addedCount);
        expect(deletedLinks).toEqual(deletedCount);
      },
      /**
       * This method compares text contents of 2 version's state contents to
       * provided text contents
       * v1 is older state and v2 is most recent state
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
      expectTextToMatch: async function(v1StateContents, v2StateContents) {
        var codeMirrorElement = await codeMirrorElementSelector();
        var lastElement = codeMirrorElement.length - 1;
        await forms.CodeMirrorChecker(
          codeMirrorElement[0],
          'first'
        ).expectTextToBe(v1StateContents);
        await forms.CodeMirrorChecker(
          codeMirrorElement[lastElement],
          'last'
        ).expectTextToBe(v2StateContents);
      },
      /*
       *  This function compares regular/highlighted text contents of 2
       *  versions' state contents to provided text contents
       *  v1 is older state and v2 is most recent state
       *    Args:
       *        v1StateContents(dict) : dicts containing state details of v1
       *        v2StateContents(dict) : dicts containing state details of v2
       *    Details of the dict:
       *        dict key - text : extract of string of expected text
       *        dict key - highlighted : true or false
       */
      expectTextWithHighlightingToMatch: async function(
          v1StateContents, v2StateContents) {
        var codeMirrorElement = await codeMirrorElementSelector();
        var lastElement = codeMirrorElement.length - 1;
        await forms.CodeMirrorChecker(
          codeMirrorElement[0],
          'first'
        ).expectTextWithHighlightingToBe(v1StateContents);
        await forms.CodeMirrorChecker(
          codeMirrorElement[lastElement],
          'last'
        ).expectTextWithHighlightingToBe(v2StateContents);
      }
    };
  };

  // This function assumes that the selected version is valid and found on the
  // first page of the exploration history.
  this.revertToVersion = async function(version) {
    // Note: there is no 'revert' link next to the current version.
    var historyListOptions = await historyListOptionsSelector();
    await action.click(
      'History list options', historyListOptions[version - 1]);
    await action.click(
      'Revert version button', revertVersionButton);
    await action.click(
      'Confirm revert button', confirmRevertVersionButton);
  };

  this.expectRevertToVersion = async function(version) {
    await waitFor.numberOfElementsToBe(
      '.e2e-test-history-table-message', 'History Table message', 4);
    await waitFor.textToBePresentInElement(
      historyTableMessage,
      'Reverted exploration to version ' + version,
      'Revert message takes too long to appear');
  };
};

exports.ExplorationEditorHistoryTab = ExplorationEditorHistoryTab;
