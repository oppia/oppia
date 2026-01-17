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
 * @fileoverview Unit tests for Image Receiver Component.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatIconModule} from '@angular/material/icon';
import {APP_BASE_HREF} from '@angular/common';
import {RouterModule} from '@angular/router';
import {WindowRef} from 'services/contextual/window-ref.service';
import {IdGenerationService} from 'services/id-generation.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ImageReceiverComponent} from './image-receiver.component';
import {BlogDashboardPageService} from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ElementRef} from '@angular/core';

describe('ImageReceiverComponent', () => {
  let component: ImageReceiverComponent;
  let fixture: ComponentFixture<ImageReceiverComponent>;
  let igs: IdGenerationService;
  let windowRef: WindowRef;
  let dropAreaRefSpy: jasmine.Spy;
  let windowRefSpy: jasmine.Spy;

  const dragoverEvent = document.createEvent('Event');
  dragoverEvent.initEvent('mockdragover', true, true);
  (dragoverEvent as unknown as Record<string, unknown>).returnValue = false;
  dragoverEvent.preventDefault = () => {};

  const dropEvent = document.createEvent('Event');
  dropEvent.initEvent('mockdrop', true, true);
  (dropEvent as unknown as Record<string, unknown>).returnValue = false;
  dropEvent.preventDefault = () => {};

  beforeEach(waitForAsync(() => {
    windowRef = new WindowRef();
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        HttpClientTestingModule,
        RouterModule.forRoot([]),
      ],
      declarations: [ImageReceiverComponent, MockTranslatePipe],
      providers: [
        BlogDashboardPageService,
        {provide: WindowRef, useValue: windowRef},
        {provide: APP_BASE_HREF, useValue: '/'},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageReceiverComponent);
    component = fixture.componentInstance;
    igs = TestBed.inject(IdGenerationService);
    fixture.detectChanges();
    dropAreaRefSpy = spyOn(
      component.dropAreaRef.nativeElement,
      'addEventListener'
    );
    windowRefSpy = spyOn(windowRef.nativeWindow, 'addEventListener');
  });

  it('should generate a random input class name on initialization', () => {
    spyOn(igs, 'generateNewId').and.returnValue('-new-id');
    component.fileInputClassName = '';
    component.ngOnInit();
    expect(component.fileInputClassName).toBe(
      'image-uploader-file-input-new-id'
    );
  });

  it('should register drag and drop event listener', () => {
    component.ngAfterViewInit();
    expect(dropAreaRefSpy.calls.allArgs()).toEqual([
      ['drop', jasmine.any(Function)],
      ['dragover', jasmine.any(Function)],
      ['dragleave', jasmine.any(Function)],
    ]);
    expect(windowRefSpy.calls.allArgs()).toEqual([
      ['dragover', jasmine.any(Function)],
      ['drop', jasmine.any(Function)],
    ]);
  });

  it('should upload image on drop', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];
    const dataTransfer = new DataTransfer();
    const validFile = new File(['content'], 'image.jpg', {type: 'image/jpg'});
    dataTransfer.items.add(validFile);

    spyOn(component, 'validateUploadedFile').and.returnValue(null);
    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer})
    );
    expect(component.fileChanged.emit).toHaveBeenCalledWith(validFile);
  });

  it('should not upload image on drop if the event is empty', () => {
    spyOn(component.fileChanged, 'emit');
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png'];
    const dataTransfer = null;
    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer} as DragEventInit)
    );
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload image on drop if the image format is not allowed', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png'];
    const dataTransfer = new DataTransfer();
    const file = new File([''], 'image.svg', {type: 'image/svg+xml'});
    dataTransfer.items.add(file);

    spyOn(component, 'validateUploadedFile').and.returnValue(
      'This image format is not supported'
    );
    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer})
    );
    expect(component.errorMessage).toBe('This image format is not supported');
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload image on drop if the image filename extension does not match the image format', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];
    const dataTransfer = new DataTransfer();
    const fileWithDiffNameAndExtension = new File([''], 'image.png', {
      type: 'image/svg+xml',
    });
    dataTransfer.items.add(fileWithDiffNameAndExtension);

    spyOn(component, 'validateUploadedFile').and.returnValue(
      'This image format does not match the filename extension.'
    );
    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer})
    );
    expect(component.errorMessage).toBe(
      'This image format does not match the filename extension.'
    );
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should return correct format string when there is one allowed image format', () => {
    component.allowedImageFormats = ['jpeg'];
    const formatString = component.getAllowedImageFormatsString();
    expect(formatString).toBe('Is in .jpeg format');
  });

  it('should emit fileChanged event if validation passes', () => {
    const validFile = new File(['content'], 'image.jpg', {type: 'image/jpg'});

    spyOn(component, 'validateUploadedFile').and.returnValue(null);
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];
    spyOn(component.fileChanged, 'emit');

    const mockInput = document.createElement('input');
    Object.defineProperty(mockInput, 'files', {
      value: [validFile],
      writable: false,
    });
    component.imageInputRef = new ElementRef(mockInput);

    component.handleFile();
    expect(component.fileChanged.emit).toHaveBeenCalledWith(validFile);
  });

  it('should not upload image on drop if the allowed image formats list contains non allowed file formats', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg', 'mp3'];
    const dataTransfer = new DataTransfer();
    const file = new File([''], 'image.jpeg', {type: 'image/jpeg'});
    dataTransfer.items.add(file);

    spyOn(component, 'validateUploadedFile').and.returnValue(
      'mp3 is not in the list of allowed image formats.'
    );
    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer})
    );
    expect(component.errorMessage).toBe(
      'mp3 is not in the list of allowed image formats.'
    );
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload file on drop if the file is not an image', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];
    const dataTransfer = new DataTransfer();
    const fileWithInvalidFormat = new File([''], 'image.mp3', {type: 'mp3'});
    dataTransfer.items.add(fileWithInvalidFormat);

    spyOn(component, 'validateUploadedFile').and.returnValue(
      'This file is not recognized as an image'
    );
    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer})
    );
    expect(component.errorMessage).toBe(
      'This file is not recognized as an image'
    );
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload image if the size is more than 100KB', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];
    component.maxImageSizeInKB = 100;
    const dataTransfer = new DataTransfer();

    const fileWithLargeSize = new File([''], 'image.jpg', {type: 'image/jpg'});
    Object.defineProperty(fileWithLargeSize, 'size', {value: 100 * 1024 + 100});

    dataTransfer.items.add(fileWithLargeSize);

    spyOn(component, 'validateUploadedFile').and.returnValue(
      'The maximum allowed file size is 100 KB (100.1 KB given).'
    );
    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer})
    );
    expect(component.errorMessage).toBe(
      'The maximum allowed file size is 100 KB (100.1 KB given).'
    );
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload image if the size is more than 1MB for blog post', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];
    component.maxImageSizeInKB = 1024;
    const dataTransfer = new DataTransfer();

    const fileWithLargeSize = new File([''], 'image.jpg', {type: 'image/jpg'});
    Object.defineProperty(fileWithLargeSize, 'size', {
      value: 1024 * 1024 + 100,
    });

    dataTransfer.items.add(fileWithLargeSize);

    spyOn(component, 'validateUploadedFile').and.returnValue(
      'The maximum allowed file size is 1024 KB (100.0 MB given).'
    );
    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(
      new DragEvent('drop', {dataTransfer: dataTransfer})
    );
    expect(component.errorMessage).toBe(
      'The maximum allowed file size is 1024 KB (100.0 MB given).'
    );
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should change background color when user drags and leaves an image into the window', () => {
    const dragoverEvt = new DragEvent('dragover');
    const dragLeaveEvt = new DragEvent('dragleave');
    spyOn(dragLeaveEvt, 'preventDefault');
    spyOn(dragoverEvt, 'preventDefault');
    expect(component.backgroundWhileUploading).toBe(false);
    component.ngAfterViewInit();
    component.dropAreaRef.nativeElement.dispatchEvent(dragoverEvt);
    expect(dragoverEvt.preventDefault).toHaveBeenCalled();
    expect(component.backgroundWhileUploading).toBe(true);
    component.dropAreaRef.nativeElement.dispatchEvent(dragLeaveEvt);
    expect(dragLeaveEvt.preventDefault).toHaveBeenCalled();
    expect(component.backgroundWhileUploading).toBe(false);
  });

  it('should prevent default browser behavior if user drops an image outside of image-uploader', () => {
    const mockWindow = {
      addEventListener: (
        eventname: string,
        callback: EventListenerOrEventListenerObject
      ) => {
        document.addEventListener('mock' + eventname, callback);
      },
    };
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(
      mockWindow as Window
    );
    spyOn(dropEvent, 'preventDefault');
    spyOn(dragoverEvent, 'preventDefault');
    component.ngAfterViewInit();
    document.dispatchEvent(dropEvent);
    expect(dropEvent.preventDefault).toHaveBeenCalled();
    document.dispatchEvent(dragoverEvent);
    expect(dragoverEvent.preventDefault).toHaveBeenCalled();
  });

  it('should upload a valid image', () => {
    const validFile = new File(['content'], 'image.jpg', {type: 'image/jpg'});

    spyOn(component, 'validateUploadedFile').and.returnValue(null);

    const mockInput = document.createElement('input');
    Object.defineProperty(mockInput, 'files', {
      value: [validFile],
      writable: false,
    });
    component.imageInputRef = new ElementRef(mockInput);

    spyOn(component.fileChanged, 'emit');
    component.handleFile();
    expect(component.fileChanged.emit).toHaveBeenCalledWith(validFile);
  });
});
