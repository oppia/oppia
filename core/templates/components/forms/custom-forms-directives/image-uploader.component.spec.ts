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
import { WindowRef } from 'services/contextual/window-ref.service';
import { IdGenerationService } from 'services/id-generation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ImageUploaderComponent } from './image-uploader.component';


fdescribe('ImageUploaderComponent', () => {
  let component: ImageUploaderComponent;
  let fixture: ComponentFixture<ImageUploaderComponent>;
  let igs: IdGenerationService;
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    windowRef = new WindowRef();
    TestBed.configureTestingModule({
      declarations: [
        ImageUploaderComponent,
        MockTranslatePipe,
      ],
      providers:[
        {provide: WindowRef, useValue: windowRef}
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageUploaderComponent);
    component = fixture.componentInstance;
    igs = TestBed.inject(IdGenerationService);
    fixture.detectChanges();

    spyOn(component.dropAreaRef.nativeElement, 'addEventListener');
    spyOn(windowRef.nativeWindow, 'addEventListener');
  });

  it('should generate a random input class name on initialization', () => {
    spyOn(igs, 'generateNewId').and.returnValue('-new-id');

    component.ngOnInit();

    expect(component.fileInputClassName).toBe(
      'image-uploader-file-input-new-id');
  });

  it('should register drag and drop event listener', () => {
    component.ngAfterViewInit();

    expect(component.dropAreaRef.nativeElement.addEventListener)
      .toHaveBeenCalledTimes(3);
    expect(windowRef.nativeWindow.addEventListener)
      .toHaveBeenCalledTimes(2);
  });

  it('should upload image on drop', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];

    let dataTransfer = new DataTransfer();
    const validFile = new File(['image'], 'image.jpg',{type: 'image/jpg'});
    dataTransfer.items.add(validFile);

    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(new DragEvent('drop', {
      dataTransfer: dataTransfer
    }));

    expect(component.fileChanged.emit).toHaveBeenCalled();
  });

  it('should not upload image on drop if the image' +
    ' format is not allowed', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png'];

    let dataTransfer = new DataTransfer();
    const file = new File(
      ['image'], 'image.svg',{type: 'image/svg+xml'});
    dataTransfer.items.add(file);

    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(new DragEvent('drop', {
      dataTransfer: dataTransfer
    }));

    expect(component.errorMessage).toBe(
      'This image format is not supported')
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload image on drop if the image filename extension' +
    ' does not match the image format', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];

    let dataTransfer = new DataTransfer();
    const fileWithDiffNameAndExtension = new File(
      ['image'], 'image.png',{type: 'image/svg+xml'});
    dataTransfer.items.add(fileWithDiffNameAndExtension);

    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(new DragEvent('drop', {
      dataTransfer: dataTransfer
    }));

    expect(component.errorMessage).toBe(
      'This image format does not match the filename extension.')
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload image on drop if the allowed image formats list' +
    ' contains non allowed file formats', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg', 'mp3'];

    let dataTransfer = new DataTransfer();
    const file = new File(
      ['image'], 'image.jpeg',{type: 'image/jpeg'});
    dataTransfer.items.add(file);

    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(new DragEvent('drop', {
      dataTransfer: dataTransfer
    }));

    expect(component.errorMessage).toBe(
      'mp3 is not in the list of allowed image formats.')
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload file on drop if the file is not an image', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];

    let dataTransfer = new DataTransfer();
    const fileWithInvalidFormat = new File(
      ['image'], 'image.mp3',{type: 'mp3'});
    dataTransfer.items.add(fileWithInvalidFormat);

    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(new DragEvent('drop', {
      dataTransfer: dataTransfer
    }));

    expect(component.errorMessage).toBe(
      'This file is not recognized as an image')
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should not upload image if the size is more than 100KB', () => {
    component.ngAfterViewInit();
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];

    let dataTransfer = new DataTransfer();
    let fileWithLargeSize = new File(
      [''], 'image.jpg',{type: 'image/jpg'});

    Object.defineProperty(fileWithLargeSize, 'size', {value: 100 * 1024 + 100});

    dataTransfer.items.add(fileWithLargeSize);

    spyOn(component.fileChanged, 'emit');

    component.dropAreaRef.nativeElement.dispatchEvent(new DragEvent('drop', {
      dataTransfer: dataTransfer
    }));

    expect(component.errorMessage).toBe(
      'The maximum allowed file size is 100 KB (100.1 KB given).')
    expect(component.fileChanged.emit).not.toHaveBeenCalled();
  });

  it('should change background color when user drags and leaves an' +
  ' image into the window', () =>{
    let dragoverEvent = new DragEvent('dragover');
    let dragLeaveEvent = new DragEvent('dragleave');
    spyOn(dragLeaveEvent, 'preventDefault');
    spyOn(dragoverEvent, 'preventDefault');

    expect(component.backgroundWhileUploading).toBe(false);

    component.ngAfterViewInit();
    component.dropAreaRef.nativeElement.dispatchEvent(dragoverEvent);

    expect(dragoverEvent.preventDefault).toHaveBeenCalled();
    expect(component.backgroundWhileUploading).toBe(true);

    component.dropAreaRef.nativeElement.dispatchEvent(dragLeaveEvent);

    expect(dragLeaveEvent.preventDefault).toHaveBeenCalled();
    expect(component.backgroundWhileUploading).toBe(false);
  });

  it('should prevent default browser behavior if user drops an image outside' +
    ' of image-uploader', () => {
    const dropEvent = new DragEvent('drop');
    const dragOverEvent = new DragEvent('dragover');

    spyOn(dropEvent, 'preventDefault');
    spyOn(dragOverEvent, 'preventDefault');

    component.ngAfterViewInit();

    windowRef.nativeWindow.dispatchEvent(dropEvent);
    expect(dropEvent.preventDefault).toHaveBeenCalled();

    windowRef.nativeWindow.dispatchEvent(dragOverEvent);
    expect(dragOverEvent.preventDefault).toHaveBeenCalled();
  });

  it('should upload an image', () => {
    component.imageInputRef.nativeElement = {
      files: [new File(['image'], 'image.jpg',{type: 'image/jpg'})]
    };
    component.imageInputRef.nativeElement.value = 'image.jpg';
    component.allowedImageFormats = ['jpeg', 'jpg', 'gif', 'png', 'svg'];
    spyOn(component.fileChanged, 'emit');

    component.handleFile();

    expect(component.fileChanged.emit).toHaveBeenCalled();
  });
});
