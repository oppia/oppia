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
        '.e2e-test-schema-based-dict-editor')[index];
      var editor = getEditor(objectType);
      return await editor(entry);
    }
  };
};

var GraphEditor = function(graphInputContainer) {
  if (!graphInputContainer) {
    throw new Error('Please provide Graph Input Container element');
  }
  var vertexElement = async function(index) {
    // Would throw incorrect element error if provided incorrect index number.
    // Node index starts at 0.
    return graphInputContainer.$(
      `.e2e-test-graph-vertex-${index}`);
  };

  var createVertex = async function(xOffset, yOffset) {
    var addNodeButton = await graphInputContainer.$(
      '.e2e-test-Add-Node-button');
    await action.click('Add Node Button', addNodeButton);
    // Offsetting from the graph container.
    await graphInputContainer.click({x: xOffset, y: yOffset});
  };

  var createEdge = async function(vertexIndex1, vertexIndex2) {
    var addEdgeButton = await graphInputContainer.$(
      '.e2e-test-Add-Edge-button');
    await action.click('Add Edge Button', addEdgeButton);
    var vertexElement1 = await vertexElement(vertexIndex1);
    var vertexElement2 = await vertexElement(vertexIndex2);

    await vertexElement1.dragAndDrop(vertexElement2);
  };

  return {
    setValue: async function(graphDict) {
      var nodeCoordinatesList = graphDict.vertices;
      var edgesList = graphDict.edges;
      if (nodeCoordinatesList) {
        expect(nodeCoordinatesList.length).toBeGreaterThan(0);
        // Assume x-coord is at index 0.
        for (coordinateElement of nodeCoordinatesList) {
          await createVertex(coordinateElement[0], coordinateElement[1]);
        }
      }
      if (edgesList) {
        for (edgeElement of edgesList) {
          await createEdge(edgeElement[0], edgeElement[1]);
        }
      }
    },
    clearDefaultGraph: async function() {
      var deleteButton = await graphInputContainer.$(
        '.e2e-test-Delete-button');
      await action.click('Delete Button', deleteButton);
      // Sample graph comes with 3 vertices.
      for (var i = 2; i >= 0; i--) {
        await action.click(`Vertex Element ${i}`, await vertexElement(i));
      }
    },
    expectCurrentGraphToBe: async function(graphDict) {
      var nodeCoordinatesList = graphDict.vertices;
      var edgesList = graphDict.edges;
      if (nodeCoordinatesList) {
        // Expecting total no. of vertices on the graph matches with the given
        // dict's vertices.
        for (var i = 0; i < nodeCoordinatesList.length; i++) {
          var graphVertexElement = await vertexElement(i);
          expect(await graphVertexElement.isDisplayed()).toBe(true);
        }
      }
      if (edgesList) {
        var allEdgesElement = await $$('.e2e-test-graph-edge');
        // Expecting total no. of edges on the graph matches with the given
        // dict's edges.
        expect(allEdgesElement.length).toEqual(edgesList.length);
      }
    }
  };
};

var ListEditor = function(elem) {
  var deleteListEntryLocator = '.e2e-test-delete-list-entry';
  var addListEntryLocator = '.e2e-test-add-list-entry';
  // NOTE: this returns a promise, not an integer.
  var _getLength = async function() {
    var items =
      await elem.$$(
        '#e2e-test-schema-based-list-editor-table-row');
    return items.length;
  };
  // If objectType is specified this returns an editor for objects of that type
  // which can be used to make changes to the newly-added item (for example
  // by calling setValue() on it). Clients should ensure the given objectType
  // corresponds to the type of elements in the list.
  // If objectType is not specified, this function returns nothing.
  var addItem = async function(objectType = null) {
    var listLength = await _getLength();
    var addListEntryButton = elem.$(addListEntryLocator);
    await action.click('Add List Entry Button', addListEntryButton);
    if (objectType !== null) {
      return await getEditor(objectType)(await elem.$$(
        '.e2e-test-schema-based-list-editor-table-data')[listLength]);
    }
  };
  var deleteItem = async function(index) {
    var item = await $$(
      '.e2e-test-schema-based-list-editor-table-data')[index];

    var deleteItemFieldElem = item.$(
      deleteListEntryLocator);
    await action.click('Delete Item Field Elem', deleteItemFieldElem);
  };

  return {
    editItem: async function(index, objectType) {
      var item = await elem.$$(
        '.e2e-test-schema-based-list-editor-table-data')[index];

      var editor = getEditor(objectType);
      return await editor(item);
    },
    addItem: addItem,
    deleteItem: deleteItem,
    // This will add or delete list elements as necessary.
    setLength: async function(desiredLength) {
      var startingLength = await elem.$$(
        '#e2e-test-schema-based-list-editor-table-row').length;
      for (var i = startingLength; i < desiredLength; i++) {
        await addItem();
      }
      for (var j = startingLength - 1; j >= desiredLength; j--) {
        await deleteItem(j);
      }
    }
  };
};

var RealEditor = function(elem) {
  return {
    setValue: async function(value) {
      await action.clear('Text Input', elem.$('<input>'));
      await action.setValue(
        'Text Input', elem.$('<input>'), value);
    }
  };
};

var RichTextEditor = async function(elem) {
  var rteElement = elem.$('.e2e-test-rte');
  var modalDialogElementsSelector = function() {
    return $$('.modal-dialog');
  };

  var closeRteComponentButtonLocator = (
    '.e2e-test-close-rich-text-component-editor');
  // Set focus in the RTE.
  await waitFor.visibilityOf(
    rteElement, 'First RTE element is not visible');
  var rteElements = await elem.$$('.e2e-test-rte');
  await waitFor.elementToBeClickable(
    rteElements[0],
    'First RTE element taking too long to become clickable.'
  );
  await rteElements[0].click();

  var _appendContentText = async function(text) {
    await rteElements[0].addValue(text);
  };
  var _clickToolbarButton = async function(buttonName) {
    await waitFor.elementToBeClickable(
      elem.$(buttonName),
      'Toolbar button takes too long to be clickable.');
    await elem.$(buttonName).click();
  };
  var _clearContent = async function() {
    expect(
      await rteElements[0].isExisting()
    ).toBe(true);
    await rteElements[0].clearValue();
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
      await _clickToolbarButton('.cke_button__bold');
      await _appendContentText(text);
      await _clickToolbarButton('.cke_button__bold');
    },
    appendItalicText: async function(text) {
      await _clickToolbarButton('.cke_button__italic');
      await _appendContentText(text);
      await _clickToolbarButton('.cke_button__italic');
    },
    appendOrderedList: async function(textArray) {
      await _appendContentText('\n');
      await _clickToolbarButton('.cke_button__numberedlist');
      for (var i = 0; i < textArray.length; i++) {
        await _appendContentText(textArray[i] + '\n');
      }
      await _clickToolbarButton('.cke_button__numberedlist');
    },
    appendUnorderedList: async function(textArray) {
      await _appendContentText('\n');
      await _clickToolbarButton('.cke_button__bulletedlist');
      for (var i = 0; i < textArray.length; i++) {
        await _appendContentText(textArray[i] + '\n');
      }
      await _clickToolbarButton('.cke_button__bulletedlist');
    },
    // This adds and customizes RTE components.
    // Additional arguments may be sent to this function, and they will be
    // passed on to the relevant RTE component editor.
    addRteComponent: async function(componentName) {
      await _clickToolbarButton(
        '.cke_button__oppia' + componentName.toLowerCase());

      var modalDialogElements = await modalDialogElementsSelector();
      var modalDialogLength = modalDialogElements.length;
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
        await action.addValue(
          'First RTE Element',
          rteElements[0],
          'ArrowDown');
      }

      // Ensure that the cursor is at the end of the RTE.
      await action.addValue(
        'First RTE Element',
        rteElements[0],
        ['Control', 'End']);
    }
  };
};

// Used to edit entries of a set of HTML strings, specifically used in the item
// selection interaction test to customize interaction details.
var SetOfTranslatableHtmlContentIdsEditor = function(elem) {
  return {
    editEntry: async function(index, objectType) {
      var entry = await elem.$$(
        '.e2e-test-schema-based-dict-editor')[index];
      var editor = getEditor(objectType);
      return await editor(entry);
    }
  };
};


var UnicodeEditor = function(elem) {
  return {
    setValue: async function(text) {
      await action.clear('Input Field', await elem.$('<input>'));
      await action.setValue(
        'Input Field',
        elem.$('<input>'), text);
    }
  };
};

var AutocompleteDropdownEditor = function(elem) {
  var containerLocator = '.e2e-test-exploration-category-dropdown';
  var searchInputLocator = '.mat-select-search-input.mat-input-element';
  var categorySelectorChoice = '.e2e-test-exploration-category-selector-choice';
  var searchInputLocatorTextElement = function(text) {
    return $$(`.e2e-test-exploration-category-selector-choice=${text}`);
  };

  return {
    setValue: async function(text) {
      await action.click('Container Element', elem.$(containerLocator));
      await action.waitForAutosave();
      // NOTE: the input field is top-level in the DOM, and is outside the
      // context of 'elem'. The 'select2-dropdown' id is assigned to the input
      // field when it is 'activated', i.e. when the dropdown is clicked.

      await action.setValue(
        'Dropdown Element Search', $(searchInputLocator), text);

      var searchInputLocatorTextOption = await searchInputLocatorTextElement(
        text)[0];
      await action.click(
        'Dropdown Element Select',
        searchInputLocatorTextOption);
    },
    expectOptionsToBe: async function(expectedOptions) {
      await action.click(
        'Container Element', await elem.$(containerLocator));
      var actualOptions = await $$(categorySelectorChoice).map(
        async function(optionElem) {
          return await action.getText('Option Elem', optionElem);
        }
      );
      expect(actualOptions).toEqual(expectedOptions);
      // Re-close the dropdown.
      await action.setValue(
        'Dropdown Element',
        $(searchInputLocator),
        '\n');
    }
  };
};

var AutocompleteMultiDropdownEditor = function(elem) {
  var selectionChoiceRemoveLocator =
    '.select2-selection__choice__remove';
  var selectionRenderedLocator = '.select2-selection__rendered';
  return {
    setValues: async function(texts) {
      // Clear all existing choices.
      var deleteButtons = await elem.$(selectionRenderedLocator).$$(
        '<li>').map(function(choiceElem) {
        return choiceElem.element(selectionChoiceRemoveLocator);
      });
      // We iterate in descending order, because clicking on a delete button
      // removes the element from the DOM. We also omit the last element
      // because it is the field for new input.
      for (var i = deleteButtons.length - 2; i >= 0; i--) {
        await action.click(`Delete Buttons ${i}`, deleteButtons[i]);
      }

      for (var i = 0; i < texts.length; i++) {
        await action.click('Container Element', elem.$(containerLocator));
        var searchFieldElement = elem.$('.select2-search__field');
        await action.setValue(
          'Search Field Element',
          searchFieldElement,
          texts[i] + '\n');
      }
    },
    expectCurrentSelectionToBe: async function(expectedCurrentSelection) {
      actualSelection = await elem.$(selectionRenderedLocator).$$(
        '<li>').map(async function(choiceElem) {
        return await choiceElem.getText();
      });
      // Remove the element corresponding to the last <li>, which actually
      // corresponds to the field for new input.
      actualSelection.pop();
      expect(actualSelection).toEqual(expectedCurrentSelection);
    }
  };
};

var MultiSelectEditor = function(elem) {
  var searchBarDropdownMenuLocator =
    '.e2e-test-search-bar-dropdown-menu';
  var selectedLocator = '.e2e-test-selected';
  // This function checks that the options corresponding to the given texts
  // have the expected class name, and then toggles those options accordingly.
  var _toggleElementStatusesAndVerifyExpectedClass = async function(
      texts, expectedClassBeforeToggle) {
    // Open the dropdown menu.
    var searchBarDropdownToggleElement = elem.$(
      '.e2e-test-search-bar-dropdown-toggle');
    await action.click(
      'Searchbar DropDown Toggle Element',
      searchBarDropdownToggleElement);

    var filteredElementsCount = 0;
    for (var i = 0; i < texts.length; i++) {
      var filteredElement = elem.$(
        '.e2e-test-search-bar-dropdown-menu').$(`span=${texts[i]}`);
      if (await filteredElement.isExisting()) {
        filteredElementsCount += 1;
        expect(await filteredElement.getAttribute('class')).toMatch(
          expectedClassBeforeToggle);
        await action.click('Filtered Element', filteredElement);
      }
    }

    if (filteredElementsCount !== texts.length) {
      throw new Error(
        'Could not toggle element selection. Values requested: ' + texts +
      '. Found ' + filteredElementsCount + ' matching elements.');
    }

    // Close the dropdown menu at the end.
    await action.click(
      'Searchbar Dropdown Toggle Element',
      searchBarDropdownToggleElement);
  };

  return {
    selectValues: async function(texts) {
      await _toggleElementStatusesAndVerifyExpectedClass(
        texts, 'e2e-test-deselected');
    },
    deselectValues: async function(texts) {
      await _toggleElementStatusesAndVerifyExpectedClass(
        texts, 'e2e-test-selected');
    },
    expectCurrentSelectionToBe: async function(expectedCurrentSelection) {
      // Open the dropdown menu.
      var searchBarDropdownToggleElement = elem.$(
        '.e2e-test-search-bar-dropdown-toggle');
      await action.click(
        'Searchbar Dropdown Toggle Element',
        searchBarDropdownToggleElement);

      // Find the selected elements.
      var actualSelection = await elem.$(searchBarDropdownMenuLocator)
        .$$(selectedLocator).map(async function(selectedElem) {
          return await action.getText('Selected Elem', selectedElem);
        });
      expect(actualSelection).toEqual(expectedCurrentSelection);

      // Close the dropdown menu at the end.
      await action.click(
        'Searchbar Dropdown Toggle Element',
        searchBarDropdownToggleElement);
    }
  };
};

// This function is sent 'elem', which should be the element immediately
// containing the various elements of a rich text area, for example
// <div>
//   plain
//   <b>bold</b>
//   <oppia-noninteractive-math> ... </oppia-noninteractive-math>
// <div>
// The richTextInstructions function will be supplied with a 'handler' argument
// which it should then use to read through the rich-text area using the
// functions supplied by the RichTextChecker below. In the example above
// richTextInstructions should consist of:
//   handler.readPlainText('plain');
//   handler.readBoldText('bold');
//   handler.readRteComponent('Math', ...);
var expectRichText = function(elem) {
  var toMatch = async function(richTextInstructions) {
    await waitFor.visibilityOf(elem, 'RTE taking too long to become visible');
    // TODO(#9821): Find a better way to parse through the tags rather than
    // using xpath.
    // We select all top-level non-paragraph elements, as well as all children
    // of paragraph elements. (Note that it is possible for <p> elements to
    // surround, e.g., <i> tags, so we can't just ignore the <p> elements
    // altogether.)
    var XPATH_SELECTOR = './p/*|./*[not(self::p)]';
    var arrayOfTexts = await elem.$$(XPATH_SELECTOR)
      .map(async function(entry) {
        // It is necessary to obtain the texts of the elements in advance since
        // applying .getText() while the RichTextChecker is running would be
        // asynchronous and so not allow us to update the textPointer
        // synchronously.
        return await action.getText('Entry', entry);
      });
    // We re-derive the array of elements as we need it too.
    var arrayOfElements = await elem.$$(XPATH_SELECTOR);
    var fullText = await action.getText('Elem', elem);
    var checker = await RichTextChecker(
      arrayOfElements, arrayOfTexts, fullText);
    await richTextInstructions(checker);
    await checker.expectEnd();
  };
  return {
    toMatch: toMatch,
    toEqual: async function(text) {
      await toMatch(async function(checker) {
        await checker.readPlainText(text);
      });
    }
  };
};

// This supplies functions to verify the contents of an area of the page that
// was created using a rich-text editor, e.g. <div>text<b>bold</b></div>.
// 'arrayOfElems': the array of promises of top-level element nodes in the
//   rich-text area, e.g [promise of <b>bold</b>].
// 'arrayOfTexts': the array of visible texts of top-level element nodes in
//   the rich-text area, obtained from getText(), e.g. ['bold'].
// 'fullText': a string consisting of all the visible text in the rich text
//   area (including both element and text nodes, so more than just the
//   concatenation of arrayOfTexts), e.g. 'textBold'.
var RichTextChecker = async function(arrayOfElems, arrayOfTexts, fullText) {
  expect(arrayOfElems.length).toEqual(arrayOfTexts.length);
  // These are shared by the returned functions, and records how far through
  // the child elements and text of the rich text area checking has gone. The
  // arrayPointer traverses both arrays simultaneously.
  var arrayPointer = 0;
  var textPointer = 0;
  // RTE components insert line breaks above and below themselves and these are
  // recorded in fullText but not arrayOfTexts so we need to track them
  // specially.
  var justPassedRteComponent = false;

  var _readFormattedText = async function(text, tagName) {
    expect(
      await arrayOfElems[arrayPointer].getTagName()
    ).toBe(tagName);
    // Remove comments introduced by angular for bindings using replace.
    expect(
      (
        await arrayOfElems[arrayPointer].getHTML(false)
      ).replace(/<!--[^>]*-->/g, '').trim()
    ).toBe(text);
    expect(arrayOfTexts[arrayPointer]).toEqual(text);
    arrayPointer = arrayPointer + 1;
    textPointer = textPointer + text.length;
    justPassedRteComponent = false;
  };

  return {
    readPlainText: function(text) {
      // Plain text is in a text node so not recorded in either array.
      expect(
        fullText.substring(textPointer, textPointer + text.length)
      ).toEqual(text);
      textPointer = textPointer + text.length;
      justPassedRteComponent = false;
    },
    readBoldText: async function(text) {
      await _readFormattedText(text, 'strong');
    },
    readItalicText: async function(text) {
      await _readFormattedText(text, 'em');
    },
    // TODO(Jacob): Add functions for other rich text components.
    // Additional arguments may be sent to this function, and they will be
    // passed on to the relevant RTE component editor.
    readRteComponent: async function(componentName) {
      var elem = await arrayOfElems[arrayPointer];
      expect(await elem.getTagName()).
        toBe('oppia-noninteractive-' + componentName.toLowerCase());
      // Need to convert arguments to an actual array; we tell the component
      // which element to act on but drop the componentName.
      var args = [elem];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      expect(await elem.getText()).toBe(arrayOfTexts[arrayPointer]);

      await richTextComponents.getComponent(componentName).
        expectComponentDetailsToMatch.apply(null, args);
      textPointer = textPointer + arrayOfTexts[arrayPointer].length +
        (justPassedRteComponent ? 1 : 2);
      arrayPointer = arrayPointer + 1;
      justPassedRteComponent = true;
    },
    expectEnd: async function() {
      expect(arrayPointer).toBe(await arrayOfElems.length);
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

/**
 * This function is used to read and check CodeMirror.
 * The input 'elem' is the div with the 'CodeMirror-code' class.
 * This assumes that line numbers are enabled, as line numbers are used to
 * identify lines.
 * CodeMirror loads a part of the text at once, and scrolling in the element
 * loads more divs.
 */
var CodeMirrorChecker = function(elem, codeMirrorPaneToScroll) {
  var codeMirrorLineNumberLocator = '.CodeMirror-linenumber';
  var codeMirrorLineBackgroundLocator = '.CodeMirror-linebackground';
  // The number of lines to scroll between reading different sections of
  // CodeMirror's text.
  var NUMBER_OF_LINES_TO_SCROLL = 15;

  /**
   * This recursive function is used by expectTextWithHighlightingToBe().
   * currentLineNumber is the current largest line number processed,
   * scrollTo is the number of pixels from the top of the text that
   * codeMirror should scroll to,
   * codeMirrorPaneToScroll specifies the CodeMirror's left or right pane
   * which is to be scrolled.
   * compareDict is an object whose keys are line numbers and whose values are
   * objects corresponding to that line with the following key-value pairs:
   *  - 'text': the exact string of text expected on that line
   *  - 'highlighted': true or false, whether the line is highlighted
   *  - 'checked': true or false, whether the line has been checked
   * compareHighLighting: Whether highlighting should be compared.
   */
  var _compareText = async function(compareDict, compareHighLighting) {
    var scrollTo = 0;
    var prevScrollTop = -1;
    var actualDiffDict = {};
    var scrollBarWebElement = null;
    var scrollBarElements = await $$('.CodeMirror-vscrollbar');
    if (codeMirrorPaneToScroll === 'first') {
      scrollBarWebElement = scrollBarElements[0];
    } else {
      var lastElement = scrollBarElements.length - 1;
      scrollBarWebElement = scrollBarElements[lastElement];
    }
    while (true) {
      // This is used to match and scroll the text in codemirror to a point
      // scrollTo pixels from the top of the text or the bottom of the text
      // if scrollTo is too large.
      await browser.execute(
        '$(\'.CodeMirror-vscrollbar\').' + codeMirrorPaneToScroll +
        '().scrollTop(' + String(scrollTo) + ');');
      var lineHeight = await elem.$(
        codeMirrorLineNumberLocator).getAttribute('clientHeight');
      var currentScrollTop = await scrollBarWebElement.scrollIntoView();
      if (currentScrollTop === prevScrollTop) {
        break;
      } else {
        prevScrollTop = currentScrollTop;
      }

      var numberOfElements = Object.keys(compareDict).length;
      await waitFor.numberOfElementsToBe(
        elem,
        'Line Number Elements',
        numberOfElements,
        '.CodeMirror-linenumber');
      var lineNumberElements = await elem.$$('.CodeMirror-linenumber');
      var totalCount = lineNumberElements.length;
      for (var i = 0; i < totalCount; i++) {
        var lineNumberElement = lineNumberElements[i];
        await waitFor.elementToBeClickable(lineNumberElement);
        var lineNumber = await lineNumberElement.getText();
        if (lineNumber && !compareDict.hasOwnProperty(lineNumber)) {
          throw new Error('Line ' + lineNumber + ' not found in CodeMirror');
        }
        var lineDivElements = await elem.$$('./div');
        var lineDivElement = lineDivElements[i];
        var lineContentElements = await elem.$$('.CodeMirror-line');
        var lineElement = lineContentElements[i];
        var isHighlighted = await lineDivElement.$(
          codeMirrorLineBackgroundLocator).isExisting();
        var text = await lineElement.getText();
        actualDiffDict[lineNumber] = {
          text: text,
          highlighted: isHighlighted
        };
      }
      scrollTo = scrollTo + lineHeight * NUMBER_OF_LINES_TO_SCROLL;
    }
    for (var lineNumber in compareDict) {
      expect(actualDiffDict[lineNumber].text).toEqual(
        compareDict[lineNumber].text);
      if (compareHighLighting) {
        expect(actualDiffDict[lineNumber].highlighted).toEqual(
          compareDict[lineNumber].highlighted);
      }
    }
  };

  return {
    /**
     * Compares text and highlighting with codeMirror-mergeView. The input
     * should be an object whose keys are line numbers and whose values should
     * be an object with the following key-value pairs:
     *  - text: the exact string of text expected on that line
     *  - highlighted: true or false
     * This runs much slower than checking without highlighting, so the
     * expectTextToBe() function should be used when possible.
     */
    expectTextWithHighlightingToBe: async function(expectedTextDict) {
      for (var lineNumber in expectedTextDict) {
        expectedTextDict[lineNumber].checked = false;
      }
      await _compareText(expectedTextDict, true);
    },
    /**
     * Compares text with codeMirror. The input should be a string (with
     * line breaks) of the expected display on codeMirror.
     */
    expectTextToBe: async function(expectedTextString) {
      var expectedTextArray = expectedTextString.split('\n');
      var expectedDict = {};
      for (var lineNumber = 1; lineNumber <= expectedTextArray.length;
        lineNumber++) {
        expectedDict[lineNumber] = {
          text: expectedTextArray[lineNumber - 1],
          checked: false
        };
      }
      await _compareText(expectedDict, false);
    }
  };
};

var CodeStringEditor = function(elem) {
  return {
    setValue: async function(code) {
      var stringEditorTextArea = await elem.$('textarea');
      await action.clear('String Editor Text Area', stringEditorTextArea);
      await action.addValue(
        'String Editor Text Area',
        stringEditorTextArea,
        code);
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
exports.DictionaryEditor = DictionaryEditor;
exports.ListEditor = ListEditor;
exports.RealEditor = RealEditor;
exports.RichTextEditor = RichTextEditor;
exports.SetOfTranslatableHtmlContentIdsEditor = (
  SetOfTranslatableHtmlContentIdsEditor);
exports.UnicodeEditor = UnicodeEditor;
exports.AutocompleteDropdownEditor = AutocompleteDropdownEditor;
exports.AutocompleteMultiDropdownEditor = AutocompleteMultiDropdownEditor;
exports.MultiSelectEditor = MultiSelectEditor;
exports.GraphEditor = GraphEditor;

exports.expectRichText = expectRichText;
exports.RichTextChecker = RichTextChecker;
exports.toRichText = toRichText;
exports.CodeMirrorChecker = CodeMirrorChecker;

exports.getEditor = getEditor;
