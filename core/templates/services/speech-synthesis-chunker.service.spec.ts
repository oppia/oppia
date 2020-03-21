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
  let speechSynthesisChunkerService: SpeechSynthesisChunkerService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpeechSynthesisChunkerService]
    });

    speechSynthesisChunkerService = TestBed.get(SpeechSynthesisChunkerService);
  });

  describe('formatLatexToSpeakableText', () => {
    it('should properly convert subtraction in LaTeX to speakable text',
      () => {
        var latex1 = '&quot;5 - 3&quot;';
        var latex2 = '&quot;i - j&quot;';
        var speakableLatex1 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
        var speakableLatex2 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
        expect(speakableLatex1).toEqual('5 minus 3');
        expect(speakableLatex2).toEqual('\'I\' minus \'J\'');
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
        expect(speakableLatex1).toEqual('two third');
        expect(speakableLatex2).toEqual('the fraction a \'B\' \'C\',' +
            ' over \'X\' \'Y\' \'Z\'. End fraction.');
        expect(speakableLatex3).toEqual('the fraction 3 \'N\',' +
            ' over 5. End fraction.');
        expect(speakableLatex4).toEqual('the fraction' +
            ' \'I\' \'J\' \'K\', over 5 \'X\' \'Y\'. End fraction.');
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
        expect(speakableLatex1).toEqual('the square root of 3 ,');
        expect(speakableLatex2).toEqual('the square root of' +
            ' \'X\' \'Y\'. End square root');
      }
    );

    it('should properly convert exponents in LaTeX to speakable text',
      () => {
        var latex1 = 'x ^ 2';
        var latex2 = '42 ^ 4';
        var latex3 = 'x ^ {62}';
        var latex4 = '3n ^ {4x}';
        var speakableLatex1 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
        var speakableLatex2 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
        var speakableLatex3 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
        var speakableLatex4 =
          speechSynthesisChunkerService.formatLatexToSpeakableText(latex4);
        expect(speakableLatex1).toEqual('\'X\' squared');
        expect(speakableLatex2).toEqual('42 to the 4 power;');
        expect(speakableLatex3).toEqual('\'X\' raised to the 62 power;');
        expect(speakableLatex4).toEqual('3 \'N\' raised to the 4 \'X\' power;');
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
      expect(speakableLatex1).toEqual('sine 90');
      expect(speakableLatex2).toEqual('cosine 0');
      expect(speakableLatex3).toEqual('tan \'U\' \'V\'');
    });
  });

  describe('convertToSpeakableText', () => {
    it('should properly convert the raw_latex-with-value attribute to' +
      ' speakable text', () => {
      const html = (
        '<oppia-noninteractive-math raw_latex-with-value="5 - 1">' +
        '</oppia-noninteractive-math>' +
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
      onend: () => {}
    };

    beforeEach(() => {
      spyOn(window, 'SpeechSynthesisUtterance').and.returnValue(
        // @ts-ignore mock doesn't have all property and methods of a native
        // SpeechSynthesisUtterance.
        mockSpeechSynthesisUtteran);
    });

    it('should not speak when chunk is too short', () => {
      const speakSpy = spyOn(window.speechSynthesis, 'speak').and
        .callFake(function() {
          mockSpeechSynthesisUtteran.onend();
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
        .callFake(function() {
          mockSpeechSynthesisUtteran.onend();
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
        .callFake(function() {
          mockSpeechSynthesisUtteran.onend();
        });
      const speechSynthesisUtterance = (
        new MockSpeechSynthesisUtteranceConstructor(
          'Value inside utterance for testing purposes.' +
          ' This is the next chunk'));
      const callbackSpy = jasmine.createSpy('callback');
      speechSynthesisChunkerService.speak(
        speechSynthesisUtterance, callbackSpy);

      // wait for 2 setTimeout calls to finished because there are
      // two chuncks in speechSynthesisUtterance.
      flush(2);

      expect(callbackSpy).toHaveBeenCalled();
      expect(speakSpy).toHaveBeenCalledTimes(2);
    }));

    it('should speak only one phrase when cancel is requested',
      fakeAsync(() => {
        const speakSpy = spyOn(window.speechSynthesis, 'speak').and
          .callFake(() => mockSpeechSynthesisUtteran.onend());
        const speechSynthesisUtterance = (
          new MockSpeechSynthesisUtteranceConstructor(

            'Value inside utterance for testing purposes.' +
            ' This is the next chunk'));
        const callbackSpy = jasmine.createSpy('callback');
        speechSynthesisChunkerService.speak(
          speechSynthesisUtterance, callbackSpy);
        speechSynthesisChunkerService.cancel();

        // wait for 1 setTimeout call to finished.
        flush(1);

        expect(callbackSpy).not.toHaveBeenCalled();
        expect(speakSpy).toHaveBeenCalledTimes(1);
      }));
  });
});
