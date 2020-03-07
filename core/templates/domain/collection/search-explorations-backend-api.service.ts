

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { LibraryPageConstants } from
  'pages/library-page/library-page.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class SearchExplorationsBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _fetchExplorations(
      searchQuery: string, successCallback: (
      value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    var queryUrl = this.urlInterpolationService.interpolateUrl(
      LibraryPageConstants.SEARCH_EXPLORATION_URL_TEMPLATE, {
        query: btoa(searchQuery)
      }
    );
    this.http.get(queryUrl).toPromise().then((response) => {
      successCallback(response);
    }, (errorResponse) => {
      errorCallback(errorResponse);
    });
  }

  /**
   * Returns exploration's metadata dict, given a search query. Search
   * queries are tokens that will be matched against exploration's title
   * and objective.
   */
  fetchExplorations(searchQuery: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchExplorations(searchQuery, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'SearchExplorationsBackendApiService',
  downgradeInjectable(SearchExplorationsBackendApiService));
