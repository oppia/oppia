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
 * @fileoverview Service to fetch voiceover regeneration task status mapping for
 * the given exploration.
 */

import {EventEmitter, Injectable} from '@angular/core';
import {BehaviorSubject, interval, from, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {
  VoiceoverBackendApiService,
  LanguageAccentToContentStatusMap,
} from 'domain/voiceover/voiceover-backend-api.service';
import {VoiceoverLanguageManagementService} from './voiceover-language-management-service';

@Injectable({
  providedIn: 'root',
})
export class VoiceoverRegenerationJobService {
  public explorationID!: string;

  public languageAccentToContentStatusMap: LanguageAccentToContentStatusMap =
    {};
  public currentLanguageAccentCodes: string[] = [];

  public statusSubject = new BehaviorSubject<LanguageAccentToContentStatusMap>(
    {}
  );
  public status$ = this.statusSubject.asObservable();

  public pollingSub: Subscription | null = null;
  private _newRegenerationRequestEventEmitter = new EventEmitter<void>();

  constructor(
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private voiceoverLanguageManagementService: VoiceoverLanguageManagementService
  ) {}

  init(explorationID: string): void {
    this.explorationID = explorationID;
    this.startPolling();
  }

  async getLatestVoiceoverRegenerationStatus(): Promise<void> {
    const status =
      await this.voiceoverBackendApiService.fetchLatestVoiceoverRegenerationStatusAsync(
        this.explorationID
      );

    this.languageAccentToContentStatusMap = status;
    this.statusSubject.next(status);
  }

  getContentRegenerationStatus(
    languageAccentCode: string,
    contentId: string
  ): string {
    return this.languageAccentToContentStatusMap[languageAccentCode]?.[
      contentId
    ];
  }

  updateContentRegenerationStatus(
    languageAccentCode: string,
    contentId: string,
    status: string
  ): void {
    if (!this.languageAccentToContentStatusMap[languageAccentCode]) {
      this.languageAccentToContentStatusMap[languageAccentCode] = {};
    }
    this.languageAccentToContentStatusMap[languageAccentCode][contentId] =
      status;
    this.statusSubject.next(this.languageAccentToContentStatusMap);
  }

  startPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    this.getLatestVoiceoverRegenerationStatus();

    // Updates the voiceover regeneration status every 5 seconds.
    this.pollingSub = interval(5000)
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

  updateNewlyAddedRegenerationTasks(contentIds: string[]): void {
    for (let languageAccentCode of this.currentLanguageAccentCodes) {
      for (let contentId of contentIds) {
        if (!this.languageAccentToContentStatusMap[languageAccentCode]) {
          this.languageAccentToContentStatusMap[languageAccentCode] = {};
        }
        this.languageAccentToContentStatusMap[languageAccentCode][contentId] =
          'GENERATING';
      }
    }
    this._newRegenerationRequestEventEmitter.emit();
  }

  get onNewRegenerationRequest(): EventEmitter<void> {
    return this._newRegenerationRequestEventEmitter;
  }
}
