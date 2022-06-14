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
 * @fileoverview Utilities for interacting with forms when carrrying
 * out end-to-end testing with protractor.
 */

// Note: Instantiating some of the editors, e.g. RichTextEditor, occurs
// asynchronously and so must be prefixed by "await".

var RichTextEditor = async function(elem) {
  var rteElements = await $$('.protractor-test-rte');
  var modalDialogElements = await $$('.modal-dialog');
  var modalDialogLength = modalDialogElements.length;
  var closeRteComponentButtonLocator = (
    '.protractor-test-close-rich-text-component-editor');
  // Set focus in the RTE.
  await waitFor.elementToBeClickable(rteElements[0]);
  await (await rteElements[0]).click();

  var _appendContentText = async function(text) {
    await (await rteElements[0]).keys(text);
  };
  var _clickToolbarButton = async function(buttonName) {
    await waitFor.elementToBeClickable(
      elem.$('.' + buttonName),
      'Toolbar button takes too long to be clickable.');
    await elem.$('.' + buttonName).click();
  };
  var _clearContent = async function() {
    await expect(
      await (await rteElements[0]).isPresent()
    ).toBe(true);
    await (await rteElements[0]).clearValue();
  };

  return {
    clear: async function() {
      await _clearContent();
    },
    setPlainText: async function(text) {
      await _clearContent();
      await _appendContentText(text);
    },
    appendPlainText: async function(text) {
      await _appendContentText(text);
    },
    appendBoldText: async function(text) {
      await _clickToolbarButton('cke_button__bold');
      await _appendContentText(text);
      await _clickToolbarButton('cke_button__bold');
    },
    appendItalicText: async function(text) {
      await _clickToolbarButton('cke_button__italic');
      await _appendContentText(text);
      await _clickToolbarButton('cke_button__italic');
    },
    appendOrderedList: async function(textArray) {
      await _appendContentText('\n');
      await _clickToolbarButton('cke_button__numberedlist');
      for (var i = 0; i < textArray.length; i++) {
        await _appendContentText(textArray[i] + '\n');
      }
      await _clickToolbarButton('cke_button__numberedlist');
    },
    appendUnorderedList: async function(textArray) {
      await _appendContentText('\n');
      await _clickToolbarButton('cke_button__bulletedlist');
      for (var i = 0; i < textArray.length; i++) {
        await _appendContentText(textArray[i] + '\n');
      }
      await _clickToolbarButton('cke_button__bulletedlist');
    },
    // This adds and customizes RTE components.
    // Additional arguments may be sent to this function, and they will be
    // passed on to the relevant RTE component editor.
    addRteComponent: async function(componentName) {
      await _clickToolbarButton(
        'cke_button__oppia' + componentName.toLowerCase());

      // The currently active modal is the last in the DOM.
      var modal = modalDialogElements[modalDialogLength - 1];

      // Need to convert arguments to an actual array; we tell the component
      // which modal to act on but drop the componentName.
      var args = [modal];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      await richTextComponents.getComponent(componentName)
        .customizeComponent.apply(null, args);
      var doneButton = modal.$(closeRteComponentButtonLocator);
      await action.click('Save Button', doneButton);
      await waitFor.invisibilityOf(
        modal, 'Customization modal taking too long to disappear.');
      // Ensure that focus is not on added component once it is added so that
      // the component is not overwritten by some other element.
      if (
        [
          'Video', 'Image', 'Collapsible', 'Tabs'
        ].includes(componentName)) {
        // RteElementFirst can be found in beginning of RichTextEditor function.
        await action.keys(
          'First RTE Element',
          rteElements[0],
          'PageDown');
      }

      // Ensure that the cursor is at the end of the RTE.
      await action.keys(
        'First RTE Element',
        rteElements[0],
        ['Control', 'End']);
    }
  };
};

exports.RichTextEditor = RichTextEditor;
