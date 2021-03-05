// // Copyright 2021 The Oppia Authors. All Rights Reserved.
// //
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //      http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS-IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.

// import { TestBed, waitForAsync } from '@angular/core/testing';
// import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
// import { ContextService } from 'services/context.service';
// import { UrlService } from 'services/contextual/url.service';
// import { WindowRef } from 'services/contextual/window-ref.service';

// /**
//  * @fileoverview Unit tests for RefresherExplorationConfirmationModalController.
//  */

// describe('Refresher Exploration Confirmation Modal Controller', () => {
//   let ngbActiveModal = null;
//   let contextService = null;
//   let ExplorationEngineService = null;
//   let urlService = null;
//   let explorationId = 'exp1';
//   let redirectConfirmationCallback = jasmine.createSpy('callback');
//   let refresherExplorationId = 'exp2';

//   class MockWindowRef {
//     _window(): object {
//       return {
//         open: () => {}
//       };
//     }
//   }

//   class MockNgbActiveModal {
//     close(): void { }
//   }

//   // BeforeEach(angular.mock.module('oppia', function($provide) {
//   //   $provide.value('$window', mockWindow);
//   // }));
//   // beforeEach(angular.mock.inject(function($injector, $controller) {
//   //   $flushPendingTasks = $injector.get('$flushPendingTasks');
//   //   var $rootScope = $injector.get('$rootScope');
//   //   $verifyNoPendingTasks = $injector.get('$verifyNoPendingTasks');

//   //   ContextService = $injector.get('ContextService');
//   //   spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);

//   //   ExplorationEngineService = $injector.get('ExplorationEngineService');
//   //   UrlService = $injector.get('UrlService');


//   //   $uibModalInstance = jasmine.createSpyObj(
//   //     '$uibModalInstance', ['close', 'dismiss']);

//   //   $scope = $rootScope.$new();
//   //   $controller('RefresherExplorationConfirmationModalController', {
//   //     $scope: $scope,
//   //     $uibModalInstance: $uibModalInstance,
//   //     redirectConfirmationCallback: redirectConfirmationCallback,
//   //     refresherExplorationId: refresherExplorationId
//   //   });
//   // }));

//   beforeEach(waitForAsync(() => {
//     TestBed.configureTestingModule({
//       providers: [{
//         provide: WindowRef,
//         useClass: MockWindowRef
//       },
//       {
//         provide: NgbActiveModal,
//         useClass: MockNgbActiveModal
//       }
//       ]
//     });
//     urlService = TestBed.inject(UrlService);
//     contextService = new ContextService(urlService);
//     spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
//   }));

//   it('should redirect page when clicking on allowing redirect button',
//     function() {
//       // SpyOn(ExplorationEngineService, 'getExplorationId').and.returnValue(
//       //   explorationId);
//       spyOn(urlService, 'getUrlParams').and.returnValue({
//         collection_id: 'collection_1'
//       });
//       spyOn(urlService, 'getQueryFieldValuesAsList').and.returnValue([
//         'field_1', 'field_2']);
//       spyOn(mockWindow, 'open').and.callThrough();
//       $scope.confirmRedirect();

//       $flushPendingTasks();
//       $verifyNoPendingTasks('$timeout');

//       expect(redirectConfirmationCallback).toHaveBeenCalled();
//       expect(mockWindow.open).toHaveBeenCalledWith(
//         '/explore/exp2?collection_id=collection_1&parent=field_1&' +
//         'parent=field_2&parent=exp1', '_self');
//       expect($uibModalInstance.close).toHaveBeenCalled();
//     });
// });
