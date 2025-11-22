// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to fetch EntityVoiceovers for the given entity in a
 * given langauge code.
 */

import {Injectable} from '@angular/core';
import {BehaviorSubject, interval, from, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {
  VoiceoverBackendApiService,
  LanguageAccentToContentStatusMap,
} from 'domain/voiceover/voiceover-backend-api.service';

@Injectable({
  providedIn: 'root',
})
export class VoiceoverRegenerationTaskMappingService {
  public explorationID!: string;

  public languageAccentToContentStatusMap: LanguageAccentToContentStatusMap =
    {};

  private statusSubject = new BehaviorSubject<LanguageAccentToContentStatusMap>(
    {}
  );
  public status$ = this.statusSubject.asObservable();

  private pollingSub: Subscription | null = null;

  constructor(private voiceoverBackendApiService: VoiceoverBackendApiService) {}

  init(explorationID: string): void {
    this.explorationID = explorationID;
    this.startPolling();
  }

  private async getLatestVoiceoverRegenerationStatus(): Promise<void> {
    const status =
      await this.voiceoverBackendApiService.fetchLatestVoiceoverRegenerationStatusAsync(
        this.explorationID
      );

    this.languageAccentToContentStatusMap = status;
    this.statusSubject.next(status);
  }

  private startPolling(): void {
    console.log('Starting Polling for Voiceover Regeneration Status');
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    this.getLatestVoiceoverRegenerationStatus();

    this.pollingSub = interval(30000)
      .pipe(
        switchMap(() =>
          from(
            this.voiceoverBackendApiService.fetchLatestVoiceoverRegenerationStatusAsync(
              this.explorationID
            )
          )
        )
      )
      .subscribe(status => {
        this.languageAccentToContentStatusMap = status;
        this.statusSubject.next(status);
      });
  }
}
