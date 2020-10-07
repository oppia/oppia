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
 * @fileoverview Service to preload audio into AssetsBackendApiService's cache.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { Exploration } from 'domain/exploration/ExplorationObjectFactory';
import { AudioTranslationLanguageService } from 'pages/exploration-player-page/services/audio-translation-language.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { ContextService } from 'services/context.service';

@Injectable({
  providedIn: 'root'
})
export class AudioPreloaderService {
  private filenamesOfAudioCurrentlyDownloading: string[] = [];
  private filenamesOfAudioToBeDownloaded: string[] = [];

  private exploration: Exploration = null;
  private audioLoadedCallback: (_: string) => void = null;
  private mostRecentlyRequestedAudioFilename: string = null;

  constructor(
      private assetsBackendApiService: AssetsBackendApiService,
      private audioTranslationLanguageService: AudioTranslationLanguageService,
      private computeGraphService: ComputeGraphService,
      private contextService: ContextService) {}

  init(exploration: Exploration): void {
    this.exploration = exploration;
  }

  kickOffAudioPreloader(sourceStateName: string): void {
    this.filenamesOfAudioToBeDownloaded = (
      this.getAudioFilenamesInBfsOrder(sourceStateName));
    const numFilesToDownload = (
      AppConstants.MAX_NUM_AUDIO_FILES_TO_DOWNLOAD_SIMULTANEOUSLY -
      this.filenamesOfAudioCurrentlyDownloading.length);
    if (numFilesToDownload > 0) {
      const filesToDownload = (
        this.filenamesOfAudioToBeDownloaded.splice(0, numFilesToDownload));
      filesToDownload.forEach(filename => this.loadAudio(filename));
      this.filenamesOfAudioCurrentlyDownloading.push(...filesToDownload);
    }
  }

  isLoadingAudioFile(filename: string): boolean {
    return this.filenamesOfAudioCurrentlyDownloading.indexOf(filename) !== -1;
  }

  restartAudioPreloader(sourceStateName: string): void {
    this.cancelPreloading();
    this.kickOffAudioPreloader(sourceStateName);
  }

  setAudioLoadedCallback(audioLoadedCallback: (_: string) => void): void {
    this.audioLoadedCallback = audioLoadedCallback;
  }

  setMostRecentlyRequestedAudioFilename(filename: string): void {
    this.mostRecentlyRequestedAudioFilename = filename;
  }

  clearMostRecentlyRequestedAudioFilename(): void {
    this.mostRecentlyRequestedAudioFilename = null;
  }

  getMostRecentlyRequestedAudioFilename(): string {
    return this.mostRecentlyRequestedAudioFilename;
  }

  getFilenamesOfAudioCurrentlyDownloading(): string[] {
    return this.filenamesOfAudioCurrentlyDownloading;
  }

  private getAudioFilenamesInBfsOrder(sourceStateName: string): string[] {
    const languageCode = (
      this.audioTranslationLanguageService.getCurrentAudioLanguageCode());
    const allVoiceovers = this.exploration.getAllVoiceovers(languageCode);
    const bfsTraversalOfStates = (
      this.computeGraphService.computeBfsTraversalOfStates(
        this.exploration.getInitialState().name, this.exploration.getStates(),
        sourceStateName));
    const audioFilenamesInBfsOrder = [];
    for (const stateName of bfsTraversalOfStates) {
      for (const voiceover of allVoiceovers[stateName]) {
        audioFilenamesInBfsOrder.push(voiceover.filename);
      }
    }
    return audioFilenamesInBfsOrder;
  }

  private loadAudio(audioFilename: string): void {
    this.assetsBackendApiService.loadAudio(
      this.contextService.getExplorationId(), audioFilename
    ).then(loadedAudio => {
      const index = this.filenamesOfAudioCurrentlyDownloading.findIndex(
        filename => filename === loadedAudio.filename);
      if (index !== -1) {
        this.filenamesOfAudioCurrentlyDownloading.splice(index, 1);
      }

      if (this.filenamesOfAudioToBeDownloaded.length > 0) {
        const nextAudioFilename = this.filenamesOfAudioToBeDownloaded.shift();
        this.loadAudio(nextAudioFilename);
        this.filenamesOfAudioCurrentlyDownloading.push(nextAudioFilename);
      }

      if (this.audioLoadedCallback) {
        this.audioLoadedCallback(loadedAudio.filename);
      }
    });
  }

  private cancelPreloading(): void {
    this.assetsBackendApiService.abortAllCurrentAudioDownloads();
    this.filenamesOfAudioCurrentlyDownloading.length = 0;
  }
}

angular.module('oppia').factory(
  'AudioPreloaderService', downgradeInjectable(AudioPreloaderService));
