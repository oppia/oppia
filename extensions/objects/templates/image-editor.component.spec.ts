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
 * @fileoverview Unit tests for the image editor.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, tick, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ImageEditorComponent } from './image-editor.component';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { ContextService } from 'services/context.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AppConstants } from 'app.constants';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { AlertsService } from 'services/alerts.service';
import { SimpleChanges } from '@angular/core';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
let gifshot = require('gifshot');

declare global {
  interface Window {
    GifFrames: Function;
  }
}

describe('ImageEditor', () => {
  let component: ImageEditorComponent;
  let fixture: ComponentFixture<ImageEditorComponent>;
  let contextService: ContextService;
  let imagePreloaderService: ImagePreloaderService;
  let imageUploadHelperService: ImageUploadHelperService;
  let imageLocalStorageService: ImageLocalStorageService;
  let alertsService: AlertsService;
  let svgSanitizerService: SvgSanitizerService;
  let httpTestingController: HttpTestingController;
  let dimensionsOfImage = {
    width: 450,
    height: 350
  };

  let dataGif = {
    uploadedFile: {
      lastModified: 1622307491398,
      name: '2442125.gif',
      size: 6700,
      type: 'image/gif'
    },
    uploadedImageData:
      'data:image/gif;base64,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' +
      'GPQQAAIfkECQkADwAsCwARAPMApgAABv/Ah3BILBqPyKRyyWw6n8sQdEqtWq/YrH' +
      'bLVUq74LB4TC6bz+i0es1uu9/wuHxOr9vv+Lx+z+/7/4CBgoOEhYaHiImKi4yNjo' +
      '+QkZKTlJWWl5iZmpucnZ6ffV+go6SlQqKmjqiprK2ur7CxsrO0tba3uLm6u7y9vr' +
      '/AwcLDxMXGx8jJysvMzc7P0NGgq2LU0oTWYNnX3N3e3+Dh4uPk5ebn6Onq6+zt7u' +
      '/w8fLz9PX29/j5+vv8/f7/AAMKHEiwoMGDCBMqDBRi28KHUxxCjCPxT8WJbi5i3M' +
      'ixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2bOHPq3Mmz5yF2jT6DCh1K1K' +
      'LMhtqKKl3KtKnTp1CjSp1KtarVq1izat3KtavXRQGqChBLVcCAA1IBBEgQoIHTAA' +
      'IOOFBgQAGCAwHCKoUbN0EBAgvQ6m0agMFgqIUPPwUwdirjr5AjS55MubLlB0Ava9' +
      '7MubPnz6BDix79JDOwIAAh+QQFCQAhACwAAAAABAHHAAAG/8CQcEgsGo/IpHLJbD' +
      'oJzijxcJBar9isduuscr9XL3isFJPPSDN6zd6quZH2+C2v27WQe7FKxzb0WHyAQ3' +
      'mDUVRrEoZnEAIbAoWLS312imiIkkoQFx4VkZlbE1kEUKBsm52fpncVa5h3AKtubK' +
      '2yg6qBlLZauq5guLvBwndVA8PHs1fAyLxnxsxNy7sBWNTQYL1Epddc1swYVhATGw' +
      'HS3NlKz2Howo2P5pkCHyAJAQ9SAtjshrFW2/hyXiVj5gALvDX/niTs0g/ZQjsHTe' +
      'XTA6DhHVJYAAj4c0RMAG9SHuoJwJEbQGIKFFjSI3JJgA/3Og7BWKTlzEwSFCAAaV' +
      'IYAv8EPQ8gKGmQ2c+ezBoQtbONnb0FHAYcsDckQoRCNI+IejJIKdKvuwDYOwDVgI' +
      'IFMB/0E1iTgEZyEcHK3SeMrpqPB85SrRZIrhC6fhfZ7biAZ7h1gRNLAhwiaxQAMK' +
      'ExVkx51eTKSNkeu3zGsBKbgDQPE82FM+YkFruYPr2H9d/PLEFnYadOHcIyroOVWm' +
      '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' +
      'c1KcmFyBKLsngvDgJv8qaSrfZrwqA4QQAAOw==',
    originalWidth: 260,
    originalHeight: 200,
    savedImageFilename: 'saved_file_name.gif',
    savedImageUrl: 'assets/images'
  };

  let dataPng = {
    uploadedFile: {
      lastModified: 1622307491398,
      name: '2442125.png',
      size: 6500,
      type: 'image/png'
    },
    uploadedImageData:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoCAAAAABfjj' +
      '4JAAAABGdBTUEAALGPC/xhBQAAAAJiS0dEAP+Hj8y/AAAAB3RJTUUH5QcCChUone' +
      'P/MgAAAAFvck5UAc+id5oAAA1ESURBVHja7dx7jFz3Wcbx5/c7l7nuxbvOrjdO4t' +
      'iVKxIlEaiJFEWpSgoiKiFpQb0ISEFquSiVmgrScBFQ/kAtoQ0KjaiKmoKIClLTJo' +
      'IEqFIBihqpVTEqoopbEhxDvfF1ba+9l9mZOZffyx9zxo6Nt/Y2zePJ6vn8M1mv35' +
      'kzX589OxvtvG4RF2ZxPl1GF/hE8Agep6C5Dc15CIVCkyg0iUKTKDSJQpMoNIlCky' +
      'g0iUKTKDSJQpMoNIlCkyg0iUKTKDSJQpMoNIlCkyg0iUKTKDRJDMABgJ13W8s8oi' +
      'wNBgfngLK6hS89gKjU3IbmYgOsin7ObVZ6ID57xg9/ZySPQ+SAoLmNzcXrXTtcFA' +
      'FAOP/zCRIAKGLNbWguNhgAgz/vtvToJ369a3iuuQ3OOcN6rJuHAh4OgEOobgdfLD' +
      '5NNbehuXjdu3OhHxKLQ/Xx8FpUBivMxW3NbWxu3dAOkQUr/t+f1/IICAGa29hcDM' +
      'AMhui82zIFojiPDDjntUqew8WWQ3Mbm4uBwcvA8289ShfyqKz+7MxrlSj4MncRNL' +
      'fROaFQaBKFJlFoEoUmUWgShSZRaBKFJlFoEoUmUWgShSZRaBKFJlFoEoUmUWgShS' +
      'ZRaBKFJlFoEoUmiddb1PZG2Sf3RpnTGU2i0CQKTaLQJApNotAkCk2i0CQKTaLQJA' +
      'pNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNor132nu3uea09440NzJ74T' +
      'b7nPbeae/d5prT3jvSnPbekea09442JxQKTaLQJApNotAkCk2i0CQKTaLQJApNot' +
      'AkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNotAk2ntHmtMZTaLQJApNotAkCk' +
      '2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNotAkCk2ivX' +
      'fae7e55rT3jjQ3MnvhNvuc9t5p793mmtPeO9Kc9t6R5rT3jjYnFApNotAkCk2i0C' +
      'QKTaLQJApNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNotAkCk2i0CTae0' +
      'ea0xlNotAkCk2i0CQKTaLQJApNcvHQBuQB4dUTHhZ5BzMLJQA453x145PQQhRCca' +
      'FH8shT5xwAMzf4j+qXiM2sn5Zn36YAoAB6OQCP06cMPtRqi8WkxX33b5/9/N56Ft' +
      'tksVirBW/hSHcwFoAAYHBMNjjOxOzsozjnnNngP4q8gQu9HC4Gh5p6PzjA6gZlMD' +
      'M477L6OXMBIT/7W9Lriy/2FwxANHhnDABYOZgIJeC8AwIwOPbBs0RW+jrWfddSHH' +
      'LAGdzgng1wcDA4pGV65vi9DY6sDvRre778lZW3vu/mMP3vD0/8xo8c2fLxvzqCnR' +
      '/8vcNzLz6y9NFbFqOvPbFny13vfUu37nx13nig+k18uGj4Vh6rHnf4cezdhY9w+D' +
      'yrOxneJoCFAERV1DwZ/EU3eDi78L2d5RbXCzz8CcgczCGLzjmwctmZwcEsNQQzQw' +
      'IzM7NaWa8DQO4cECwU1T9WCOYj62drw8LVbVF9aEVah/ehiLwFxPF2F2J0D568/8' +
      'SJFWBs6sM7vvp53P+rV+15/wKAXV9608HHHsWv3Hngz0+sAs1t05+dviqGOXulKO' +
      'BdKKPECpcU3cE7WR3iwQ2qD5EiqicWLK3CR857B1gVurfqnHPOIR98vbrMORicQ1' +
      'F/9RuCLE+rQhf5yfDioQEElJ35/spKVmRZL2QZXLfTC0VZFmXZNbMQzHoIFoJZns' +
      'VpnsMKABZKsypkGcxHlmXpMDzOfMEZAHN5lARDiGDB4lrtCGAH//5ze2t9tNBBVD' +
      'a6zqKPfPRvH4zjEPD4HQ9/unTW6AK1Wi9Do3vdr92zvYburn6/cN6hTCx3adlLh6' +
      'dwdeOHZ3hwSWwB8bC895FzhgSxQxJWJ5zz3nnUnfPeOdeIojiKYl8vG+NJlPikls' +
      'a19njt6lY0OKcvEvqil44z/yJu+BWIS7kkAXAGO/s3B8/GLjZ55vMn2qlrX7l7sV' +
      'hAB3DNuLWQoT3RasDy4NNGa6K9ZOl0p9/r9wE3vvWGnTM1IOAH5OAGj+7OOYx1jt' +
      'FsEOOiz+fs/V/qpSM55yJULPuLXDoKB1gIVg4PuzTvQz/rrnfpKNO6A0qrLh3XIH' +
      'hgbfnBg987lMc75z684+k/bf7OL0/sfd9+ADc9Pbf0+ENrD7zzwKOH5/No+665h8' +
      'a2IOSRO/QDXjpi7zxgVl16u51LunRYKC/x0nFJ3wzNYdg5j6pvNSXgnAOK6ltaOb' +
      'h1vdLX17/jMutjeOIMAvvq49gayZnHNI/BZ5rNL5x45p+Xb33nTQsz09n4vTMH3v' +
      'LrX/jfaPcvXXtgx7395Q/s2vHubz7zn1t+6u4pAPCJRdcguFedE91eFTJUhYcnbf' +
      'C1xvd52rmvTlsHmBkQA2Zmg1ccBqtex0R+8I3wh/PNMI/8eW8yL1ecmQFmUXWODJ' +
      '+IL+t1BIQLh+5nZXUmDwO76r3SZs0mqjezl84DeYJ+FKNXR24pTueu0a+FkzNLsy' +
      '/vT67bfnR8Ydr3a11zNe+aQJaiXzYRPBCsOmwA1smq1xlnAldndBY1mhc6wuqJLg' +
      '+/t/jq6690DnDOhbLRwqvCBh/K5If1zfD8Ixml/8/7RpnTT4YkCk2i0CQKTaLQJA' +
      'pNotAk2nunvXeba05770hzI7MXbrPPae+d9t5trjntvSPNae8daU5772hzQqHQJA' +
      'pNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNot' +
      'AkCk2ivXekOZ3RJApNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNotAkCk' +
      '2i0CQKTaLQJApNotAkCk2i0CTae6e9d5trTnvvSHMjsxdus89p75323m2uOe29I8' +
      '1p7x1pTnvvaHNCodAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNotAkCk2i0C' +
      'QKTaLQJApNotAkCk2i0CQKTaK9d6Q5ndEkCk2i0CQKTaLQJApNotAkCk2i0CQKTa' +
      'LQJApNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJNp7p713m2tOe+9IcyOzF2' +
      '6zz2nvnfbeba457b0jzWnvHWlOe+9oc0Kh0CQKTaLQJApNotAkCk2i0CQKTaLQJA' +
      'pNotAkCk2i0CQKTaLQJApNotAkCk2i0CQKTaLQJApNMrJ770q/NAlzwaI8WWvaIb' +
      'elWB3rodmdPllbiRtW5vUsSpYbq9uPbouGd19Ywj7OS50b2TO66yb7azAf5YB1cG' +
      'VruVNPEYp8/nhrNlnJrZ0X3e5EMb1sETIEH+ARJfnlPu71xK/9Ll4f7bVifHCErm' +
      'gBL22P63ZsLFlsbCtWj7STqG/FdDhd+pONKRybhEfpXM+nI/t8RvaMNjcOlIYyB4' +
      'Bi96lG8tJn9rUmG8eO29ZtSWS+eXChndkVZRezNWAlCaGenvlNrZEzsmeAa2D+mo' +
      'WVN0fzVx6uz5UvL5grv3ZjPZ46YklzamXl9NzO1bj5P53ZK049N3v9iXB67JXudZ' +
      'f7oL+PkQ3daeWf2DPfuPmP33M0u+1zz/1Jpzz4M9/MX9r+C8/ur9/9i//wVLf5kf' +
      'vWHvjL3jumFr5+wz1Pf2einGi+7aHotT/w62RkLx0t9J5vfPmvj//ZKx//SvKxR+' +
      '95/MHmj+/8+ck7/mnHZ377vx74xn2P3/rU/L/83e/vffmZm558xxPf/oNHZn/rp7' +
      '/eR3a5j3s9I3tGm2vPve0OPP8EfnLX9L75D149+8nx9lx8y1df2nd8/qqD+xq9Q8' +
      'cXk/eHRz+06+3px4q7l178ue8+mjd0jd4ot9ouv7eaHJg52MN4ue1bW/fVQ7EYN2' +
      'euf+iFT08lD2957lutrStHdn7xWBf7d+zvtxFWrHpr1Cga2dBrbRz77kL+4id/92' +
      'Re+4n//tST394/NvXk4e7PPnVf9+r3PPapyUM/9h/jN91/7b/u+psvtm9cO5ZuP4' +
      'k3Z7VyVEuPbOgmwtytP+r+8Mbsrbhzyz/O7z5au+uGve+97U3XvpDe/var9iy/+6' +
      '5nJx/+i6VHbn/+hdtuefZme+DaiQ9MjO73HLe4zicu94/gwOIn7ryjO4blcQB/9F' +
      'ijdcuDcydmugk69e5U33fKK7+zdfYkXHN5BujVkaU4Nns5jvPS5kb2jAamPnRFPA' +
      'aMoVic+c13feO621fStLHSuaI+6RbG4tkTR67v7N2VudMxOs16Hmrdxqzl0ai+wB' +
      'vZLzUsYdcYUGANcQOtuXt3h8OZW4qa4fQJ1/SnXmnUOsVM8/TadD+0HJIceQH4Ue' +
      '08wqEnukBAjlYXcR/eF92tzbTvvZtwiF17vESnbKzMJD72wFLeRjsCEF7z475ORj' +
      'b0EjxQWGMVPTRiuF6zjE/5lgsrwdfcWij7tTTYSlY72kCnnCjQ9S64eGSfz8heoy' +
      'dQA1KgHbYgRAC8wVkG74E1pHBxhrhsWD6Wox6hgcYInzUY7WPbVBSaRKFJFJpEoU' +
      'kUmkShSf4PLtcFn9vdh74AAAAldEVYdGRhdGU6Y3JlYXRlADIwMjEtMDctMDJUMT' +
      'A6MjE6MzkrMDA6MDDnnN2jAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIxLTA3LTAyVD' +
      'EwOjIxOjM5KzAwOjAwlsFlHwAAAABJRU5ErkJggg==',
    originalWidth: 360,
    originalHeight: 360,
    savedImageFilename: 'saved_file_name.gif',
    savedImageUrl: 'assets/images'
  };

  // This is used to generate a mock Image file from the data URI
  // present above.
  let localConvertImageDataToImageFile = (dataURI) => {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  };

  class MockImageUploadHelperService {
    convertImageDataToImageFile(dataURI) {
      return dataURI;
    }

    generateImageFilename(
        height: number, width: number, extension: string): string {
      return 'img_' + '12345' + '_height_' + height + '_width_' + width +
      '.' + extension;
    }
  }

  class MockReaderObject {
    onload = null;
    result = null;
    constructor() {
      this.onload = () => {
        return 'Fake onload executed';
      };
    }

    readAsDataURL(file) {
      this.onload();
      return 'The file is loaded';
    }
  }

  class MockImageObject {
    source = null;
    onload = null;
    constructor() {
      this.onload = () => {
        return 'Fake onload executed';
      };
    }

    set src(url) {
      this.onload();
    }

    addEventListener(txt, func, bool) {
      func();
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        imports: [HttpClientTestingModule],
        declarations: [
          ImageEditorComponent,
          MockTranslatePipe
        ],
        providers: [
          {
            provide: ImageUploadHelperService,
            useClass: MockImageUploadHelperService
          },
          ImageLocalStorageService],
        schemas: [NO_ERRORS_SCHEMA]
      }
    ).compileComponents();
  }));

  beforeEach(() => {
    httpTestingController = TestBed.inject(HttpTestingController);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    alertsService = TestBed.inject(AlertsService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    imagePreloaderService = TestBed.inject(ImagePreloaderService);
    contextService = TestBed.inject(ContextService);
    fixture = TestBed.createComponent(ImageEditorComponent);
    component = fixture.componentInstance;
    spyOn(contextService, 'getEntityId').and.returnValue('2');
    spyOn(contextService, 'getEntityType').and.returnValue('question');
    // This throws "Argument of type 'mockImageObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockImageObject'.
    // @ts-expect-error
    spyOn(window, 'Image').and.returnValues(new MockImageObject(), {
      src: null
    });
    // This throws "Argument of type 'mockReaderObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());

    component.ngOnInit();

    component.data = {
      mode: 2,
      metadata: {
        // This throws an error "Type '{ lastModified: number; name:
        // string; size: number; type: string; }' is missing the following
        // properties from type 'File': arrayBuffer, slice, stream, text"
        // We need to suppress this error because we only need the values given
        // below.
        // @ts-expect-error
        uploadedFile: {
          lastModified: 1622307491398,
          name: '2442125.svg',
          size: 2599,
          type: 'image/svg+xml'
        },
        uploadedImageData:
        'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb2' +
        '5lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHID' +
        'IwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVk' +
        'ctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bW' +
        'xucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iNzI2LjAwMD' +
        'AwMHB0IiBoZWlnaHQ9IjEyODAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCA3MjYuMD' +
        'AwMDAwIDEyODAuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaW' +
        'QgbWVldCI+CjxtZXRhZGF0YT4KQ3JlYXRlZCBieSBwb3RyYWNlIDEuMTUsIHdyaX' +
        'R0ZW4gYnkgUGV0ZXIgU2VsaW5nZXIgMjAwMS0yMDE3CjwvbWV0YWRhdGE+CjxnIH' +
        'RyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLDEyODAuMDAwMDAwKSBzY2FsZS' +
        'gwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbm' +
        'UiPgo8cGF0aCBkPSJNMzU3NSAxMjc2MyBjLTQ5OSAtNDUyIC03NzIgLTc2MSAtMT' +
        'A2OCAtMTIwOSAtODUyIC0xMjg5IC0xMTIyCi0yODY4IC03OTEgLTQ2MjQgMTM3IC' +
        '03MjcgMzk2IC0xNTIxIDcwOSAtMjE3NiBsNjQgLTEzNCAxMTMxIDAgMTEzMSAwID' +
        'Y5IDE0NApjMzgwIDc5NiA2NzEgMTc4MCA3NzkgMjYzNiA3MSA1NjMgODAgMTE2MC' +
        'AyNSAxNjUwIC0xMTYgMTAzOSAtNDczIDE5NTkgLTEwNzMKMjc2NSAtMjQyIDMyNC' +
        'AtNDk5IDYwMSAtODQ3IDkxMyAtNDQgMzkgLTgzIDcyIC04NSA3MiAtMiAwIC0yMi' +
        'AtMTcgLTQ0IC0zN3oKbTIyMiAtMzA3OCBjMzg2IC03MyA2ODIgLTM0NyA3ODUgLT' +
        'cyNSAyMCAtNzQgMjMgLTEwNyAyMiAtMjU1IDAgLTE5NCAtMTUKLTI2NCAtODIgLT' +
        'QwOSAtNTQgLTExNSAtMTEyIC0xOTggLTIwMSAtMjg3IC0xMjYgLTEyNiAtMjgyIC' +
        '0yMTYgLTQ1MyAtMjYyCi03MCAtMTggLTEwOSAtMjIgLTI0OCAtMjIgLTE5NiAxIC' +
        '0yNzYgMTggLTQzNSA5NiAtMjY5IDEzMSAtNDYyIDM3NSAtNTMxIDY3NAotMjggMT' +
        'E4IC0yNiAzMjkgNCA0NDkgODMgMzMyIDMzNCA2MDIgNjYxIDcxMSAxMzUgNDQgMz' +
        'M1IDU3IDQ3OCAzMHogbS0zMgotMjI4MCBjMzkgLTggMTEyIC0zNSAxNjMgLTYwID' +
        'I2NCAtMTMxIDQxNSAtNDM1IDM1OCAtNzI1IC00NyAtMjM5IC0yMTcgLTQzNgotND' +
        'Q4IC01MTcgLTEwNiAtMzggLTI3MyAtNDQgLTM4MSAtMTQgLTE5OSA1NCAtMzU1ID' +
        'E4MCAtNDQxIDM1NiAtNDcgOTQgLTY4CjE4OSAtNjcgMzA1IDAgMTE1IDE4IDE4OC' +
        'A3MyAzMDAgMzMgNjkgNTggMTAxIDEyNyAxNzAgNTMgNTMgMTA5IDk4IDE0NiAxMT' +
        'cKNTggMzAgMTY0IDY4IDIxNSA3NiA1OCAxMCAxOTAgNiAyNTUgLTh6IG0tMzYgLT' +
        'E2NTAgYzIyMSAtNTMgMzc5IC0yODUgMzQyCi01MDUgLTIyIC0xMzMgLTg4IC0yMz' +
        'kgLTE5MSAtMzA5IC0xNDMgLTk1IC0zMjEgLTEwNyAtNDcxIC0zMCAtNTIgMjYgLT' +
        'E0NQoxMTQgLTE3NiAxNjYgLTEzMiAyMjYgLTUwIDUyMiAxNzkgNjM5IDEwMyA1My' +
        'AyMDQgNjUgMzE3IDM5eiIvPgo8cGF0aCBkPSJNNTUxMiA2MjI4IGMtMjMgLTczIC' +
        '02NyAtMjM4IC05NyAtMzY3IC05MCAtMzgyIC0xNzkgLTYyNiAtMzg3Ci0xMDUzIC' +
        '01NiAtMTE1IC05OSAtMjEwIC05NyAtMjEyIDE1IC0xMyAyNTAgLTE2NiA0MzQgLT' +
        'I4MyA3ODYgLTQ5OSAxMjk0Ci03NTUgMTYwNCAtODA4IDIzNiAtNDEgMzI5IDU2ID' +
        'I3NSAyODUgLTY1IDI4MCAtMzM3IDc1NiAtNzk0IDEzOTUgLTIxNyAzMDIKLTgxNy' +
        'AxMDkyIC04ODQgMTE2MyAtMTAgMTAgLTIxIC0xNSAtNTQgLTEyMHoiLz4KPHBhdG' +
        'ggZD0iTTE1NzMgNjE3OCBjLTU3NCAtNzI2IC0xMDQ5IC0xMzkyIC0xMjk4IC0xOD' +
        'IzIC05MyAtMTYwIC0yMDAgLTM4NwotMjM2IC00OTggLTI3IC04MyAtMzMgLTExOC' +
        'AtMzQgLTE4OSAwIC05MyAxMSAtMTE5IDY3IC0xNjEgMzQgLTI2IDE1NSAtMzQKMj' +
        'QwIC0xNyAyNDMgNDcgNjYwIDI0NSAxMTk4IDU2OCAyOTQgMTc3IDgyMCA1MTUgOD' +
        'IwIDUyOCAwIDQgLTQxIDg5IC05MCAxOTAKLTE0MyAyOTEgLTI0MiA1MjYgLTMwNS' +
        'A3MjQgLTE0IDQ3IC01NiAyMDQgLTkxIDM1MCAtNTkgMjQzIC0xMjkgNDkwIC0xMz' +
        'kgNDkwCi0yIDAgLTYxIC03MyAtMTMyIC0xNjJ6Ii8+CjxwYXRoIGQ9Ik0yNjc5ID' +
        'QzODMgYy0zMDkgLTMyNCAtNTQwIC03NDEgLTY0OSAtMTE3MiAtNTkgLTIzNCAtOD' +
        'EgLTQxNCAtODEKLTY3MSAwIC0yMzkgMTYgLTM5MSA2NyAtNjIwIDI4IC0xMjQgMT' +
        'IxIC00MjAgMTMzIC00MjAgNCAwIDE3IDM5IDMwIDg4IDE0NQo1NjIgMzE2IDkzOS' +
        'A0NjUgMTAyNyA1OCAzNCAxMjQgMzQgMTgyIDAgMjQxIC0xNDEgNDkyIC05MTYgNz' +
        'M0IC0yMjY1IDI4IC0xNTcKNTMgLTI5NiA1NyAtMzEwIDYgLTI4IDMgLTQzIDczID' +
        'M0NSAyMTUgMTE5MiA0MzcgMTkyNSA2NTQgMjE2MiA2NiA3MiAxMDQgOTMKMTY2ID' +
        'kzIDE3NSAwIDM1MiAtMzE5IDUyNiAtOTQ4IDU5IC0yMTcgNTMgLTIwMSA2NiAtMT' +
        'c5IDE4IDMzIDc4IDIyMCAxMDggMzM3CjExOCA0NjIgMTE2IDk1MiAtNSAxMzk1IC' +
        '0xMTUgNDE4IC0zMzkgODIxIC02MjAgMTExNCBsLTk3IDEwMSAtODY4IDAgLTg2Ny' +
        'AwCi03NCAtNzd6Ii8+CjwvZz4KPC9zdmc+Cg==',
        originalWidth: 968,
        originalHeight: 1707,
        savedImageFilename: 'saved_file_name.png',
        savedImageUrl: 'assets/images'
      },
      crop: false
    };
  });

  it('should set component properties on initialization', () => {
    component.ngOnInit();

    expect(component.CROP_CURSORS[component.MOUSE_TOP_LEFT])
      .toBe('nwse-resize');
    expect(component.CROP_CURSORS[component.MOUSE_TOP])
      .toBe('ns-resize');
    expect(component.CROP_CURSORS[component.MOUSE_TOP_RIGHT])
      .toBe('nesw-resize');
    expect(component.CROP_CURSORS[component.MOUSE_RIGHT])
      .toBe('ew-resize');
    expect(component.CROP_CURSORS[component.MOUSE_BOTTOM_RIGHT])
      .toBe('nwse-resize');
    expect(component.CROP_CURSORS[component.MOUSE_BOTTOM])
      .toBe('ns-resize');
    expect(component.CROP_CURSORS[component.MOUSE_BOTTOM_LEFT])
      .toBe('nesw-resize');
    expect(component.CROP_CURSORS[component.MOUSE_LEFT])
      .toBe('ew-resize');
    expect(component.CROP_CURSORS[component.MOUSE_INSIDE])
      .toBe('move');
    expect(component.data).toEqual({
      mode: component.MODE_EMPTY, metadata: {}, crop: true });
    expect(component.imageResizeRatio).toBe(1);
    expect(component.cropArea).toEqual({ x1: 0, y1: 0, x2: 0, y2: 0 });
    expect(component.mousePositionWithinCropArea).toBe(null);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.lastMouseDownEventCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.userIsDraggingCropArea).toBe(false);
    expect(component.userIsResizingCropArea).toBe(false);
    expect(component.cropAreaResizeDirection).toBe(null);
    expect(component.invalidTagsAndAttributes).toEqual({tags: [], attrs: []});
    expect(component.processedImageIsTooLarge).toBe(false);
    expect(component.entityId).toBe('2');
    expect(component.entityType).toBe('question');
  });

  it('should stop resizing and dragging on when user releases ' +
  'the mouse button', () => {
    component.userIsDraggingCropArea = true;
    component.userIsResizingCropArea = true;

    window.dispatchEvent(new Event('mouseup'));

    expect(component.userIsDraggingCropArea).toBe(false);
    expect(component.userIsResizingCropArea).toBe(false);
  });

  it('should retrieve existing graph when user edits an old graph', () => {
    component.value = 'file_1';
    spyOn(imagePreloaderService, 'getDimensionsOfImage')
      .and.returnValue(dimensionsOfImage);
    spyOn(component, 'setSavedImageFilename');

    component.ngOnInit();

    expect(component.setSavedImageFilename)
      .toHaveBeenCalledWith('file_1', false);
    expect(imagePreloaderService.getDimensionsOfImage)
      .toHaveBeenCalledWith('file_1');
    expect(component.imageContainerStyle).toEqual({
      height: '350px',
      width: '450px'
    });
  });

  // This only returns if the image file has been saved or not.
  it('should validate that the Image file is saved', () => {
    component.data.mode = 3;

    expect(component.validate(component.data)).toBe(true);
  });

  it('should reset file path editor and delete file when user clicks' +
  '\'Delete this image\'', () => {
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
    spyOn(imageLocalStorageService, 'deleteImage');

    expect(component.data.mode).toBe(2);
    expect(component.data.metadata).not.toEqual({});
    expect(component.data.crop).toBe(false);

    component.resetFilePathEditor();

    expect(imageLocalStorageService.deleteImage).toHaveBeenCalledWith(
      'saved_file_name.png'
    );
    expect(component.data.mode).toBe(1);
    expect(component.data.metadata).toEqual({});
    expect(component.data.crop).toBe(true);
    expect(component.imageResizeRatio).toBe(1);
    expect(component.invalidTagsAndAttributes).toEqual({
      tags: [],
      attrs: []
    });
  });

  it('should reset file path editor', () => {
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);
    spyOn(imageLocalStorageService, 'deleteImage');

    expect(component.data.mode).toBe(2);
    expect(component.data.metadata).not.toEqual({});
    expect(component.data.crop).toBe(false);

    component.resetFilePathEditor();

    expect(imageLocalStorageService.deleteImage).not.toHaveBeenCalled();
    expect(component.data.mode).toBe(1);
    expect(component.data.metadata).toEqual({});
    expect(component.data.crop).toBe(true);
    expect(component.imageResizeRatio).toBe(1);
    expect(component.invalidTagsAndAttributes).toEqual({
      tags: [],
      attrs: []
    });
  });

  it('should return true if file is saved', () => {
    component.data.mode = component.MODE_SAVED;

    expect(component.validate(component.data)).toBe(true);
  });

  it('should return false if file is not saved', () => {
    expect(component.data.mode).toBe(component.MODE_UPLOADED);

    expect(component.validate(component.data)).toBe(false);
  });

  it('should return false if file is not uploaded', () => {
    component.data.metadata.savedImageFilename = null;

    expect(component.validate(component.data)).toBe(false);
  });

  it('should return true if the user is cropping', () => {
    spyOn(component, 'calculateTargetImageDimensions').and.callThrough();
    component.cropArea = {
      x1: 200,
      y1: 250,
      x2: 400,
      y2: 460
    };
    // Pre-check.
    expect(component.imageResizeRatio).toBe(1);

    expect(component.isUserCropping()).toBe(true);
    expect(component.calculateTargetImageDimensions).toHaveBeenCalled();
  });

  it('should return false if the user is cropping', () => {
    component.cropArea = {
      x1: 0,
      y1: 0,
      x2: 968,
      y2: 1707
    };
    // Pre-check.
    expect(component.imageResizeRatio).toBe(1);

    expect(component.isUserCropping()).toBe(false);
  });

  it('should update crop area while user is dragging the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = true;
    component.cropArea = {
      x1: 20,
      y1: 20,
      x2: 40,
      y2: 40
    };
    component.cropAreaXWhenLastDown = 0;
    component.cropAreaYWhenLastDown = 0;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    // Pre-check.
    expect(component.imageResizeRatio).toBe(1);
    expect(component.lastMouseDownEventCoordinates).toEqual({
      x: 0,
      y: 0
    });
    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 0,
      y: 0
    });

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 468,
      y1: 216,
      x2: 488,
      y2: 236
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the top left of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 468,
      y1: 216,
      x2: 660,
      y2: 440
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the top of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 360,
      y1: 216,
      x2: 660,
      y2: 440
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the top right of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_RIGHT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 360,
      y1: 216,
      x2: 468,
      y2: 440
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the right of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_RIGHT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 360,
      y1: 420,
      x2: 468,
      y2: 440
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the bottom right of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_BOTTOM_RIGHT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 360,
      y1: 420,
      x2: 468,
      y2: 460
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the bottom of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_BOTTOM;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 460
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the bottom left of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_BOTTOM_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 468,
      y1: 420,
      x2: 660,
      y2: 460
    });
  });

  it('should update crop area while user is resizing the crop area towards' +
  ' the left of the image', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = true;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.cropAreaResizeDirection = component.MOUSE_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropArea).toEqual({
      x1: 468,
      y1: 420,
      x2: 660,
      y2: 440
    });
  });

  it('should update mouse position to top right when user points' +
  ' mouse to the top right of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_RIGHT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 360,
      y: 420
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_TOP_LEFT);
  });

  it('should update mouse position to top left when user points' +
  ' mouse to the top left of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(660);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 660,
      y: 420
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_TOP_RIGHT);
  });

  it('should update mouse position to bottom left when user points' +
  ' mouse to the bottom left of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(560);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 360,
      y: 560
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_BOTTOM_LEFT);
  });

  it('should update mouse position to bottom right when user points' +
  ' mouse to the bottom right of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(660);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(560);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 660,
      y: 560
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_BOTTOM_RIGHT);
  });

  it('should update mouse position to top when user points' +
  ' mouse to the top of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(390);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 390,
      y: 420
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_TOP);
  });

  it('should update mouse position to left when user points' +
  ' mouse to the left of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(500);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 360,
      y: 500
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_LEFT);
  });

  it('should update mouse position to right when user points' +
  ' mouse to the right of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(660);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(500);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 660,
      y: 500
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_RIGHT);
  });

  it('should update mouse position to bottom when user points' +
  ' mouse to the bottom of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(400);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(560);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 400,
      y: 560
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_BOTTOM);
  });

  it('should update mouse position to inside when user points' +
  ' mouse to the inside of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(400);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(500);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 400,
      y: 500
    });
    expect(component.mousePositionWithinCropArea)
      .toBe(component.MOUSE_INSIDE);
  });

  it('should update mouse position to null when user points' +
  ' mouse to the outside of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(200);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(200);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.userIsDraggingCropArea = false;
    component.userIsResizingCropArea = false;
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.cropAreaResizeDirection = component.MOUSE_TOP_LEFT;
    let dummyMouseEvent = new MouseEvent('Mousemove');

    expect(component.imageResizeRatio).toEqual(1);
    expect(component.mouseLastKnownCoordinates).toEqual({ x: 0, y: 0 });
    expect(component.mousePositionWithinCropArea).toBeNull();

    component.onMouseMoveOnImageArea(dummyMouseEvent);

    expect(component.mouseLastKnownCoordinates).toEqual({
      x: 200,
      y: 200
    });
    expect(component.mousePositionWithinCropArea)
      .toBeNull();
  });

  it('should update values when user presses the mouse button down inside the' +
  ' crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(468);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(216);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.mousePositionWithinCropArea = component.MOUSE_INSIDE;
    let dummyMouseEvent = new MouseEvent('Mousedown');

    expect(component.lastMouseDownEventCoordinates).toEqual({
      x: 0,
      y: 0
    });
    expect(component.cropAreaXWhenLastDown).toBeUndefined();
    expect(component.cropAreaYWhenLastDown).toBeUndefined();
    expect(component.userIsDraggingCropArea).toBe(false);

    component.onMouseDownOnCropArea(dummyMouseEvent);

    expect(component.lastMouseDownEventCoordinates).toEqual({
      x: 468,
      y: 216
    });
    expect(component.cropAreaXWhenLastDown).toBe(360);
    expect(component.cropAreaYWhenLastDown).toBe(420);
    expect(component.userIsDraggingCropArea).toBe(true);
  });

  it('should update values when user presses the mouse button down on the' +
  ' bottom of the crop area', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(400);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(560);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 560
    };
    component.mousePositionWithinCropArea = component.MOUSE_BOTTOM;
    let dummyMouseEvent = new MouseEvent('Mousedown');

    expect(component.lastMouseDownEventCoordinates).toEqual({
      x: 0,
      y: 0
    });
    expect(component.cropAreaResizeDirection).toBeNull();
    expect(component.userIsResizingCropArea).toBe(false);

    component.onMouseDownOnCropArea(dummyMouseEvent);

    expect(component.lastMouseDownEventCoordinates).toEqual({
      x: 400,
      y: 560
    });
    expect(component.cropAreaResizeDirection).toBe(component.MOUSE_BOTTOM);
    expect(component.userIsResizingCropArea).toBe(true);
  });

  it('should set dragging and resizing to false when user\'s mouse is over' +
  ' the crop area', () =>{
    let dummyMouseEvent = new MouseEvent('Mouseover');
    spyOn(MouseEvent.prototype, 'preventDefault');

    component.userIsDraggingCropArea = true;
    component.userIsResizingCropArea = true;

    component.onMouseUpOnCropArea(dummyMouseEvent);

    expect(dummyMouseEvent.preventDefault).toHaveBeenCalled();
    expect(component.userIsDraggingCropArea).toBe(false);
    expect(component.userIsResizingCropArea).toBe(false);
  });

  it('should show border for the image container when user has not' +
  ' uploaded a file', () => {
    component.data.mode = component.MODE_EMPTY;

    expect(component.getImageContainerDynamicStyles())
      .toBe('border: 1px dotted #888; width: 100%');
  });

  it('should not show border for the image container when user has' +
  ' uploaded a file', () => {
    // Pre-check.
    expect(component.data.mode).toBe(component.MODE_UPLOADED);

    expect(component.getImageContainerDynamicStyles())
      .toBe('border: none; width: 490px');
  });

  it('should not show tool bar when the user is cropping', () => {
    component.cropArea = {
      x1: 200,
      y1: 250,
      x2: 400,
      y2: 460
    };

    expect(component.getToolbarDynamicStyles()).toBe('visibility: hidden');
  });

  it('should show toolbar when the user is not cropping', () => {
    component.cropArea = {
      x1: 0,
      y1: 0,
      x2: 968,
      y2: 1707
    };

    expect(component.getToolbarDynamicStyles()).toBe('visibility: visible');
  });

  it('should get dynamic styles for the crop button when user is' +
  ' cropping', () => {
    component.cropArea = {
      x1: 200,
      y1: 250,
      x2: 400,
      y2: 460
    };

    expect(component.getCropButtonBarDynamicStyles())
      .toBe('left: 400px;top: 250px;');
  });

  it('should get crop are dynamic style when user is cropping the image',
    () => {
      component.cropArea = {
        x1: 360,
        y1: 420,
        x2: 660,
        y2: 440
      };
      component.mousePositionWithinCropArea = component.MOUSE_TOP_LEFT;

      // Pre-check.
      expect(component.imageResizeRatio).toBe(1);

      var style = component.getCropAreaDynamicStyles();

      expect(style).toBe(
        'left: 360px; top: 420px; width: 300px; ' +
        'height: 20px; cursor: nwse-resize; background: url(' +
        component.data.metadata.uploadedImageData +
        ') no-repeat; background-position: -363px -423px;' +
        ' background-size: 490px 864px'
      );
    });

  it('should get default type cursor when user\'s mouse is outside the crop' +
  ' area', () => {
    component.cropArea = {
      x1: 360,
      y1: 420,
      x2: 660,
      y2: 440
    };
    component.mousePositionWithinCropArea = null;

    // Pre-check.
    expect(component.imageResizeRatio).toBe(1);

    var style = component.getCropAreaDynamicStyles();

    expect(style).toBe(
      'left: 360px; top: 420px; width: 300px; ' +
        'height: 20px; cursor: default; background: url(' +
        component.data.metadata.uploadedImageData +
        ') no-repeat; background-position: -363px -423px;' +
        ' background-size: 490px 864px'
    );
  });

  it('should return uploaded image dynamic style when called', () => {
    expect(component.getUploadedImageDynamicStyles())
      .toBe('width: 490px; height: 864px;');
  });

  it('should upload file when the user clicks \’Upload Image\’ image', () => {
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt) => {
            return {
              drawImage: (txt, x, y) => {
                return;
              },
              getImageData: (x, y, width, height) => {
                return 'data';
              },
              putImageData: (data, x, y) => {
                return;
              }
            };
          },
          toDataURL: (str, x) => {
            return component.data.metadata.uploadedImageData;
          }
        }
      )
    );
    let dataSvg = component.data.metadata;
    component.data = { mode: component.MODE_EMPTY, metadata: {}, crop: true };
    spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl').and.returnValue(
      dataSvg.uploadedImageData);
    spyOn(svgSanitizerService, 'getInvalidSvgTagsAndAttrsFromDataUri')
      .and.returnValue({ tags: [], attrs: [] });
    spyOn(svgSanitizerService, 'removeAllInvalidTagsAndAttributes')
      .and.returnValue(dataSvg.uploadedImageData.toString());

    component.onFileChanged(dataSvg.uploadedFile);

    expect(component.data).toEqual({
      mode: 2,
      metadata: {
        uploadedFile: dataSvg.uploadedFile,
        uploadedImageData: dataSvg.uploadedImageData,
        originalWidth: 300,
        originalHeight: 150
      },
      crop: false
    });
  });

  it('should crop svg when user clicks the \'crop\' button', () => {
    spyOn(gifshot, 'createGIF').and.callFake((obj, func) => {
      func({image: obj.images});
    });
    spyOn(component, 'updateDimensions').and.callThrough();
    component.cropArea = {
      x1: 0,
      y1: 0,
      x2: 140,
      y2: 120
    };

    expect(component.data.metadata.originalWidth).toBe(968);
    expect(component.data.metadata.originalHeight).toBe(1707);

    component.confirmCropImage();

    expect(component.updateDimensions).toHaveBeenCalledWith(
      jasmine.any(String),
      component.data.metadata.uploadedImageData as string,
      276.57142857142856, 237.0612244897959);
    expect(component.data.metadata.originalWidth).toBe(276.57142857142856);
    expect(component.data.metadata.originalHeight).toBe(237.0612244897959);
  });

  it('should crop png when user clicks the \'crop\' button', () => {
    spyOn(gifshot, 'createGIF').and.callFake((obj, func) => {
      func({image: obj.images});
    });
    spyOn(component, 'updateDimensions').and.callThrough();
    component.cropArea = {
      x1: 0,
      y1: 0,
      x2: 140,
      y2: 120
    };
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt) => {
            return {
              drawImage: (txt, x, y) => {
                return;
              },
              getImageData: (x, y, width, height) => {
                return 'data';
              },
              putImageData: (data, x, y) => {
                return;
              }
            };
          },
          toDataURL: (str, x) => {
            return component.data.metadata.uploadedImageData;
          }
        }
      )
    );
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataPng;

    expect(component.data.metadata.originalWidth).toBe(360);
    expect(component.data.metadata.originalHeight).toBe(360);

    component.confirmCropImage();

    expect(component.updateDimensions).toHaveBeenCalledWith(
      jasmine.any(String),
      component.data.metadata.uploadedImageData,
      140, 120);
    expect(component.data.metadata.originalWidth).toBe(140);
    expect(component.data.metadata.originalHeight).toBe(120);
  });

  it('should crop gif when user clicks the \'crop\' button', (done) => {
    spyOn(gifshot, 'createGIF').and.callFake((obj, func) => {
      func({image: dataGif.uploadedImageData});
    });
    component.cropArea = {
      x1: 0,
      y1: 0,
      x2: 140,
      y2: 120
    };
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt) => {
            return {
              drawImage: (txt, x, y) => {
                return;
              },
              getImageData: (x, y, width, height) => {
                return 'data';
              },
              putImageData: (data, x, y) => {
                return;
              }
            };
          },
          toDataURL: (str, x) => {
            return component.data.metadata.uploadedImageData;
          }
        }
      )
    );
    spyOn(window, 'GifFrames').and.resolveTo([{
      getImage: () => {
        return {
          toDataURL: () => {
            return {
              image: dataGif.uploadedImageData
            };
          }
        };
      },
      frameInfo: {
        disposal: 1
      },
    }] as unknown as never);
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataGif;

    expect(component.data.metadata.originalWidth).toBe(260);
    expect(component.data.metadata.originalHeight).toBe(200);

    component.confirmCropImage();

    setTimeout(() => {
      expect(component.data.metadata.originalWidth).toBe(140);
      expect(component.data.metadata.originalHeight).toBe(120);
      done();
    }, 150);
  });

  it('should cancel cropping image when user click the \'cancel\' button',
    () => {
      component.cropArea = {
        x1: 0,
        y1: 0,
        x2: 140,
        y2: 120
      };

      component.cancelCropImage();

      expect(component.cropArea).toEqual({
        x1: 0,
        y1: 0,
        x2: 490,
        y2: 864
      });
    });

  it('should show help text when image uploaded by user is too big for the' +
  ' card', () => {
    // The help text should only be displayed if the width of the image is
    // greater 490. Therefore the originalwidth is also tested below.
    expect(component.data.metadata.originalWidth).toBe(968);
    expect(component.getImageSizeHelp())
      .toBe(
        'This image has been automatically downsized to ensure ' +
        'that it will fit in the card.'
      );
  });

  it('should not show help text when image uploaded by user is not' +
  ' too big for the card', () => {
    // The help text should only be displayed if the width of the image is
    // greater 490. Therefore the originalwidth is also tested below.
    component.data.metadata.originalWidth = 400;
    expect(component.getImageSizeHelp()).toBeNull();
  });

  it('should return true if the user is allowed to crop the image', () => {
    component.data.crop = true;
    expect(component.isCropAllowed()).toBe(true);
  });

  it('should return false if the user is allowed to crop the image', () => {
    component.data.crop = false;
    expect(component.isCropAllowed()).toBe(false);
  });

  it('should return true if the user has not uploaded image', () => {
    component.data.mode = component.MODE_EMPTY;
    expect(component.isNoImageUploaded()).toBe(true);
  });

  it('should return false if the user has uploaded or saved the image', () => {
    component.data.mode = component.MODE_UPLOADED;
    expect(component.isNoImageUploaded()).toBe(false);
  });

  it('should return true if the user has uploaded image', () => {
    component.data.mode = component.MODE_UPLOADED;
    expect(component.isImageUploaded()).toBe(true);
  });

  it('should return false if the user has not uploaded or' +
  ' saved the image', () => {
    component.data.mode = component.MODE_EMPTY;
    expect(component.isImageUploaded()).toBe(false);
  });

  it('should return true if the user has saved image', () => {
    component.data.mode = component.MODE_SAVED;
    expect(component.isImageSaved()).toBe(true);
  });

  it('should return false if the user has not saved the image', () => {
    component.data.mode = component.MODE_EMPTY;
    expect(component.isImageSaved()).toBe(false);
  });

  it('should return resize percentage of the image when called', () => {
    expect(component.getCurrentResizePercent()).toBe(100);
  });

  it('should decrease iamge size when user decreases the image size' +
  ' percentage by clicking the \'-\' button', (done) => {
    spyOn(gifshot, 'createGIF').and.callFake((obj, func) => {
      func(obj);
    });
    spyOn(component, 'validateProcessedFilesize').and.stub();
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataGif;

    component.decreaseResizePercent(20);

    setTimeout(() => {
      expect(component.imageResizeRatio).toBe(0.8);
      expect(component.validateProcessedFilesize).toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should increase image size when user increases the image size' +
  ' percentage by clicking the \'+\' button', (done) => {
    spyOn(component, 'validateProcessedFilesize').and.stub();
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt) => {
            return {
              drawImage: (txt, x, y) => {
                return;
              }
            };
          },
          toDataURL: (str, x) => {
            return component.data.metadata.uploadedImageData;
          }
        }
      )
    );
    component.imageResizeRatio = 0.2;

    component.increaseResizePercent(10);

    setTimeout(() => {
      expect(component.imageResizeRatio).toBeCloseTo(0.3);
      expect(component.validateProcessedFilesize).toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should calculate the Image dimensions when called', () => {
    expect(component.calculateTargetImageDimensions()).toEqual({
      width: 490,
      height: 864,
    });
  });

  it('should discard uploaded file when user clicks discard button', () => {
    component.processedImageIsTooLarge = true;

    expect(component.data).toEqual({
      mode: 2,
      metadata: {
        uploadedFile: {
          lastModified: 1622307491398,
          name: '2442125.svg',
          size: 2599,
          type: 'image/svg+xml'
        },
        uploadedImageData:
        'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb2' +
        '5lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHID' +
        'IwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVk' +
        'ctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bW' +
        'xucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iNzI2LjAwMD' +
        'AwMHB0IiBoZWlnaHQ9IjEyODAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCA3MjYuMD' +
        'AwMDAwIDEyODAuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaW' +
        'QgbWVldCI+CjxtZXRhZGF0YT4KQ3JlYXRlZCBieSBwb3RyYWNlIDEuMTUsIHdyaX' +
        'R0ZW4gYnkgUGV0ZXIgU2VsaW5nZXIgMjAwMS0yMDE3CjwvbWV0YWRhdGE+CjxnIH' +
        'RyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLDEyODAuMDAwMDAwKSBzY2FsZS' +
        'gwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbm' +
        'UiPgo8cGF0aCBkPSJNMzU3NSAxMjc2MyBjLTQ5OSAtNDUyIC03NzIgLTc2MSAtMT' +
        'A2OCAtMTIwOSAtODUyIC0xMjg5IC0xMTIyCi0yODY4IC03OTEgLTQ2MjQgMTM3IC' +
        '03MjcgMzk2IC0xNTIxIDcwOSAtMjE3NiBsNjQgLTEzNCAxMTMxIDAgMTEzMSAwID' +
        'Y5IDE0NApjMzgwIDc5NiA2NzEgMTc4MCA3NzkgMjYzNiA3MSA1NjMgODAgMTE2MC' +
        'AyNSAxNjUwIC0xMTYgMTAzOSAtNDczIDE5NTkgLTEwNzMKMjc2NSAtMjQyIDMyNC' +
        'AtNDk5IDYwMSAtODQ3IDkxMyAtNDQgMzkgLTgzIDcyIC04NSA3MiAtMiAwIC0yMi' +
        'AtMTcgLTQ0IC0zN3oKbTIyMiAtMzA3OCBjMzg2IC03MyA2ODIgLTM0NyA3ODUgLT' +
        'cyNSAyMCAtNzQgMjMgLTEwNyAyMiAtMjU1IDAgLTE5NCAtMTUKLTI2NCAtODIgLT' +
        'QwOSAtNTQgLTExNSAtMTEyIC0xOTggLTIwMSAtMjg3IC0xMjYgLTEyNiAtMjgyIC' +
        '0yMTYgLTQ1MyAtMjYyCi03MCAtMTggLTEwOSAtMjIgLTI0OCAtMjIgLTE5NiAxIC' +
        '0yNzYgMTggLTQzNSA5NiAtMjY5IDEzMSAtNDYyIDM3NSAtNTMxIDY3NAotMjggMT' +
        'E4IC0yNiAzMjkgNCA0NDkgODMgMzMyIDMzNCA2MDIgNjYxIDcxMSAxMzUgNDQgMz' +
        'M1IDU3IDQ3OCAzMHogbS0zMgotMjI4MCBjMzkgLTggMTEyIC0zNSAxNjMgLTYwID' +
        'I2NCAtMTMxIDQxNSAtNDM1IDM1OCAtNzI1IC00NyAtMjM5IC0yMTcgLTQzNgotND' +
        'Q4IC01MTcgLTEwNiAtMzggLTI3MyAtNDQgLTM4MSAtMTQgLTE5OSA1NCAtMzU1ID' +
        'E4MCAtNDQxIDM1NiAtNDcgOTQgLTY4CjE4OSAtNjcgMzA1IDAgMTE1IDE4IDE4OC' +
        'A3MyAzMDAgMzMgNjkgNTggMTAxIDEyNyAxNzAgNTMgNTMgMTA5IDk4IDE0NiAxMT' +
        'cKNTggMzAgMTY0IDY4IDIxNSA3NiA1OCAxMCAxOTAgNiAyNTUgLTh6IG0tMzYgLT' +
        'E2NTAgYzIyMSAtNTMgMzc5IC0yODUgMzQyCi01MDUgLTIyIC0xMzMgLTg4IC0yMz' +
        'kgLTE5MSAtMzA5IC0xNDMgLTk1IC0zMjEgLTEwNyAtNDcxIC0zMCAtNTIgMjYgLT' +
        'E0NQoxMTQgLTE3NiAxNjYgLTEzMiAyMjYgLTUwIDUyMiAxNzkgNjM5IDEwMyA1My' +
        'AyMDQgNjUgMzE3IDM5eiIvPgo8cGF0aCBkPSJNNTUxMiA2MjI4IGMtMjMgLTczIC' +
        '02NyAtMjM4IC05NyAtMzY3IC05MCAtMzgyIC0xNzkgLTYyNiAtMzg3Ci0xMDUzIC' +
        '01NiAtMTE1IC05OSAtMjEwIC05NyAtMjEyIDE1IC0xMyAyNTAgLTE2NiA0MzQgLT' +
        'I4MyA3ODYgLTQ5OSAxMjk0Ci03NTUgMTYwNCAtODA4IDIzNiAtNDEgMzI5IDU2ID' +
        'I3NSAyODUgLTY1IDI4MCAtMzM3IDc1NiAtNzk0IDEzOTUgLTIxNyAzMDIKLTgxNy' +
        'AxMDkyIC04ODQgMTE2MyAtMTAgMTAgLTIxIC0xNSAtNTQgLTEyMHoiLz4KPHBhdG' +
        'ggZD0iTTE1NzMgNjE3OCBjLTU3NCAtNzI2IC0xMDQ5IC0xMzkyIC0xMjk4IC0xOD' +
        'IzIC05MyAtMTYwIC0yMDAgLTM4NwotMjM2IC00OTggLTI3IC04MyAtMzMgLTExOC' +
        'AtMzQgLTE4OSAwIC05MyAxMSAtMTE5IDY3IC0xNjEgMzQgLTI2IDE1NSAtMzQKMj' +
        'QwIC0xNyAyNDMgNDcgNjYwIDI0NSAxMTk4IDU2OCAyOTQgMTc3IDgyMCA1MTUgOD' +
        'IwIDUyOCAwIDQgLTQxIDg5IC05MCAxOTAKLTE0MyAyOTEgLTI0MiA1MjYgLTMwNS' +
        'A3MjQgLTE0IDQ3IC01NiAyMDQgLTkxIDM1MCAtNTkgMjQzIC0xMjkgNDkwIC0xMz' +
        'kgNDkwCi0yIDAgLTYxIC03MyAtMTMyIC0xNjJ6Ii8+CjxwYXRoIGQ9Ik0yNjc5ID' +
        'QzODMgYy0zMDkgLTMyNCAtNTQwIC03NDEgLTY0OSAtMTE3MiAtNTkgLTIzNCAtOD' +
        'EgLTQxNCAtODEKLTY3MSAwIC0yMzkgMTYgLTM5MSA2NyAtNjIwIDI4IC0xMjQgMT' +
        'IxIC00MjAgMTMzIC00MjAgNCAwIDE3IDM5IDMwIDg4IDE0NQo1NjIgMzE2IDkzOS' +
        'A0NjUgMTAyNyA1OCAzNCAxMjQgMzQgMTgyIDAgMjQxIC0xNDEgNDkyIC05MTYgNz' +
        'M0IC0yMjY1IDI4IC0xNTcKNTMgLTI5NiA1NyAtMzEwIDYgLTI4IDMgLTQzIDczID' +
        'M0NSAyMTUgMTE5MiA0MzcgMTkyNSA2NTQgMjE2MiA2NiA3MiAxMDQgOTMKMTY2ID' +
        'kzIDE3NSAwIDM1MiAtMzE5IDUyNiAtOTQ4IDU5IC0yMTcgNTMgLTIwMSA2NiAtMT' +
        'c5IDE4IDMzIDc4IDIyMCAxMDggMzM3CjExOCA0NjIgMTE2IDk1MiAtNSAxMzk1IC' +
        '0xMTUgNDE4IC0zMzkgODIxIC02MjAgMTExNCBsLTk3IDEwMSAtODY4IDAgLTg2Ny' +
        'AwCi03NCAtNzd6Ii8+CjwvZz4KPC9zdmc+Cg==',
        originalWidth: 968,
        originalHeight: 1707,
        savedImageFilename: 'saved_file_name.png',
        savedImageUrl: 'assets/images'
      },
      crop: false
    });

    component.discardUploadedFile();

    expect(component.processedImageIsTooLarge).toBe(false);
    expect(component.data).toEqual({
      mode: component.MODE_EMPTY,
      metadata: {},
      crop: true
    });
  });

  it('should alert user with parsed error if it fails to post' +
  ' image to server when user savesimage', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(imagePreloaderService, 'getDimensionsOfImage')
      .and.returnValue({width: 490, height: 327});

    let dimensions = {width: 490, height: 327};

    let resampledFile = localConvertImageDataToImageFile(
      component.data.metadata.uploadedImageData);

    component.postImageToServer(dimensions, resampledFile, 'gif');
    tick(200);

    let req = httpTestingController.expectOne(
      '/createhandler/imageupload/question/2'
    );
    expect(req.request.method).toEqual('POST');
    req.flush('Failed to upload image', {
      status: 500,
      statusText: 'Failed to upload image'
    });

    tick(100);

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('Failed to upload image');

    httpTestingController.verify();
  }));

  it('should alert user with default error if it fails to post' +
  ' image to server when user savesimage', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(imagePreloaderService, 'getDimensionsOfImage')
      .and.returnValue({width: 490, height: 327});

    let dimensions = {width: 490, height: 327};
    let resampledFile = localConvertImageDataToImageFile(
      component.data.metadata.uploadedImageData);

    component.postImageToServer(dimensions, resampledFile, 'gif');
    tick(200);

    let req = httpTestingController.expectOne(
      '/createhandler/imageupload/question/2'
    );
    expect(req.request.method).toEqual('POST');
    req.flush(null, {
      status: 500,
      statusText: null
    });

    flushMicrotasks();
    tick(100);

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('Error communicating with server.');
    httpTestingController.verify();
  }));

  it('should save uploaded gif when user clicks \`Use Image\`' +
  ' button', fakeAsync(() => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    spyOn(gifshot, 'createGIF').and.callFake((obj, func) => {
      func(obj);
    });
    spyOn(window, 'GifFrames').and.resolveTo([{
      getImage: () => {
        return {
          toDataURL: () => {
            return {
              image: dataGif.uploadedImageData
            };
          }
        };
      },
      frameInfo: {
        disposal: 1
      },
    }] as never);

    spyOn(component, 'saveImage').and.callThrough();
    spyOn(component, 'validateProcessedFilesize').and.stub();
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataGif;

    component.saveUploadedFile();
    tick(200);

    let req = httpTestingController.expectOne(
      '/createhandler/imageupload/question/2'
    );
    expect(req.request.method).toEqual('POST');
    req.flush({
      filename: 'img_20210701_185457_qgrrul296o_height_200_width_260.gif'
    });
    httpTestingController.verify();

    tick(100);

    expect(component.validateProcessedFilesize).toHaveBeenCalled();
    expect(component.saveImage).toHaveBeenCalled();
    expect(component.data.mode).toBe(component.MODE_SAVED);
  }));

  it('should not save uploaded gif when file size over 100 KB', (done) => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    spyOn(gifshot, 'createGIF').and.callFake((obj, func) => {
      func({
        image: btoa('data:image/gif;base64,' + Array(102410).join('a')),
        error: false
      });
    });
    spyOn(component, 'saveImage');
    spyOn(component, 'validateProcessedFilesize').and.callThrough();
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataGif;

    component.saveUploadedFile();

    setTimeout(() => {
      expect(component.validateProcessedFilesize).toHaveBeenCalled();
      expect(document.body.style.cursor).toBe('default');
      expect(component.saveImage).not.toHaveBeenCalled();
      expect(component.data.mode).toBe(component.MODE_UPLOADED);
      done();
    }, 150);
  });

  it('should alert user if resampled gif file is not obtained when the user' +
  ' saves image', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    spyOn(gifshot, 'createGIF').and.callFake((obj, func) => {
      func(obj);
    });
    spyOn(window, 'GifFrames').and.resolveTo([{
      getImage: () => {
        return {
          toDataURL: () => {
            return {
              image: dataGif.uploadedImageData
            };
          }
        };
      },
      frameInfo: {
        disposal: 1
      },
    }] as never);
    spyOn(component, 'saveImage').and.callThrough();
    spyOn(component, 'validateProcessedFilesize').and.stub();
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataGif;

    spyOn(imageUploadHelperService, 'convertImageDataToImageFile')
      .and.returnValue(null);

    component.saveUploadedFile();
    tick();

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('Could not get resampled file.');
    expect(component.data.mode).toBe(component.MODE_UPLOADED);
  }));

  it('should save uploaded svg when user clicks \`Use Image\`' +
  ' button', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    spyOn(component, 'setSavedImageFilename').and.callThrough();
    spyOn(component, 'saveImage').and.callThrough();

    component.saveUploadedFile();

    expect(component.saveImage).toHaveBeenCalled();
    expect(component.setSavedImageFilename).toHaveBeenCalled();
    expect(component.data.mode).toBe(component.MODE_SAVED);
  });

  it('should save uploaded png when user clicks \`Use Image\`' +
  ' button', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt) => {
            return {
              drawImage: (txt, x, y) => {
                return;
              }
            };
          },
          toDataURL: (str, x) => {
            return component.data.metadata.uploadedImageData;
          }
        }
      )
    );
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    spyOn(component, 'saveImage').and.callThrough();
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataPng;

    component.saveUploadedFile();

    expect(component.saveImage).toHaveBeenCalled();
    expect(component.data.mode).toBe(component.MODE_SAVED);
  });

  it('should not save uploaded png when file size over 100 KB', () => {
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt) => {
            return {
              drawImage: (txt, x, y) => {
                return;
              }
            };
          },
          toDataURL: (str, x) => {
            return component.data.metadata.uploadedImageData;
          }
        }
      )
    );
    spyOn(component, 'saveImage');
    component.data.metadata = {
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
      uploadedFile: {
        lastModified: 1622307491398,
        name: '2442125.png',
        size: 102410,
        type: 'image/png'
      },
      uploadedImageData:
        btoa('data:image/png;base64,' + Array(102410).join('a')),
      originalWidth: 360,
      originalHeight: 360,
      savedImageFilename: 'saved_file_name.gif',
      savedImageUrl: 'assets/images'
    };

    component.saveUploadedFile();

    expect(component.saveImage).not.toHaveBeenCalled();
    expect(component.data.mode).toBe(component.MODE_UPLOADED);
  });

  it('should alert user if resampled png file is not obtained when the user' +
  ' saves image', () => {
    spyOn(alertsService, 'addWarning');
    spyOnProperty(MouseEvent.prototype, 'offsetX').and.returnValue(360);
    spyOnProperty(MouseEvent.prototype, 'offsetY').and.returnValue(420);
    spyOnProperty(MouseEvent.prototype, 'target').and.returnValue({
      offsetLeft: 0,
      offsetTop: 0,
      offsetParent: null,
      classList: {
        contains: (text) => {
          return false;
        }
      }
    });
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt) => {
            return {
              drawImage: (txt, x, y) => {
                return;
              }
            };
          },
          toDataURL: (str, x) => {
            return component.data.metadata.uploadedImageData;
          }
        }
      )
    );
    // This throws an error "Type '{ lastModified: number; name:
    // string; size: number; type: string; }' is missing the following
    // properties from type 'File': arrayBuffer, slice, stream, text"
    // We need to suppress this error because we only need the values given
    // below.
    // @ts-expect-error
    component.data.metadata = dataPng;
    spyOn(component, 'saveImage');
    spyOn(imageUploadHelperService, 'convertImageDataToImageFile')
      .and.returnValue(null);

    expect(component.data.mode).toBe(component.MODE_UPLOADED);

    component.saveUploadedFile();

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('Could not get resampled file.');
  });

  it('should warn user if no image file is detected when the user' +
  ' is save image', () => {
    spyOn(alertsService, 'addWarning');
    component.data.metadata.uploadedFile = null;

    component.saveUploadedFile();

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('No image file detected.');
  });

  it('should warn user if no image file is detected when the user' +
  ' is save image', () => {
    spyOn(alertsService, 'addWarning');
    component.data.metadata.uploadedFile = null;

    component.saveUploadedFile();

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('No image file detected.');
  });

  it('should set file name when user saves image', () => {
    spyOn(alertsService, 'clearWarnings');
    spyOn(component.valueChanged, 'emit');
    spyOn(component.validityChange, 'emit');

    expect(component.value).toBeUndefined();
    expect(component.data.metadata.savedImageFilename)
      .toBe('saved_file_name.png');

    component.setSavedImageFilename('img_12345_height_250_width_250.png', true);

    expect(component.data.metadata.savedImageFilename)
      .toBe('img_12345_height_250_width_250.png');
    expect(component.value).toBe('img_12345_height_250_width_250.png');
    expect(component.data.metadata.savedImageUrl)
      .toBe(
        '/assetsdevhandler/question/2/assets/image/' +
        'img_12345_height_250_width_250.png');
    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(component.valueChanged.emit).toHaveBeenCalled();
    expect(component.validityChange.emit).toHaveBeenCalled();
  });

  it('should not update parent when the component is reset', () => {
    spyOn(alertsService, 'clearWarnings');
    spyOn(component.valueChanged, 'emit');
    spyOn(component.validityChange, 'emit');

    expect(component.value).toBeUndefined();
    expect(component.data.metadata.savedImageFilename)
      .toBe('saved_file_name.png');

    component.setSavedImageFilename(
      'img_12345_height_250_width_250.png', false);

    expect(component.data.metadata.savedImageFilename)
      .toBe('img_12345_height_250_width_250.png');
    expect(component.data.metadata.savedImageUrl)
      .toBe(
        '/assetsdevhandler/question/2/assets/image/' +
      'img_12345_height_250_width_250.png');
    // The following values should not get updated when resetting the
    // component.
    expect(component.value).toBeUndefined();
    expect(alertsService.clearWarnings).not.toHaveBeenCalled();
    expect(component.valueChanged.emit).not.toHaveBeenCalled();
    expect(component.validityChange.emit).not.toHaveBeenCalled();
  });

  it('should update component when the user makes changes to the image', () => {
    let changes: SimpleChanges = {
      value: {
        currentValue: 'img_12345_height_250_width_250.png',
        previousValue: 'saved_file_name.png',
        firstChange: true,
        isFirstChange: () => true
      }
    };
    expect(component.data.metadata.savedImageFilename)
      .toBe('saved_file_name.png');

    component.ngOnChanges(changes);

    expect(component.data.metadata.savedImageFilename)
      .toBe('img_12345_height_250_width_250.png');
  });
});
