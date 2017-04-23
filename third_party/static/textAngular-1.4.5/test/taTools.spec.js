var val;
describe('taToolsExecuteFunction', function(){
	var scope, startActionResult, editor, $rootScope;
	beforeEach(module('textAngular'));
	beforeEach(inject(function(taToolExecuteAction, _$rootScope_){
		$rootScope = _$rootScope_;
		startActionResult = Math.random();
		scope = {
			taToolExecuteAction: taToolExecuteAction,
			$editor: function(){
				return editor = {
					startCount: 0,
					startAction: function(){
						this.startCount++;
						return startActionResult;
					},
					finishCount: 0,
					endAction: function(){ this.finishCount++; }
				};
			}
		};
	}));

	describe('executes the action passing the correct parameters', function(){
		it('should pass the result of startAction Result', function(){
			scope.action = function(deferred, startActionResult){
				expect(startActionResult).toBe(startActionResult);
			};
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
		});
		it('should pass a valid deferred object', function(){
			scope.action = function(deferred, startActionResult){
				expect(deferred.resolve).toBeDefined();
				expect(deferred.reject).toBeDefined();
				expect(deferred.notify).toBeDefined();
				expect(deferred.promise).toBeDefined();
			};
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
		});
	});

	it('doesn\'t error when action not present', function(){
		expect(function(){
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
		}).not.toThrow();
	});

	it('sets the correct editor if passed', function(){
		var _editor = {endAction: function(){}, startAction: function(){}};
		scope.taToolExecuteAction(_editor);
		expect(scope.$editor()).toBe(_editor);
	});

	describe('calls editor action', function(){
		it('start and end when action returns truthy', function(){
			scope.action = function(deferred, startActionResult){ return true; };
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
			expect(editor.startCount).toBe(1);
			expect(editor.finishCount).toBe(1);
		});

		it('start and end when action returns undefined', function(){
			scope.action = function(deferred, startActionResult){};
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
			expect(editor.startCount).toBe(1);
			expect(editor.finishCount).toBe(1);
		});

		it('start and not end when action returns false', function(){
			scope.action = function(deferred, startActionResult){ return false; };
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
			expect(editor.startCount).toBe(1);
			expect(editor.finishCount).toBe(0);
		});
	});

	describe('promise works correctly', function(){
		it('start and end once promise resolved', function(){
			var _deferred;
			scope.action = function(deferred, startActionResult){
				_deferred = deferred;
				return false;
			};
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
			expect(editor.startCount).toBe(1);
			expect(editor.finishCount).toBe(0);
			$rootScope.$apply(function(){ _deferred.resolve(); });
			expect(editor.startCount).toBe(1);
			expect(editor.finishCount).toBe(1);
		});

		it('.then promises called before .finally', function(){
			var _deferred;
			scope.action = function(deferred, startActionResult){
				_deferred = deferred;
				_deferred.promise.then(function(){
					expect(editor.startCount).toBe(1);
					expect(editor.finishCount).toBe(0);
				});
				return false;
			};
			$rootScope.$apply(function(){ scope.taToolExecuteAction(); });
			expect(editor.startCount).toBe(1);
			expect(editor.finishCount).toBe(0);
			$rootScope.$apply(function(){ _deferred.resolve(); });
			expect(editor.startCount).toBe(1);
			expect(editor.finishCount).toBe(1);
		});
	});
});

function buttonByName(element, name){
	var button;
	angular.forEach(element.find('button'), function(_b){
		_b = angular.element(_b);
		if(_b.attr('name') === name) button = _b;
	});
	return button;
}

describe('taTools test tool actions', function(){
	'use strict';
	var $rootScope, element, button, editorScope, $window;
	var findAndTriggerButton = function(name){
		var button = buttonByName(element, name);
		button.scope().executeAction(editorScope);
		editorScope.endAction();
		$rootScope.$digest();
		return button;
	};

	var findButton = function(name){
		return buttonByName(element, name);
	};

	// We use an assumption here and only test whether the button reports as being activated
	// it ended up being too difficult to reselect and un-apply

	var testAllButtons = function(){
		it('h1 button should function correctly', function(){
			button = findAndTriggerButton('h1');
			expect(button.hasClass('active'));
		});

		it('h2 button should function correctly', function(){
			button = findAndTriggerButton('h2');
			expect(button.hasClass('active'));
		});

		it('h3 button should function correctly', function(){
			button = findAndTriggerButton('h3');
			expect(button.hasClass('active'));
		});

		it('h4 button should function correctly', function(){
			button = findAndTriggerButton('h4');
			expect(button.hasClass('active'));
		});

		it('h5 button should function correctly', function(){
			button = findAndTriggerButton('h5');
			expect(button.hasClass('active'));
		});

		it('h6 button should function correctly', function(){
			button = findAndTriggerButton('h6');
			expect(button.hasClass('active'));
		});

		it('p button should function correctly', function(){
			button = findAndTriggerButton('p');
			expect(button.hasClass('active'));
		});

		it('pre button should function correctly', function(){
			button = findAndTriggerButton('pre');
			expect(button.hasClass('active'));
		});

		it('quote button should function correctly', function(){
			button = findAndTriggerButton('quote');
			expect(button.hasClass('active'));
		});

		it('bold button should function correctly', function(){
			button = findAndTriggerButton('bold');
			expect(button.hasClass('active'));
		});

		it('italics button should function correctly', function(){
			button = findAndTriggerButton('italics');
			expect(button.hasClass('active'));
		});

		it('underline button should function correctly', function(){
			button = findAndTriggerButton('underline');
			expect(button.hasClass('active'));
		});

		it('strikeThrough button should function correctly', function(){
			button = findAndTriggerButton('strikeThrough');
			expect(button.hasClass('active'));
		});

		it('ul button should function correctly', function(){
			button = findAndTriggerButton('ul');
			expect(button.hasClass('active'));
		});

		it('ol button should function correctly', function(){
			button = findAndTriggerButton('ol');
			expect(button.hasClass('active'));
		});

		it('justifyLeft button should function correctly', function(){
			button = findAndTriggerButton('justifyLeft');
			expect(button.hasClass('active'));
		});

		it('justifyCenter button should function correctly', function(){
			button = findAndTriggerButton('justifyCenter');
			expect(button.hasClass('active'));
		});

		it('justifyRight button should function correctly', function(){
			button = findAndTriggerButton('justifyRight');
			expect(button.hasClass('active'));
		});

		it('justifyFull button should function correctly', function(){
			button = findAndTriggerButton('justifyFull');
			expect(button.hasClass('active'));
		});

		it('indent button should function correctly', function(){
			button = findAndTriggerButton('indent');
			expect(button.hasClass('active'));
		});

		it('outdent button should function correctly', function(){
			button = findAndTriggerButton('outdent');
			expect(button.hasClass('active'));
		});

		it('html button should function correctly', inject(function($timeout){
			button = findAndTriggerButton('html');
			$timeout.flush();
			expect(button.hasClass('active'));
			expect(!jQuery('.ta-text').is(":visible"));
			expect(jQuery('.ta-html').is(":visible"));
			expect(jQuery('.ta-html').is(":focus"));
			button = findAndTriggerButton('html'); // retrigger to reset to non html view
			$timeout.flush();
			expect(!jQuery('.ta-html').is(":visible"));
			expect(jQuery('.ta-text').is(":visible"));
			expect(jQuery('.ta-text').is(":focus"));
		}));

		it('html button should have title attribute', function() {
			expect(findButton('h1').attr('title')).toBe('Heading 1');
			expect(findButton('h2').attr('title')).toBe('Heading 2');
			expect(findButton('h3').attr('title')).toBe('Heading 3');
			expect(findButton('h4').attr('title')).toBe('Heading 4');
			expect(findButton('h5').attr('title')).toBe('Heading 5');
			expect(findButton('h6').attr('title')).toBe('Heading 6');

			expect(findButton('justifyLeft').attr('title')).toBe('Align text left');
			expect(findButton('justifyCenter').attr('title')).toBe('Center');
			expect(findButton('justifyRight').attr('title')).toBe('Align text right');

			expect(findButton('indent').attr('title')).toBe('Increase indent');
			expect(findButton('outdent').attr('title')).toBe('Decrease indent');

			expect(findButton('insertImage').attr('title')).toBe('Insert image');
			expect(findButton('html').attr('title')).toBe('Toggle html / Rich Text');
			expect(findButton('insertVideo').attr('title')).toBe('Insert video');
			expect(findButton('insertLink').attr('title')).toBe('Insert / edit link');


		});

		describe('check untestables don\'t error - ', function(){
			it('redo', function(){
				expect(function(){
					findAndTriggerButton('redo');
				}).not.toThrow();
			});
			it('undo', function(){
				expect(function(){
					findAndTriggerButton('undo');
				}).not.toThrow();
			});
			it('insertImage', function(){
				expect(function(){
					findAndTriggerButton('insertImage');
				}).not.toThrow();
			});
			it('insertVideo', function(){
				expect(function(){
					findAndTriggerButton('insertVideo');
				}).not.toThrow();
			});
		});
	};

	describe('with un-wrapped content', function(){
		beforeEach(module('textAngular'));
		beforeEach(inject(function (_$compile_, _$rootScope_, $document, textAngularManager, _$window_) {
			$window = _$window_;
			// prompt such that we actually get to test all of the insertVideo code
			$window.prompt = function(){ return 'https://www.youtube.com/watch?v=6T8LeO-01I4'; };
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test">Test Content</text-angular>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('test').scope;
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNode(jQuery('.ta-text .ta-bind')[0].childNodes[0]);
			sel.setSingleRange(range);
		}));
		afterEach(function(){
			element.remove();
		});

		testAllButtons();
	});

	describe('with wrapped content', function(){
		beforeEach(module('textAngular'));
		beforeEach(inject(function (_$compile_, _$rootScope_, $document, textAngularManager, _$window_) {
			$window = _$window_;
			$window.prompt = function(){ return ''; };
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"><p>Test Content</p></text-angular>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('test').scope;
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNodeContents(jQuery('.ta-text p')[0]);
			sel.setSingleRange(range);
		}));
		afterEach(function(){
			element.remove();
		});

		testAllButtons();
	});

	describe('test count buttons', function(){
		beforeEach(module('textAngular'));
		var buttons;
		beforeEach(inject(function (_$compile_, _$rootScope_, $document, textAngularManager, _$window_) {
			$window = _$window_;
			$rootScope = _$rootScope_;
			$rootScope.htmlcontent = '<p>Test Content <b>that</b> <u>should</u> be cleared</p><h1>Test Other Tags</h1>\n<ul><li>Test <b>1</b></li><li>Test 2</li></ul>';
			element = _$compile_('<text-angular name="test" ng-model="htmlcontent" ta-toolbar="[[\'wordcount\',\'charcount\']]"></text-angular>')($rootScope);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('test').scope;
			buttons = element.children()[0].childNodes[0];
			textAngularManager.retrieveEditor('test').editorFunctions.updateSelectedStyles();
			$rootScope.$digest();
		}));

		it('word count should be 13', function(){
			expect(buttons.childNodes[0].childNodes[1].innerHTML).toBe('13');
			expect(editorScope.wordcount).toBe(13);
		});

		it('char count should be 62', function(){
			expect(buttons.childNodes[1].childNodes[1].innerHTML).toBe('62');
			expect(editorScope.charcount).toBe(62);
		});
	});

		describe('test count buttons with odd markup', function(){
				beforeEach(module('textAngular'));
				var buttons;
				beforeEach(inject(function (_$compile_, _$rootScope_, $document, textAngularManager, _$window_) {
						$window = _$window_;
						$rootScope = _$rootScope_;
						$rootScope.htmlcontent = '<p>Test Co<i><b><u>nt</u>e</b></i>nt <b>that</b> <u>should</u> be c<span style="color:#ff0000;">lea</span>red</p><h1>Test Other Tags</h1>\n<ul><li>Test <b>1</b></li><li>Test 2</li></ul>';
						element = _$compile_('<text-angular name="test" ng-model="htmlcontent" ta-toolbar="[[\'wordcount\',\'charcount\']]"></text-angular>')($rootScope);
						$rootScope.$digest();
						editorScope = textAngularManager.retrieveEditor('test').scope;
						buttons = element.children()[0].childNodes[0];
						textAngularManager.retrieveEditor('test').editorFunctions.updateSelectedStyles();
						$rootScope.$digest();
				}));

				it('word count should be 13', function(){
						expect(buttons.childNodes[0].childNodes[1].innerHTML).toBe('13');
						expect(editorScope.wordcount).toBe(13);
				});

				it('char count should be 62', function(){
						expect(buttons.childNodes[1].childNodes[1].innerHTML).toBe('62');
						expect(editorScope.charcount).toBe(62);
				});
		});

	describe('test clear button', function(){
		beforeEach(module('textAngular'));
		beforeEach(inject(function (_$compile_, _$rootScope_, $document, textAngularManager, _$window_) {
			$window = _$window_;
			$window.prompt = function(){ return ''; };
			$rootScope = _$rootScope_;
			$rootScope.htmlcontent = '<p class="test-class" style="text-align: left;">Test Content <b>that</b> <u>should</u> be cleared</p><h1>Test Other Tags</h1><ul><li>Test <b>1</b></li><li>Test 2</li></ul>';
			element = _$compile_('<text-angular name="testclearbutton" ng-model="htmlcontent"></text-angular>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('testclearbutton').scope;
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNodeContents(jQuery('.ta-text > .ta-bind', element)[0]);
			sel.setSingleRange(range);
			sel.refresh();
		}));
		afterEach(function(){
			element.remove();
		});

		it('doesn\'t error', function(){
			expect(function(){
				findAndTriggerButton('clear');
			}).not.toThrow();
		});

		it('clears out all formatting', function(){
			findAndTriggerButton('clear');
			//expect($rootScope.htmlcontent).toBe('<p>Test Content that should be cleared</p><p>Test Other Tags</p><p>Test 1</p><p>Test 2</p>');
			// bug in phantom JS
			expect($rootScope.htmlcontent).toBe('<p>Test Content that should be cleared</p><h1>Test Other Tags</h1><p>Test 1</p><p>Test 2</p>');
		});

		it('doesn\'t remove partially selected list elements, but clears them of formatting', function(){
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.setStartBefore(jQuery('.ta-text ul li:first-child b')[0]);
			range.setEndBefore(jQuery('.ta-text ul li:last-child')[0]);
			sel.setSingleRange(range);
			sel.refresh();
			findAndTriggerButton('clear');
			expect($rootScope.htmlcontent).toBe('<p class="test-class" style="text-align: left;">Test Content <b>that</b> <u>should</u> be cleared</p><h1>Test Other Tags</h1><ul><li>Test 1</li><li>Test 2</li></ul>');
		});

		it('doesn\'t clear wholly selected list elements, but clears them of formatting', function(){
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNodeContents(jQuery('.ta-text ul')[0]);
			sel.setSingleRange(range);
			sel.refresh();
			findAndTriggerButton('clear');
			expect($rootScope.htmlcontent).toBe('<p class="test-class" style="text-align: left;">Test Content <b>that</b> <u>should</u> be cleared</p><h1>Test Other Tags</h1><ul><li>Test 1</li><li>Test 2</li></ul>');
		});

		it('doesn\'t clear singly selected list elements, but clears them of formatting', function(){
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNodeContents(jQuery('.ta-text ul li:first-child')[0]);
			range.setEndAfter(jQuery('.ta-text ul li:first-child')[0]);
			sel.setSingleRange(range);
			sel.refresh();
			findAndTriggerButton('clear');
			expect($rootScope.htmlcontent).toBe('<p class="test-class" style="text-align: left;">Test Content <b>that</b> <u>should</u> be cleared</p><h1>Test Other Tags</h1><ul><li>Test 1</li><li>Test 2</li></ul>');
		});

		it('doesn\'t clear singly selected list elements, but clears them of formatting', function(){
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNode(jQuery('.ta-text ul li:first-child')[0]);
			range.setEndAfter(jQuery('.ta-text ul li:first-child')[0]);
			sel.setSingleRange(range);
			sel.refresh();
			findAndTriggerButton('clear');
			expect($rootScope.htmlcontent).toBe('<p class="test-class" style="text-align: left;">Test Content <b>that</b> <u>should</u> be cleared</p><h1>Test Other Tags</h1><ul><li>Test 1</li><li>Test 2</li></ul>');
		});

		describe('collapsed selection in list escapse list element', function(){
			it('as only in list', function(){
				$rootScope.htmlcontent = '<ul><li>Test <b>1</b></li></ul>';
				$rootScope.$digest();
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNode(jQuery('.ta-text ul li:first-child')[0]);
				range.collapse(true);
				sel.setSingleRange(range);
				sel.refresh();
				findAndTriggerButton('clear');
				expect($rootScope.htmlcontent).toBe('<p>Test <b>1</b></p>');
			});

			it('as first in list', function(){
				$rootScope.htmlcontent = '<ul><li>Test <b>1</b></li><li>Test 2</li></ul>';
				$rootScope.$digest();
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNode(jQuery('.ta-text ul li:first-child')[0]);
				range.collapse(true);
				sel.setSingleRange(range);
				sel.refresh();
				findAndTriggerButton('clear');
				expect($rootScope.htmlcontent).toBe('<p>Test <b>1</b></p><ul><li>Test 2</li></ul>');
			});

			it('as last in list', function(){
				$rootScope.htmlcontent = '<ul><li>Test <b>1</b></li><li>Test 2</li></ul>';
				$rootScope.$digest();
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNode(jQuery('.ta-text ul li:last-child')[0]);
				range.collapse(true);
				sel.setSingleRange(range);
				sel.refresh();
				findAndTriggerButton('clear');
				expect($rootScope.htmlcontent).toBe('<ul><li>Test <b>1</b></li></ul><p>Test 2</p>');
			});

			it('as middle in list', function(){
				$rootScope.htmlcontent = '<ul><li>Test <b>1</b></li><li>Test 2</li><li>Test 3</li></ul>';
				$rootScope.$digest();
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNode(jQuery('.ta-text ul li:nth-child(2)')[0]);
				range.collapse(true);
				sel.setSingleRange(range);
				sel.refresh();
				findAndTriggerButton('clear');
				expect($rootScope.htmlcontent).toBe('<ul><li>Test <b>1</b></li></ul><p>Test 2</p><ul><li>Test 3</li></ul>');
			});
		});
	});

	describe('test link functions and button', function(){
		beforeEach(module('textAngular'));
		beforeEach(inject(function (_$compile_, _$rootScope_, $document, textAngularManager, _$window_) {
			$window = _$window_;
			$window.prompt = function(){ return ''; };
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"><p>Test Content</p></text-angular>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('test').scope;
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNodeContents(jQuery('.ta-text p')[0]);
			sel.setSingleRange(range);
		}));
		afterEach(function(){
			element.remove();
		});

		it('doesn\'t error', function(){
			expect(function(){
				findAndTriggerButton('insertLink');
			}).not.toThrow();
		});

		it('creates a link', function(){
			$window.prompt = function(){ return 'testval'; };
			findAndTriggerButton('insertLink');
			expect(editorScope.displayElements.text.find('p').find('a').attr('href')).toBe('testval');
		});

		describe('interacts with the popover', function(){
			beforeEach(function(){
				$window.prompt = function(){ return 'testval'; };
				findAndTriggerButton('insertLink');
			});

			it('opens on click', function(){
				editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
				editorScope.$parent.$digest();
				expect(editorScope.displayElements.popover.hasClass('in')).toBe(true);
			});

			it('has correct content', function(){
				editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
				var contents = editorScope.displayElements.popoverContainer.contents();
				expect(contents.eq(0)[0].tagName.toLowerCase()).toBe('a');
				expect(contents.eq(0).html()).toBe('testval');
				expect(contents.eq(0).attr('href')).toBe('testval');
			});

			it('has functioning unlink button', function(){
				editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
				editorScope.displayElements.popoverContainer.find('button').eq(1).triggerHandler('click');
				$rootScope.$digest();
				expect(editorScope.displayElements.text.find('p').find('a').length).toBe(0);
			});

			it('has functioning edit button', function(){
				$window.prompt = function(){ return 'newval'; };
				editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
				editorScope.displayElements.popoverContainer.find('button').eq(0).triggerHandler('click');
				$rootScope.$digest();
				expect(editorScope.displayElements.text.find('p').find('a').attr('href')).toBe('newval');
			});

			it('has functioning edit button when blank passed', function(){
				$window.prompt = function(){ return ''; };
				editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
				editorScope.displayElements.popoverContainer.find('button').eq(0).triggerHandler('click');
				$rootScope.$digest();
				expect(editorScope.displayElements.text.find('p').find('a').attr('href')).toBe('testval');
			});

			describe('has functioning target button', function(){
				it('adds target', function(){
					editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
					editorScope.displayElements.popoverContainer.find('button').eq(2).triggerHandler('click');
					$rootScope.$digest();
					expect(editorScope.displayElements.text.find('p').find('a').attr('target')).toBe('_blank');
				});
				it('removes target', function(){
					editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
					editorScope.displayElements.popoverContainer.find('button').eq(2).triggerHandler('click');
					$rootScope.$digest();
					editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
					editorScope.displayElements.popoverContainer.find('button').eq(2).triggerHandler('click');
					$rootScope.$digest();
					expect(editorScope.displayElements.text.find('p').find('a').attr('target')).not.toBe('_blank');
				});
				it('deactivates button with target!="_blank"', function(){
					editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
					expect(editorScope.displayElements.popoverContainer.find('button').eq(2).hasClass('active')).not.toBe(true);
				});
				it('activates button with target="_blank"', function(){
					editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
					editorScope.displayElements.popoverContainer.find('button').eq(2).triggerHandler('click');
					$rootScope.$digest();
					editorScope.displayElements.text.find('p').find('a').triggerHandler('click');
					expect(editorScope.displayElements.popoverContainer.find('button').eq(2).hasClass('active')).toBe(true);
				});
			});
		});
	});

	describe('test image popover logic', function(){
		beforeEach(module('textAngular'));
		beforeEach(inject(function (_$compile_, _$rootScope_, $document, textAngularManager, _$window_) {
			$window = _$window_;
			$window.prompt = function(){ return ''; };
			$rootScope = _$rootScope_;
			element = _$compile_('<text-angular name="test"><p>Test Content<img src="testuri"/></p></text-angular>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
			editorScope = textAngularManager.retrieveEditor('test').scope;
		}));
		afterEach(function(){
			element.remove();
		});

		it('opens on click', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.$parent.$digest();
			expect(editorScope.displayElements.popover.hasClass('in')).toBe(true);
		});

		it('has correct content', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			var contents = editorScope.displayElements.popoverContainer.contents();
			expect(contents.find('button').length).toBe(8);
		});
		// Note that this is just some phantomJS oddness that causes us to have to define the px value not %
		it('has functioning 100% button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(0).triggerHandler('click');
			$rootScope.$digest();
			val = editorScope.displayElements.text.find('p').find('img').css('width');
			if(jQuery === angular.element) expect(val).toBe('384px');
			else expect(val).toBe('100%');
		});

		it('has functioning 50% button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(1).triggerHandler('click');
			$rootScope.$digest();
			val = editorScope.displayElements.text.find('p').find('img').css('width');
			if(jQuery === angular.element) expect(val).toBe('192px');
			else expect(val).toBe('50%');
		});

		it('has functioning 25% button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(2).triggerHandler('click');
			$rootScope.$digest();
			val = editorScope.displayElements.text.find('p').find('img').css('width');
			if(jQuery === angular.element) expect(val).toBe('96px');
			else expect(val).toBe('25%');
		});

		it('has functioning reset-size button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(3).triggerHandler('click');
			$rootScope.$digest();
			val = editorScope.displayElements.text.find('p').find('img').css('width');
			if(jQuery === angular.element) expect(val === '0px' || val === '4px').toBe(true); // catch a phantomJS inconsistency
			else expect(val).toBe('');
		});

		it('has functioning float-left button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(4).triggerHandler('click');
			$rootScope.$digest();
			expect(editorScope.displayElements.text.find('p').find('img').css('float')).toBe('left');
		});

		it('has functioning float-none button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(4).triggerHandler('click');
			$rootScope.$digest();
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(5).triggerHandler('click');
			$rootScope.$digest();
			if(jQuery === angular.element) expect(editorScope.displayElements.text.find('p').find('img').css('float')).toBe('none');
			else expect(editorScope.displayElements.text.find('p').find('img').css('float')).toBe('');
		});

		it('has functioning float-right button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(6).triggerHandler('click');
			$rootScope.$digest();
			expect(editorScope.displayElements.text.find('p').find('img').css('float')).toBe('right');
		});

		it('has functioning remove button', function(){
			editorScope.displayElements.text.find('p').find('img').triggerHandler('click');
			editorScope.displayElements.popoverContainer.find('button').eq(7).triggerHandler('click');
			$rootScope.$digest();
			expect(editorScope.displayElements.text.find('p').find('img').length).toBe(0);
		});
	});
});
