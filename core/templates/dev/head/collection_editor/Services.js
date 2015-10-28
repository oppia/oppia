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
 * @fileoverview Standalone services for the exploration editor page.
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */


oppia.factory('collectionData', ['$q', '$http', '$log', function($q, $http, $log) {
  // The pathname (without the hash) should be: .../create/{collection_id}
  var collectiononId = '';
  var pathnameArray = window.location.pathname.split('/');
  for (var i = 0; i < pathnameArray.length; i++) {
    if (pathnameArray[i] === 'create') {
      var collectionId = pathnameArray[i + 1];
      break;
    }
  }

  if(!collectionId) {
	  $log.error('Unexpected call to collection data for pathname ', collectionId);
    // Note: if we do not return anything, Karma unit tests fail.
    return {};
  }

  var collectionUrl = 'collection_editor/create/' + collectionId;
  var collectionDataUrl = '/collection_editor/data/' + collectionId;

  // Put collection variables here.
  var collectionData = {
    collectionId: collectionId,
    // Returns a promise that supplies the data for the current collection.
    getData: function() {
      if (collectionData.data) {
        $log.info('Found collection data in cache.');
      	var deferred = $q.defer();
	  	  deferred.resolve(collectionData.data);
      	return deferred.promise;
      } else {
      	// Retrieve data from the server.
      	return $http.get(collectionDataUrl).then(function(response) {
          $log.info('Retrieved collection data.');
          $log.info(response.data);
          collectionData.data = response.data;
          console.log(collectionData);
          return response.data;
        });
      }
    }
  }
  return collectionData;
}]);
