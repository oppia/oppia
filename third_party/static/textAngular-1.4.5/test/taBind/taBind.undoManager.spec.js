describe('taBind.undoManager', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	var $rootScope, element, first, second, third;
	beforeEach(inject(function (_$compile_, _$rootScope_, $document) {
		$rootScope = _$rootScope_;
		$rootScope.html = '<p>Test Contents</p>';
		element = _$compile_('<div ta-bind contenteditable="contenteditable" ng-model="html" id="Test"></div>')($rootScope);
		$document.find('body').append(element);
		$rootScope.$digest();
	}));
	
	describe('should attach functions to scope', function () {
		it('attaches undoTaBind', function(){
			expect($rootScope.$undoTaBindTest).not.toBeUndefined();
		});
		it('attaches redoTaBind', function(){
			expect($rootScope.$redoTaBindTest).not.toBeUndefined();
		});
	});
	
	describe('should push to undoStack', function () {
		it('expect initial value to be pushed', function(){
			expect($rootScope.$undoManagerTest._stack[0]).toBe($rootScope.html);
		});
		it('expect current to be the last pushed value', function(){
			expect($rootScope.$undoManagerTest._stack[0]).toBe($rootScope.$undoManagerTest.current());
		});
		it('expect model changes to be pushed', function(){
			$rootScope.html = '<p>Test Changed Contents</p>';
			$rootScope.$digest();
			expect($rootScope.$undoManagerTest.current()).toBe($rootScope.html);
		});
		it('expect push to truncate redo branch', function(){
			$rootScope.html = '<p>Test Changed Contents 1</p>';
			$rootScope.$digest();
			$rootScope.html = '<p>Test Changed Contents 2</p>';
			$rootScope.$digest();
			$rootScope.html = '<p>Test Changed Contents 3</p>';
			$rootScope.$digest();
			$rootScope.$undoManagerTest._index = 1;
			$rootScope.html = '<p>Test Changed Contents 4</p>';
			$rootScope.$digest();
			expect($rootScope.$undoManagerTest.current()).toBe($rootScope.html);
			expect($rootScope.$undoManagerTest._stack.length).toBe(3);
			expect($rootScope.$undoManagerTest._stack[2]).toBe('<p>Test Changed Contents 4</p>');
		});
		it('expect push to remove start if past max undo level', function(){
			$rootScope.$undoManagerTest._max = 2;
			$rootScope.html = '<p>Test Changed Contents 1</p>';
			$rootScope.$digest();
			$rootScope.html = '<p>Test Changed Contents 2</p>';
			$rootScope.$digest();
			$rootScope.html = '<p>Test Changed Contents 3</p>';
			$rootScope.$digest();
			expect($rootScope.$undoManagerTest._stack.length).toBe(2);
			expect($rootScope.$undoManagerTest._stack[0]).toBe('<p>Test Changed Contents 2</p>');
		});
	});
	
	describe('undo function', function () {
		var first, second, third;
		describe('should update', function(){
			beforeEach(function(){
				first = $rootScope.html = '<p>Test Changed Contents 1</p>';
				$rootScope.$digest();
				second = $rootScope.html = '<p>Test Changed Contents 2</p>';
				$rootScope.$digest();
				third = $rootScope.html = '<p>Test Changed Contents 3</p>';
				$rootScope.$digest();
				$rootScope.$undoTaBindTest();
			});
			it('model', function(){
				expect($rootScope.$undoManagerTest.current()).toBe(second);
			});
			it('html', function(){
				expect(element[0].innerHTML).toBe(second);
			});
		});
		
		describe('should handle when no undo available', function(){
			it('not error', function(){
				expect(function(){
					$rootScope.$undoTaBindTest();
				}).not.toThrow();
			});
			it('not change html', function(){
				$rootScope.$undoTaBindTest();
				expect(element[0].innerHTML).toBe('<p>Test Contents</p>');
			});
			it('not change model', function(){
				$rootScope.$undoTaBindTest();
				expect($rootScope.html).toBe('<p>Test Contents</p>');
			});
		});
	});
	describe('redo function', function () {
		beforeEach(function(){
			first = $rootScope.html = '<p>Test Changed Contents 1</p>';
			$rootScope.$digest();
			second = $rootScope.html = '<p>Test Changed Contents 2</p>';
			$rootScope.$digest();
			third = $rootScope.html = '<p>Test Changed Contents 3</p>';
			$rootScope.$digest();
		});
		describe('should update', function(){
			beforeEach(inject(function($timeout){
				$rootScope.$undoTaBindTest();
				$rootScope.$undoTaBindTest();
				$timeout.flush();
				$rootScope.$redoTaBindTest();
				$timeout.flush();
			}));
			it('model', function(){
				expect($rootScope.$undoManagerTest.current()).toBe(second);
			});
			it('html', function(){
				expect(element[0].innerHTML).toBe(second);
			});
		});
		
		describe('should handle when no redo available', function(){
			it('not error', function(){
				expect(function(){
					$rootScope.$redoTaBindTest();
					$rootScope.$redoTaBindTest();
				}).not.toThrow();
			});
			it('not change html', function(){
				$rootScope.$redoTaBindTest();
				expect(element[0].innerHTML).toBe(third);
			});
			it('not change model', function(){
				$rootScope.$redoTaBindTest();
				expect($rootScope.html).toBe(third);
			});
		});
	});
	
	describe('handles keyup', function () {
		describe('trigger push on $timeout or trigger_key', function(){
			beforeEach(function(){
				element.html('<p>Test</p>');
			});
			
			it('should trigger timeout', inject(function($timeout){
				element.triggerHandler('keyup');
				expect($rootScope.$undoManagerTest.current()).not.toBe('<p>Test</p>');
				expect(function(){ $timeout.flush(); }).not.toThrow();
				expect($rootScope.$undoManagerTest.current()).toBe('<p>Test</p>');
			}));
			it('should re-create timeout on next keypress', inject(function($timeout){
				element.triggerHandler('keyup');
				element.triggerHandler('keyup');
				expect($rootScope.$undoManagerTest.current()).not.toBe('<p>Test</p>');
				$timeout.flush();
				expect($rootScope.$undoManagerTest.current()).toBe('<p>Test</p>');
			}));
		});
	});
	
	describe('handles keydown', function () {
		describe('should trigger undo on keydown', function(){
			beforeEach(function(){
				first = $rootScope.html = '<p>Test Changed Contents 1</p>';
				$rootScope.$digest();
				second = $rootScope.html = '<p>Test Changed Contents 2</p>';
				$rootScope.$digest();
				third = $rootScope.html = '<p>Test Changed Contents 3</p>';
				$rootScope.$digest();
			});
			
			it('ctrl+z', inject(function($timeout){
				if(angular.element === jQuery) {
					event = jQuery.Event('keydown');
					event.keyCode = 90;
					event.ctrlKey = true;
					element.triggerHandler(event);
				}else{
					event = {
						keyCode: 90,
						ctrlKey: true
					};
					element.triggerHandler('keydown', event);
				}
				expect($rootScope.html).toBe(second);
			}));
			
			it('command+z', inject(function($timeout){
				if(angular.element === jQuery) {
					event = jQuery.Event('keydown');
					event.keyCode = 90;
					event.metaKey = true;
					element.triggerHandler(event);
				}else{
					event = {
						keyCode: 90,
						metaKey: true
					};
					element.triggerHandler('keydown', event);
				}
				expect($rootScope.html).toBe(second);
			}));
			
			it('not alt+ctrl+z #518', inject(function($timeout){
				if(angular.element === jQuery) {
					event = jQuery.Event('keydown');
					event.keyCode = 90;
					event.altKey = true;
					event.ctrlKey = true;
					element.triggerHandler(event);
				}else{
					event = {
						keyCode: 90,
						altKey: true,
						ctrlKey: true
					};
					element.triggerHandler('keydown', event);
				}
				expect($rootScope.html).toBe(third);
			}));
		});
		
		describe('should trigger redo on keydown', function(){
			beforeEach(function(){
				first = $rootScope.html = '<p>Test Changed Contents 1</p>';
				$rootScope.$digest();
				second = $rootScope.html = '<p>Test Changed Contents 2</p>';
				$rootScope.$digest();
				third = $rootScope.html = '<p>Test Changed Contents 3</p>';
				$rootScope.$digest();
				$rootScope.$undoTaBindTest();
				$rootScope.$undoTaBindTest();
			});
			
			it('ctrl+y', inject(function($timeout){
				if(angular.element === jQuery) {
					event = jQuery.Event('keydown');
					event.keyCode = 89;
					event.ctrlKey = true;
					element.triggerHandler(event);
				}else{
					event = {
						keyCode: 89,
						ctrlKey: true
					};
					element.triggerHandler('keydown', event);
				}
				expect($rootScope.html).toBe(second);
			}));
			
			it('command+shift+z', inject(function($timeout){
				if(angular.element === jQuery) {
					event = jQuery.Event('keydown');
					event.keyCode = 90;
					event.shiftKey = true;
					event.metaKey = true;
					element.triggerHandler(event);
				}else{
					event = {
						keyCode: 90,
						metaKey: true,
						shiftKey: true
					};
					element.triggerHandler('keydown', event);
				}
				expect($rootScope.html).toBe(second);
			}));
		});
		
		describe('should prevent default on match only', function(){
			beforeEach(function(){
				first = $rootScope.html = '<p>Test Changed Contents 1</p>';
				$rootScope.$digest();
			});
			
			it('match prevents default', inject(function($timeout){
				event = jasmine.createSpyObj('e', ['preventDefault']);
				event.keyCode = 89;
				event.ctrlKey = true;
				element.triggerHandler('keydown', event);
				expect(event.preventDefault).toHaveBeenCalled();
			}));
			
			it('no match allows pass', inject(function($timeout){
				event = jasmine.createSpyObj('e', ['preventDefault']);
				event.keyCode = 80;
				event.ctrlKey = true;
				element.triggerHandler('keydown', event);
				expect(event.preventDefault).not.toHaveBeenCalled();
			}));
		});
	});
});