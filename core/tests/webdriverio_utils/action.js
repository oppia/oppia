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
 * @fileoverview Utilities for performing actions on element in webdriverio.
 */

var waitFor = require('./waitFor.js');

// Waits for the invisibility of the autosave message.
var waitForAutosave = async function() {
  var autoSaveIndicatorElement = $('.e2e-test-autosave-indicator');
  await waitFor.invisibilityOf(
    autoSaveIndicatorElement, 'Auto save indicator didn\'t disappear');
};

var clear = async function(inputName, inputElement) {
  await click(inputName, inputElement);
  await inputElement.clearValue();
};

var click = async function(elementName, clickableElement, elementIsMasked) {
  await waitFor.visibilityOf(
    clickableElement, `${elementName} is not visible.`);
  await waitFor.elementToBeClickable(
    clickableElement, `${elementName} is not clickable.`);
  // In some cases, we expect the element to be masked by a dummy element. In
  // these cases, the regular click will throw an error of the form
  // Failed: element click intercepted: Element A is not clickable at point
  // (x, y). Other element would receive the click: B.
  // It is expected that the masked element receives the click. Therefore, a
  // Javascript click action is used here to avoid the error.
  if (elementIsMasked) {
    await browser.execute(
      '$(arguments[0]).click()', clickableElement);
  } else {
    await clickableElement.click();
  }
};

var getText = async function(elementName, element) {
  await waitFor.visibilityOf(
    element, `${elementName} is not visible for getText()`);
  return await element.getText();
};

var getAttribute = async function(elementName, element, attribute) {
  await waitFor.presenceOf(
    element, `${elementName} is not present for getAttribute(${attribute})`);
  return await element.getAttribute(attribute);
};

var getValue = async function(elementName, element) {
  await waitFor.presenceOf(
    element, `${elementName} is not present for getValue()`);
  return await element.getValue();
};

var select = async function(selectorName, selectorElement, optionToSelect) {
  await waitFor.visibilityOf(
    selectorElement,
    `${selectorName} is not visible to select ${optionToSelect}`
  );
  await selectorElement.selectByVisibleText(optionToSelect);
};

var matSelect = async function(selectorName, selectorElement, optionToSelect) {
  await click(selectorName, selectorElement);
  var optionElement = $(`.mat-option-text=${optionToSelect}`);
  await click(`${optionToSelect} in ${selectorName}`, optionElement);
};

var select2 = async function(selectorName, selectorElement, optionToSelect) {
  await click(selectorName, selectorElement);
  var select2Results = $('.select2-results');
  await waitFor.visibilityOf(
    select2Results, `${selectorName} options are not visible.`);
  var option = select2Results.$(`li=${optionToSelect}`);
  await click(`${optionToSelect} in ${selectorName}`, option);
};

// This method send a sequence of key strokes to an element after clearing
// it's value.
var setValue = async function(
    inputName, inputElement, keys, clickInputElement = true) {
  if (clickInputElement) {
    await click(inputName, inputElement);
  }
  await inputElement.setValue(keys);
};

// This method send a sequence of key strokes to an element without clearing
// it's value before.
var addValue = async function(
    inputName, inputElement, keys, clickInputElement = true) {
  if (clickInputElement) {
    await click(inputName, inputElement);
  }
  await inputElement.addValue(keys);
};

exports.clear = clear;
exports.click = click;
exports.getText = getText;
exports.getAttribute = getAttribute;
exports.getValue = getValue;
exports.select = select;
exports.select2 = select2;
exports.matSelect = matSelect;
exports.addValue = addValue;
exports.setValue = setValue;
exports.waitForAutosave = waitForAutosave;
