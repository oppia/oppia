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

import { AppConstants } from 'app.constants';

import { WindowRef } from 'services/contextual/window-ref.service';

// This makes the UrlParamsType like a dict whose keys and values both are
// string.
export interface UrlParamsType {
  [param: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  constructor(private windowRef: WindowRef) {}

  /**
   * This function is used to find the current location
   * of the window.
   * @return {boolean} the current location.
   */
  getCurrentLocation(): Location {
    return this.windowRef.nativeWindow.location;
  }

  /**
   * This function is used to find the current query string.
   * @return {boolean} the current query string.
   */
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
  getUrlParams(): UrlParamsType {
    let params: UrlParamsType = {};
    this.getCurrentQueryString().replace(
      /[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        return params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    );
    return params;
  }

  /**
   * This function is used to check whether the url is framed.
   * @return {boolean} whether the url is framed.
   */
  isIframed(): boolean {
    let pathname = this.getPathname();
    let urlParts = pathname.split('/');
    return urlParts[1] === 'embed';
  }

  /**
   * This function is used to find the current path name.
   * @return {string} the current path name.
   */
  getPathname(): string {
    return this.getCurrentLocation().pathname;
  }

  /**
   * This function is used to find the topic id from url.
   * @return {string} the topic id.
   * @throws Will throw an error if the url is invalid.
   */
  getTopicIdFromUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/topic_editor\/(\w|-){12}/g)) {
      return pathname.split('/')[2];
    }
    throw new Error('Invalid topic id url');
  }

  /**
   * This function is used to find the topic URL fragment
   * from the learner's url.
   * @return {string} the topic URL fragment.
   * @throws Will throw an error if the url is invalid.
   */
  getTopicUrlFragmentFromLearnerUrl(): string {
    let pathname = this.getPathname();
    if (pathname.startsWith('/learn')) {
      return decodeURIComponent(pathname.split('/')[3]);
    } else if (pathname.startsWith('/explore')) {
      // The following section is for getting the URL fragment from the
      // exploration player.
      if (
        this.getUrlParams().hasOwnProperty('topic_url_fragment') &&
        this.getUrlParams().topic_url_fragment.match(
          AppConstants.VALID_URL_FRAGMENT_REGEX)) {
        return this.getUrlParams().topic_url_fragment;
      }
    }
    throw new Error('Invalid URL for topic');
  }

  getStoryUrlFragmentFromLearnerUrl(): string | null {
    let pathname = this.getPathname();
    // The following segment is for getting the fragment from the new learner
    // pages.
    if (
      pathname.startsWith('/learn') &&
      pathname.match(/\/story\/|\/review-test\//g)) {
      return decodeURIComponent(pathname.split('/')[5]);
    }
    // The following section is for getting the URL fragment from the
    // exploration player.
    if (pathname.startsWith('/explore')) {
      if (
        this.getUrlParams().hasOwnProperty('story_url_fragment') &&
        this.getUrlParams().story_url_fragment.match(
          AppConstants.VALID_URL_FRAGMENT_REGEX)) {
        return this.getUrlParams().story_url_fragment;
      }
    }
    // Shouldn't throw an error, since this is called whenever an exploration
    // starts, to check if it is linked to a story.
    return null;
  }

  getSubtopicUrlFragmentFromLearnerUrl(): string {
    let pathname = this.getPathname();
    if (pathname.startsWith('/learn') && pathname.includes('/revision')) {
      return decodeURIComponent(pathname.split('/')[5]);
    }
    throw new Error('Invalid URL for subtopic');
  }

  getClassroomUrlFragmentFromLearnerUrl(): string {
    let pathname = this.getPathname();
    if (pathname.startsWith('/learn')) {
      return decodeURIComponent(pathname.split('/')[2]);
    } else if (pathname.startsWith('/explore')) {
      // The following section is for getting the URL fragment from the
      // exploration player.
      if (
        this.getUrlParams().hasOwnProperty('classroom_url_fragment') &&
        this.getUrlParams().classroom_url_fragment.match(
          AppConstants.VALID_URL_FRAGMENT_REGEX)) {
        return this.getUrlParams().classroom_url_fragment;
      }
    }
    throw new Error('Invalid URL for classroom');
  }

  /**
   * This function is used to find the subtopic name from the learner's URL.
   * @return {string} the subtopic name.
   * @throws Will throw an error if the url for practice session is invalid.
   */
  getSelectedSubtopicsFromUrl(): string {
    let pathname = this.getPathname();
    let queryStrings = this.getCurrentQueryString().split('=');
    if (pathname.match(/\/practice/g) && queryStrings.length === 2) {
      return decodeURIComponent(queryStrings[1]);
    }
    throw new Error('Invalid URL for practice session');
  }


  /**
   * This function is used to find the classroom URL fragment from the learner's
   * URL.
   * @return {string} the classroom URL fragment.
   * @throws Will throw an error if the URL is invalid.
   */
  getClassroomUrlFragmentFromUrl(): string {
    let pathname = this.getPathname();
    let argumentsArray = pathname.split('/');
    if (pathname.startsWith('/learn') && argumentsArray.length === 3) {
      return decodeURIComponent(pathname.split('/')[2]);
    }
    throw new Error('Invalid URL for classroom');
  }

  /**
   * This function is used to find the subtopic id from the learner's url.
   * @return {string} the subtopic id.
   * @throws Will throw an error if the url is invalid.
   */
  getSubtopicIdFromUrl(): string {
    let pathname = this.getPathname();
    let argumentsArray = pathname.split('/');
    if (pathname.match(/\/revision/g) && argumentsArray.length === 6) {
      return decodeURIComponent(argumentsArray[5]);
    }
    throw new Error('Invalid URL for subtopic');
  }

  /**
   * This function is used to find the story id from the learner's url.
   * @return {string} the story id.
   * @throws Will Throw an error if the url is invalid.
   */
  getStoryIdFromUrl(): string {
    let pathname = this.getPathname();
    var matchedPath = pathname.match(
      /\/(story_editor|review-test)\/(\w|-){12}/g);
    if (matchedPath) {
      return matchedPath[0].split('/')[2];
    }
    throw new Error('Invalid story id url');
  }

  /**
   * This function is used to find the story id from the viewer's url.
   * @return {string} the story id.
   * @throws Will throw an error if the url is invalid.
   */
  getStoryIdFromViewerUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/story\/(\w|-){12}/g)) {
      return pathname.split('/')[5];
    }
    throw new Error('Invalid story id url');
  }

  /**
   * This function is used to find the skill id from the url.
   * @return {string} the skill id.
   * @throws Will throw an error if the skill Id is invalid.
   */
  getSkillIdFromUrl(): string {
    let pathname = this.getPathname();
    let skillId = pathname.split('/')[2];
    if (skillId.length !== 12) {
      throw new Error('Invalid Skill Id');
    }
    return skillId;
  }

  /**
   * This function is used to find the blog id from the url.
   * @return {string} the blog post id.
   * @throws Will throw an error if the blog post Id is invalid.
   */
  getBlogPostIdFromUrl(): string {
    let pathname = this.getHash();
    let blogPostId = pathname.split('/')[2];
    if (blogPostId.length !== 12) {
      throw new Error('Invalid Blog Post Id.');
    }
    return blogPostId;
  }

  /**
 * This function is used to find the blog post url fragment from the url.
 * @return {string} the blog post url fragment.
 * @throws Will throw an error if the blog post url is invalid.
 */
  getBlogPostUrlFromUrl(): string {
    let pathname = this.getPathname();
    let argumentsArray = pathname.split('/');
    if (pathname.startsWith('/blog') && argumentsArray.length === 3) {
      return decodeURIComponent(pathname.split('/')[2]);
    } else {
      throw new Error('Invalid Blog Post Url.');
    }
  }

  /**
 * This function is used to find the blog author username from the url.
 * @return {string} the blog author username fragment.
 * @throws Will throw an error if the url is invalid.
 */
  getBlogAuthorUsernameFromUrl(): string {
    let pathname = this.getPathname();
    let argumentsArray = pathname.split('/');
    if (pathname.startsWith('/blog/author') && argumentsArray.length === 4) {
      return decodeURIComponent(pathname.split('/')[3]);
    } else {
      throw new Error('Invalid Blog Author Profile Page Url.');
    }
  }

  /**
   * This function is used to find the query values as a list.
   * @param {string} fieldName - the name of the field.
   * @return {string[]} the list of query field values.
   */
  getQueryFieldValuesAsList(fieldName: string): string[] {
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

  /**
   * This function is used to combine the url, the field name,
   * and the field value together.
   * @param {string} url - the url.
   * @param {string} fieldName - the field name.
   * @param {string} fieldValue - the field value.
   * @return {string[]} the list of query field values.
   */
  addField(url: string, fieldName: string, fieldValue: string): string {
    let encodedFieldValue = encodeURIComponent(fieldValue);
    let encodedFieldName = encodeURIComponent(fieldName);
    return url + (url.indexOf('?') !== -1 ? '&' : '?') + encodedFieldName +
        '=' + encodedFieldValue;
  }

  /**
   * This function is used to find the hashed value
   * from the current location.
   */
  getHash(): string {
    return this.getCurrentLocation().hash;
  }

  /**
   * This function is used to find the origin from the current location.
   */
  getOrigin(): string {
    return this.getCurrentLocation().origin;
  }

  /**
   * This function is used to find the collection id from
   * the exploration url.
   * @return {string} a collection id if
   * the url parameter doesn't have a 'parent' property
   * but have a 'collection_id' property; @return {null} if otherwise.
   */
  getCollectionIdFromExplorationUrl(): string | null {
    let urlParams: UrlParamsType = this.getUrlParams();
    if (urlParams.hasOwnProperty('parent')) {
      return null;
    }
    if (urlParams.hasOwnProperty('collection_id')) {
      return urlParams.collection_id;
    }
    return null;
  }

  /**
   * This function is used to find the username from the profile url.
   * @return {string} the username.
   * @throws Will throw exception if the profile URL is invalid.
   */
  getUsernameFromProfileUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(profile)/g)) {
      return decodeURIComponent(pathname.split('/')[2]);
    }
    throw new Error('Invalid profile URL');
  }

  /**
   * This function is used to find the collection id from the url.
   * @return {string} the collection id.
   * @throws Will throw exception if the profile URL is invalid.
   */
  getCollectionIdFromUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(collection)/g)) {
      return decodeURIComponent(pathname.split('/')[2]);
    }
    throw new Error('Invalid collection URL');
  }

  /**
   * This function is used to find
   * the collection id from the editor url.
   * @return {string} the collection id.
   * @throws Will throw exception if the editor URL is invalid.
   */
  getCollectionIdFromEditorUrl(): string {
    let pathname = this.getPathname();
    if (pathname.match(/\/(collection_editor\/create)/g)) {
      return decodeURIComponent(pathname.split('/')[3]);
    }
    throw new Error('Invalid collection editor URL');
  }

  /**
   * This function is used to find the exploration
   * version id from the url.
   * @return {number} the exploration version from Url
   * if an exploration version can be extracted;
   * {null} if otherwise.
   */
  getExplorationVersionFromUrl(): number | null {
    let urlParams: UrlParamsType = this.getUrlParams();
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

  getPidFromUrl(): string | null {
    let urlParams: UrlParamsType = this.getUrlParams();
    if (urlParams.hasOwnProperty('pid')) {
      let pid = urlParams.pid;
      return String(pid);
    }
    return null;
  }
}

angular.module('oppia').factory(
  'UrlService', downgradeInjectable(UrlService));
