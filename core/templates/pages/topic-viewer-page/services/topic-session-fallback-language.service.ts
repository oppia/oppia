// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Session-only fallback language selection state for lessons.
 */

import {Injectable} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';

interface TopicSessionFallbackLanguageState {
  textLanguageCode: string;
  voiceoverLanguageCode: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TopicSessionFallbackLanguageService {
  private readonly STORAGE_KEY = 'topic_session_fallback_language';

  constructor(private windowRef: WindowRef) {}

  getFallbackSelection(): TopicSessionFallbackLanguageState | null {
    return this.getSavedState();
  }

  saveFallbackSelection(
    textLanguageCode: string,
    voiceoverLanguageCode: string | null
  ): void {
    if (!this.isSessionStorageAvailable()) {
      return;
    }

    const state: TopicSessionFallbackLanguageState = {
      textLanguageCode,
      voiceoverLanguageCode,
    };

    this.windowRef.nativeWindow.sessionStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  clearSelection(): void {
    if (!this.isSessionStorageAvailable()) {
      return;
    }
    this.windowRef.nativeWindow.sessionStorage.removeItem(this.STORAGE_KEY);
  }

  private getSavedState(): TopicSessionFallbackLanguageState | null {
    if (!this.isSessionStorageAvailable()) {
      return null;
    }

    const serializedState = this.windowRef.nativeWindow.sessionStorage.getItem(
      this.STORAGE_KEY
    );

    if (!serializedState) {
      return null;
    }

    try {
      return JSON.parse(serializedState) as TopicSessionFallbackLanguageState;
    } catch (e) {
      this.clearSelection();
      return null;
    }
  }

  private isSessionStorageAvailable(): boolean {
    const testKey = 'topicSessionFallbackLanguage';
    try {
      this.windowRef.nativeWindow.sessionStorage.setItem(testKey, testKey);
      this.windowRef.nativeWindow.sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}
