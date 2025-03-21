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
  public punctuationsForCurrentLanguage!: string;
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
      this.localStorageService.getLastSelectedTranslationLanguageCode();

    this.punctuationsForCurrentLanguage =
      AppConstants.LANGUAGE_CODE_TO_PUNCTIONATION_MARKS[this.languageCode];
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

  setHighlightIdToSenetnceMap(highlightIdToSentenceMap: {
    [highlightId: string]: string;
  }): void {
    this.highlightIdToSentenceMap = highlightIdToSentenceMap;
    this.removeSpacesAndTransformMathSymbols();
  }

  removeSpacesAndTransformMathSymbols(): void {
    for (let highlightSentenceId in this.highlightIdToSentenceMap) {
      let sentence = this.highlightIdToSentenceMap[highlightSentenceId];
      // this.transformMathSentenceContainingAudioSpecficWords(highlightSentenceId, sentence);
      this.highlightIdToSentenceWithoutSpacesMap[highlightSentenceId] = sentence
        .split(' ')
        .join('');
    }
  }

  transformMathSentenceContainingAudioSpecficWords(
    highlightSentenceId,
    sentence: string
  ): void {
    let mathSymbolPronounciations =
      AppConstants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS[
        this.languageCode
      ];

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

    if (sentence.includes(' / ')) {
      sentence = sentence.replace(/\//g, mathSymbolPronounciations['÷']);
    }

    if (sentence.includes('÷')) {
      sentence = sentence.replace(/÷/g, mathSymbolPronounciations['÷']);
    }

    if (sentence.includes(' = ')) {
      sentence = sentence.replace(/ = /g, mathSymbolPronounciations['=']);
    }

    this.highlightIdToSentenceMap[highlightSentenceId] = sentence;
  }

  getSentencesToHighlightForTimeRanges(): void {
    const audioOffsets =
      this.automatedVoiceoversAudioOffsetsMsecs[this.activeContentId];

    let sentence = '';
    let minOffsetMsecs = Number.MAX_VALUE;
    let maxOffsetMsecs = 0;

    audioOffsets?.forEach(tokenToAudioOffsetMsecs => {
      const token = tokenToAudioOffsetMsecs['token'];
      const audioOffsetMsecs = tokenToAudioOffsetMsecs['audioOffsetMsecs'];

      sentence += token;
      minOffsetMsecs = Math.min(minOffsetMsecs, audioOffsetMsecs);
      maxOffsetMsecs = Math.max(maxOffsetMsecs, audioOffsetMsecs);

      // If the current token is a punctuation in given language, then it marks
      // as an end of sentence.
      if (this.punctuationsForCurrentLanguage.includes(token)) {
        const highlightId = Object.keys(
          this.highlightIdToSentenceWithoutSpacesMap
        ).find(
          highlightSentenceId =>
            sentence.trim() ===
            this.highlightIdToSentenceWithoutSpacesMap[highlightSentenceId]
        );

        this.sentenceHighlightIntervalList.push({
          highlightSentenceId: highlightId,
          startTimeInSecs:
            minOffsetMsecs === Number.MAX_VALUE
              ? 0
              : Math.round(minOffsetMsecs / 1000),
          endTimeInSecs: Math.round(maxOffsetMsecs / 1000),
        });

        // Resetting variables for the next sentence.
        sentence = '';
        minOffsetMsecs = Number.MAX_VALUE;
        maxOffsetMsecs = 0;
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
