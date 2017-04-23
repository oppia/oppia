describe('taBind.taReadOnly', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	var $rootScope;
	
	describe('should respect taReadonly value', function () {
		describe('initially true', function () {
			it('as a textarea', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<textarea ta-bind ta-readonly="readonly" ng-model="html"></textarea>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('disabled')).toBe('disabled');
			}));
			it('as an input', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<input ta-bind ta-readonly="readonly" ng-model="html"/>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('disabled')).toBe('disabled');
			}));
			it('as an editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).not.toBeDefined();
			}));
			it('as an un-editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<div ta-bind ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).not.toBeDefined();
			}));
			it('has the .ta-readonly class', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.hasClass('ta-readonly')).toBe(true);
			}));
		});

		describe('initially false', function () {
			it('as a textarea', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<textarea ta-bind ta-readonly="readonly" ng-model="html"></textarea>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('disabled')).not.toBeDefined();
			}));
			it('as an input', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<input ta-bind ta-readonly="readonly" ng-model="html"/>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('disabled')).not.toBeDefined();
			}));
			it('as an editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).toBe('true');
			}));
			it('as an un-editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<div ta-bind ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).not.toBeDefined();
			}));
			it('does not have .ta-readonly class', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				expect(element.hasClass('ta-readonly')).toBe(false);
			}));
		});


		describe('changed to true', function () {
			it('as a textarea', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<textarea ta-bind ta-readonly="readonly" ng-model="html"></textarea>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = true;
				_$rootScope_.$digest();
				expect(element.attr('disabled')).toBe('disabled');
			}));
			it('as an input', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<input ta-bind ta-readonly="readonly" ng-model="html"/>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = true;
				_$rootScope_.$digest();
				expect(element.attr('disabled')).toBe('disabled');
			}));
			it('as an editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = true;
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).not.toBeDefined();
			}));
			it('as an un-editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<div ta-bind ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = true;
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).not.toBeDefined();
			}));
			it('adds the .ta-readonly class', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = false;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = true;
				_$rootScope_.$digest();
				expect(element.hasClass('ta-readonly')).toBe(true);
			}));
		});

		describe('changed to false', function () {
			it('as a textarea', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<textarea ta-bind ta-readonly="readonly" ng-model="html"></textarea>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = false;
				_$rootScope_.$digest();
				expect(element.attr('disabled')).not.toBeDefined();
			}));
			it('as an input', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<input ta-bind ta-readonly="readonly" ng-model="html"/>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = false;
				_$rootScope_.$digest();
				expect(element.attr('disabled')).not.toBeDefined();
			}));
			it('as an editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = false;
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).toBe('true');
			}));
			it('as an un-editable div', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<div ta-bind ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = false;
				_$rootScope_.$digest();
				expect(element.attr('contenteditable')).not.toBeDefined();
			}));
			it('removes the .ta-readonly class', inject(function (_$compile_, _$rootScope_) {
				_$rootScope_.html = '<p>Test Contents</p>';
				_$rootScope_.readonly = true;
				var element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')(_$rootScope_);
				_$rootScope_.$digest();
				_$rootScope_.readonly = false;
				_$rootScope_.$digest();
				expect(element.hasClass('ta-readonly')).toBe(false);
			}));
		});

		describe('when true don\'t update model', function () {
			describe('from cut and paste events', function () {
				describe('on textarea', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<textarea ta-bind ta-readonly="readonly" ng-model="html"></textarea>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model from paste', inject(function($timeout) {
						element.val('<div>Test 2 Content</div>');
						element.triggerHandler('paste');
						$rootScope.$digest();
						$timeout.flush();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					}));

					it('should not update model from cut', function () {
						element.val('<div>Test 2 Content</div>');
						element.triggerHandler('cut');
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});

				describe('on input', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<input ta-bind ta-readonly="readonly" ng-model="html"/>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model from paste', inject(function ($timeout) {
						element.val('<div>Test 2 Content</div>');
						element.triggerHandler('paste');
						$rootScope.$digest();
						$timeout.flush();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					}));

					it('should not update model from cut', function () {
						element.val('<div>Test 2 Content</div>');
						element.triggerHandler('cut');
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});

				describe('on editable div', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model from paste', inject(function ($timeout) {
						element.html('<div>Test 2 Content</div>');
						element.triggerHandler('paste');
						$rootScope.$digest();
						$timeout.flush();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					}));

					it('should not update model from cut', function () {
						element.html('<div>Test 2 Content</div>');
						element.triggerHandler('cut');
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});
			});

			describe('from updateTaBind function', function () {
				describe('on textarea', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<textarea ta-bind ta-readonly="readonly" ng-model="html"></textarea>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model', function () {
						element.val('<div>Test 2 Content</div>');
						$rootScope.updateTaBind();
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});

				describe('on input', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<input ta-bind ta-readonly="readonly" ng-model="html"/>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model', function () {
						element.val('<div>Test 2 Content</div>');
						$rootScope.updateTaBind();
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});

				describe('on editable div', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model', function () {
						element.html('<div>Test 2 Content</div>');
						$rootScope.updateTaBind();
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});
			});

			describe('from blur function', function () {
				describe('on textarea', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<textarea ta-bind ta-readonly="readonly" ng-model="html"></textarea>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model', function () {
						element.val('<div>Test 2 Content</div>');
						element.triggerHandler('blur');
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});

				describe('on input', function () {
					var $rootScope, element;
					beforeEach(inject(function (_$compile_, _$rootScope_) {
						$rootScope = _$rootScope_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<input ta-bind ta-readonly="readonly" ng-model="html"/>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model', function () {
						element.val('<div>Test 2 Content</div>');
						element.triggerHandler('blur');
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});
			});

			describe('from keyup function', function () {
				describe('on editable div', function () {
					var $rootScope, element, $timeout;
					beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_) {
						$rootScope = _$rootScope_;
						$timeout = _$timeout_;
						$rootScope.html = '<p>Test Contents</p>';
						$rootScope.readonly = true;
						element = _$compile_('<div ta-bind contenteditable="true" ta-readonly="readonly" ng-model="html"></div>')($rootScope);
						$rootScope.$digest();
					}));

					it('should not update model', function () {
						element.html('<div>Test 2 Content</div>');
						element.triggerHandler('keyup');
						$rootScope.$digest();
						expect($rootScope.html).toBe('<p>Test Contents</p>');
					});
				});
			});
		});
	});
});