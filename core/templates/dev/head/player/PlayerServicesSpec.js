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
 * @fileoverview Unit tests for services for the exploration player page.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Stopwatch service', function() {
  beforeEach(module('oppia'));

  describe('stopwatch service', function() {
    var stopwatchProviderService = null;
    var errorLog = [];

    beforeEach(inject(function($injector) {
      stopwatchProviderService = $injector.get('stopwatchProviderService');
      spyOn($injector.get('$log'), 'error').andCallFake(function(errorMessage) {
        errorLog.push(errorMessage);
      });
    }));

    var changeCurrentTime = function(stopwatch, desiredCurrentTime) {
      stopwatch._getCurrentTime = function() {
        return desiredCurrentTime;
      };
    };

    it('should correctly record time intervals', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 0);
      stopwatch.resetStopwatch();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should not reset the stopwatch when the current time is retrieved', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 0);
      stopwatch.resetStopwatch();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should correctly reset the stopwatch', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 0);
      stopwatch.resetStopwatch();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      stopwatch.resetStopwatch();
      expect(stopwatch.getTimeInSecs()).toEqual(0);
      changeCurrentTime(stopwatch, 800);
      expect(stopwatch.getTimeInSecs()).toEqual(0.3);
    });

    it('should raise an error if getTimeInSecs() is called prior to resetStopwatch()', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 29);
      expect(stopwatch.getTimeInSecs()).toBeNull();
      expect(errorLog).toEqual([
        'Tried to retrieve the elapsed time, but no start time was set.']);
    });

    it('should instantiate independent stopwatches', function() {
      var stopwatch1 = stopwatchProviderService.getInstance();
      var stopwatch2 = stopwatchProviderService.getInstance();

      changeCurrentTime(stopwatch1, 0);
      changeCurrentTime(stopwatch2, 0);
      stopwatch1.resetStopwatch();

      changeCurrentTime(stopwatch1, 50);
      changeCurrentTime(stopwatch2, 50);
      stopwatch2.resetStopwatch();

      changeCurrentTime(stopwatch1, 100);
      changeCurrentTime(stopwatch2, 100);
      expect(stopwatch1.getTimeInSecs()).toEqual(0.1);
      expect(stopwatch2.getTimeInSecs()).toEqual(0.05);
    });
  });
});

describe('Learner parameters service', function() {
  beforeEach(module('oppia'));

  describe('learner params service', function() {
    var learnerParamsService = null;

    beforeEach(inject(function($injector) {
      learnerParamsService = $injector.get('learnerParamsService');
    }));

    it('should correctly initialize parameters', function() {
      expect(learnerParamsService.getAllParams()).toEqual({});
      learnerParamsService.init({'a': 'b'});
      expect(learnerParamsService.getAllParams()).toEqual({'a': 'b'});
    });

    it('should correctly get and set parameters', function() {
      learnerParamsService.init({'a': 'b'});
      expect(learnerParamsService.getValue('a')).toEqual('b');
      learnerParamsService.setValue('a', 'c');
      expect(learnerParamsService.getValue('a')).toEqual('c');
    });

    it('should not get an invalid parameter', function() {
      learnerParamsService.init({'a': 'b'});
      expect(function() {
        learnerParamsService.getValue('b');
      }).toThrow(new Error('Invalid parameter name: b'));
    });

    it('should not set an invalid parameter', function() {
      learnerParamsService.init({'a': 'b'});
      expect(function() {
        learnerParamsService.setValue('b', 'c');
      }).toThrow(new Error('Cannot set unknown parameter: b'));
    });
  });
});

describe('Text to speech service', function() {
  beforeEach(module('oppia'));

  describe('text to speech service', function() {
    var speechService = null;

    beforeEach(inject(function($injector) {
      speechService = $injector.get('speechService');
    }));

    it('should correctly replace link element', function() {
      var linkElement = 
        '<p><oppia-noninteractive-link open_link_in_same_window-with-value="false" text-with-value="&amp;quot;Link text here.&amp;quot;" url-with-value="&amp;quot;https://www.example.com&amp;quot;"></oppia-noninteractive-link></p>'
      expect(speechService.getSpokenText(linkElement))
        .toEqual('Link: Link text here.');
    });

    it('should correctly replace collapsible element', function() {
      var collapsibleElement = 
        '<p><oppia-noninteractive-collapsible content-with-value="&amp;quot;You have opened the collapsible block.&amp;quot;" heading-with-value="&amp;quot;This is the collapsible header.&amp;quot;"></oppia-noninteractive-collapsible></p>'
      expect(speechService.getSpokenText(collapsibleElement))
        .toEqual('This is the collapsible header. You have opened the collapsible block.');
    });

    it('should correctly replace image element', function() {
      var imageElement = 
        '<p><oppia-noninteractive-image alt-with-value="&amp;quot;Image Alt Text Here.&amp;quot;" filepath-with-value="&amp;quot;defaultuserpic.png&amp;quot;"></oppia-noninteractive-image></p>'
      expect(speechService.getSpokenText(imageElement))
        .toEqual('Image: Image Alt Text Here.');
    });

    it('should correctly replace math element', function() {
      var mathElement = 
        '<p><oppia-noninteractive-math raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;quot;"></oppia-noninteractive-math></p>'
      expect(speechService.getSpokenText(mathElement))
        .toEqual('Math Formula.');
    });

    it('should remove tabs element', function() {
      var tabsElement = 
        '<p><oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;title&amp;quot;:&amp;quot;Hint introduction&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;This set of tabs shows some hints. Click on the other tabs to display the relevant hints.&amp;quot;},{&amp;quot;title&amp;quot;:&amp;quot;Hint 1&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;This is a first hint.&amp;quot;}]"></oppia-noninteractive-tabs></p>'
      expect(speechService.getSpokenText(tabsElement)).toEqual('');
    });

    it('should correctly replace video element', function() {
      var videoElement = 
        '<p><oppia-noninteractive-video autoplay-with-value="false" end-with-value="0" start-with-value="0" video_id-with-value="&amp;quot;eNc0R4G79Fc&amp;quot;"></oppia-noninteractive-video></p>'
      expect(speechService.getSpokenText(videoElement))
        .toEqual('Video.');
    });
  });
});