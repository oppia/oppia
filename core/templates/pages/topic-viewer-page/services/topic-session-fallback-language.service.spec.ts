// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for TopicSessionFallbackLanguageService.
 */

import {TestBed} from '@angular/core/testing';
import {WindowRef} from 'services/contextual/window-ref.service';
import {TopicSessionFallbackLanguageService} from './topic-session-fallback-language.service';

describe('TopicSessionFallbackLanguageService', () => {
  let service: TopicSessionFallbackLanguageService;
  let mockSessionStorage: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    const store: {[key: string]: string} = {};
    mockSessionStorage = jasmine.createSpyObj('Storage', [
      'getItem',
      'setItem',
      'removeItem',
      'clear',
    ]);
    mockSessionStorage.getItem.and.callFake(
      (key: string) => store[key] || null
    );
    mockSessionStorage.setItem.and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    mockSessionStorage.removeItem.and.callFake((key: string) => {
      delete store[key];
    });
    mockSessionStorage.clear.and.callFake(() => {
      Object.keys(store).forEach(k => delete store[k]);
    });

    const mockWindowRef = new WindowRef();
    Object.defineProperty(mockWindowRef, 'nativeWindow', {
      value: {sessionStorage: mockSessionStorage},
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        TopicSessionFallbackLanguageService,
        {provide: WindowRef, useValue: mockWindowRef},
      ],
    });
    service = TestBed.inject(TopicSessionFallbackLanguageService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should return null when no fallback selection is saved', () => {
    expect(service.getFallbackSelection()).toBeNull();
  });

  it('should save and retrieve a fallback selection', () => {
    service.saveFallbackSelection('es', 'en');
    const selection = service.getFallbackSelection();
    expect(selection).toEqual({
      textLanguageCode: 'es',
      voiceoverLanguageCode: 'en',
    });
  });

  it('should save with null voiceover code', () => {
    service.saveFallbackSelection('en', null);
    const selection = service.getFallbackSelection();
    expect(selection).toEqual({
      textLanguageCode: 'en',
      voiceoverLanguageCode: null,
    });
  });

  it('should clear a saved fallback selection', () => {
    service.saveFallbackSelection('fr', null);
    expect(service.getFallbackSelection()).not.toBeNull();

    service.clearSelection();
    expect(service.getFallbackSelection()).toBeNull();
  });

  it('should clear selection when JSON parse fails on retrieval', () => {
    const corruptData = 'not-valid-json';
    mockSessionStorage.setItem('topic_session_fallback_language', corruptData);

    const result = service.getFallbackSelection();

    expect(result).toBeNull();
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'topic_session_fallback_language'
    );
  });

  it('should propagate error when sessionStorage throws on getItem', () => {
    mockSessionStorage.getItem.and.throwError('Storage error');

    expect(() => service.getFallbackSelection()).toThrowError('Storage error');
  });

  it('should return null when sessionStorage is unavailable on retrieval', () => {
    mockSessionStorage.setItem.and.callFake(() => {
      throw new Error('Storage unavailable');
    });

    const result = service.getFallbackSelection();

    expect(result).toBeNull();
  });

  it('should handle saveFallbackSelection when sessionStorage is unavailable', () => {
    mockSessionStorage.setItem.and.callFake(() => {
      throw new Error('Storage unavailable');
    });

    expect(() => service.saveFallbackSelection('en', null)).not.toThrowError();
    expect(mockSessionStorage.setItem).toHaveBeenCalled();
  });

  it('should handle clearSelection when sessionStorage is unavailable', () => {
    mockSessionStorage.setItem.and.callFake(() => {
      throw new Error('Storage unavailable');
    });

    expect(() => service.clearSelection()).not.toThrowError();
    expect(mockSessionStorage.setItem).toHaveBeenCalled();
  });

  it('should return the last saved selection when saved multiple times', () => {
    service.saveFallbackSelection('en', null);
    service.saveFallbackSelection('es', 'fr');
    service.saveFallbackSelection('pt', 'pt');

    const selection = service.getFallbackSelection();
    expect(selection).toEqual({
      textLanguageCode: 'pt',
      voiceoverLanguageCode: 'pt',
    });
  });

  it('should overwrite existing selection on save', () => {
    service.saveFallbackSelection('en', 'en');
    service.saveFallbackSelection('fr', null);

    const selection = service.getFallbackSelection();
    expect(selection).toEqual({
      textLanguageCode: 'fr',
      voiceoverLanguageCode: null,
    });
  });
});
