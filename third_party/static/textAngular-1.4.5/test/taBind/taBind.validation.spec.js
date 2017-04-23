describe('taBind.validation', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	var $rootScope, element;
	
	describe('basic', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_, $document) {
			$rootScope = _$rootScope_;
			$rootScope.html = '';
			var _form = angular.element('<form name="form"></form>');
			element = angular.element('<div ta-bind name="test" contenteditable="true" ng-model="html"></div>');
			_form.append(element);
			$document.find('body').append(_$compile_(_form)($rootScope));
			$rootScope.$digest();
		}));
		
		describe('should start with', function () {
			it('pristine', function(){
				expect($rootScope.form.$pristine).toBe(true);
			});
			it('field pristine', function(){
				expect($rootScope.form.test.$pristine).toBe(true);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
		
		describe('should NOT change on direct model change', function () {
			beforeEach(function(){
				$rootScope.html = '<div>Test Change Content</div>';
				$rootScope.$digest();
			});
			it('pristine', function(){
				expect($rootScope.form.$pristine).toBe(true);
			});
			it('field pristine', function(){
				expect($rootScope.form.test.$pristine).toBe(true);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
		
		describe('should change on input update', function () {
			beforeEach(inject(function(textAngularManager, $timeout){
				element.html('<div>Test Change Content</div>');
				element.triggerHandler('keyup');
				$rootScope.$digest();
				$timeout.flush();
			}));
			it('not pristine', function(){
				expect($rootScope.form.$pristine).toBe(false);
			});
			it('field not pristine', function(){
				expect($rootScope.form.test.$pristine).toBe(false);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
		
		describe('should change on blur', function () {
			beforeEach(inject(function(textAngularManager){
				element.html('<div>Test Change Content</div>');
				element.triggerHandler('blur');
				$rootScope.$digest();
			}));
			it('not pristine', function(){
				expect($rootScope.form.$pristine).toBe(false);
			});
			it('field not pristine', function(){
				expect($rootScope.form.test.$pristine).toBe(false);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
		
		describe('should NOT change on blur with no content difference', function () {
			beforeEach(function(){
				$rootScope.html = '<div>Test Change Content</div>';
				$rootScope.$digest();
				element.triggerHandler('blur');
				$rootScope.$digest();
			});
			it('pristine', function(){
				expect($rootScope.form.$pristine).toBe(true);
			});
			it('field pristine', function(){
				expect($rootScope.form.test.$pristine).toBe(true);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
	});
	describe('with errors', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_, $document) {
			$rootScope = _$rootScope_;
			$rootScope.html = '';
			var _form = angular.element('<form name="form"></form>');
			element = angular.element('<div ta-bind name="test" contenteditable="true" ng-model="html" required="required"></div>');
			_form.append(element);
			$document.find('body').append(_$compile_(_form)($rootScope));
			$rootScope.$digest();
		}));
		
		describe('should start with', function () {
			it('required', function(){
				expect($rootScope.form.test.$error.required).toBe(true);
			});
			it('invalid', function(){
				expect($rootScope.form.$invalid).toBe(true);
			});
			it('infield valid', function(){
				expect($rootScope.form.test.$invalid).toBe(true);
			});
		});
		
		describe('should change on direct model change', function () {
			beforeEach(function(){
				$rootScope.html = '<div>Test Change Content</div>';
				$rootScope.$digest();
			});
			it('required', function(){
				expect($rootScope.form.test.$error.required).toBe(undefined);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
		
		describe('should handle blank test', function () {
			beforeEach(inject(function($timeout){
				element.html('<pre><br></pre>');
				element.triggerHandler('keyup');
				$rootScope.$digest();
				$timeout.flush();
			}));
			it('required', function(){
				expect($rootScope.form.test.$error.required).toBe(true);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(false);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(false);
			});
		});
		
		describe('should handle inline elements like img', function () {
			beforeEach(function(){
				$rootScope.html = '<p><img src="test.jpg"/></p>';
				$rootScope.$digest();
			});
			it('ng-required', function(){
				expect($rootScope.form.test.$error.required).toBe(undefined);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
		
		describe('should change on input update', function () {
			beforeEach(inject(function(textAngularManager, $timeout){
				element.html('<div>Test Change Content</div>');
				element.triggerHandler('keyup');
				$rootScope.$digest();
				$timeout.flush();
			}));
			it('ng-required', function(){
				expect($rootScope.form.test.$error.required).toBe(undefined);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
		
		describe('should change on blur', function () {
			beforeEach(inject(function(textAngularManager){
				element.html('<div>Test Change Content</div>');
				element.triggerHandler('blur');
				$rootScope.$digest();
			}));
			it('ng-required', function(){
				expect($rootScope.form.test.$error.required).toBe(undefined);
			});
			it('valid', function(){
				expect($rootScope.form.$valid).toBe(true);
			});
			it('field valid', function(){
				expect($rootScope.form.test.$valid).toBe(true);
			});
		});
	});
});