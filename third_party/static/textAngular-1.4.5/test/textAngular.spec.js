describe('textAngular', function(){
	/*
		Display Tests
	*/
	'use strict';
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	beforeEach(module('textAngular'));
	var $window, element, $rootScope, textAngularManager, editorScope;
	describe('Minimal Initiation', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular><p>Test Content</p></text-angular>')($rootScope);
			$rootScope.$digest();
		}));
		describe('Adds Correct Classes and Elements', function () {
			it('add .ta-root to base element', function(){
				expect(jQuery(element).hasClass('.ta-root'));
			});
			it('adds 2 .ta-editor elements', function(){
				expect(jQuery('.ta-editor', element).length).toBe(2);
			});
			it('adds the WYSIWYG div', function(){
				expect(jQuery('div.ta-text.ta-editor', element).length).toBe(1);
			});
			it('adds the textarea', function(){
				expect(jQuery('textarea.ta-html.ta-editor', element).length).toBe(1);
			});
			it('no hidden form submission element', function(){
				expect(jQuery('input[type=hidden][name=test]', element).length).toBe(0);
			});
		});
	});

	describe('Basic Initiation without ng-model', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"><p>Test Content</p></text-angular>')($rootScope);
			$rootScope.$digest();
		}));
		describe('Adds Correct Classes and Elements', function () {
			it('add .ta-root to base element', function(){
				expect(jQuery(element).hasClass('.ta-root'));
			});
			it('adds 2 .ta-editor elements', function(){
				expect(jQuery('.ta-editor', element).length).toBe(2);
			});
			it('adds the WYSIWYG div', function(){
				expect(jQuery('div.ta-text.ta-editor', element).length).toBe(1);
			});
			it('adds the textarea', function(){
				expect(jQuery('textarea.ta-html.ta-editor', element).length).toBe(1);
			});
			it('adds one hidden form submission element', function(){
				expect(jQuery('input[type=hidden][name=test]', element).length).toBe(1);
			});
		});
	});

	describe('Add classes via attributes', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_, _textAngularManager_) {
			$rootScope = _$rootScope_;
			textAngularManager = _textAngularManager_;
			element = _$compile_('<text-angular name="test" ta-focussed-class="test-focus-class" ta-text-editor-class="test-text-class" ta-html-editor-class="test-html-class"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));

		describe('Adds Correct Classes', function () {
			it('initially has no focus class', function(){
				expect(!jQuery(element).hasClass('.test-focus-class'));
			});
			it('adds focus class when ta-text is focussed', function(){
				textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('focus');
				expect(jQuery(element).hasClass('.test-focus-class'));
			});
			it('adds focus class when ta-html is focussed', function(){
				jQuery('.ta-html', element).triggerHandler('focus');
				expect(jQuery(element).hasClass('.test-focus-class'));
			});
			it('adds text editor class', function(){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.hasClass('.test-text-class'));
			});
			it('adds html editor class', function(){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.html.hasClass('.test-html-class'));
			});
		});
	});

	describe('Change classes via decorator', function(){
		beforeEach(module('textAngular', function($provide){
			// change all the classes at once
			$provide.decorator('taOptions', ['$delegate', function(taOptions){
				taOptions.classes.focussed = "test-focus-class";
				taOptions.classes.disabled = "disabled-test";
				taOptions.classes.textEditor = 'test-text-class';
				taOptions.classes.htmlEditor = 'test-html-class';
				return taOptions;
			}]);
		}));
		beforeEach(inject(function (_$compile_, _$rootScope_, _textAngularManager_) {
			$rootScope = _$rootScope_;
			textAngularManager = _textAngularManager_;
			element = _$compile_('<text-angular name="test"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));
		it('should add .test-focus-class instead of default .focussed', function(){
			textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('focus');
			expect(jQuery(element).hasClass('.test-focus-class'));
		});
		it('adds text editor class', function(){
			expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.hasClass('.test-text-class'));
		});
		it('adds html editor class', function(){
			expect(textAngularManager.retrieveEditor('test').scope.displayElements.html.hasClass('.test-html-class'));
		});
		it('adds disabled class', function(){
			expect(jQuery(element).hasClass('.disabled-test'));
		});
	});

	describe('Add tabindex attribute', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_, _textAngularManager_) {
			$rootScope = _$rootScope_;
			textAngularManager = _textAngularManager_;
			element = _$compile_('<text-angular name="test" tabindex="42"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));

		describe('Check moved across', function () {
			it('to textEditor', function(){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.attr('tabindex')).toBe('42');
			});
			it('to htmlEditor', function(){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.html.attr('tabindex')).toBe('42');
			});
			it('removed from .ta-root', function(){
				expect(element.attr('tabindex')).toBeUndefined();
			});
		});
	});

	describe('Use serial attribute', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_, _textAngularManager_) {
			$rootScope = _$rootScope_;
			textAngularManager = _textAngularManager_;
			element = _$compile_('<text-angular serial="test"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));

		describe('generates id\'s and name attributes', function () {
			it('name of editor', function(){
				expect(textAngularManager.retrieveEditor('textAngularEditortest')).not.toBeUndefined();
			});
			it('to textEditor', function(){
				expect(textAngularManager.retrieveEditor('textAngularEditortest').scope.displayElements.text.attr('id')).toBe('taTextElementtest');
			});
			it('to htmlEditor', function(){
				expect(textAngularManager.retrieveEditor('textAngularEditortest').scope.displayElements.html.attr('id')).toBe('taHtmlElementtest');
			});
		});
	});

	describe('Disable the editor', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$rootScope.disabled = true;
			element = _$compile_('<text-angular name="test" ta-disabled="disabled"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));

		describe('check disabled class', function () {
			it('is added initially', function(){
				expect(jQuery(element).hasClass('disaled'));
			});
			it('is removed on change to false', function(){
				$rootScope.disabled = false;
				$rootScope.$digest();
				expect(!jQuery(element).hasClass('disabled'));
			});
			it('is added on change to true', function(){
				$rootScope.disabled = false;
				$rootScope.$digest();
				$rootScope.disabled = true;
				$rootScope.$digest();
				expect(jQuery(element).hasClass('disabled'));
			});
		});
	});

	it('respects the taShowHtml attribute',inject(function ($compile, $rootScope, $document) {
		element = $compile('<text-angular name="test" ta-show-html="true"></text-angular>')($rootScope);
		$document.find('body').append(element);
		$rootScope.$digest();
		expect(jQuery('.ta-text', element[0]).is(':visible')).toBe(false);
		expect(jQuery('.ta-html', element[0]).is(':visible')).toBe(true);
		element.remove();
	}));

	it('respects the taDefaultTagAttributes attribute',inject(function ($compile, $rootScope, $document, textAngularManager) {
		$rootScope.taTestDefaultTagAttributes = {a:{target:"_blank"}, li:{test:"testing"}};
		element = $compile('<text-angular name="test" ta-default-tag-attributes="{{taTestDefaultTagAttributes}}"></text-angular>')($rootScope);
		$document.find('body').append(element);
		editorScope = textAngularManager.retrieveEditor('test').scope;
		$rootScope.$digest();
		expect(editorScope.defaultTagAttributes).toEqual($rootScope.taTestDefaultTagAttributes);
		element.remove();
	}));

	it('uses the default defaultTagAttributes when the taDefaultTagAttributes attribute throws a JSON parse error',inject(function ($compile, $rootScope, $document, textAngularManager) {
		var taTestDefaultTagAttributes = {a:{target:""}};
		element = $compile('<text-angular name="test" ta-default-tag-attributes="invalidJSON"></text-angular>')($rootScope);
		$document.find('body').append(element);
		editorScope = textAngularManager.retrieveEditor('test').scope;
		$rootScope.$digest();
		expect(editorScope.defaultTagAttributes).toEqual(taTestDefaultTagAttributes);
		element.remove();
	}));

	describe('Check view change', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager, $document) {
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"></text-angular>')($rootScope);
			$document.find('body').append(element);
			editorScope = textAngularManager.retrieveEditor('test').scope;
			$rootScope.$digest();
		}));
		afterEach(function(){
			element.remove();
		});

		it('initially should hide .ta-html and show .ta-text', function(){
			expect(jQuery('.ta-text', element[0]).is(':visible')).toBe(true);
			expect(jQuery('.ta-html', element[0]).is(':visible')).toBe(false);
		});

		describe('from WYSIWYG text to RAW HTML view', function () {
			it('should hide .ta-text and show .ta-html', function(){
				editorScope.switchView();
				editorScope.$parent.$digest();
				expect(jQuery('.ta-text', element[0]).is(':visible')).toBe(false);
				expect(jQuery('.ta-html', element[0]).is(':visible')).toBe(true);
			});
		});

		describe('from RAW HTML to WYSIWYG text view', function () {
			it('should hide .ta-html and show .ta-text', function(){
				editorScope.switchView();
				editorScope.$parent.$digest();
				editorScope.switchView();
				editorScope.$parent.$digest();
				expect(jQuery('.ta-text', element[0]).is(':visible')).toBe(true);
				expect(jQuery('.ta-html', element[0]).is(':visible')).toBe(false);
			});
		});
	});

	describe('Check focussed class adding', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager) {
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"></text-angular>')($rootScope);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('test').scope;
		}));

		describe('should have added .focussed', function(){
			it('on trigger focus on ta-text', function(){
				editorScope.displayElements.text.triggerHandler('focus');
				expect(element.hasClass('focussed'));
			});
			it('on trigger focus on ta-html', function(){
				editorScope.displayElements.html.triggerHandler('focus');
				expect(element.hasClass('focussed'));
			});
		});

		describe('should have removed .focussed', function(){
			it('on ta-text trigger blur', function(){
				editorScope.displayElements.text.triggerHandler('focus');
				$rootScope.$digest();
				editorScope.displayElements.text.triggerHandler('blur');
				expect(!element.hasClass('focussed'));
			});
			it('on ta-html trigger blur', function(){
				editorScope.displayElements.html.triggerHandler('focus');
				$rootScope.$digest();
				editorScope.displayElements.html.triggerHandler('blur');
				expect(!element.hasClass('focussed'));
			});
		});
	});

	describe('Check text and html editor setup functions', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$rootScope.attrSetup = function($element){
				$element.attr('testattr', 'trueish');
			};
			element = _$compile_('<text-angular ta-text-editor-setup="attrSetup" ta-html-editor-setup="attrSetup" name="test"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));

		describe('should have added attribute to', function(){
			it('ta-text', inject(function(textAngularManager){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.attr('testattr')).toBe('trueish');
			}));
			it('ta-html', inject(function(textAngularManager){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.html.attr('testattr')).toBe('trueish');
			}));
		});
	});

	describe('Check placeholder passthrough', function(){
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test" placeholder="Test Placeholder"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));

		describe('should have added placeholder to', function(){
			it('ta-text', inject(function(textAngularManager){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.attr('placeholder')).toBe('Test Placeholder');
			}));
			it('ta-html', inject(function(textAngularManager){
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.html.attr('placeholder')).toBe('Test Placeholder');
			}));
		});
	});

	describe('registration', function(){
		it('should add itself to the textAngularManager', inject(function($rootScope, $compile, textAngularManager){
			$compile('<text-angular name="test"></text-angular>')($rootScope);
			expect(textAngularManager.retrieveEditor('test')).not.toBeUndefined();
		}));

		it('should register toolbars to itself', inject(function($rootScope, $compile, textAngularManager){
			var toolbar1 = {name: 'test-toolbar1'};
			var toolbar2 = {name: 'test-toolbar2'};
			textAngularManager.registerToolbar(toolbar1);
			textAngularManager.registerToolbar(toolbar2);
			$compile('<text-angular name="test" ta-target-toolbars="test-toolbar1,test-toolbar2"></text-angular>')($rootScope);
			var _toolbars = textAngularManager.retrieveToolbarsViaEditor('test');
			expect(_toolbars[0]).toBe(toolbar1);
			expect(_toolbars[1]).toBe(toolbar2);
		}));
	});

	describe('unregistration', function(){
		it('should remove itself from the textAngularManager on $destroy', inject(function($rootScope, $compile, textAngularManager){
			element = $compile('<text-angular name="test"></text-angular>')($rootScope);
			$rootScope.$digest();
			textAngularManager.retrieveEditor('test').scope.$destroy();
			expect(textAngularManager.retrieveEditor('test')).toBeUndefined();
		}));
	});

	/*
		Form validation tests
	*/

	describe('form validation', function(){

		describe('basic', function(){
			beforeEach(inject(function (_$compile_, _$rootScope_, _$window_, $document, textAngularManager) {
				$window = _$window_;
				$rootScope = _$rootScope_;
				$rootScope.html = '';
				var _form = angular.element('<form name="form"></form>');
				element = angular.element('<text-angular name="test" ng-model="html"></text-angular>');
				_form.append(element);
				$document.find('body').append(_$compile_(_form)($rootScope));
				element = textAngularManager.retrieveEditor('test').scope.displayElements.text;
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
					$rootScope.htmlcontent = '<div>Test Change Content</div>';
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
		});
		describe('with errors', function(){
			beforeEach(inject(function (_$compile_, _$rootScope_, _$window_, $document, textAngularManager) {
				$window = _$window_;
				$rootScope = _$rootScope_;
				$rootScope.html = '';
				var _form = angular.element('<form name="form"></form>');
				element = angular.element('<text-angular name="test" ng-model="html" required></text-angular>');
				_form.append(element);
				$document.find('body').append(_$compile_(_form)($rootScope));
				element = textAngularManager.retrieveEditor('test').scope.displayElements.text;
				$rootScope.$digest();
			}));

			describe('should start with', function () {
				it('ng-required', function(){
					expect($rootScope.form.test.$error.required).toBe(true);
				});
				it('valid', function(){
					expect($rootScope.form.$invalid).toBe(true);
				});
				it('field valid', function(){
					expect($rootScope.form.test.$invalid).toBe(true);
				});
			});

			describe('should change on direct model change', function () {
				beforeEach(function(){
					$rootScope.html = '<div>Test Change Content</div>';
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

			describe('should change on input update', function() {
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

	/*
		Data Tests
	*/

	describe('Basic Initiation without ng-model', function(){
		var displayElements;
		beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager) {
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"><p>Test Content</p></text-angular>')($rootScope);
			$rootScope.$digest();
			displayElements = textAngularManager.retrieveEditor('test').scope.displayElements;
		}));
		describe('Inserts the current information into the fields', function(){
			it('populates the WYSIWYG area', function(){
				expect(displayElements.text.find('p').length).toBe(1);
			});
			it('populates the textarea', function(){
				expect(displayElements.html.val()).toBe('<p>Test Content</p>');
			});
			it('populates the hidden input value', function(){
				expect(displayElements.forminput.val()).toBe('<p>Test Content</p>');
			});
		});
	});

	describe('Basic Initiation with ng-model', function(){
		var displayElements;
		beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Content</p>';
			element = _$compile_('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
			$rootScope.$digest();
			displayElements = textAngularManager.retrieveEditor('test').scope.displayElements;
		}));
		describe('Inserts the current information into the fields', function(){
			it('populates the WYSIWYG area', function(){
				expect(displayElements.text.find('p').length).toBe(1);
			});
			it('populates the textarea', function(){
				expect(displayElements.html.val()).toBe('<p>Test Content</p>');
			});
			it('populates the hidden input value', function(){
				expect(displayElements.forminput.val()).toBe('<p>Test Content</p>');
			});
		});
	});
	describe('Basic Initiation with ng-model and originalContents', function(){
		var displayElements;
		beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Content</p>';
			element = _$compile_('<text-angular name="test" ng-model="html"><p>Original Content</p></text-angular>')($rootScope);
			$rootScope.$digest();
			displayElements = textAngularManager.retrieveEditor('test').scope.displayElements;
		}));
		describe('Inserts the current information into the fields', function(){
			it('populates the WYSIWYG area', function(){
				expect(displayElements.text.find('p').length).toBe(1);
			});
			it('populates the textarea', function(){
				expect(displayElements.html.val()).toBe('<p>Test Content</p>');
			});
			it('populates the hidden input value', function(){
				expect(displayElements.forminput.val()).toBe('<p>Test Content</p>');
			});
		});
	});

	describe('should respect the ta-default-wrap value', function(){
		it('with ng-model', inject(function($rootScope, $compile, textAngularManager){
			$rootScope.html = '';
			$compile('<text-angular ta-default-wrap="div" name="test" ng-model="html"></text-angular>')($rootScope);
			element = textAngularManager.retrieveEditor('test').scope.displayElements.text;
			$rootScope.$digest();
			element.triggerHandler('focus');
			$rootScope.$digest();
			expect(element.html()).toBe('<div><br></div>');
		}));
		it('without ng-model', inject(function($rootScope, $compile, textAngularManager){
			$compile('<text-angular ta-default-wrap="div" name="test"></text-angular>')($rootScope);
			element = textAngularManager.retrieveEditor('test').scope.displayElements.text;
			$rootScope.$digest();
			element.triggerHandler('focus');
			$rootScope.$digest();
			expect(element.html()).toBe('<div><br></div>');
		}));
	});



	describe('should respect taUnsafeSanitizer attribute', function () {
		var element2, displayElements, $timeout;
		beforeEach(inject(function(_$timeout_){
			$timeout = _$timeout_;
		}));
		describe('without ng-model', function(){
			beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager) {
				$rootScope = _$rootScope_;
				element = _$compile_('<text-angular name="test" ta-unsafe-sanitizer="true"><p>Test Contents</p></text-angular>')($rootScope);
				$rootScope.$digest();
				editorScope = textAngularManager.retrieveEditor('test').scope;
				element = textAngularManager.retrieveEditor('test').scope.displayElements.text;
				element2 = textAngularManager.retrieveEditor('test').scope.displayElements.html;
			}));

			it('allow bad tags', function () {
				element.append('<bad-tag>Test 2 Content</bad-tag>');
				element.triggerHandler('keyup');
				$rootScope.$digest();
				$timeout.flush();
				expect(element2.val()).toBe('<p>Test Contents</p>\n<p><bad-tag>Test 2 Content</bad-tag></p>');
			});

			it('not allow malformed html', function () {
				element.append('<bad-tag Test 2 Content</bad-tag>');
				element.triggerHandler('keyup');
				$rootScope.$digest();
				$timeout.flush();
				expect(element2.val()).toBe('<p>Test Contents</p>');
			});
		});

		describe('with ng-model', function(){
			beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager) {
				$rootScope = _$rootScope_;
				$rootScope.html = '<p>Test Contents</p>';
				element = _$compile_('<text-angular name="test" ta-unsafe-sanitizer="true" ng-model="html"></text-angular>')($rootScope);
				$rootScope.$digest();
				editorScope = textAngularManager.retrieveEditor('test').scope;
				element = editorScope.displayElements.text;
			}));

			it('allow bad tags', function () {
				element.append('<bad-tag>Test 2 Content</bad-tag>');
				element.triggerHandler('keyup');
				$rootScope.$digest();
				$timeout.flush();
				expect($rootScope.html).toBe('<p>Test Contents</p><p><bad-tag>Test 2 Content</bad-tag></p>');
			});

			it('not allow malformed html', function () {
				element.append('<bad-tag Test 2 Content</bad-tag>');
				element.triggerHandler('keyup');
				$rootScope.$digest();
				$timeout.flush();
				expect($rootScope.html).toBe('<p>Test Contents</p>');
			});
		});
	});

	describe('Updates without ng-model', function(){
		var displayElements;
		beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager, $timeout) {
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"><p>Test Content</p></text-angular>')($rootScope);
			$rootScope.$digest();
			displayElements = textAngularManager.retrieveEditor('test').scope.displayElements;
			displayElements.text.html('<div>Test Change Content</div>');
			displayElements.text.triggerHandler('keyup');
			$rootScope.$digest();
			$timeout.flush();
		}));

		describe('updates from .ta-text', function(){
			it('should update .ta-html', function(){
				expect(displayElements.html.val()).toBe('<div>Test Change Content</div>');
			});
			it('should update input[type=hidden]', function(){
				expect(displayElements.forminput.val()).toBe('<div>Test Change Content</div>');
			});
		});

		describe('updates from .ta-html', function(){
			it('should update .ta-text', function(){
				expect(displayElements.text.html()).toBe('<div>Test Change Content</div>');
			});
			it('should update input[type=hidden]', function(){
				expect(displayElements.forminput.val()).toBe('<div>Test Change Content</div>');
			});
		});
	});

	describe('Updates with ng-model', function(){
		var displayElements;
		beforeEach(inject(function (_$compile_, _$rootScope_, textAngularManager) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Content</p>';
			element = _$compile_('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
			$rootScope.$digest();
			$rootScope.html = '<div>Test Change Content</div>';
			$rootScope.$digest();
			displayElements = textAngularManager.retrieveEditor('test').scope.displayElements;
		}));

		describe('updates from model to display', function(){
			it('should update .ta-html', function(){
				expect(displayElements.html.val()).toBe('<div>Test Change Content</div>');
			});
			it('should update .ta-text', function(){
				expect(displayElements.text.html()).toBe('<div>Test Change Content</div>');
			});
			it('should update input[type=hidden]', function(){
				expect(displayElements.forminput.val()).toBe('<div>Test Change Content</div>');
			});
		});
	});

	describe('ng-model should handle undefined and null', function(){
		it('should handle initial undefined to empty-string', inject(function ($compile, $rootScope, textAngularManager) {
			$rootScope.html = undefined;
			element = $compile('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
			$rootScope.$digest();
			expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><br></p>');
		}));

		it('should handle initial null to empty-string', inject(function ($compile, $rootScope, textAngularManager) {
			$rootScope.html = null;
			element = $compile('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
			$rootScope.$digest();
			expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><br></p>');
		}));

		it('should handle initial undefined to originalContents', inject(function ($compile, $rootScope, textAngularManager) {
			$rootScope.html = undefined;
			element = $compile('<text-angular name="test" ng-model="html">Test Contents</text-angular>')($rootScope);
			$rootScope.$digest();
			expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p>Test Contents</p>');
		}));

		it('should handle initial null to originalContents', inject(function ($compile, $rootScope, textAngularManager) {
			$rootScope.html = null;
			element = $compile('<text-angular name="test" ng-model="html">Test Contents</text-angular>')($rootScope);
			$rootScope.$digest();
			expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p>Test Contents</p>');
		}));

		describe('should reset', function(){
			it('from undefined to empty-string', inject(function ($compile, $rootScope, textAngularManager) {
				$rootScope.html = 'Test Content';
				element = $compile('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
				$rootScope.$digest();
				$rootScope.html = undefined;
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><br></p>');
			}));

			it('from null to empty-string', inject(function ($compile, $rootScope, textAngularManager) {
				$rootScope.html = 'Test Content';
				element = $compile('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
				$rootScope.$digest();
				$rootScope.html = null;
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><br></p>');
			}));

			it('from undefined to blank/emptystring WITH originalContents', inject(function ($compile, $rootScope, textAngularManager) {
				$rootScope.html = 'Test Content1';
				element = $compile('<text-angular name="test" ng-model="html">Test Contents2</text-angular>')($rootScope);
				$rootScope.$digest();
				$rootScope.html = undefined;
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><br></p>');
			}));

			it('from null to blank/emptystring WITH originalContents', inject(function ($compile, $rootScope, textAngularManager) {
				$rootScope.html = 'Test Content1';
				element = $compile('<text-angular name="test" ng-model="html">Test Contents2</text-angular>')($rootScope);
				$rootScope.$digest();
				$rootScope.html = null;
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><br></p>');
			}));
		});
	});

	describe('should have correct startAction and endAction functions', function(){

		it('should have rangy loaded with save-restore module', function(){
			expect(window.rangy).toBeDefined();
			expect(window.rangy.saveSelection).toBeDefined();
		});
		var sel, range;
		beforeEach(inject(function($compile, $rootScope, textAngularManager, $document){
			$rootScope.html = '<p>Lorem ipsum dolor sit amet, <i>consectetur adipisicing</i> elit, <strong>sed do eiusmod tempor incididunt</strong> ut labore et dolore magna aliqua.</p>';
			element = $compile('<text-angular name="test" ng-model="html">Test Contents2</text-angular>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('test').scope;
			// setup selection
			sel = window.rangy.getSelection();
			range = window.rangy.createRangyRange();
			range.selectNodeContents(editorScope.displayElements.text.find('p').find('strong')[0]);
			sel.setSingleRange(range);
		}));
		afterEach(function(){
			element.remove();
		});
		describe('startAction should return a function that will restore a selection', function(){
			it('should start with the correct selection', function(){
				expect(sel.getRangeAt(0).toHtml()).toBe('sed do eiusmod tempor incididunt');
			});

			it('should set _actionRunning to true', function(){
				editorScope.startAction();
				expect(editorScope._actionRunning);
			});

			it('should return a function that resets the selection', function(){
				var resetFunc = editorScope.startAction();
				expect(sel.toHtml()).toBe('sed do eiusmod tempor incididunt');
				// change selection
				var range = window.rangy.createRangyRange();
				range.selectNodeContents(editorScope.displayElements.text.find('p').find('i')[0]);
				sel.setSingleRange(range);
				sel.refresh();
				expect(sel.toHtml()).toBe('consectetur adipisicing');
				// reset selection
				resetFunc();
				sel.refresh();
				expect(sel.toHtml()).toBe('sed do eiusmod tempor incididunt');
			});
		});

		describe('endAction should remove the ability to restore selection', function(){
			it('shouldn\'t affect the selection', function(){
				editorScope.startAction();
				editorScope.endAction();
				expect(sel.toHtml()).toBe('sed do eiusmod tempor incididunt');
			});

			it('shouldn\'t restore the selection', function(){
				var resetFunc = editorScope.startAction();
				editorScope.endAction();
				var range = window.rangy.createRangyRange();
				range.selectNodeContents(editorScope.displayElements.text.find('p').find('i')[0]);
				sel.setSingleRange(range);
				sel.refresh();
				expect(sel.toHtml()).toBe('consectetur adipisicing');
				// reset selection - should do nothing now
				resetFunc();
				sel.refresh();
				expect(sel.toHtml()).toBe('consectetur adipisicing');
			});
		});
	});

	describe('Toolbar interaction functions work', function(){
		var sel, range;
		beforeEach(inject(function(taRegisterTool, taOptions, taSelectableElements){
			taSelectableElements.push('i');
			taRegisterTool('testbutton', {
				buttontext: 'reactive action',
				action: function(){
					return this.$element.attr('hit-this', 'true');
				},
				commandKeyCode: 21,
				activeState: function(){ return true; },
				onElementSelect: {
					element: 'i',
					action: function(event, element, editorScope){
						element.attr('hit-via-select', 'true');
						this.$element.attr('hit-via-select', 'true');
					}
				}
			});
			taOptions.toolbar = [
				['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote', 'testbutton'],
				['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
				['justifyLeft','justifyCenter','justifyRight','indent','outdent'],
				['html', 'insertImage', 'insertLink', 'unlink']
			];
		}));
		beforeEach(inject(function($compile, $rootScope, textAngularManager, $document){
			$rootScope.html = '<p>Lorem ipsum <u>dolor sit amet<u>, consectetur <i>adipisicing elit, sed do eiusmod tempor incididunt</i> ut labore et <a>dolore</a> magna aliqua.</p>';
			element = $compile('<text-angular name="test" ng-model="html">Test Contents2</text-angular>')($rootScope);
			$document.find('body').append(element);
			editorScope = textAngularManager.retrieveEditor('test').scope;
			textAngularManager.retrieveEditor('test').editorFunctions.focus();
			$rootScope.$digest();
			// setup selection
			sel = window.rangy.getSelection();
			range = window.rangy.createRangyRange();
			range.selectNodeContents(editorScope.displayElements.text.find('p').find('i')[0]);
			sel.setSingleRange(range);
		}));
		afterEach(inject(function(taSelectableElements){
			taSelectableElements.pop();
			element.remove();
		}));

		it('should not trigger focus out while an action is processing', inject(function($timeout){
			editorScope.displayElements.text.triggerHandler('focus');
			editorScope.$parent.$digest();
			editorScope.startAction();
			editorScope.displayElements.text.triggerHandler('blur');
			editorScope.$parent.$digest();
			$timeout.flush();
			expect(jQuery(element[0]).find('button:disabled').length).toBe(0);
		}));

		it('keypress should call sendKeyCommand', function(){
			editorScope.displayElements.text.triggerHandler('keypress', {metaKey: true, which: 21});
			editorScope.$parent.$digest();
			expect(jQuery(element[0]).find('.ta-toolbar button[name=testbutton]').attr('hit-this')).toBe('true');
		});

		describe('wrapSelection', function(){
			it('should wrap the selected text in tags', function(){
				editorScope.wrapSelection('bold');
				expect(editorScope.displayElements.text.find('p').find('b').length).toBe(1);
			});

			it('should unwrap the selected text in tags on re-call', function(){
				editorScope.wrapSelection('bold');
				editorScope.wrapSelection('bold');
				expect(editorScope.displayElements.text.find('p').find('b').length).toBe(0);
			});
		});

		describe('queryFormatBlockState', function(){
			it('should return true if formatted', function(){
				editorScope.wrapSelection("formatBlock", "<PRE>");
				expect(editorScope.queryFormatBlockState('PRE')).toBe(true);
			});
			it('should return false if un-formatted', function(){
				expect(editorScope.queryFormatBlockState('PRE')).toBe(false);
			});
		});

		describe('queryCommandState', function(){
			it('should return value if not showHtml', function(){
				editorScope.showHtml = false;
				editorScope.$parent.$digest();
				expect(editorScope.queryCommandState('bold')).not.toBe('');
			});
			it('should return empty if showHtml', function(){
				editorScope.showHtml = true;
				editorScope.$parent.$digest();
				expect(editorScope.queryCommandState('bold')).toBe('');
			});
		});

		describe('ta-element-select event', function(){
			it('fires correctly on element selector', function(){
				var triggerElement = editorScope.displayElements.text.find('i');
				triggerElement.triggerHandler('click');
				expect(triggerElement.attr('hit-via-select')).toBe('true');
			});

			it('fires correctly when filter returns true', inject(function(taTools){
				taTools.testbutton.onElementSelect.filter = function(){ return true; };
				var triggerElement = editorScope.displayElements.text.find('i');
				triggerElement.triggerHandler('click');
				expect(triggerElement.attr('hit-via-select')).toBe('true');
			}));

			it('does not fire when filter returns false', inject(function(taTools){
				taTools.testbutton.onElementSelect.filter = function(){ return false; };
				var triggerElement = editorScope.displayElements.text.find('i');
				triggerElement.triggerHandler('click');
				expect(triggerElement.attr('hit-via-select')).toBeUndefined();
			}));
		});

		describe('popover', function(){
			it('should show the popover', function(){
				editorScope.showPopover(editorScope.displayElements.text.find('p').find('i'));
				editorScope.$parent.$digest();
				expect(editorScope.displayElements.popover.hasClass('in')).toBe(true);
			});
			describe('should hide the popover', function(){
				beforeEach(inject(function($timeout){
					editorScope.showPopover(editorScope.displayElements.text.find('p').find('i'));
					editorScope.$parent.$digest();
					$timeout.flush();
					editorScope.$parent.$digest();
				}));
				it('on function call', function(){
					editorScope.hidePopover();
					editorScope.$parent.$digest();
					expect(editorScope.displayElements.popover.hasClass('in')).toBe(false);
				});
				it('on click in editor', inject(function($document){
					$document.find('body').triggerHandler('click');
					editorScope.$parent.$digest();
					expect(editorScope.displayElements.popover.hasClass('in')).toBe(false);
				}));
				it('should prevent mousedown from propagating up from popover', function(){
					var event;
					if(angular.element === jQuery){
						event = jQuery.Event('mousedown');
						editorScope.displayElements.popover.triggerHandler(event);
						editorScope.$parent.$digest();
						expect(event.isDefaultPrevented()).toBe(true);
					}else{
						var _defaultPrevented = false;
						event = {preventDefault: function(){ _defaultPrevented = true; }};
						editorScope.displayElements.popover.triggerHandler('mousedown', event);
						editorScope.$parent.$digest();
						expect(_defaultPrevented).toBe(true);
					}
				});
			});
		});

		describe('updating styles', function(){
			var iButton;
			beforeEach(function(){
				//find italics button
				iButton = element.find('button[name=italics]');
			});

			it('should be initially active when selected', function(){
				expect(iButton.hasClass('active'));
			});

			it('should change on keypress', function(){
				range.selectNodeContents(editorScope.displayElements.text.find('p').find('u')[0]);
				sel.setSingleRange(range);
				editorScope.displayElements.text.triggerHandler('keypress');
				expect(!iButton.hasClass('active'));
			});

			it('should change on keydown and stop on keyup', inject(function($timeout, $document){
				$document.hasFocus = function(){return true;};
				editorScope.displayElements.text.triggerHandler('keydown');
				range.selectNodeContents(editorScope.displayElements.text.find('p').find('u')[0]);
				sel.setSingleRange(range);
				setTimeout(function(){
					expect(!iButton.hasClass('active'));
					setTimeout(function(){
						range = window.rangy.createRangyRange();
						range.selectNodeContents(editorScope.displayElements.text.find('p').find('i')[0]);
						setTimeout(function(){
							expect(iButton.hasClass('active'));
							editorScope.displayElements.text.triggerHandler('keydown');
							setTimeout(function(){
								range.selectNodeContents(editorScope.displayElements.text.find('p').find('u')[0]);
								setTimeout(function(){
									expect(iButton.hasClass('active'));
								}, 201);
							}, 201);
						}, 201);
					}, 201);
				}, 201);
			}));

			it('should change on mouseup', function(){
				range.selectNodeContents(editorScope.displayElements.text.find('p').find('u')[0]);
				sel.setSingleRange(range);
				editorScope.displayElements.text.triggerHandler('mouseup');
				expect(!iButton.hasClass('active'));
			});
		});
	});

	describe('File Drop Event', function(){
		beforeEach(inject(function(_textAngularManager_){
			textAngularManager = _textAngularManager_;
		}));
		afterEach(inject(function($timeout){
			try{
				$timeout.flush();
			}catch(e){}
		}));

		it('should respect the function set in the attribute', inject(function($compile, $rootScope){
			$rootScope.html = '';
			var testvar = false;
			$rootScope.testhandler = function(){
				testvar = true;
			};
			element = $compile('<text-angular name="test" ta-file-drop="testhandler" ng-model="html"></text-angular>')($rootScope);
			if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			$rootScope.$digest();
			expect(testvar).toBe(true);
		}));

		it('when no attribute should use the default handler in taOptions', inject(function($compile, $rootScope, taOptions){
			$rootScope.html = '';
			var testvar = false;
			taOptions.defaultFileDropHandler = function(){
				testvar = true;
			};
			element = $compile('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
			if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			$rootScope.$digest();
			expect(testvar).toBe(true);
		}));

		it('handler not fired when no files and no errors', inject(function($compile, $rootScope, taOptions){
			$rootScope.html = '';
			var testvar = false;
			taOptions.defaultFileDropHandler = function(){
				testvar = true;
			};
			element = $compile('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
			if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {files: [], types: ['url or something']}}});
			else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {files: [], types: ['url or something']}}});
			$rootScope.$digest();
			expect(testvar).toBe(false);
			expect(function(){
				if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {}}});
				else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {}}});
			}).not.toThrow();
			expect(function(){
				if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {}});
				else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {}});
			}).not.toThrow();
		}));

		describe('check handler return values respected', function(){
			it('default inserts returned html', inject(function($compile, $rootScope, taOptions, $document){
				$rootScope.html = '';
				taOptions.defaultFileDropHandler = function(file, insertAction){
					insertAction('insertHtml', '<img/>');
					return true;
				};
				element = $compile('<text-angular name="test" ng-model="html"></text-angular>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
				if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><img><br></p>');
				element.remove();
			}));
			it('attr function inserts returned html', inject(function($compile, $rootScope, taOptions, $document){
				$rootScope.html = '';
				$rootScope.testhandler = function(file, insertAction){
					insertAction('insertHtml', '<img/>');
					return true;
				};
				element = $compile('<text-angular name="test" ta-file-drop="testhandler" ng-model="html"></text-angular>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
				if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><img><br></p>');
				element.remove();
			}));
			it('attr function overrides default', inject(function($compile, $rootScope, taOptions, $document){
				$rootScope.html = '';
				taOptions.defaultFileDropHandler = function(file, insertAction){
					insertAction('insertHtml', '<wrong/>');
					return true;
				};
				$rootScope.testhandler = function(file, insertAction){
					insertAction('insertHtml', '<img/>');
					return true;
				};
				element = $compile('<text-angular name="test" ta-file-drop="testhandler" ng-model="html"></text-angular>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
				if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><img><br></p>');
				element.remove();
			}));
			it('default inserted if attr function returns false', inject(function($compile, $rootScope, taOptions, $document){
				$rootScope.html = '';
				taOptions.defaultFileDropHandler = function(file, insertAction){
					insertAction('insertHtml', '<img/>');
					return true;
				};
				$rootScope.testhandler = function(file, insertAction){
					return false;
				};
				element = $compile('<text-angular name="test" ta-file-drop="testhandler" ng-model="html"></text-angular>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
				if(jQuery === angular.element) textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler({type: 'drop', originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
			else textAngularManager.retrieveEditor('test').scope.displayElements.text.triggerHandler('drop', {originalEvent: {dataTransfer: {files: ['test'], types: ['files']}}});
				$rootScope.$digest();
				expect(textAngularManager.retrieveEditor('test').scope.displayElements.text.html()).toBe('<p><img><br></p>');
				element.remove();
			}));
		});
	});

	describe('Multiple Editors same toolbar', function(){
		// For more info on this see the excellent writeup @ https://github.com/fraywing/textAngular/issues/112
		var element1, element2, toolbar;
		beforeEach(inject(function($compile, _$rootScope_){
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Lorem ipsum <u>dolor sit amet<u>, consectetur <i>adipisicing elit, sed do eiusmod tempor incididunt</i> ut labore et dolore magna aliqua.</p>';
			toolbar = $compile('<text-angular-toolbar name="toolbar"></text-angular-toolbar>')($rootScope);
			element1 = $compile('<text-angular name="test1" ng-model="html" ta-target-toolbars="toolbar"></text-angular>')($rootScope);
			element2 = $compile('<text-angular name="test2" ng-model="html" ta-target-toolbars="toolbar"></text-angular>')($rootScope);
			$rootScope.$digest();
		}));

		it('should re-focus on toolbar when swapping directly from editor to editor', inject(function($timeout, textAngularManager){
			textAngularManager.retrieveEditor('test1').scope.displayElements.text.triggerHandler('focus');
			$rootScope.$digest();
			expect(jQuery(toolbar[0]).find('button:not(:disabled)').length).toBe(28);
			textAngularManager.retrieveEditor('test2').scope.displayElements.text.triggerHandler('focus');
			$rootScope.$digest();
			$timeout.flush();
			// expect none to be disabled
			expect(jQuery(toolbar[0]).find('button:not(:disabled)').length).toBe(28);
		}));
	});



	describe('handles the ta-paste event correctly', function(){
		beforeEach(inject(function(_textAngularManager_){
			textAngularManager = _textAngularManager_;
		}));
		it('allows conversion of html', inject(function($window, _$rootScope_, $compile, $document, $timeout){
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Contents</p>';
			$rootScope.converter = function(html){
				expect(html).toBe('<font>Test 4 Content</font>');
				return '<b>Changed Content</b>';
			};
			element = $compile('<text-angular name="testpaste" ta-paste="converter($html)" ng-model="html"></text-angular>')($rootScope);
			$document.find('body').append(element);
			element = textAngularManager.retrieveEditor('testpaste').scope.displayElements.text;
			$rootScope.$digest();
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNodeContents(element.find('p')[0]);
			sel.setSingleRange(range);
			triggerEvent('paste', element, {originalEvent: {clipboardData: {types: ['text/html'], getData: function(){ return '<font>Test 4 Content</font>';} }}});
			$timeout.flush();
			$rootScope.$digest();
			expect($rootScope.html).toBe('<p><b>Changed Content</b></p>');
		}));
	});
});
