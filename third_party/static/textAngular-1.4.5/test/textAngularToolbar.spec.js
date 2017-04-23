describe('textAngularToolbar', function(){
	'use strict';
	beforeEach(module('textAngular'));
	beforeEach(inject(function(taRegisterTool, taOptions){
		// add a tool that is ALLWAYS active
		taRegisterTool('active', {
			buttontext: 'Allways Active',
			action: function(){
				return this.$editor().wrapSelection("formatBlock", "<P>");
			},
			activeState: function(){ return true; }
		});
		taOptions.toolbar = [
			['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote', 'active'],
			['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
			['justifyLeft','justifyCenter','justifyRight','indent','outdent'],
			['html', 'insertImage', 'insertLink', 'unlink']
		];
	}));
	describe('initiation', function(){
		describe('requires a name attribute', function(){
			it('errors when missing', inject(function($rootScope, $compile){
				expect(function(){
					$compile('<text-angular-toolbar></text-angular-toolbar>')($rootScope);
				}).toThrow('textAngular Error: A toolbar requires a name');
			}));
		});
		
		describe('respects the taToolbar attribute compiled string', function(){
			it('should output the correct toolbar', inject(function($rootScope, $compile){
				var element = $compile('<text-angular-toolbar name="test" ta-toolbar="[[\'h1\',\'h2\',\'h3\',\'h4\',\'h5\',\'h6\']]"></text-angular-toolbar>')($rootScope);
				expect(jQuery('button', element[0]).length).toBe(6);
			}));
			
			it('via text-angular should output the correct toolbar', inject(function($rootScope, $compile){
				var element = $compile('<text-angular name="test" ta-toolbar="[[\'h1\',\'h2\',\'h3\',\'h4\',\'h5\',\'h6\']]"></text-angular>')($rootScope);
				expect(jQuery('button', element[0]).length).toBe(6);
			}));
		});
		
		describe('respects the taToolbar attribute variable name', function(){
			it('should output the correct toolbar', inject(function($rootScope, $compile){
				$rootScope.toolbar = [['h1','h2','h3','h4','h5','h6']];
				var element = $compile('<text-angular-toolbar name="test" ta-toolbar="toolbar"></text-angular-toolbar>')($rootScope);
				expect(jQuery('button', element[0]).length).toBe(6);
			}));
			
			it('via text-angular should output the correct toolbar', inject(function($rootScope, $compile){
				$rootScope.toolbar = [['h1','h2','h3','h4','h5','h6']];
				var element = $compile('<text-angular name="test" ta-toolbar="toolbar"></text-angular>')($rootScope);
				expect(jQuery('button', element[0]).length).toBe(6);
			}));
		});
		
		describe('respects the Class attribute taToolbarClass', function(){
			it('on the toolbar', inject(function($rootScope, $compile){
				var element = $compile('<text-angular-toolbar name="test" ta-toolbar-class="test-class"></text-angular-toolbar>')($rootScope);
				expect(jQuery('.test-class', element[0]).length).toBe(0);
				expect(jQuery(element).hasClass('test-class'));
			}));
			
			it('via text-angular on the toolbar', inject(function($rootScope, $compile){
				var element = $compile('<text-angular name="test" ta-toolbar-class="test-class"></text-angular>')($rootScope);
				expect(jQuery('.test-class', element[0]).length).toBe(1);
			}));
		});
			
		describe('respects the Class attribute taToolbarGroupClass', function(){
			it('on the toolbar group', inject(function($rootScope, $compile){
				var element = $compile('<text-angular-toolbar name="test" ta-toolbar-group-class="test-class"></text-angular-toolbar>')($rootScope);
				expect(jQuery('.test-class', element[0]).length).toBe(4);
			}));
			
			it('via text-angular on the toolbar group', inject(function($rootScope, $compile){
				var element = $compile('<text-angular name="test" ta-toolbar-group-class="test-class"></text-angular>')($rootScope);
				expect(jQuery('.test-class', element[0]).length).toBe(4);
			}));
		});
		
		describe('respects the Class attribute taToolbarButtonClass', function(){
			it('adds to all buttons', inject(function($rootScope, $compile){
				var element = $compile('<text-angular-toolbar name="test" ta-toolbar-button-class="test-class"></text-angular-toolbar>')($rootScope);
				expect(jQuery('button:not(.test-class)', element[0]).length).toBe(0);
			}));
			
			it('via text-angular adds to all buttons', inject(function($rootScope, $compile){
				var element = $compile('<text-angular name="test" ta-toolbar-button-class="test-class"></text-angular>')($rootScope);
				expect(jQuery('button:not(.test-class)', element[0]).length).toBe(0);
			}));
		});
		
		describe('respects the Class attribute taToolbarActiveButtonClass', function(){
			it('on an active button', inject(function($rootScope, $compile, textAngularManager){
				var element = $compile('<text-angular-toolbar name="test" ta-toolbar-active-button-class="test-class"></text-angular-toolbar>')($rootScope);
				var toolbarScope = textAngularManager.retrieveToolbar('test');
				toolbarScope.disabled = false;
				toolbarScope.focussed = true;
				angular.forEach(toolbarScope.tools, function(toolScope){
					if(toolScope.activeState){
						toolScope.active = toolScope.activeState();
					}
				});
				$rootScope.$digest();
				expect(jQuery('button.test-class', element[0]).length).toBe(1);
			}));
			
			it('via text-angular on an active button', inject(function($rootScope, $compile, textAngularManager){
				var element = $compile('<text-angular name="test" ta-toolbar-active-button-class="test-class"></text-angular>')($rootScope);
				var toolbarScope = textAngularManager.retrieveToolbarsViaEditor('test')[0];
				toolbarScope.disabled = false;
				toolbarScope.focussed = true;
				angular.forEach(toolbarScope.tools, function(toolScope){
					if(toolScope.activeState){
						toolScope.active = toolScope.activeState();
					}
				});
				$rootScope.$digest();
				expect(jQuery('button.test-class', element[0]).length).toBe(1);
			}));
		});
		
		describe('is added to the textAngularManager', function(){
			it('successfully', inject(function($rootScope, $compile, textAngularManager){
				$compile('<text-angular-toolbar name="test"></text-angular-toolbar>')($rootScope);
				expect(textAngularManager.retrieveToolbar('test')).not.toBeUndefined();
			}));
		});
	});
	
	describe('focussed class', function(){
		var $rootScope, element, toolbarScope;
		beforeEach(inject(function(_$rootScope_, $compile, textAngularManager){
			$rootScope = _$rootScope_;
			element = $compile('<text-angular-toolbar name="test" ta-focussed-class="test-class"></text-angular-toolbar>')($rootScope);
			toolbarScope = textAngularManager.retrieveToolbar('test');
			toolbarScope.disabled = false;
		}));
		
		describe('initially not focussed', function(){
			it('should not have class', function(){
				expect(!jQuery(element).hasClass('test-class'));
			});
			
			it('should add class on focussed change', function(){
				toolbarScope.focussed = true;
				$rootScope.$digest();
				expect(jQuery(element).hasClass('test-class'));
			});
		});
	});
	
	describe('enables and disables from editor', function(){
		var $rootScope, element, $timeout, displayElements;
		beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_, textAngularManager) {
			$timeout = _$timeout_;
			$rootScope = _$rootScope_;
			_$compile_('<text-angular name="test"></text-angular>')($rootScope);
			$rootScope.$digest();
			displayElements = textAngularManager.retrieveEditor('test').scope.displayElements;
		}));
		
		describe('should have activated all buttons', function(){
			it('on trigger focus on ta-text', function(){
				displayElements.text.triggerHandler('focus');
				$rootScope.$digest();
				expect(jQuery(displayElements.text.parent()).find('button').eq(0).attr('disabled')).toBeUndefined();
			});
			it('on trigger focus on ta-html', function(){
				displayElements.html.triggerHandler('focus');
				$rootScope.$digest();
				expect(jQuery(displayElements.html.parent()).find('button').eq(0).attr('disabled')).toBeUndefined();
			});
		});
		
		describe('should have disabled all buttons', function(){
			it('on ta-text trigger blur', function(){	
				displayElements.text.triggerHandler('focus');
				$rootScope.$digest();
				displayElements.text.triggerHandler('blur');
				$rootScope.$digest();
				$timeout.flush();
				$rootScope.$digest();
				expect(jQuery(displayElements.text.parent().parent()).find('button').eq(0).attr('disabled')).toBe('disabled');
			});
			it('on ta-html trigger blur', function(){
				displayElements.html.triggerHandler('focus');
				$rootScope.$digest();
				displayElements.html.triggerHandler('blur');
				$rootScope.$digest();
				$timeout.flush();
				$rootScope.$digest();
				expect(jQuery(displayElements.html.parent()).find('button').eq(0).attr('disabled')).toBe('disabled');
			});
		});
	});
	
	describe('registration', function(){
		it('should add itself to the textAngularManager', inject(function($rootScope, $compile, textAngularManager){
			$compile('<text-angular-toolbar name="test"></text-angular-toolbar>')($rootScope);
			expect(textAngularManager.retrieveToolbar('test')).not.toBeUndefined();
		}));
	});
	
	describe('unregistration', function(){
		it('should remove itself from the textAngularManager on $destroy', inject(function($rootScope, $compile, textAngularManager){
			var element = $compile('<text-angular-toolbar name="test"></text-angular-toolbar>')($rootScope);
			$rootScope.$digest();
			textAngularManager.retrieveToolbar('test').$destroy();
			expect(textAngularManager.retrieveToolbar('test')).toBeUndefined();
		}));
	});
	
	describe('check for required tool attributes', function(){
		var $rootScope, element, toolbarScope;
		beforeEach(inject(function(_$rootScope_, $compile, textAngularManager){
			$rootScope = _$rootScope_;
			element = $compile('<text-angular-toolbar name="test"></text-angular-toolbar>')($rootScope);
			toolbarScope = textAngularManager.retrieveToolbar('test');
			toolbarScope.disabled = false;
			toolbarScope.focussed = true;
			$rootScope.$digest();
			element = element.find('button').eq(0);
		}));
		
		it('should have a name', function(){
			expect(element.attr('name')).not.toBeUndefined();
		});
		
		it('should be unselectable', function(){
			expect(element.attr('unselectable')).toBe('on');
		});
		
		it('should have ng-disabled set', function(){
			expect(element.attr('ng-disabled')).toBe('isDisabled()');
		});
		
		it('should have a negative tabindex', function(){
			expect(element.attr('tabindex')).toBe('-1');
		});
		
		it('should have ng-click to executeAction()', function(){
			expect(element.attr('ng-click')).toBe('executeAction()');
		});
		
		it('should have ng-disabled set', function(){
			expect(element.attr('ng-disabled')).toBe('isDisabled()');
		});
		
		it('should prevent event on mousedown', function(){
			var event;
			if(angular.element === jQuery){
				event = jQuery.Event('mousedown');
				element.triggerHandler(event);
				$rootScope.$digest();
				expect(event.isDefaultPrevented()).toBe(true);
			}else{
				var _defaultPrevented = false;
				event = {preventDefault: function(){ _defaultPrevented = true; }};
				element.triggerHandler('mousedown', event);
				$rootScope.$digest();
				expect(_defaultPrevented).toBe(true);
			}
		});
	});
	
	describe('test custom tool attributes', function(){
		var $rootScope, element, toolbarScope;
		beforeEach(inject(function(_$rootScope_, $compile, textAngularManager, taRegisterTool, taOptions){
			taRegisterTool('display', {display: '<div>THIS IS A TEST DIV</div>', iconclass: 'badclass', buttontext: 'badtext'});
			taRegisterTool('buttontext', {buttontext: 'Only Text'});
			taRegisterTool('iconclass', {iconclass: 'onlyiconclass'});
			taRegisterTool('iconandtext', {iconclass: 'iconclass', buttontext: 'good text'});
			taRegisterTool('customclass', {'class': 'buttonclass', buttontext: 'custom class'});
			taOptions.toolbar = [['display','buttontext','iconclass','iconandtext','customclass']];
			$rootScope = _$rootScope_;
			element = $compile('<text-angular-toolbar name="test"></text-angular-toolbar>')($rootScope);
			toolbarScope = textAngularManager.retrieveToolbar('test');
			toolbarScope.disabled = false;
			toolbarScope.focussed = true;
			$rootScope.$digest();
		}));
		
		describe('displaying the button', function(){
			it('should override everything with the html in the display attribute', function(){
				expect($('div[name=display]', element[0]).html()).toBe('THIS IS A TEST DIV');
			});
			
			it('should display only buttontext in the button', function(){
				expect($('button[name=buttontext]', element[0]).html()).toBe('Only Text');
			});
			
			it('should display only icon in the button', function(){
				expect($('button[name=iconclass]', element[0]).html()).toBe('<i class="onlyiconclass"></i>');
			});
			
			it('should display both icon and buttontext in the button', function(){
				expect($('button[name=iconandtext]', element[0]).html()).toBe('<i class="iconclass"></i>&nbsp;good text');
			});
			
			it('should use the default class', function(){
				expect($('div[name=display]', element[0]).hasClass('btn')).toBe(true);
			});
			
			it('should override the default class', function(){
				expect($('button[name=customclass]', element[0]).hasClass('buttonclass')).toBe(true);
			});
		});
		
		describe('updating the button display', function(){
			beforeEach(inject(function(textAngularManager){
				textAngularManager.updateToolsDisplay({
					'display': {
						display: '<div>Replaced Text</div>'
					},
					'buttontext': {
						buttontext: 'otherstuff'
					},
					'iconclass': {
						iconclass: 'test-icon-class'
					},
					'iconandtext': {
						buttontext: 'otherstuff',
						iconclass: 'test-icon-class'
					}
				});
				$rootScope.$digest();
			}));
			
			it('should override the old display with the html in the new display attribute', function(){
				expect($('div[name=display]', element[0]).html()).toBe('Replaced Text');
			});
			
			it('should display only new buttontext in the button', function(){
				expect($('button[name=buttontext]', element[0]).html()).toBe('otherstuff');
			});
			
			it('should display only new icon in the button', function(){
				expect($('button[name=iconclass]', element[0]).html()).toBe('<i class="test-icon-class"></i>');
			});
			
			it('should display both new icon and new buttontext in the button', function(){
				expect($('button[name=iconandtext]', element[0]).html()).toBe('<i class="test-icon-class"></i>&nbsp;otherstuff');
			});
		});
		
		describe('updating the button display', function(){
			beforeEach(inject(function(textAngularManager){
				textAngularManager.updateToolsDisplay({
					'display': {
						display: '<div>Replaced Text</div>'
					},
					'buttontext': {
						buttontext: 'otherstuff'
					},
					'iconclass': {
						iconclass: 'test-icon-class'
					},
					'iconandtext': {
						buttontext: 'otherstuff',
						iconclass: 'test-icon-class'
					}
				});
				$rootScope.$digest();
			}));
			
			it('should override the old display with the html in the new display attribute', function(){
				expect($('div[name=display]', element[0]).html()).toBe('Replaced Text');
			});
			
			it('should display only new buttontext in the button', function(){
				expect($('button[name=buttontext]', element[0]).html()).toBe('otherstuff');
			});
			
			it('should display only new icon in the button', function(){
				expect($('button[name=iconclass]', element[0]).html()).toBe('<i class="test-icon-class"></i>');
			});
			
			it('should display both new icon and new buttontext in the button', function(){
				expect($('button[name=iconandtext]', element[0]).html()).toBe('<i class="test-icon-class"></i>&nbsp;otherstuff');
			});
		});
		
		describe('resetting part of the button display', function(){
			beforeEach(inject(function(textAngularManager){
				textAngularManager.updateToolsDisplay({
					'display': {
						display: '<div>Replaced Text</div>',
						buttontext: 'This isnt a test'
					},
					'buttontext': {
						buttontext: 'otherstuff',
						iconclass: 'newest-test-class'
					},
					'iconclass': {
						iconclass: 'test-icon-class',
						buttontext: 'More text to insert'
					}
				});
				$rootScope.$digest();
				textAngularManager.updateToolsDisplay({
					'display': {
						display: null
					},
					'buttontext': {
						buttontext: null
					},
					'iconclass': {
						iconclass: null
					}
				});
				$rootScope.$digest();
			}));
			
			it('should remove the display attribute and follow the other rules', function(){
				// note as it is reset this is now a button not a div
				expect($('button[name=display]', element[0]).html()).toBe('<i class="badclass"></i>&nbsp;This isnt a test');
			});
			
			it('should remove the button text', function(){
				expect($('button[name=buttontext]', element[0]).html()).toBe('<i class="newest-test-class"></i>');
			});
			
			it('should remove the icon tag', function(){
				expect($('button[name=iconclass]', element[0]).html()).toBe('More text to insert');
			});
			
			it('should error on attempting to set all 3 to null', inject(function(textAngularManager){
				expect(function(){
					textAngularManager.updateToolsDisplay({'iconandtext': {
						display: null,
						buttontext: null,
						iconclass: null
					}});
				}).toThrow('textAngular Error: Tool Definition for updating "iconandtext" does not have a valid display/iconclass/buttontext value');
			}));
		});
	});
	
	describe('add tool dynamically to toolbar', function(){
		var $rootScope, element, toolbarScope, manager;
		beforeEach(inject(function(_$rootScope_, $compile, textAngularManager, taRegisterTool, taOptions){
			manager = textAngularManager;
			taOptions.toolbar = [['h1','h2','h3','h4']];
			$rootScope = _$rootScope_;
			element = jQuery($compile('<text-angular-toolbar name="test1"></text-angular-toolbar>')($rootScope)[0]);
			toolbarScope = textAngularManager.retrieveToolbar('test1');
			toolbarScope.disabled = false;
			toolbarScope.focussed = true;
			$rootScope.$digest();
		}));
		
		it('should add with all values set', function(){
			toolbarScope.addTool('newtool', {buttontext: 'Test Add Tool'}, 0, 0);
			expect(element.find('[name="newtool"]').length).toBe(1);
		});
		
		it('should add with group undefined', function(){
			toolbarScope.addTool('newtool', {buttontext: 'Test Add Tool'}, undefined, 0);
			expect(element.find('[name="newtool"]').length).toBe(1);
		});
		
		it('should add with index undefined', function(){
			toolbarScope.addTool('newtool', {buttontext: 'Test Add Tool'}, 0);
			expect(element.find('[name="newtool"]').length).toBe(1);
		});
	});
	
	describe('update and reset tools buttons and multi toolbars', function(){
		var $rootScope, elements, toolbarScopes, manager;
		beforeEach(inject(function(_$rootScope_, $compile, textAngularManager, taRegisterTool, taOptions){
			manager = textAngularManager;
			taOptions.toolbar = [['h1','h2','h3','h4']];
			$rootScope = _$rootScope_;
			elements = jQuery('<div></div>');
			elements.append($compile('<text-angular-toolbar name="test1"></text-angular-toolbar>')($rootScope));
			elements.append($compile('<text-angular-toolbar name="test2"></text-angular-toolbar>')($rootScope));
			elements.append($compile('<text-angular-toolbar name="test3"></text-angular-toolbar>')($rootScope));
			elements.append($compile('<text-angular-toolbar name="test4"></text-angular-toolbar>')($rootScope));
			toolbarScopes = [
				textAngularManager.retrieveToolbar('test1'),
				textAngularManager.retrieveToolbar('test2'),
				textAngularManager.retrieveToolbar('test3'),
				textAngularManager.retrieveToolbar('test4')
			];
			angular.forEach(toolbarScopes, function(toolbarScope){
				toolbarScope.disabled = false;
				toolbarScope.focussed = true;
			});
			$rootScope.$digest();
		}));
		
		it('updateToolbarToolDisplay should update one tool on one toolbar', function(){
			manager.updateToolbarToolDisplay('test1', 'h1', {buttontext: 'h1_changed'});
			var matches = 0;
			elements.find('button').each(function(i, element){
				if(jQuery(element).html() === 'h1_changed') matches++;
			});
			expect(matches).toBe(1);
		});
		
		it('updateToolDisplay should update one tool on all toolbars', function(){
			manager.updateToolDisplay('h1', {buttontext: 'h1_changed'});
			var matches = 0;
			elements.find('button').each(function(i, element){
				if(jQuery(element).html() === 'h1_changed') matches++;
			});
			expect(matches).toBe(4);
		});
		
		it('updateToolsDisplay should update multiple tools on all toolbars', function(){
			manager.updateToolsDisplay({'h1': {buttontext: 'changed'}, 'h2': {buttontext: 'changed'}});
			var matches = 0;
			elements.find('button').each(function(i, element){
				if(jQuery(element).html() === 'changed') matches++;
			});
			expect(matches).toBe(8);
		});
		
		it('resetToolbarToolDisplay should reset one tool on one toolbar to the default', function(){
			manager.updateToolsDisplay({'h1': {buttontext: 'changed'}, 'h2': {buttontext: 'changed'}});
			manager.resetToolbarToolDisplay('test1', 'h1');
			var matches = 0;
			elements.find('button').each(function(i, element){
				if(jQuery(element).html() === 'changed') matches++;
			});
			expect(matches).toBe(7);
		});
		
		it('updateToolDisplay should update one tool on all toolbars', function(){
			manager.updateToolsDisplay({'h1': {buttontext: 'changed'}, 'h2': {buttontext: 'changed'}});
			manager.resetToolDisplay('h1');
			var matches = 0;
			elements.find('button').each(function(i, element){
				if(jQuery(element).html() === 'changed') matches++;
			});
			expect(matches).toBe(4);
		});
		
		it('updateToolsDisplay should update multiple tools on all toolbars', function(){
			manager.updateToolsDisplay({'h1': {buttontext: 'changed'}, 'h2': {buttontext: 'changed'}});
			manager.resetToolsDisplay();
			var matches = 0;
			elements.find('button').each(function(i, element){
				if(jQuery(element).html() === 'changed') matches++;
			});
			expect(matches).toBe(0);
		});
	});
	
	describe('test custom tool functions', function(){
		var $rootScope, element, toolbarScope;
		beforeEach(inject(function(_$rootScope_, $compile, textAngularManager, taRegisterTool, taOptions){
			taRegisterTool('disabled1', {buttontext: 'allways-disabled', disabled: true});
			taRegisterTool('disabled2', {buttontext: 'allways-disabled', disabled: function(){ return true;}});
			taOptions.toolbar = [['disabled1','disabled2']];
			$rootScope = _$rootScope_;
			element = jQuery($compile('<text-angular-toolbar name="test"></text-angular-toolbar>')($rootScope)[0]);
			toolbarScope = textAngularManager.retrieveToolbar('test');
			toolbarScope.disabled = false;
			toolbarScope.focussed = true;
			$rootScope.$digest();
		}));
		
		it('should respect a disabled value', function(){
			expect(element.find('[name=disabled1]').is(":disabled"));
		});
		
		it('should respect a disabled functions return value', function(){
			expect(element.find('[name=disabled2]').is(":disabled"));
		});
		// action is called in correct deferred pattern
	});
});
