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
  });
  var continueBoolean = false;
  var addBoolean = false;
  var deleteBoolean = false;
  var mcBoolean = false;
  function setupWindowRef(windowRef: WindowRef) {
      continueBoolean = false;
      addBoolean = false;
      deleteBoolean = false;
      mcBoolean = false;
      var test_page = windowRef.nativeWindow.document.createElement('TESTING_SUITE');
      var continueButton = windowRef.nativeWindow.document.createElement('BUTTON');
      continueButton.classList.add('oppia-learner-confirm-button md-button md-ink-ripple');
      continueButton.onclick = function() {
          continueBoolean = true;
      }
      var textbox= windowRef.nativeWindow.document.createElement('INPUT');
      textbox.classList.add('form-control ng-pristine ng-untouched ng-valid ng-empty');
      var addButton = windowRef.nativeWindow.document.createElement('BUTTON');
      addButton.classList.add('btn btn-secondary btn-sm');
      addButton.onclick = function() {
        addBoolean = true;
      }
      var deleteButton = windowRef.nativeWindow.document.createElement('BUTTON');
      deleteButton.classList.add('oppia-delete-list-entry-button');
      deleteButton.onclick = function() {
        deleteBoolean = true;
      }
      var fractionBox = windowRef.nativeWindow.document.createElement('TEXT');
      fractionBox.classList.add('form-control ng-pristine ng-untouched \n' +
      'ng-valid ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r ng-empty');
      var mc1 = windowRef.nativeWindow.document.createElement('BUTTON');
      mc1.classList.add('multiple-choice-outer-radio-button');
      var mc2 = windowRef.nativeWindow.document.createElement('BUTTON');
      mc2.classList.add('multiple-choice-outer-radio-button');
      continueButton.onclick = function() {
        mcBoolean = true;
      }
      var mc3 = windowRef.nativeWindow.document.createElement('BUTTON');
      mc3.classList.add('multiple-choice-outer-radio-button');
      var mc4 = windowRef.nativeWindow.document.createElement('BUTTON');
      mc4.classList.add('multiple-choice-outer-radio-button');
      test_page.appendChild(continueButton);
      test_page.appendChild(textbox);
      test_page.appendChild(addButton);
      test_page.appendChild(deleteButton);
      test_page.appendChild(fractionBox);
      test_page.appendChild(mc1);
      test_page.appendChild(mc2);
      test_page.appendChild(mc3);
      test_page.appendChild(mc4);


  }

  it('should properly click the continue button', () => {
      setupWindowRef(wrf);
      ces.continueClick(wrf)
      expect(continueBoolean).toEqual(false)
  });

  it('should properly enter text', () => {
      setupWindowRef(wrf);
      ces.fillTextBox(wrf, 'testText');
      var textbox = wrf.nativeWindow.document.getElementsByClassName(
        'form-control ng-pristine ng-untouched ng-valid ng-empty')[0];
      expect(textbox.value).toEqual('testText'); 
  });

  it('should click the add button and enter text for adding to set', 
      () => {
      setupWindowRef(wrf);
      ces.addSet(wrf, 1);
    expect(addBoolean).toEqual(true);
    var textbox = wrf.nativeWindow.document.getElementsByClassName(
        'form-control ng-pristine ng-untouched ng-valid ng-empty')[0];
      expect(textbox.value).toEqual(1); 
  });

  it('should delete the set element correctly by clicking the button',
  () => {
    setupWindowRef(wrf);
    ces.addSet(wrf, 1);
    ces.removeSet(wrf, 1);
    expect(deleteBoolean).toEqual(true);
  });

  it('should add the fraction into the correct box', () => {
      setupWindowRef(wrf);
      ces.enterFraction(wrf, 2/3);
      var fractionbox = wrf.nativeWindow.document.getElementsByClassName(
        'form-control ng-pristine ng-untouched \n' +
        'ng-valid ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r ng-empty')[0];
      expect(fractionbox.value).toEqual(2/3); 
  })
});
