// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
  let ces: CommandExecutorService = null;
  let wrf: WindowRef = null;
  let spy = null;
  beforeEach((done) => {
    TestBed.configureTestingModule({
      providers: [CommandExecutorService, WindowRef]
    });
    ces = TestBed.get(CommandExecutorService);
    wrf = TestBed.get(WindowRef);
    setupWindowRef(wrf);
    spy = spyOn(ces.windowWrapperMessageService, 'addEventListener');
    ces.getOuterFrameEvents(wrf);
    done();
  });

  afterEach((done) => {
    var suite =
    wrf.nativeWindow.document.getElementsByTagName('TESTING_SUITE')[0];
    suite.remove();
    done()
  });

  var continueBoolean = false;
  var addBoolean = false;
  var deleteBoolean = false;
  var mcBoolean = false;
  var secondaryContinueBoolean = false;
  var setupWindowRef = function(windowRef: WindowRef) {
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
    // textbox.value = 'placeholder';
    var secondaryTextbox = windowRef.nativeWindow.document.createElement(
      'INPUT') as HTMLInputElement;
    secondaryTextbox.classList.add(
      'form-control');
    // secondaryTextbox.value = 'placeholder';
    var addButton = windowRef.nativeWindow.document.createElement(
      'BUTTON');
    addButton.classList.add('oppia-add-list-entry');
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
    testPage.appendChild(secondaryTextbox);
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

  it('should register the host', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
  });

  it('should click continue', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'CONTINUE'
    });
    listener(messageEvent);
    expect(continueBoolean).toEqual(true);
  });

  it('should enter text and click submit button after', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var suite =
    wrf.nativeWindow.document.getElementsByTagName('TESTING_SUITE')[0];
    suite.querySelector(
      '.ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r').remove();
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'ENTER_TEXT_NUMBER_UNITS testText'
    });
    listener(messageEvent);
    var textbox = wrf.nativeWindow.document.getElementsByClassName(
      'form-control')[0] as HTMLInputElement;
    expect(textbox.value).toEqual('testText');
  });

  it('should add to set by filling box', () => {
    var suite =
    wrf.nativeWindow.document.getElementsByTagName('TESTING_SUITE')[0];
    suite.querySelector(
      '.ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r').remove();
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'ADD_SET 1'
    });
    listener(messageEvent);
    var textbox = wrf.nativeWindow.document.getElementsByClassName(
      'form-control')[0] as HTMLInputElement;
  });

  it('should add two elements to set', () => {
    var suite =
    wrf.nativeWindow.document.getElementsByTagName('TESTING_SUITE')[0];
    suite.querySelector(
      '.ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r').remove();
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'ADD_SET 1'
    });
    listener(messageEvent);
    var textbox = wrf.nativeWindow.document.getElementsByClassName(
      'form-control')[0] as HTMLInputElement;
    expect(textbox.value).toEqual('1');
    expect(addBoolean).toEqual(false);
    var messageEvent = new MessageEvent('message', {
      data: 'ADD_SET 2'
    });
    listener(messageEvent);
    var textboxes = wrf.nativeWindow.document.getElementsByClassName(
      'form-control');
    var first = textboxes[0] as HTMLInputElement;
    var second = textboxes[1] as HTMLInputElement;
    expect(first.value).toEqual('1');
    expect(second.value).toEqual('2');
    expect(addBoolean).toEqual(true);
  });

  it('should enter a fraction', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'ENTER_FRACTION 2/3'
    });
    listener(messageEvent);
    var textbox = wrf.nativeWindow.document.getElementsByClassName(
      'ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r'
    )[0] as HTMLInputElement;
    expect(textbox.value).toEqual('2/3');
  });

  it('should click 2nd multiple choice answer', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'SELECT_ITEM_BULLET 2'
    });
    listener(messageEvent);
    expect(mcBoolean).toEqual(true);
  });

  it('should click submit', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'SUBMIT'
    });
    listener(messageEvent);
    expect(continueBoolean).toEqual(true);
  });

  it('should delete the added element', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'ADD_SET 1'
    });
    listener(messageEvent);
    var messageEvent = new MessageEvent('message', {
      data: 'REMOVE_SET 1'
    });
    listener(messageEvent);
    expect(deleteBoolean).toEqual(true);
  });

  it('should click the second type of continue button', () => {
    var suite =
    wrf.nativeWindow.document.getElementsByTagName('TESTING_SUITE')[0];
    suite.querySelector(
      '.oppia-learner-confirm-button').remove();
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.hostname).toEqual('mockWindow');
    var messageEvent = new MessageEvent('message', {
      data: 'CONTINUE'
    });
    listener(messageEvent);
    expect(secondaryContinueBoolean).toEqual(true);
  });

  it('should attempt to send parent ready state', () => {
    ces.windowWrapperMessageService.postMessageToParent =
    jasmine.createSpy('parentMessage spy');
    ces.sendParentReadyState(wrf);
    expect(ces.windowWrapperMessageService.postMessageToParent)
      .toHaveBeenCalled();
  });

  it('should mimic send state to outer frame', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    ces.windowWrapperMessageService.postMessageToParent =
    jasmine.createSpy('parentMessage spy');
    ces.sendStateToOuterFrame('Continue');
    expect(ces.windowWrapperMessageService.postMessageToParent)
      .toHaveBeenCalledWith('CONTINUE', 'mockWindow');
  });

  it('should send the cached message after hostname load',
    () => {
      ces.sendStateToOuterFrame('SetInput');
      expect(ces.cachedOuterFrameMessage).toEqual('SET_OPERATION');
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.mostRecent().args[0]).toEqual('message');
      var listener = spy.calls.mostRecent().args[1];
      ces.windowWrapperMessageService.postMessageToParent =
      jasmine.createSpy('parentMessage spy');
      var messageEvent = new MessageEvent('message', {
        data: 'HOSTNAME mockWindow'
      });
      listener(messageEvent);
      expect(ces.hostname).toEqual('mockWindow');
      expect(ces.windowWrapperMessageService.postMessageToParent)
        .toHaveBeenCalledWith('SET_OPERATION', 'mockWindow');
    });

  it('should not send any message', () => {
    var emptyVal = ces.sendStateToOuterFrame('START_STATE');
    expect(emptyVal).toEqual(undefined);
  });

  it('should do nothing because hostname not set', () => {
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'CONTINUE'
    });
    var emptyVal = listener(messageEvent);
    expect(emptyVal).toEqual(undefined);
  });
});
