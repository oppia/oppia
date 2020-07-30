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
 * @fileoverview Unit tests for the command executor service
 */

import { TestBed } from '@angular/core/testing';
import { CommandExecutorService } from
  'pages/exploration-player-page/services/command-executor.service';
import { WindowRef } from 'services/contextual/window-ref.service.ts';

describe('Command executor service', () => {
  let ces: CommandExecutorService, wrf: WindowRef;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommandExecutorService, WindowRef]
    });
    ces = TestBed.get(CommandExecutorService);
    wrf = TestBed.get(WindowRef);
    ces.setHostname(wrf, '*');
  });
  var continueBoolean = false;
  var addBoolean = false;
  var deleteBoolean = false;
  var mcBoolean = false;
  var secondaryContinueBoolean = false;
  var setupWindowRef = function(windowRef: WindowRef) {
    var suite =
        wrf.nativeWindow.document.getElementsByTagName('TESTING_SUITE')[0];
    if (suite) {
      suite.remove();
    }
    continueBoolean = false;
    addBoolean = false;
    deleteBoolean = false;
    mcBoolean = false;
    secondaryContinueBoolean = false;
    var testPage = windowRef.nativeWindow.document.createElement(
      'TESTING_SUITE');
    var continueButton = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    continueButton.classList.add(
      'oppia-learner-confirm-button');
    continueButton.onclick = function() {
      continueBoolean = true;
    };
    var secondaryContinueButton =
      windowRef.nativeWindow.document.createElement('BUTTON');
    secondaryContinueButton.classList.add(
      'protractor-test-next-card-button');
    secondaryContinueButton.onclick = function() {
      secondaryContinueBoolean = true;
    };
    var textbox = windowRef.nativeWindow.document.createElement(
      'INPUT') as HTMLInputElement;
    textbox.classList.add(
      'form-control');
    textbox.value = 'placeholder';
    var addButton = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    addButton.classList.add('btn');
    addButton.classList.add('btn-secondary');
    addButton.onclick = function() {
      addBoolean = true;
    };
    var deleteButton = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    deleteButton.classList.add('oppia-delete-list-entry-button');
    deleteButton.onclick = function() {
      deleteBoolean = true;
    };
    var fractionBox = windowRef.nativeWindow.document.createElement(
      'TEXT');
    fractionBox.classList.add('form-control');
    fractionBox.classList.add(
      'ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r');
    var mc1 = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    mc1.classList.add('multiple-choice-outer-radio-button');
    var mc2 = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    mc2.classList.add('multiple-choice-outer-radio-button');
    mc2.onclick = function() {
      mcBoolean = true;
    };
    var mc3 = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    mc3.classList.add('multiple-choice-outer-radio-button');
    var mc4 = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    mc4.classList.add('multiple-choice-outer-radio-button');
    testPage.appendChild(continueButton);
    testPage.appendChild(textbox);
    testPage.appendChild(addButton);
    testPage.appendChild(deleteButton);
    testPage.appendChild(fractionBox);
    testPage.appendChild(mc1);
    testPage.appendChild(mc2);
    testPage.appendChild(mc3);
    testPage.appendChild(mc4);
    testPage.appendChild(secondaryContinueButton);
    wrf.nativeWindow.document.body.appendChild(testPage);
  };
  it('should properly click the continue button', () => {
    setupWindowRef(wrf);
    ces.continueClick(wrf);
    expect(continueBoolean).toEqual(true);
  });

  it('should properly enter text', () => {
    setupWindowRef(wrf);
    ces.fillTextBox(wrf, 'testText');
    var textbox = wrf.nativeWindow.document.getElementsByClassName(
      'form-control'
    )[0] as HTMLInputElement;
    expect(textbox.value).toEqual('testText');
  });

  it('should only enter text for adding to set',
    () => {
      setupWindowRef(wrf);
      ces.addSet(wrf, '1');
      expect(addBoolean).toEqual(false);
      var textbox = wrf.nativeWindow.document.getElementsByClassName(
        'form-control'
      )[0] as HTMLInputElement;
      expect(textbox.value).toEqual('1');
    });

  it('should enter text, click button, then add text to add to set',
    () => {
      setupWindowRef(wrf);
      ces.addSet(wrf, '1');
      expect(addBoolean).toEqual(false);
      ces.addSet(wrf, '2');
      expect(addBoolean).toEqual(true);
      var textbox = wrf.nativeWindow.document.getElementsByClassName(
        'form-control'
      )[0] as HTMLInputElement;
      expect(textbox.value).toEqual('1');
      var textbox = wrf.nativeWindow.document.getElementsByClassName(
        'form-control'
      )[1] as HTMLInputElement;
      expect(textbox.value).toEqual('2');
    });

  it('should delete the set element correctly by clicking the button',
    () => {
      setupWindowRef(wrf);
      ces.addSet(wrf, '1');
      ces.removeSet(wrf, '1');
      expect(deleteBoolean).toEqual(true);
    });

  it('should add the fraction into the correct box', () => {
    setupWindowRef(wrf);
    ces.enterFraction(wrf, '2/3');
    var fractionbox = wrf.nativeWindow.document.getElementsByClassName(
      'form-control \n' +
      'ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r'
    )[0] as HTMLInputElement;
    expect(fractionbox.value).toEqual('2/3');
  });

  it('should correctly click the 2nd multiple choice answer', () => {
    setupWindowRef(wrf);
    ces.selectItemBullet(wrf, '2');
    expect(mcBoolean).toEqual(true);
  });

  it('should click the submit button', () => {
    setupWindowRef(wrf);
    ces.submit(wrf);
    expect(continueBoolean).toEqual(true);
  });

  it('should click continue in the second type of continue button',
    () => {
      setupWindowRef(wrf);
      var suite =
        wrf.nativeWindow.document.getElementsByTagName('TESTING_SUITE')[0];
      suite.querySelector(
        '.oppia-learner-confirm-button').remove();
      ces.continueClick(wrf);
      expect(secondaryContinueBoolean).toEqual(true);
    });
});
