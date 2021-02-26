// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IdGenerationService } from 'services/id-generation.service';
import { AudioFileUploaderComponent } from './audio-file-uploader.component';

/**
 * @fileoverview Tests for audio-file-uploader component.
 */

describe('Audio File Uploader Component', () => {
  let component: AudioFileUploaderComponent;
  let fixture:
    ComponentFixture<AudioFileUploaderComponent>;
  let testId: string = '123';

  class MockIdGenerationService {
    generateNewId(): string {
      return testId;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AudioFileUploaderComponent],
      providers: [{ provide: IdGenerationService,
        useClass: MockIdGenerationService }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture =
      TestBed.createComponent(AudioFileUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initalize correctly', () => {
    expect(component.inputFieldClassName)
      .toEqual('audio-file-uploader-input' + testId);
    expect(component.inputFieldFormId)
      .toEqual('audio-file-uploader-form' + testId);
  });

  it('should validate files correctly', () => {
    let mockFile = new File(['foo'], 'audio.mp3', {
      type: 'audio/mpeg',
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual(null);
    expect(component.validateUploadedFile(null))
      .toEqual('No audio file was uploaded.');
    mockFile = new File(['foo'], 'audio.mp3', {
      type: 'other than audio'
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual('Only the MP3 audio format is currently supported.');
    mockFile = new File(['foo'], '', {
      type: 'audio/mpeg',
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual('Filename must not be empty.');
    mockFile = new File(['foo'], 'video.mp4', {
      type: 'audio/mpeg',
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual('This audio format does not match the filename extension.');
  });
});
