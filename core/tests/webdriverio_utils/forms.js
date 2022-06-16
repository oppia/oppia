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
 * out end-to-end testing with webdriverio.
 */

// Note: Instantiating some of the editors, e.g. RichTextEditor, occurs
// asynchronously and so must be prefixed by "await".

var richTextComponents = require(
  '../../../extensions/rich_text_components/webdriverio.js');
var objects = require('../../../extensions/objects/webdriverio.js');
var waitFor = require('./waitFor.js');
var action = require('./action.js');

var DictionaryEditor = function(elem) {
  return {
    editEntry: async function(index, objectType) {
      var entry = await elem.$$(
        '.protractor-test-schema-based-dict-editor').get(index);
      var editor = getEditor(objectType);
      return await editor(entry);
    }
  };
};

var UnicodeEditor = function(elem) {
  return {
    setValue: async function(text) {
      await action.clear('Input Field', await elem.$('<input>'));
      await action.keys(
        'Input Field',
        await elem.$('<input>'), text);
    }
  };
};

var AutocompleteDropdownEditor = function(elem) {
  var containerLocator = '.select2-container';
  var searchInputLocator = '.select2-search input';
  return {
    setValue: async function(text) {
      var dropdownElement = await $('.select2-dropdown');
      await action.click('Container Element', await elem.$(containerLocator));
      await action.waitForAutosave();
      // NOTE: the input field is top-level in the DOM, and is outside the
      // context of 'elem'. The 'select2-dropdown' id is assigned to the input
      // field when it is 'activated', i.e. when the dropdown is clicked.
      await action.keys(
        'Dropdown Element',
        await dropdownElement.$(searchInputLocator),
        text + '\n');
    },
    expectOptionsToBe: async function(expectedOptions) {
      var dropdownElement = await $('.select2-dropdown');
      await action.click('Container Element', await elem.$(containerLocator));
      var actualOptions = await dropdownElement.$$('<li>').map(
        async function(optionElem) {
          return await action.getText('Option Elem', optionElem);
        }
      );
      expect(actualOptions).toEqual(expectedOptions);
      // Re-close the dropdown.
      await action.keys(
        'Dropdown Element',
        await dropdownElement.$(searchInputLocator),
        '\n');
    }
  };
};

// var GraphEditor = function(graphInputContainer) {
//   if (!graphInputContainer) {
//     throw new Error('Please provide Graph Input Container element');
//   }
//   var vertexElement = async function(index) {
//     // Would throw incorrect element error if provided incorrect index number.
//     // Node index starts at 0.
//     return await graphInputContainer.$(
//       `.protractor-test-graph-vertex-${index}`);
//   };

//   var createVertex = async function(xOffset, yOffset) {
//     var addNodeButton = await graphInputContainer.$(
//       '.protractor-test-Add-Node-button');
//     await action.click('Add Node Button', addNodeButton);
//     // Offsetting from the graph container.
//     await browser.actions().mouseMove(
//       graphInputContainer, {x: xOffset, y: yOffset}).perform();
//     await browser.actions().click().perform();
//   };

//   var createEdge = async function(vertexIndex1, vertexIndex2) {
//     var addEdgeButton = await graphInputContainer.$(
//       '.protractor-test-Add-Edge-button');
//     await action.click('Add Edge Button', addEdgeButton);
//     await browser.actions().mouseMove(
//       vertexElement(vertexIndex1)).perform();
//     await browser.actions().mouseDown().perform();
//     await browser.actions().mouseMove(
//       vertexElement(vertexIndex2)).perform();
//     await browser.actions().mouseUp().perform();
//   };

//   return {
//     setValue: async function(graphDict) {
//       var nodeCoordinatesList = graphDict.vertices;
//       var edgesList = graphDict.edges;
//       if (nodeCoordinatesList) {
//         expect(nodeCoordinatesList.length).toBeGreaterThan(0);
//         // Assume x-coord is at index 0.
//         for (coordinateElement of nodeCoordinatesList) {
//           await createVertex(coordinateElement[0], coordinateElement[1]);
//         }
//       }
//       if (edgesList) {
//         for (edgeElement of edgesList) {
//           await createEdge(edgeElement[0], edgeElement[1]);
//         }
//       }
//     },
//     clearDefaultGraph: async function() {
//       var deleteButton = await graphInputContainer.$(
//         '.protractor-test-Delete-button');
//       await action.click('Delete Button', deleteButton);
//       // Sample graph comes with 3 vertices.
//       for (var i = 2; i >= 0; i--) {
//         await action.click(`Vertex Element ${i}`, vertexElement(i));
//       }
//     },
//     expectCurrentGraphToBe: async function(graphDict) {
//       var nodeCoordinatesList = graphDict.vertices;
//       var edgesList = graphDict.edges;
//       if (nodeCoordinatesList) {
//         // Expecting total no. of vertices on the graph matches with the given
//         // dict's vertices.
//         for (var i = 0; i < nodeCoordinatesList.length; i++) {
//           expect(await vertexElement(i).isDisplayed()).toBe(true);
//         }
//       }
//       if (edgesList) {
//         var allEdgesElement = await $$('.protractor-test-graph-edge');
//         // Expecting total no. of edges on the graph matches with the given
//         // dict's edges.
//         expect(await allEdgesElement.count()).toEqual(edgesList.length);
//       }
//     }
//   };
// };

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
    await (await rteElements[0]).setValue(text);
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
      var doneButton = await modal.$(closeRteComponentButtonLocator);
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

var CodeStringEditor = function(elem) {
  return {
    setValue: async function(code) {
      var stringEditorTextArea = await elem.$('textarea');
      await action.clear('String Editor Text Area', stringEditorTextArea);
      await action.keys(
        'String Editor Text Area',
        stringEditorTextArea,
        code);
    }
  };
};


// This converts a string into a function that represents rich text, which can
// then be sent to either editRichText() or expectRichText(). The string should
// not contain any html formatting. In the first case the function created will
// write the given text into the rich text editor (as plain text), and in
// the second it will verify that the html created by a rich text editor
// consists of the given text (without any formatting).
//   This is necessary because the Protractor tests do not have an abstract
// representation of a 'rich text object'. This is because we are more
// interested in the process of interacting with the page than in the
// information thereby conveyed.
var toRichText = async function(text) {
  // The 'handler' should be either a RichTextEditor or RichTextChecker.
  return async function(handler) {
    if (handler.hasOwnProperty('setPlainText')) {
      await handler.setPlainText(text);
    } else {
      await handler.readPlainText(text);
    }
  };
};

// This is used by the list and dictionary editors to retrieve the editors of
// their entries dynamically.
var FORM_EDITORS = {
  CodeString: CodeStringEditor,
  Dictionary: DictionaryEditor,
  Graph: GraphEditor,
  List: ListEditor,
  Real: RealEditor,
  RichText: RichTextEditor,
  SetOfTranslatableHtmlContentIds: SetOfTranslatableHtmlContentIdsEditor,
  Unicode: UnicodeEditor
};

var getEditor = function(formName) {
  if (FORM_EDITORS.hasOwnProperty(formName)) {
    return FORM_EDITORS[formName];
  } else if (objects.OBJECT_EDITORS.hasOwnProperty(formName)) {
    return objects.OBJECT_EDITORS[formName];
  } else {
    throw new Error('Unknown form / object requested: ' + formName);
  }
};

exports.CodeStringEditor = CodeStringEditor;
exports.RichTextEditor = RichTextEditor;
exports.toRichText = toRichText;
exports.UnicodeEditor = UnicodeEditor;
exports.AutocompleteDropdownEditor = AutocompleteDropdownEditor;

exports.getEditor = getEditor;
