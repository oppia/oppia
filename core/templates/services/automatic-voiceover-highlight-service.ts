// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that provides helper methods for highlighting sentences
 * during automatic voiceover play in a lesson.
 */

import {Injectable} from '@angular/core';
import {AppConstants} from 'app.constants';
import {LocalStorageService} from './local-storage.service';
import {ContentIdToVoiceoversAudioOffsetsMsecs} from 'domain/voiceover/entity-voiceovers.model';

interface SentenceHighlightInterval {
  highlightSentenceId: string;
  startTimeInSecs: number;
  endTimeInSecs: number;
}

@Injectable({
  providedIn: 'root',
})
export class AutomaticVoiceoverHighlightService {
  public languageCode!: string;
  public activeContentId!: string;

  public highlightIdToSentenceMap: {[highlightId: string]: string} = {};
  public automatedVoiceoversAudioOffsetsMsecs: ContentIdToVoiceoversAudioOffsetsMsecs =
    {};
  public highlightIdToSentenceWithoutSpacesMap: {
    [highlightId: string]: string;
  } = {};
  public sentenceHighlightIntervalList: SentenceHighlightInterval[] = [];

  constructor(private localStorageService: LocalStorageService) {
    this.languageCode =
      this.localStorageService.getLastSelectedTranslationLanguageCode() as string;
  }

  setActiveContentId(contentId: string): void {
    this.activeContentId = contentId;
  }

  setAutomatedVoiceoversAudioOffsets(
    automatedVoiceoversAudioOffsetsMsecs: ContentIdToVoiceoversAudioOffsetsMsecs
  ): void {
    this.automatedVoiceoversAudioOffsetsMsecs =
      automatedVoiceoversAudioOffsetsMsecs;
  }

  setHighlightIdToSenetenceMap(highlightIdToSentenceMap: {
    [highlightId: string]: string;
  }): void {
    this.highlightIdToSentenceMap = highlightIdToSentenceMap;
    this.removeSpacesAndTransformMathSymbols();
  }

  removeSpacesAndTransformMathSymbols(): void {
    for (let highlightSentenceId in this.highlightIdToSentenceMap) {
      let sentence = this.highlightIdToSentenceMap[highlightSentenceId];
      sentence =
        this.transformMathSentenceContainingAudioSpecficWords(sentence);
      this.highlightIdToSentenceWithoutSpacesMap[highlightSentenceId] = sentence
        .split(/\s+/)
        .join('')
        .trim();
    }
  }

  processSuperscriptInText(
    text: string,
    mathSymbolPronounciations: {[key: string]: string}
  ): string {
    const superscriptDigits: {[key: string]: string} = {
      '⁰': '0',
      '¹': '1',
      '²': '2',
      '³': '3',
      '⁴': '4',
      '⁵': '5',
      '⁶': '6',
      '⁷': '7',
      '⁸': '8',
      '⁹': '9',
    };
    const superscriptChars = Object.keys(superscriptDigits).concat('^');

    let isSuperscriptPresent = superscriptChars.some(char =>
      text.includes(char)
    );
    if (!isSuperscriptPresent) {
      return text;
    }

    let result = '';
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      if (superscriptDigits[char]) {
        let number = '';
        while (i < text.length && superscriptDigits[text[i]]) {
          number += superscriptDigits[text[i]];
          i++;
        }
        result += '^' + number;
        continue;
      }
      result += char;
      i++;
    }

    const getPronounciation = (superscriptChars: string): string => {
      if (superscriptChars === '^2') {
        return ' ' + mathSymbolPronounciations['^2'];
      } else if (superscriptChars === '^3') {
        return ' ' + mathSymbolPronounciations['^3'];
      }
      return (
        ' ' + mathSymbolPronounciations['^'] + ' ' + superscriptChars.slice(1)
      );
    };

    result = result.replace(/\^(\d+)/g, match => getPronounciation(match));

    return result;
  }

  processFactorialInText(
    text: string,
    mathSymbolPronounciations: {[key: string]: string}
  ): string {
    const pronunciation = mathSymbolPronounciations['!'] + ' ';
    return text.replace(/(\d+)!/g, (_match, p1) => pronunciation + p1);
  }

  processAlgebraicFraction(text: string): string {
    // Transforms algebraic fractions in the text into a format with spaces
    // around slashes. For example, 'x/2' becomes 'x / 2'.
    text = text.replace(/(\d+)\//g, '$1 / ');
    text = text.replace(/\/(\d+)/g, ' / $1');
    return text;
  }

  transformMathSentenceContainingAudioSpecficWords(sentence: string): string {
    let mathSymbolPronounciations: {[key: string]: string} = {};
    if (
      AppConstants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS.hasOwnProperty(
        this.languageCode as string
      )
    ) {
      mathSymbolPronounciations =
        AppConstants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS[
          this
            .languageCode as keyof typeof AppConstants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS
        ];
    } else {
      mathSymbolPronounciations =
        AppConstants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS[
          AppConstants.DEFAULT_LANGUAGE_CODE as keyof typeof AppConstants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS
        ];
    }

    // This logic is similar to the implementation in
    // core/platform/azure_speech_synthesis/azure_speech_synthesis_services.py.
    // It ensures that sentences from the frontend match those from the backend.
    if (sentence.includes(' - ')) {
      sentence = sentence.replace(/-/g, mathSymbolPronounciations['-']);
    }

    if (sentence.includes(' + ')) {
      sentence = sentence.replace(/\+/g, mathSymbolPronounciations['+']);
    }

    if (sentence.includes(' * ')) {
      sentence = sentence.replace(/\*/g, mathSymbolPronounciations['*']);
    }

    if (sentence.includes('×')) {
      sentence = sentence.replace(/×/g, mathSymbolPronounciations['×']);
    }

    sentence = this.processAlgebraicFraction(sentence);

    if (sentence.includes(' / ')) {
      sentence = sentence.replace(/\//g, mathSymbolPronounciations['÷']);
    }

    if (sentence.includes('÷')) {
      sentence = sentence.replace(/÷/g, mathSymbolPronounciations['÷']);
    }

    if (sentence.includes(' = ')) {
      sentence = sentence.replace(/=/g, mathSymbolPronounciations['=']);
    }

    sentence = this.processFactorialInText(sentence, mathSymbolPronounciations);

    sentence = this.processSuperscriptInText(
      sentence,
      mathSymbolPronounciations
    );

    sentence = sentence.replace(/_{2,}/g, ' dash ');

    return sentence;
  }

  getSentencesToHighlightForTimeRanges(): void {
    const audioOffsets =
      this.automatedVoiceoversAudioOffsetsMsecs[this.activeContentId];

    let minOffsetMsecs = 0.0;
    let maxOffsetMsecs = 0.0;
    this.sentenceHighlightIntervalList = [];

    let hightlightIds = Object.keys(this.highlightIdToSentenceWithoutSpacesMap);

    let currentHighlightId = hightlightIds.shift();
    let currentSentence =
      this.highlightIdToSentenceWithoutSpacesMap[currentHighlightId as string];

    minOffsetMsecs = 0.0;

    audioOffsets?.forEach(tokenToAudioOffsetMsecs => {
      let token = tokenToAudioOffsetMsecs.token;
      let audioOffsetMsecs = tokenToAudioOffsetMsecs.audioOffsetMsecs;

      if (minOffsetMsecs === 0.0) {
        minOffsetMsecs = audioOffsetMsecs;
      }

      token = token.split(/\s+/).join('').trim();

      currentSentence = currentSentence?.startsWith(token)
        ? currentSentence.slice(token.length)
        : currentSentence;

      if (currentSentence.length === 0) {
        maxOffsetMsecs = audioOffsetMsecs;

        this.sentenceHighlightIntervalList.push({
          highlightSentenceId: currentHighlightId as string,
          startTimeInSecs: Math.round(minOffsetMsecs / 1000),
          endTimeInSecs: Math.round(maxOffsetMsecs / 1000),
        });

        currentHighlightId = hightlightIds.shift();

        if (currentHighlightId === undefined) {
          return;
        }
        currentSentence =
          this.highlightIdToSentenceWithoutSpacesMap[
            currentHighlightId as string
          ];
        minOffsetMsecs = 0.0;
      }
    });
  }

  getCurrentSentenceIdToHighlight(
    currentAudioPlayerTimeInSecs: number
  ): string | undefined {
    let currentsentenceIdAndInterval = this.sentenceHighlightIntervalList.find(
      sentenceIdAndInterval => {
        return (
          currentAudioPlayerTimeInSecs >=
            sentenceIdAndInterval.startTimeInSecs &&
          currentAudioPlayerTimeInSecs <= sentenceIdAndInterval.endTimeInSecs
        );
      }
    );
    return currentsentenceIdAndInterval?.highlightSentenceId;
  }
}
