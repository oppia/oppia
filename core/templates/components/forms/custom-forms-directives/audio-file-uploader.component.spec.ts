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

/**
 * @fileoverview Tests for audio-file-uploader component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SmartRouterModule } from 'hybrid-router-module-provider';
import { AudioFileUploaderComponent } from './audio-file-uploader.component';

describe('Audio File Uploader Component', () => {
  let component: AudioFileUploaderComponent;
  let fixture:
    ComponentFixture<AudioFileUploaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([])
      ],
      declarations: [AudioFileUploaderComponent],
      providers: [{
        provide: APP_BASE_HREF,
        useValue: '/'
      }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture =
      TestBed.createComponent(AudioFileUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should upload an audio file', () => {
    let files = [
      new File(['foo'], 'audio.mp3', {
        type: 'audio/mpeg',
      }),
      new File(['bar'], 'audio.mp3', {
        type: 'audio/mp3',
      })
    ];
    spyOn(component.fileChange, 'emit');
    spyOn(component.fileClear, 'emit');

    files.forEach(file => {
      component.fileInputRef.nativeElement = {
        files: [file]
      };

      component.addAudio(new Event('add'));

      expect(component.fileChange.emit).toHaveBeenCalledWith(files[0]);
      expect(component.fileClear.emit).not.toHaveBeenCalled();
    });
  });

  it('should not upload an audio file when the file fails' +
    ' validation criteria', () => {
    const testCases = [
      {
        title: 'Uploading a file that is not an mp3 audio.',
        file: new File(['foo'], 'audio.mp3', {type: 'audio/aac'}),
        expected: 'Only the MP3 audio format is currently supported.'
      },
      {
        title: 'Uploading a file with no name.',
        file: new File(['foo'], '', {type: 'audio/mpeg'}),
        expected: 'Filename must not be empty.'
      },
      {
        title: 'Uploading an audio whose audio format does not match the' +
          ' filename extension.',
        file: new File(['foo'], 'video.mp4', {type: 'audio/mpeg'}),
        expected: 'This audio format does not match the filename extension.'
      },
      {
        title: 'Uploading a non-audio file.',
        file: new File(['foo'], 'video.mp4', {type: 'png'}),
        expected: 'This file is not recognized as an audio file.'
      }
    ];

    spyOn(component.fileClear, 'emit');
    spyOn(component.fileChange, 'emit');
    spyOn(component.inputFormRef.nativeElement, 'reset');

    testCases.forEach(testCase => {
      component.fileInputRef.nativeElement = {
        files: [testCase.file]
      };

      component.addAudio(new Event('add'));

      expect(component.errorMessage).toEqual(testCase.expected, testCase.title);
      expect(component.fileClear.emit).toHaveBeenCalled();
      expect(component.fileChange.emit).not.toHaveBeenCalled();
      expect(component.inputFormRef.nativeElement.reset).toHaveBeenCalled();
    });

    // Testing an empty file separately, as inputForm.nativeElement.reset() is
    // not called in that case.
    component.fileInputRef.nativeElement = {
      files: [null]
    };
    component.addAudio(new Event('add'));
    expect(component.fileClear.emit).toHaveBeenCalled();
    expect(component.fileChange.emit).not.toHaveBeenCalled();
  });
});
