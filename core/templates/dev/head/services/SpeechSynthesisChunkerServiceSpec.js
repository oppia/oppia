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

describe('Speech Synthesis Chunker Service', function() {
  var SpeechSynthesisChunkerService = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SpeechSynthesisChunkerService = $injector.get(
      'SpeechSynthesisChunkerService');
  }));

  it('Should properly convert subtraction in LaTeX to speakable text',
    function() {
      var latex1 = '5-3';
      var latex2 = 'i-j';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      expect(speakableLatex1).toEqual('5 minus 3');
      expect(speakableLatex2).toEqual('i minus j');
    }
  );

  it('Should properly convert fractions in LaTeX to speakable text',
    function() {
      var latex1 = '\\\\frac{2}{3}';
      var latex2 = '\\\\frac{abc}{xyz}';
      var latex3 = '\\\\frac{3n}{5}';
      var latex4 = '\\\\frac{ijk}{5xy}';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      var speakableLatex3 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
      var speakableLatex4 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex4);
      expect(speakableLatex1).toEqual('2/3');
      expect(speakableLatex2).toEqual('a b c over x y z');
      expect(speakableLatex3).toEqual('3n over 5');
      expect(speakableLatex4).toEqual('i j k over 5x y');
    }
  );

  it('Should properly convert square roots in LaTeX to speakable text',
    function() {
      var latex1 = '\\\\sqrt{3}';
      var latex2 = '\\\\sqrt{xy}';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      expect(speakableLatex1).toEqual('the square root of 3');
      expect(speakableLatex2).toEqual('the square root of x y');
    }
  );

  it('Should properly convert exponents in LaTeX to speakable text',
    function() {
      var latex1 = 'x^2';
      var latex2 = '42^4';
      var latex3 = 'x^62';
      var latex4 = '3n^4x';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      var speakableLatex3 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
      var speakableLatex4 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex4);
      expect(speakableLatex1).toEqual('x^2');
      expect(speakableLatex2).toEqual('42 to the power of 4');
      expect(speakableLatex3).toEqual('x to the power of 62');
      expect(speakableLatex4).toEqual('3n to the power of 4x');
    }
  );

  it ('Should properly convert trigonometric functions in LaTeX to ' +
      'speakable text', function() {
    var latex1 = '\\\\sin{90}';
    var latex2 = '\\\\cos{0}';
    var latex3 = '\\\\tan{uv}';
    var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
    var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
    var speakableLatex3 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
    expect(speakableLatex1).toEqual('the sine of 90');
    expect(speakableLatex2).toEqual('the cosine of 0');
    expect(speakableLatex3).toEqual('the tangent of u v');
  });
});
