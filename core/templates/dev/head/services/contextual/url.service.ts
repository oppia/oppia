// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for manipulating the page URL. Also allows
 * functions on $window to be mocked in unit tests.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  constructor(private windowRef: WindowRef) {}

  getCurrentLocation(): Location {
    return this.windowRef.nativeWindow.location;
  }

  getCurrentQueryString(): string {
    return this.getCurrentLocation().search;
  }
  /* As params[key] is overwritten, if query string has multiple fieldValues
     for same fieldName, use getQueryFieldValuesAsList(fieldName) to get it
     in array form. */

  /* This function returns an object which has dynamic keys
   since the keys generated depend on the URL being provided.
  So exact type of this function can not be determined
  https://github.com/oppia/oppia/pull/7834#issuecomment-547896982 */
  getUrlParams(): Object {
    let params = {};
    let parts = this.getCurrentQueryString().replace(
      /[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        return params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    );
    return params;
  }

  isIframed(): boolean {
    let pathname = this.getPathname();
    let urlParts = pathname.split('/');
    return urlParts[1] === 'embed';
  }

  getPathname(): string {
    return this.getCurrentLocation().pathname;
  }

  getTopicIdFromUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/topic_editor\/(\w|-){12}/g)) {
      return pathname.split('/')[2];
    }
    throw Error('Invalid topic id url');
  }

  getTopicNameFromLearnerUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(story|topic|subtopic|practice_session)/g)) {
      return decodeURIComponent(pathname.split('/')[2]);
    }
    throw Error('Invalid URL for topic');
  }

  getClassroomNameFromUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/classroom/g)) {
      return decodeURIComponent(pathname.split('/')[2]);
    }
    throw Error('Invalid URL for classroom');
  }

  getSubtopicIdFromUrl(): string {
    let pathname = this.getPathname();
    let argumentsArray = pathname.split('/');
    if (pathname.match(/\/subtopic/g) && argumentsArray.length === 4) {
      return decodeURIComponent(argumentsArray[3]);
    }
    throw Error('Invalid URL for subtopic');
  }

  getStoryIdFromUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(story_editor|review_test)\/(\w|-){12}/g)) {
      return pathname.split('/')[2];
    }
    throw Error('Invalid story id url');
  }

  getStoryIdFromViewerUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/story\/(\w|-){12}/g)) {
      return pathname.split('/')[2];
    }
    throw Error('Invalid story id url');
  }

  getStoryIdInPlayer(): string | null {
    let query = this.getCurrentQueryString();
    let queryItems = query.split('&');
    for (let i = 0; i < queryItems.length; i++) {
      let part = queryItems[i];
      if (part.match(/\?story_id=((\w|-){12})/g)) {
        return part.split('=')[1];
      }
    }
    return null;
  }

  getSkillIdFromUrl(): string {
    let pathname = this.getPathname();
    let skillId = pathname.split('/')[2];
    if (skillId.length !== 12) {
      throw Error('Invalid Skill Id');
    }
    return skillId;
  }

  getQueryFieldValuesAsList(fieldName: string): Array<string> {
    let fieldValues = [];
    if (this.getCurrentQueryString().indexOf('?') > -1) {
      // Each queryItem return one field-value pair in the url.
      let queryItems = this.getCurrentQueryString().slice(
        this.getCurrentQueryString().indexOf('?') + 1).split('&');
      for (let i = 0; i < queryItems.length; i++) {
        let currentFieldName = decodeURIComponent(
          queryItems[i].split('=')[0]);
        let currentFieldValue = decodeURIComponent(
          queryItems[i].split('=')[1]);
        if (currentFieldName === fieldName) {
          fieldValues.push(currentFieldValue);
        }
      }
    }
    return fieldValues;
  }

  addField(url: string, fieldName: string, fieldValue: string): string {
    let encodedFieldValue = encodeURIComponent(fieldValue);
    let encodedFieldName = encodeURIComponent(fieldName);
    return url + (url.indexOf('?') !== -1 ? '&' : '?') + encodedFieldName +
        '=' + encodedFieldValue;
  }

  getHash(): string {
    return this.getCurrentLocation().hash;
  }

  getOrigin(): string {
    return this.getCurrentLocation().origin;
  }

  getCollectionIdFromExplorationUrl(): string | null {
    let urlParams: any = this.getUrlParams();
    if (urlParams.hasOwnProperty('parent')) {
      return null;
    }
    if (urlParams.hasOwnProperty('collection_id')) {
      return urlParams.collection_id;
    }
    return null;
  }

  getUsernameFromProfileUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(profile)/g)) {
      return decodeURIComponent(pathname.split('/')[2]);
    }
    throw Error('Invalid profile URL');
  }

  getCollectionIdFromUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(collection)/g)) {
      return decodeURIComponent(pathname.split('/')[2]);
    }
    throw Error('Invalid collection URL');
  }

  getCollectionIdFromEditorUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(collection_editor\/create)/g)) {
      return decodeURIComponent(pathname.split('/')[3]);
    }
    throw Error('Invalid collection editor URL');
  }

  getExplorationVersionFromUrl(): number | null {
    let urlParams: any = this.getUrlParams();
    if (urlParams.hasOwnProperty('v')) {
      let version = urlParams.v;
      if (version.includes('#')) {
        // For explorations played in an iframe.
        version = version.substring(0, version.indexOf('#'));
      }
      return Number(version);
    }
    return null;
  }
}

angular.module('oppia').factory(
  'UrlService', downgradeInjectable(UrlService));
