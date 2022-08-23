// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SpeechSynthesisChunkerService.
 */

import { TestBed, fakeAsync, flush } from '@angular/core/testing';

import { SpeechSynthesisChunkerService } from
  'services/speech-synthesis-chunker.service';

describe('Speech Synthesis Chunker Service', () => {
  let speechSynthesisChunkerService: SpeechSynthesisChunkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpeechSynthesisChunkerService]
    });

    speechSynthesisChunkerService = TestBed.inject(
      SpeechSynthesisChunkerService);
  });

  describe('formatLatexToSpeakableText', () => {
    it('should properly convert subtraction in LaTeX to speakable text',
      () => {
        var latex1 = '5 - 3';
        var latex2 = 'i - j';
        var speakableLatex1 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
        var speakableLatex2 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
        expect(speakableLatex1).toEqual('5 minus 3');
        expect(speakableLatex2).toEqual('i minus j');
      }
    );

    it('should properly convert fractions in LaTeX to speakable text',
      () => {
        var latex1 = '\\\\frac{2}{3}';
        var latex2 = '\\\\frac{abc}{xyz}';
        var latex3 = '\\\\frac{3n}{5}';
        var latex4 = '\\\\frac{ijk}{5xy}';
        var speakableLatex1 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
        var speakableLatex2 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
        var speakableLatex3 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
        var speakableLatex4 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex4);
        expect(speakableLatex1).toEqual('2/3');
        expect(speakableLatex2).toEqual('a b c over x y z');
        expect(speakableLatex3).toEqual('3n over 5');
        expect(speakableLatex4).toEqual('i j k over 5x y');
      }
    );

    it('should properly convert square roots in LaTeX to speakable text',
      () => {
        var latex1 = '\\\\sqrt{3}';
        var latex2 = '\\\\sqrt{xy}';
        var speakableLatex1 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
        var speakableLatex2 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
        expect(speakableLatex1).toEqual('the square root of 3');
        expect(speakableLatex2).toEqual('the square root of x y');
      }
    );

    it('should properly convert exponents in LaTeX to speakable text',
      () => {
        var latex1 = 'x ^ 2';
        var latex2 = '42 ^ 4';
        var latex3 = 'x ^ 62';
        var latex4 = '3n ^ 4x';
        var speakableLatex1 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
        var speakableLatex2 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
        var speakableLatex3 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
        var speakableLatex4 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex4);
        expect(speakableLatex1).toEqual('x^2');
        expect(speakableLatex2).toEqual('42 to the power of 4');
        expect(speakableLatex3).toEqual('x to the power of 62');
        expect(speakableLatex4).toEqual('3n to the power of 4x');
      }
    );

    it('should properly convert trigonometric functions in LaTeX to ' +
        'speakable text', () => {
      var latex1 = '\\\\sin{90}';
      var latex2 = '\\\\cos{0}';
      var latex3 = '\\\\tan{uv}';
      var speakableLatex1 =
        speechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        speechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      var speakableLatex3 =
        speechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
      expect(speakableLatex1).toEqual('the sine of 90');
      expect(speakableLatex2).toEqual('the cosine of 0');
      expect(speakableLatex3).toEqual('the tangent of u v');
    });
  });

  describe('convertToSpeakableText', () => {
    it('should properly convert the raw_latex-with-value attribute to' +
      ' speakable text', () => {
      const html = (
        '<oppia-noninteractive-math math_content-with-value="{&amp;quot;' +
        'raw_latex&amp;quot;:&amp;quot;5-1&amp;quot;,&amp;quot;svg_filename&' +
        'amp;quot;:&amp;quot;&amp;quot;}"></oppia-noninteractive-math>' +
        '<li>Speech</li>' +
        '<li>Text</li>'
      );

      expect(speechSynthesisChunkerService.convertToSpeakableText(html))
        .toBe('5 minus 1 Speech. Text. ');
    });

    it('should properly convert the text-with-value attribute to' +
      ' speakable text', () => {
      const html = (
        '<oppia-noninteractive-link text-with-value="Testing&quot;">' +
        '</oppia-noninteractive-link>' +
        '<li>"Speech"</li>' +
        '<li>Text</li>'
      );

      expect(speechSynthesisChunkerService.convertToSpeakableText(html))
        .toBe('Testing Speech. Text. ');
    });
  });

  describe('speak', function() {
    const MockSpeechSynthesisUtteranceConstructor = (
      SpeechSynthesisUtterance);
    const mockSpeechSynthesisUtteran = {
      speak: () => {},
      onend: () => {},
      addEventListener: function(_: string, cb: () => void) {
        this.onend = cb;
      }
    };

    beforeEach(() => {
      spyOn(window, 'SpeechSynthesisUtterance').and.returnValues(
        // This throws "Argument of type '{ speak: () => void; onend:
        // () => void; ...}' is not assignable to parameter of type
        // 'SpeechSynthesisUtterance'.". We need to suppress this error because
        // 'SpeechSynthesisUtterance' has around 10 more properties. We have
        // only defined the properties we need in 'mockSpeechSynthesisUtteran'.
        // @ts-expect-error
        Object.assign({}, mockSpeechSynthesisUtteran),
        Object.assign({}, mockSpeechSynthesisUtteran));
    });

    it('should not speak when chunk is too short', () => {
      const speakSpy = spyOn(window.speechSynthesis, 'speak').and
        .callFake(function(utterance) {
        // This throws "Argument of type '{ speak: () => void; onend:
        // () => void; ...}' is not assignable to parameter of type
        // 'SpeechSynthesisUtterance'.". We need to suppress this error because
        // 'SpeechSynthesisUtterance' has around 10 more properties. We have
        // only defined the properties we need in 'mockSpeechSynthesisUtteran'.
        // @ts-expect-error
          utterance.onend();
        });
      const speechSynthesisUtterance = (
        new MockSpeechSynthesisUtteranceConstructor('a'));
      const callbackSpy = jasmine.createSpy('callback');
      speechSynthesisChunkerService.speak(
        speechSynthesisUtterance, callbackSpy);

      expect(callbackSpy).toHaveBeenCalled();
      expect(speakSpy).not.toHaveBeenCalled();
    });

    it('should not speak when chunk is a falsy value', () => {
      const speakSpy = spyOn(window.speechSynthesis, 'speak').and
        .callFake(function(utterance: SpeechSynthesisUtterance) {
        // This throws "Argument of type '{ speak: () => void; onend:
        // () => void; ...}' is not assignable to parameter of type
        // 'SpeechSynthesisUtterance'.". We need to suppress this error because
        // 'SpeechSynthesisUtterance' has around 10 more properties. We have
        // only defined the properties we need in 'mockSpeechSynthesisUtteran'.
        // @ts-expect-error
          utterance.onend();
        });
      const speechSynthesisUtterance = (
        new MockSpeechSynthesisUtteranceConstructor(''));
      const callbackSpy = jasmine.createSpy('callback');
      speechSynthesisChunkerService.speak(
        speechSynthesisUtterance, callbackSpy);

      expect(callbackSpy).toHaveBeenCalled();
      expect(speakSpy).not.toHaveBeenCalled();
    });

    it('should speak two phrases at a time', fakeAsync(() => {
      const speakSpy = spyOn(window.speechSynthesis, 'speak').and
        .callFake(function(utterance: SpeechSynthesisUtterance) {
        // This throws "Argument of type '{ speak: () => void; onend:
        // () => void; ...}' is not assignable to parameter of type
        // 'SpeechSynthesisUtterance'.". We need to suppress this error because
        // 'SpeechSynthesisUtterance' has around 10 more properties. We have
        // only defined the properties we need in 'mockSpeechSynthesisUtteran'.
        // @ts-expect-error
          utterance.onend();
        });

      const speechSynthesisUtterance = (
        new MockSpeechSynthesisUtteranceConstructor(
          'Value inside utterance for testing purposes.' +
          ' This is the next chunk'));
      const callbackSpy = jasmine.createSpy('callback');
      speechSynthesisChunkerService.speak(
        speechSynthesisUtterance, callbackSpy);

      // Wait for 2 setTimeout calls to finished because there are
      // two chuncks in speechSynthesisUtterance.
      flush(2);

      expect(callbackSpy).toHaveBeenCalled();
      expect(speakSpy).toHaveBeenCalledTimes(2);
    }));

    it('should speak only one phrase when cancel is requested',
      fakeAsync(() => {
        const speakSpy = spyOn(window.speechSynthesis, 'speak').and
          .callFake(function(utterance: SpeechSynthesisUtterance) {
          // This throws "Argument of type '{ speak: () => void; onend:
          // () => void; ...}' is not assignable to parameter of type
          // 'SpeechSynthesisUtterance'.". We need to suppress this error
          // because 'SpeechSynthesisUtterance' has around 10 more properties.
          // We have only defined the properties we need in
          // 'mockSpeechSynthesisUtteran'.
          // @ts-expect-error
            utterance.onend();
          });
        const speechSynthesisUtterance = (
          new MockSpeechSynthesisUtteranceConstructor(

            'Value inside utterance for testing purposes.' +
            ' This is the next chunk'));
        const callbackSpy = jasmine.createSpy('callback');
        speechSynthesisChunkerService.speak(
          speechSynthesisUtterance, callbackSpy);
        speechSynthesisChunkerService.cancel();

        // Wait for 1 setTimeout call to finished.
        flush(1);

        expect(callbackSpy).not.toHaveBeenCalled();
        expect(speakSpy).toHaveBeenCalledTimes(1);
      }));
  });
});
