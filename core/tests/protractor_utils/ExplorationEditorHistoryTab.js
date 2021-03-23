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
var action = require('./action.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorHistoryTab = function() {
  /*
   * Interactive elements
   */
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
  var revertVersionButton = element(by.css('.protractor-test-revert-version'));
  var resetGraphButton = element(by.css('.protractor-test-reset-graph'));
  var historyListOptions = element.all(
    by.css('.protractor-test-history-list-options'));
  var confirmRevertVersionButton = element(
    by.css('.protractor-test-confirm-revert'));

  /*
   * Display
   */
  var datesCommitsWereSaved = element.all(
    by.css('.protractor-test-history-tab-commit-date'));

  /*
   * Links
   */
  var historyGraphLink = historyGraph.all(by.css('.protractor-test-link'));

  /*
   * Workflows
   */

  /*
   * This method checks if the commit dates are being displayed in
   * the "List of Changes" section of the history tab.
  */
  this.expectCommitDatesToBeDisplayed = async function() {
    var numCommitDates = await datesCommitsWereSaved.count();
    for (var i = 0; i < numCommitDates; i++) {
      await waitFor.visibilityOf(
        datesCommitsWereSaved.get(
          i), 'Dates Commits Were Saved taking too long to appear');
      var date = await datesCommitsWereSaved.get(i).getText();
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
        var listOfNames = await stateNodes.map(async function(stateElement) {
          await waitFor.visibilityOf(stateNodeLabel(
            stateElement), 'State Node Label taking too long to appear');
          return await stateNodeLabel(stateElement).getText();
        });
        var matched = false;
        for (var i = 0; i < listOfNames.length; i++) {
          if (listOfNames[i] === stateName) {
            var stateNodeButton = stateNodes.get(i);
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
      deselectVersion: async function() {
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
        var firstVersionDropdown = element(
          by.css('.protractor-test-history-version-dropdown-first'));
        var versionNumber1Button = firstVersionDropdown.element(
          by.cssContainingText('option', versionNumber1));
        await action.click('Version Number1 Button', versionNumber1Button);

        var secondVersionDropdown = element(
          by.css('.protractor-test-history-version-dropdown-second'));
        var versionNumber2Button = secondVersionDropdown.element(
          by.cssContainingText('option', versionNumber2));
        await action.click('Version Number2 Button', versionNumber2Button);
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
        var states = await stateNodes.map(async function(stateElement) {
          await waitFor.visibilityOf(stateNodeLabel(
            stateElement), 'State Node Label taking too long to appear');
          var label = await stateNodeLabel(stateElement).getText();
          var color = await stateNodeBackground(stateElement).getCssValue(
            'fill');
          return {
            label: label,
            color: color
          };
        });
        expect(states.length).toEqual(expectedStates.length);
        // Note: we need to compare this way because the state graph is
        // sometimes generated with states in different configurations.
        states.forEach(function(element) {
          expect(expectedStates).toContain(element);
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
      expectNumberOfLinksToMatch: async function(
          totalLinks, addedLinks, deletedLinks) {
        var COLOR_ADDED = 'rgb(31, 125, 31)';
        var COLOR_DELETED = 'rgb(178, 34, 34)';
        var totalCount = 0;
        var addedCount = 0;
        var deletedCount = 0;
        await historyGraphLink.map(async function(link) {
          var linkColor = await link.getCssValue('stroke');
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
        await forms.CodeMirrorChecker(
          element.all(by.css('.CodeMirror-code')).first(),
          'first'
        ).expectTextToBe(v1StateContents);
        await forms.CodeMirrorChecker(
          element.all(by.css('.CodeMirror-code')).last(),
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
        await forms.CodeMirrorChecker(
          await element.all(by.css('.CodeMirror-code')).first(),
          'first'
        ).expectTextWithHighlightingToBe(v1StateContents);
        await forms.CodeMirrorChecker(
          await element.all(by.css('.CodeMirror-code')).last(),
          'last'
        ).expectTextWithHighlightingToBe(v2StateContents);
      }
    };
  };

  // This function assumes that the selected version is valid and found on the
  // first page of the exploration history.
  this.revertToVersion = async function(version) {
    // Note: there is no 'revert' link next to the current version.
    await action.click(
      'History list options', historyListOptions.get(version - 1));
    await action.click(
      'Revert version button', revertVersionButton);
    await action.click(
      'Confirm revert button', confirmRevertVersionButton);
  };
};

exports.ExplorationEditorHistoryTab = ExplorationEditorHistoryTab;
