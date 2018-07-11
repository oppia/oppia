// Copyright 2014 The Oppia Authors. All Rights Reserved.
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

var interactions = require('../../../extensions/interactions/protractor.js');
var richTextComponents = require(
  '../../../extensions/rich_text_components/protractor.js');
var objects = require('../../../extensions/objects/protractor.js');
var general = require('./general.js');

var DictionaryEditor = function(elem) {
  return {
    editEntry: function(index, objectType) {
      var entry = elem.element(by.repeater('property in propertySchemas()').
        row(index));
      var editor = getEditor(objectType);
      return editor(entry);
    }
  };
};

var GraphEditor = function(graphInputContainer) {
  if (!graphInputContainer) {
    throw Error('Please provide Graph Input Container element');
  }
  var vertexElement = function(index) {
    // Would throw incorrect element error if provided incorrect index number.
    // Node index starts at 0.
    return graphInputContainer.element(by.css(
      '.protractor-test-graph-vertex-' + index));
  };

  var createVertex = function(xOffset, yOffset) {
    var addNodeButton = graphInputContainer.element(
      by.css('.protractor-test-Add-Node-button'));
    addNodeButton.click();
    // Offsetting from the graph container.
    browser.actions()
      .mouseMove(graphInputContainer, {x: xOffset, y: yOffset})
      .click()
      .perform();
  };

  var createEdge = function(vertexIndex1, vertexIndex2) {
    var addEdgeButton = graphInputContainer.element(
      by.css('.protractor-test-Add-Edge-button'));
    addEdgeButton.click();
    browser.actions()
      .dragAndDrop(vertexElement(vertexIndex1), vertexElement(vertexIndex2))
      .perform();
  };
  return {
    setValue: function(graphDict) {
      var nodeCoordinatesList = graphDict.vertices;
      var edgesList = graphDict.edges;
      if (nodeCoordinatesList) {
        expect(nodeCoordinatesList.length).toBeGreaterThan(0);
        // Assume x-coord is at index 0.
        nodeCoordinatesList.forEach(function(coordinateElement) {
          createVertex(coordinateElement[0], coordinateElement[1]);
        });
      }
      if (edgesList) {
        edgesList.forEach(function(edgeElement) {
          createEdge(edgeElement[0], edgeElement[1]);
        });
      }
    },
    clearDefaultGraph: function() {
      var deleteButton = graphInputContainer.element(
        by.css('.protractor-test-Delete-button'));
      deleteButton.click();
      // Sample graph comes with 3 vertices.
      for (i = 2; i >= 0; i--) {
        vertexElement(i).click();
      }
    },
    expectCurrentGraphToBe: function(graphDict) {
      var nodeCoordinatesList = graphDict.vertices;
      var edgesList = graphDict.edges;
      if (nodeCoordinatesList) {
        // Expecting total no. of vertices on the graph matches with the given
        // dict's vertices.
        nodeCoordinatesList.forEach(function(node, index) {
          expect(vertexElement(index).isDisplayed()).toBe(true);
        });
      }
      if (edgesList) {
        // Expecting total no. of edges on the graph matches with the given
        // dict's edges.
        var allEdgesElement = element.all(by.css(
          '.protractor-test-graph-edge'));
        allEdgesElement.then(function(allEdges) {
          expect(allEdges.length).toEqual(edgesList.length);
        });
      }
    }
  };
};

var ListEditor = function(elem) {
  // NOTE: this returns a promise, not an integer.
  var _getLength = function() {
    return elem.all(by.repeater('item in localValue track by $index'))
      .then(function(items) {
        return items.length;
      });
  };
  // If objectType is specified this returns an editor for objects of that type
  // which can be used to make changes to the newly-added item (for example
  // by calling setValue() on it). Clients should ensure the given objectType
  // corresponds to the type of elements in the list.
  // If objectType is not specified, this function returns nothing.
  var addItem = function(objectType) {
    var listLength = _getLength();
    elem.element(by.css('.protractor-test-add-list-entry')).click();
    if (objectType) {
      return getEditor(objectType)(
        elem.element(
          by.repeater('item in localValue track by $index').row(listLength)));
    }
  };
  var deleteItem = function(index) {
    elem.element(
      by.repeater('item in localValue track by $index').row(index)
    ).element(by.css('.protractor-test-delete-list-entry')).click();
  };

  return {
    editItem: function(index, objectType) {
      var item = elem.element(
        by.repeater('item in localValue track by $index'
        ).row(index));
      var editor = getEditor(objectType);
      return editor(item);
    },
    addItem: addItem,
    deleteItem: deleteItem,
    // This will add or delete list elements as necessary
    setLength: function(desiredLength) {
      elem.all(by.repeater('item in localValue track by $index')).count().then(
        function(startingLength) {
          for (var i = startingLength; i < desiredLength; i++) {
            addItem();
          }
          for (var i = startingLength - 1; i >= desiredLength; i--) {
            deleteItem(i);
          }
        }
      );
    }
  };
};

var RealEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    }
  };
};

var RichTextEditor = function(elem) {
  // Set focus in the RTE.
  elem.all(by.css('.oppia-rte')).first().click();

  var _appendContentText = function(text) {
    elem.all(by.css('.oppia-rte')).first().sendKeys(text);
  };
  var _clickToolbarButton = function(buttonName) {
    elem.element(by.css('.' + buttonName)).click();
  };
  var _clearContent = function() {
    expect(elem.all(by.css('.oppia-rte')).first().isPresent()).toBe(true);
    elem.all(by.css('.oppia-rte')).first().clear();
  };

  return {
    clear: function() {
      _clearContent();
    },
    setPlainText: function(text) {
      _clearContent();
      _appendContentText(text);
    },
    appendPlainText: function(text) {
      _appendContentText(text);
    },
    appendBoldText: function(text) {
      _clickToolbarButton('cke_button__bold');
      _appendContentText(text);
      _clickToolbarButton('cke_button__bold');
    },
    appendItalicText: function(text) {
      _clickToolbarButton('cke_button__italic');
      _appendContentText(text);
      _clickToolbarButton('cke_button__italic');
    },
    appendOrderedList: function(textArray) {
      _appendContentText('\n');
      _clickToolbarButton('cke_button__numberedlist');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickToolbarButton('cke_button__numberedlist');
    },
    appendUnorderedList: function(textArray) {
      _appendContentText('\n');
      _clickToolbarButton('cke_button__bulletedlist');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickToolbarButton('cke_button__bulletedlist');
    },
    // This adds and customizes RTE components.
    // Additional arguments may be sent to this function, and they will be
    // passed on to the relevant RTE component editor.
    addRteComponent: function(componentName) {
      _clickToolbarButton('cke_button__oppia' + componentName.toLowerCase());

      // The currently active modal is the last in the DOM
      var modal = element.all(by.css('.modal-dialog')).last();

      // Need to convert arguments to an actual array; we tell the component
      // which modal to act on but drop the componentName.
      var args = [modal];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      richTextComponents.getComponent(componentName).customizeComponent.apply(
        null, args);
      modal.element(
        by.css('.protractor-test-close-rich-text-component-editor')).click();

      // Ensure that focus is not on added component once it is added so that
      // the component is not overwritten by some other element.
      if (['Video', 'Image', 'Collapsible', 'Tabs'].includes(componentName)) {
        elem.all(by.css('.oppia-rte')).first().sendKeys(protractor.Key.DOWN);
      }

      // Ensure that the cursor is at the end of the RTE.
      elem.all(by.css('.oppia-rte')).first().sendKeys(
        protractor.Key.chord(protractor.Key.CONTROL, protractor.Key.END));
    }
  };
};

var UnicodeEditor = function(elem) {
  return {
    setValue: function(text) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    }
  };
};

var AutocompleteDropdownEditor = function(elem) {
  return {
    setValue: function(text) {
      elem.element(by.css('.select2-container')).click();
      // NOTE: the input field is top-level in the DOM, and is outside the
      // context of 'elem'. The 'select2-dropdown' id is assigned to the input
      // field when it is 'activated', i.e. when the dropdown is clicked.
      element(by.css('.select2-dropdown')).element(
        by.css('.select2-search input')).sendKeys(text + '\n');
    },
    expectOptionsToBe: function(expectedOptions) {
      elem.element(by.css('.select2-container')).click();
      element(by.css('.select2-dropdown')).all(by.tagName('li')).map(
        function(optionElem) {
          return optionElem.getText();
        }
      ).then(function(actualOptions) {
        expect(actualOptions).toEqual(expectedOptions);
      });
      // Re-close the dropdown.
      element(by.css('.select2-dropdown')).element(
        by.css('.select2-search input')).sendKeys('\n');
    }
  };
};

var AutocompleteMultiDropdownEditor = function(elem) {
  return {
    setValues: function(texts) {
      // Clear all existing choices.
      elem.element(by.css('.select2-selection__rendered'))
        .all(by.tagName('li')).map(function(choiceElem) {
          return choiceElem.element(
            by.css('.select2-selection__choice__remove'));
        }).then(function(deleteButtons) {
          // We iterate in descending order, because clicking on a delete button
          // removes the element from the DOM. We also omit the last element
          // because it is the field for new input.
          for (var i = deleteButtons.length - 2; i >= 0; i--) {
            deleteButtons[i].click();
          }
        });

      for (var i = 0; i < texts.length; i++) {
        elem.element(by.css('.select2-container')).click();
        elem.element(by.css('.select2-search__field')).sendKeys(
          texts[i] + '\n');
      }
    },
    expectCurrentSelectionToBe: function(expectedCurrentSelection) {
      elem.element(by.css('.select2-selection__rendered'))
        .all(by.tagName('li')).map(function(choiceElem) {
          return choiceElem.getText();
        }).then(function(actualSelection) {
          // Remove the element corresponding to the last <li>, which actually
          // corresponds to the field for new input.
          actualSelection.pop();
          expect(actualSelection).toEqual(expectedCurrentSelection);
        });
    }
  };
};

var MultiSelectEditor = function(elem) {
  // This function checks that the options corresponding to the given texts
  // have the expected class name, and then toggles those options accordingly.
  var _toggleElementStatusesAndVerifyExpectedClass = function(
      texts, expectedClassBeforeToggle) {
    // Open the dropdown menu.
    elem.element(by.css('.protractor-test-search-bar-dropdown-toggle')).click();

    elem.element(by.css('.protractor-test-search-bar-dropdown-menu'))
      .all(by.tagName('span')).filter(function(choiceElem) {
        return choiceElem.getText().then(function(choiceText) {
          return texts.indexOf(choiceText) !== -1;
        });
      }).then(function(filteredElements) {
        if (filteredElements.length !== texts.length) {
          throw (
            'Could not toggle element selection. Values requested: ' + texts +
          '. Found ' + filteredElements.length + ' matching elements.');
        }

        for (var i = 0; i < filteredElements.length; i++) {
        // Check that, before toggling, the element is in the correct state.
          expect(filteredElements[i].getAttribute('class')).toMatch(
            expectedClassBeforeToggle);
          filteredElements[i].click();
        }

        // Close the dropdown menu at the end.
        elem.element(by.css(
          '.protractor-test-search-bar-dropdown-toggle')).click();
      });
  };

  return {
    selectValues: function(texts) {
      _toggleElementStatusesAndVerifyExpectedClass(
        texts, 'protractor-test-deselected');
    },
    deselectValues: function(texts) {
      _toggleElementStatusesAndVerifyExpectedClass(
        texts, 'protractor-test-selected');
    },
    expectCurrentSelectionToBe: function(expectedCurrentSelection) {
      // Open the dropdown menu.
      elem.element(by.css(
        '.protractor-test-search-bar-dropdown-toggle')).click();

      // Find the selected elements.
      elem.element(by.css('.protractor-test-search-bar-dropdown-menu'))
        .all(by.css('.protractor-test-selected')).map(function(selectedElem) {
          return selectedElem.getText();
        }).then(function(actualSelection) {
          expect(actualSelection).toEqual(expectedCurrentSelection);

          // Close the dropdown menu at the end.
          elem.element(by.css(
            '.protractor-test-search-bar-dropdown-toggle')).click();
        });
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
  var toMatch = function(richTextInstructions) {
    // We select all top-level non-paragraph elements, as well as all children
    // of paragraph elements. (Note that it is possible for <p> elements to
    // surround, e.g., <i> tags, so we can't just ignore the <p> elements
    // altogether.)
    var XPATH_SELECTOR = './p/*|./*[not(self::p)]';
    elem.all(by.xpath(XPATH_SELECTOR)).map(function(entry) {
      // It is necessary to obtain the texts of the elements in advance since
      // applying .getText() while the RichTextChecker is running would be
      // asynchronous and so not allow us to update the textPointer
      // synchronously.
      return entry.getText(function(text) {
        return text;
      });
    }).then(function(arrayOfTexts) {
      // We re-derive the array of elements as we need it too.
      elem.all(by.xpath(XPATH_SELECTOR)).then(function(arrayOfElements) {
        elem.getText().then(function(fullText) {
          var checker = RichTextChecker(
            arrayOfElements, arrayOfTexts, fullText);
          richTextInstructions(checker);
          checker.expectEnd();
        });
      });
    });
  };
  return {
    toMatch: toMatch,
    toEqual: function(text) {
      toMatch(function(checker) {
        checker.readPlainText(text);
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
//   concatenation of arrayOfTexts), e.g. 'textbold'.
var RichTextChecker = function(arrayOfElems, arrayOfTexts, fullText) {
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

  var _readFormattedText = function(text, tagName) {
    expect(arrayOfElems[arrayPointer].getTagName()).toBe(tagName);
    expect(
      arrayOfElems[arrayPointer].getAttribute('innerHTML')
    ).toBe(text);
    expect(arrayOfTexts[arrayPointer]).toEqual(text);
    arrayPointer = arrayPointer + 1;
    textPointer = textPointer + text.length;
    justPassedRteComponent = false;
  };

  return {
    readPlainText: function(text) {
      // Plain text is in a text node so not recorded in either array
      expect(
        fullText.substring(textPointer, textPointer + text.length)
      ).toEqual(text);
      textPointer = textPointer + text.length;
      justPassedRteComponent = false;
    },
    readBoldText: function(text) {
      _readFormattedText(text, 'strong');
    },
    readItalicText: function(text) {
      _readFormattedText(text, 'em');
    },
    // TODO(Jacob): add functions for other rich text components.
    // Additional arguments may be sent to this function, and they will be
    // passed on to the relevant RTE component editor.
    readRteComponent: function(componentName) {
      var elem = arrayOfElems[arrayPointer];
      expect(elem.getTagName()).
        toBe('oppia-noninteractive-' + componentName.toLowerCase());
      expect(elem.getText()).toBe(arrayOfTexts[arrayPointer]);

      // Need to convert arguments to an actual array; we tell the component
      // which element to act on but drop the componentName.
      var args = [elem];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      richTextComponents.getComponent(componentName).
        expectComponentDetailsToMatch.apply(null, args);
      textPointer = textPointer + arrayOfTexts[arrayPointer].length +
        (justPassedRteComponent ? 1 : 2);
      arrayPointer = arrayPointer + 1;
      justPassedRteComponent = true;
    },
    expectEnd: function() {
      expect(arrayPointer).toBe(arrayOfElems.length);
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
var toRichText = function(text) {
  // The 'handler' should be either a RichTextEditor or RichTextChecker
  return function(handler) {
    if (handler.hasOwnProperty('setPlainText')) {
      handler.setPlainText(text);
    } else {
      handler.readPlainText(text);
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
var CodeMirrorChecker = function(elem) {
  // The number of pixels to scroll between reading different sections of
  // CodeMirror's text. 400 pixels is about 15 lines, which will work if
  // codemirror's buffer (viewportMargin) is set to at least 10 (the default).
  var CODEMIRROR_SCROLL_AMOUNT_IN_PIXELS = 400;

  /**
   * This recursive function is used by expectTextWithHighlightingToBe().
   * currentLineNumber is the current largest line number processed,
   * scrollTo is the number of pixels from the top of the text that
   * codemirror should scroll to,
   * compareDict is an object whose keys are line numbers and whose values are
   * objects corresponding to that line with the following key-value pairs:
   *  - 'text': the exact string of text expected on that line
   *  - 'highlighted': true or false, whether the line is highlighted
   *  - 'checked': true or false, whether the line has been checked
   */
  var _compareTextAndHighlightingFromLine = function(
      currentLineNumber, scrollTo, compareDict) {
    // This is used to scroll the text in codemirror to a point scrollTo pixels
    // from the top of the text or the bottom of the text if scrollTo is too
    // large.
    browser.executeScript(
      "$('.CodeMirror-vscrollbar').first().scrollTop(" + String(scrollTo) +
      ');');
    elem.all(by.xpath('./div')).map(function(lineElement) {
      return lineElement.element(by.css('.CodeMirror-linenumber')).getText()
        .then(function(lineNumber) {
          // Note: the last line in codemirror will have an empty string for
          // line number and for text. This is to skip that line.
          if (lineNumber === '') {
            return lineNumber;
          }
          if (!compareDict.hasOwnProperty(lineNumber)) {
            throw Error('Line ' + lineNumber + ' not found in CodeMirror');
          }
          expect(lineElement.element(by.xpath('./pre')).getText())
            .toEqual(compareDict[lineNumber].text);
          expect(
            lineElement.element(
              by.css('.CodeMirror-linebackground')).isPresent())
            .toEqual(compareDict[lineNumber].highlighted);
          compareDict[lineNumber].checked = true;
          return lineNumber;
        });
    }).then(function(lineNumbers) {
      var largestLineNumber = lineNumbers[lineNumbers.length - 1];
      if (largestLineNumber !== currentLineNumber) {
        _compareTextAndHighlightingFromLine(
          largestLineNumber,
          scrollTo + CODEMIRROR_SCROLL_AMOUNT_IN_PIXELS,
          compareDict);
      } else {
        for (var lineNumber in compareDict) {
          if (compareDict[lineNumber].checked !== true) {
            throw Error('Expected line ' + lineNumber + ': \'' +
              compareDict[lineNumber].text + '\' to be found in CodeMirror');
          }
        }
      }
    });
  };

  /**
   * This recursive function is used by expectTextToBe(). The previous function
   * is not used because it is very slow.
   * currentLineNumber is the current largest line number processed,
   * scrollTo is the number of pixels from the top of the text that
   * codemirror should scroll to,
   * compareDict is an object whose keys are line numbers and whose values are
   * objects corresponding to that line with the following key-value pairs:
   *  - 'text': the exact string of text expected on that line
   *  - 'checked': true or false, whether the line has been checked
   */
  var _compareTextFromLine = function(
      currentLineNumber, scrollTo, compareDict) {
    browser.executeScript(
      "$('.CodeMirror-vscrollbar').first().scrollTop(" + String(scrollTo) +
      ');');
    elem.getText().then(function(text) {
      // The 'text' arg is a string 2n lines long representing n lines of text
      // codemirror has loaded. The (2i)th line contains a line number and the
      // (2i+1)th line contains the text on that line.
      var textArray = text.split('\n');
      for (var i = 0; i < textArray.length; i += 2) {
        // CKEditor prettifies html and adds new lines.
        // Due to this there are extra lines in the output.
        // This creates a deviation from the usual case where--
        // (2i)th line contains a line number and the
        // (2i+1)th line contains the text on that line.
        // In this case both the (2i)th and (2i+1)th lines
        // contain line numbers since the html text spans
        // multiple lines.
        // This block checks whether (2i+1)th contains a line
        // number or text for (2i)th line.

        // Spaces are trimmed from line numbers since extra spaces
        // span multiple lines due to html being prettified by CKEditor.
        var lineNumber = textArray[i].replace(/^\s+/g, '');
        var lineText = textArray[i + 1];
        var copy = lineText;
        var lineTextWithoutStartSpaces = copy.replace(/^\s+/g, '');
        // Checks if the line only contains a single digit.
        if ((lineTextWithoutStartSpaces.length === 1) && (
          lineTextWithoutStartSpaces.match(/[0-9]/i))) {
          lineText = '';
          i -= 1;
        }
        if (!compareDict.hasOwnProperty(lineNumber)) {
          throw Error('Line ' + lineNumber + ' not found in CodeMirror');
        }
        expect(lineText).toEqual(compareDict[lineNumber].text);
        compareDict[lineNumber].checked = true;
      }
      var largestLineNumber = textArray[textArray.length - 2];
      if (largestLineNumber !== currentLineNumber) {
        _compareTextFromLine(
          largestLineNumber,
          scrollTo + CODEMIRROR_SCROLL_AMOUNT_IN_PIXELS,
          compareDict);
      } else {
        for (var lineNumber in compareDict) {
          if (compareDict[lineNumber].checked !== true) {
            throw Error('Expected line ' + lineNumber + ': \'' +
              compareDict[lineNumber].text + '\' to be found in CodeMirror');
          }
        }
      }
    });
  };

  return {
    /**
     * Compares text and highlighting with codemirror-mergeview. The input
     * should be an object whose keys are line numbers and whose values should
     * be an object with the following key-value pairs:
     *  - text: the exact string of text expected on that line
     *  - highlighted: true or false
     * This runs much slower than checking without highlighting, so the
     * expectTextToBe() function should be used when possible.
     */
    expectTextWithHighlightingToBe: function(expectedTextDict) {
      for (var lineNumber in expectedTextDict) {
        expectedTextDict[lineNumber].checked = false;
      }
      _compareTextAndHighlightingFromLine(1, 0, expectedTextDict);
    },
    /**
     * Compares text with codemirror. The input should be a string (with
     * line breaks) of the expected display on codemirror.
     */
    expectTextToBe: function(expectedTextString) {
      var expectedTextArray = expectedTextString.split('\n');
      var expectedDict = {};
      for (var lineNumber = 1; lineNumber <= expectedTextArray.length;
        lineNumber++) {
        expectedDict[lineNumber] = {
          text: expectedTextArray[lineNumber - 1],
          checked: false
        };
      }
      _compareTextFromLine(1, 0, expectedDict);
    }
  };
};

// This is used by the list and dictionary editors to retrieve the editors of
// their entries dynamically.
var FORM_EDITORS = {
  Dictionary: DictionaryEditor,
  Graph: GraphEditor,
  List: ListEditor,
  Real: RealEditor,
  RichText: RichTextEditor,
  Unicode: UnicodeEditor
};

var getEditor = function(formName) {
  if (FORM_EDITORS.hasOwnProperty(formName)) {
    return FORM_EDITORS[formName];
  } else if (objects.OBJECT_EDITORS.hasOwnProperty(formName)) {
    return objects.OBJECT_EDITORS[formName];
  } else {
    throw Error('Unknown form / object requested: ' + formName);
  }
};

exports.DictionaryEditor = DictionaryEditor;
exports.ListEditor = ListEditor;
exports.RealEditor = RealEditor;
exports.RichTextEditor = RichTextEditor;
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
