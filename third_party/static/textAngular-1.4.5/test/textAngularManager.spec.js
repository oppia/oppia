describe('textAngularManager', function(){
	'use strict';
	beforeEach(module('textAngular'));

	describe('toolbar', function(){
		describe('registration', function(){
			it('should require a scope object', inject(function(textAngularManager){
				expect(textAngularManager.registerToolbar).toThrow("textAngular Error: A toolbar requires a scope");
			}));

			it('should require a name', inject(function(textAngularManager){
				expect(function(){textAngularManager.registerToolbar({});}).toThrow("textAngular Error: A toolbar requires a name");
				expect(function(){textAngularManager.registerToolbar({name: ''});}).toThrow("textAngular Error: A toolbar requires a name");
			}));

			it('should require a unique name', inject(function(textAngularManager){
				textAngularManager.registerToolbar({name: 'test'});
				expect(function(){textAngularManager.registerToolbar({name: 'test'});}).toThrow('textAngular Error: A toolbar with name "test" already exists');
			}));
		});

		describe('retrieval', function(){
			it('should be undefined for no registered toolbar', inject(function(textAngularManager){
				expect(textAngularManager.retrieveToolbar('test')).toBeUndefined();
			}));

			it('should get the correct toolbar', inject(function(textAngularManager){
				var scope = {name: 'test'};
				textAngularManager.registerToolbar(scope);
				expect(textAngularManager.retrieveToolbar('test')).toBe(scope);
			}));

			it('should get the correct toolbar via editor', inject(function(textAngularManager){
				var scope = {name: 'test'};
				textAngularManager.registerToolbar(scope);
				textAngularManager.registerEditor('testeditor', {}, ['test']);
				expect(textAngularManager.retrieveToolbarsViaEditor('testeditor')[0]).toBe(scope);
			}));
		});

		describe('unregister', function(){
			it('should get the correct toolbar', inject(function(textAngularManager){
				textAngularManager.registerToolbar({name: 'test'});
				textAngularManager.unregisterToolbar('test');
				expect(textAngularManager.retrieveToolbar('test')).toBeUndefined();
			}));
		});

		describe('modification', function(){
			var $rootScope, toolbar1, toolbar2, textAngularManager;
			beforeEach(inject(function(_textAngularManager_){
				textAngularManager = _textAngularManager_;
			}));
			beforeEach(inject(function (_$compile_, _$rootScope_) {
				$rootScope = _$rootScope_;
				toolbar1 = jQuery(_$compile_('<text-angular-toolbar name="test1"></text-angular-toolbar>')($rootScope)[0]);
				toolbar2 = jQuery(_$compile_('<text-angular-toolbar name="test2"></text-angular-toolbar>')($rootScope)[0]);
				$rootScope.$digest();
			}));

			describe('throws error on no toolbar', function(){
				it('when update tool', function(){
					expect(function(){
						textAngularManager.updateToolbarToolDisplay('test', 'h1', {iconclass: 'test-icon-class'});
					}).toThrow('textAngular Error: No Toolbar with name "test" exists');
				});
				it('when reset tool', function(){
					expect(function(){
						textAngularManager.resetToolbarToolDisplay('test', 'h1');
					}).toThrow('textAngular Error: No Toolbar with name "test" exists');
				});
			});

			describe('single toolbar', function(){
				// we test these by adding an icon with a specific class and then testing for it's existance
				it('should update only one button on one toolbar', function(){
					textAngularManager.updateToolbarToolDisplay('test1', 'h1', {iconclass: 'test-icon-class'});
					expect(jQuery('i.test-icon-class', toolbar1).length).toBe(1);
					expect(jQuery('i.test-icon-class', toolbar2).length).toBe(0);
				});
				it('should reset one toolbar button on one toolbar', function(){
					textAngularManager.updateToolbarToolDisplay('test1', 'h1', {iconclass: 'test-icon-class'});
					textAngularManager.updateToolbarToolDisplay('test1', 'h2', {iconclass: 'test-icon-class2'});
					textAngularManager.resetToolbarToolDisplay('test1', 'h1');
					expect(jQuery('[name="h1"] i.test-icon-class', toolbar1).length).toBe(0);
					expect(jQuery('[name="h1"] i.test-icon-class', toolbar2).length).toBe(0);
					expect(jQuery('[name="h2"] i.test-icon-class2', toolbar1).length).toBe(1);
				});
			});
			describe('multi toolbar', function(){
				it('should update only one button on multiple toolbars', function(){
					textAngularManager.updateToolDisplay('h1', {iconclass: 'test-icon-class'});
					expect(jQuery('[name="h1"] i.test-icon-class', toolbar1).length).toBe(1);
					expect(jQuery('[name="h1"] i.test-icon-class', toolbar2).length).toBe(1);
				});
				it('should reset one toolbar button', function(){
					textAngularManager.updateToolDisplay('h1', {iconclass: 'test-icon-class'});
					textAngularManager.updateToolDisplay('h2', {iconclass: 'test-icon-class2'});
					textAngularManager.resetToolDisplay('h1');
					expect(jQuery('[name="h1"] i.test-icon-class', toolbar1).length).toBe(0);
					expect(jQuery('[name="h1"] i.test-icon-class', toolbar2).length).toBe(0);
					expect(jQuery('[name="h2"] i.test-icon-class2', toolbar1).length).toBe(1);
				});
				it('should update multiple buttons on multiple toolbars', function(){
					textAngularManager.updateToolsDisplay({'h1': {iconclass: 'test-icon-class'},'h2': {iconclass: 'test-icon-class2'}});
					expect(jQuery('[name="h1"] i.test-icon-class, [name="h2"] i.test-icon-class2', toolbar1).length).toBe(2);
					expect(jQuery('[name="h1"] i.test-icon-class, [name="h2"] i.test-icon-class2', toolbar2).length).toBe(2);
				});
				it('should reset all toolbar buttons', function(){
					textAngularManager.updateToolsDisplay({'h1': {iconclass: 'test-icon-class'},'h2': {iconclass: 'test-icon-class2'}});
					textAngularManager.resetToolsDisplay();
					expect(jQuery('[name="h1"] i.test-icon-class, [name="h2"] i.test-icon-class2', toolbar1).length).toBe(0);
					expect(jQuery('[name="h1"] i.test-icon-class, [name="h2"] i.test-icon-class2', toolbar2).length).toBe(0);
				});
			});

			describe('dynamically add tool', function(){
				it('to all toolbars', function(){
					textAngularManager.addTool('newtool', {buttontext: 'Test Add Tool'}, 0, 0);
					expect(toolbar1.find('[name="newtool"]').length).toBe(1);
					expect(toolbar2.find('[name="newtool"]').length).toBe(1);
				});
				it('specifically to one toolbar', function(){
					textAngularManager.addToolToToolbar('newtool', {buttontext: 'Test Add Tool'}, 'test1', 0, 0);
					expect(toolbar1.find('[name="newtool"]').length).toBe(1);
					expect(toolbar2.find('[name="newtool"]').length).toBe(0);
				});
			});

			describe('dynamically remove tool', function(){
				it('from all toolbars', function(){
					textAngularManager.addTool('newtool', {buttontext: 'Test Add Tool'}, 0, 0);
					textAngularManager.removeTool('newtool');
					expect(toolbar1.find('[name="newtool"]').length).toBe(0);
					expect(toolbar2.find('[name="newtool"]').length).toBe(0);
				});
				it('when only on one toolbar', function(){
					textAngularManager.addToolToToolbar('newtool', {buttontext: 'Test Add Tool'}, 'test1', 0, 0);
					textAngularManager.removeTool('newtool');
					expect(toolbar1.find('[name="newtool"]').length).toBe(0);
					expect(toolbar2.find('[name="newtool"]').length).toBe(0);
				});
			});
		});
	});

	describe('editor', function(){
		describe('registration', function(){
			it('should require a name', inject(function(textAngularManager){
				expect(textAngularManager.registerEditor).toThrow("textAngular Error: An editor requires a name");
				expect(function(){textAngularManager.registerEditor('');}).toThrow("textAngular Error: An editor requires a name");
			}));

			it('should require a scope object', inject(function(textAngularManager){
				expect(function(){textAngularManager.registerEditor('test');}).toThrow("textAngular Error: An editor requires a scope");
			}));

			it('should require a unique name', inject(function(textAngularManager){
				textAngularManager.registerEditor('test', {});
				expect(function(){textAngularManager.registerEditor('test', {});}).toThrow('textAngular Error: An Editor with name "test" already exists');
			}));

			it('should return a disable function', inject(function(textAngularManager){
				expect(textAngularManager.registerEditor('test', {}).disable).toBeDefined();
			}));

			it('should return a enable function', inject(function(textAngularManager){
				expect(textAngularManager.registerEditor('test', {}).enable).toBeDefined();
			}));

			it('should return a focus function', inject(function(textAngularManager){
				expect(textAngularManager.registerEditor('test', {}).focus).toBeDefined();
			}));

			it('should return a unfocus function', inject(function(textAngularManager){
				expect(textAngularManager.registerEditor('test', {}).unfocus).toBeDefined();
			}));

			it('should return a updateSelectedStyles function', inject(function(textAngularManager){
				expect(textAngularManager.registerEditor('test', {}).updateSelectedStyles).toBeDefined();
			}));
		});

		describe('retrieval', function(){
			it('should be undefined for no registered editor', inject(function(textAngularManager){
				expect(textAngularManager.retrieveEditor('test')).toBeUndefined();
			}));

			it('should get the correct editor', inject(function(textAngularManager){
				var scope = {};
				textAngularManager.registerEditor('test', scope);
				expect(textAngularManager.retrieveEditor('test').scope).toBe(scope);
			}));
		});

		describe('unregister', function(){
			it('should get the correct editor', inject(function(textAngularManager){
				textAngularManager.registerEditor('test', {});
				textAngularManager.unregisterEditor('test');
				expect(textAngularManager.retrieveEditor('test')).toBeUndefined();
			}));
		});

		describe('interacting', function(){
			var $rootScope, textAngularManager, editorFuncs, testbar1, testbar2, testbar3;
			var editorScope = {};
			beforeEach(inject(function(_textAngularManager_){
				textAngularManager = _textAngularManager_;
			}));

			describe('active state', function(){
				beforeEach(inject(function (_$rootScope_) {
					$rootScope = _$rootScope_;
					textAngularManager.registerToolbar((testbar1 = {name: 'testbar1', disabled: true}));
					textAngularManager.registerToolbar((testbar2 = {name: 'testbar2', disabled: true}));
					textAngularManager.registerToolbar((testbar3 = {name: 'testbar3', disabled: true}));
					editorFuncs = textAngularManager.registerEditor('test', editorScope, ['testbar1','testbar2']);
					$rootScope.$digest();
				}));
				describe('focus', function(){
					beforeEach(function(){
						editorFuncs.focus();
						$rootScope.$digest();
					});
					it('should set disabled to false on toolbars', function(){
						expect(!testbar1.disabled);
						expect(!testbar2.disabled);
						expect(testbar3.disabled);
					});
					it('should set the active editor to the editor', function(){
						expect(testbar1._parent).toBe(editorScope);
						expect(testbar2._parent).toBe(editorScope);
						expect(testbar3._parent).toNotBe(editorScope);
					});
				});
				describe('unfocus', function(){
					beforeEach(function(){
						editorFuncs.unfocus();
						$rootScope.$digest();
					});
					it('should set disabled to false on toolbars', function(){
						expect(testbar1.disabled);
						expect(testbar2.disabled);
						expect(!testbar3.disabled);
					});
				});
				describe('disable', function(){
					beforeEach(function(){
						editorFuncs.disable();
						$rootScope.$digest();
					});
					it('should set disabled to false on toolbars', function(){
						expect(testbar1.disabled).toBe(true);
						expect(testbar2.disabled).toBe(true);
						expect(testbar3.disabled).toBe(true);
					});
				});
				describe('enable', function(){
					beforeEach(function(){
						editorFuncs.disable();
						$rootScope.$digest();
						editorFuncs.enable();
						$rootScope.$digest();
					});
					it('should set disabled to false on toolbars', function(){
						expect(testbar1.disabled).toBe(false);
						expect(testbar2.disabled).toBe(false);
						expect(testbar3.disabled).toBe(true);
					});
				});
			});

			describe('actions passthrough', function(){
				var editorScope, element;
				beforeEach(inject(function(taRegisterTool, taOptions, _$rootScope_, _$compile_){
					// add a tool that is ALLWAYS active
					taRegisterTool('activeonrangyrange', {
						buttontext: 'Active On Rangy Rangy',
						action: function(){
							return this.$element.attr('hit-this', 'true');
						},
						commandKeyCode: 21,
						activeState: function(rangyrange){ return rangyrange !== undefined; }
					});
					taRegisterTool('inactiveonrangyrange', {
						buttontext: 'Inactive On Rangy Rangy',
						action: function(){
							return this.$element.attr('hit-this', 'true');
						},
						commandKeyCode: 23,
						activeState: function(rangyrange){ return rangyrange === undefined; }
					});
					taRegisterTool('noactivestate', {
						buttontext: 'Shouldnt error, Shouldnt be active either',
						action: function(){
							return this.$element.attr('hit-this', 'true');
						}
					});
					taRegisterTool('onselect', {
						buttontext: 'Active on element select',
						action: function(){
							return this.$element.attr('hit-this', 'true');
						},
						onElementSelect: {
							element: 'i',
							action: function(event, element, editorScope){
								return this.$element.attr('hit-this', 'true');
							}
						}
					});
					taRegisterTool('onselectattr', {
						buttontext: 'Active on element with attr select',
						action: function(){
							return this.$element.attr('hit-this', 'true');
						},
						onElementSelect: {
							element: 'i',
							onlyWithAttrs: ['src'],
							action: function(event, element, editorScope){
								return this.$element.attr('hit-this', 'true');
							}
						}
					});
					taRegisterTool('onselectattr_specific', {
						buttontext: 'Active on element select',
						action: function(){
							return this.$element.attr('hit-this', 'true');
						},
						onElementSelect: {
							element: 'i',
							onlyWithAttrs: ['src','href'],
							action: function(event, element, editorScope){
								return this.$element.attr('hit-this', 'true');
							}
						}
					});
					taRegisterTool('specialkey', {
						buttontext: 'specialkey',
						action: function(){
							return this.$element.attr('hit-this', 'true');
						},
						commandKeyCode: 'TabKey',
						onElementSelect: {
							element: 'i',
							onlyWithAttrs: ['src','href'],
							action: function(event, element, editorScope){
								return this.$element.attr('hit-this', 'true');
							}
						}
					});
					taRegisterTool('unused', {
						buttontext: 'Button Is Not Used',
						action: function(){
							throw('Error Should Not Run');
						},
						commandKeyCode: 42,
						onElementSelect: {
							element: 'b',
							action: function(event, element, editorScope){
								throw('Error Should Not Run');
							}
						}
					});
					taOptions.toolbar = [['noactivestate','activeonrangyrange','inactiveonrangyrange','onselect','onselectattr','onselectattr_specific', 'specialkey']];
					$rootScope = _$rootScope_;
					element = jQuery(_$compile_('<text-angular name="test"><p>Test Content</p></text-angular>')($rootScope)[0]);
					$rootScope.$digest();
					editorScope = textAngularManager.retrieveEditor('test');
				}));
				describe('updateSelectedStyles', function(){
					describe('should activate buttons correctly', function(){
						it('without rangyrange passed through', function(){
							editorScope.editorFunctions.updateSelectedStyles();
							$rootScope.$digest();
							expect(element.find('.ta-toolbar button.active').length).toBe(1);
						});
						it('with rangyrange passed through', function(){
							editorScope.editorFunctions.updateSelectedStyles({});
							$rootScope.$digest();
							expect(element.find('.ta-toolbar button.active').length).toBe(1);
						});
					});
				});

				describe('sendKeyCommand', function(){
					it('should return true if there is a relevantCommandKeyCode on a tool', function(){
						expect(editorScope.editorFunctions.sendKeyCommand({metaKey: true, which: 21})).toBe(true);
					});

					it('should call the action of the specified tool', function(){
						editorScope.editorFunctions.sendKeyCommand({metaKey: true, which: 21});
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=activeonrangyrange]').attr('hit-this')).toBe('true');
					});

					it('should react only when modifiers present', function(){
						editorScope.editorFunctions.sendKeyCommand({which: 21});
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=activeonrangyrange]').attr('hit-this')).toBeUndefined();
					});

					it('should react to metaKey', function(){
						editorScope.editorFunctions.sendKeyCommand({metaKey: true, which: 21});
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=activeonrangyrange]').attr('hit-this')).toBe('true');
					});

					it('should react to ctrlKey', function(){
						editorScope.editorFunctions.sendKeyCommand({ctrlKey: true, which: 21});
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=activeonrangyrange]').attr('hit-this')).toBe('true');
					});

					it('should react to tabKey', function(){
						var event = {shiftKey: false, which: 9, specialKey: 'TabKey',
							preventDefault: function () {}};
						var fakeEditorScope =  { updateSelectedStyles: function() {}};
						textAngularManager.sendKeyCommand(fakeEditorScope, event);
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=specialkey]').attr('hit-this')).toBe('true');
					});
				});

				describe('onElementSelect', function(){
					it('should do nothing if button not added', function(){
						expect(function(){
							editorScope.editorFunctions.triggerElementSelect({}, '<b>');
						}).not.toThrow();
					});

					it('should return true if there is a relevant select element on a tool', function(){
						expect(editorScope.editorFunctions.triggerElementSelect({}, '<i>')).toBe(true);
					});

					it('should call the onElementSelect.action handler of defined tools', function(){
						editorScope.editorFunctions.triggerElementSelect({}, '<i>');
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=onselect]').attr('hit-this')).toBe('true');
					});

					it('should call the onElementSelect.action handler of defined tools with attr', function(){
						editorScope.editorFunctions.triggerElementSelect({}, '<i src="test">');
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=onselect]').attr('hit-this')).toBeUndefined();
						expect(element.find('.ta-toolbar button[name=onselectattr]').attr('hit-this')).toBe('true');
					});

					it('should call only the most specific handler when ambigious', function(){
						editorScope.editorFunctions.triggerElementSelect({}, '<i src="test" href="test">');
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=onselectattr_specific]').attr('hit-this')).toBe('true');
						expect(element.find('.ta-toolbar button[name=onselectattr]').attr('hit-this')).toBeUndefined();
					});

					it('should not call more specific', function(){
						editorScope.editorFunctions.triggerElementSelect({}, '<i src="test">');
						$rootScope.$digest();
						expect(element.find('.ta-toolbar button[name=onselectattr_specific]').attr('hit-this')).toBeUndefined();
						expect(element.find('.ta-toolbar button[name=onselectattr]').attr('hit-this')).toBe('true');
					});
				});
			});
		});

		describe('linking toolbar to existing editor', function(){
			it('should link when referenced', inject(function(textAngularManager) {
				var scope = {name: 'test'};
				textAngularManager.registerEditor('testeditor', {}, ['test']);
				textAngularManager.registerToolbar(scope);
				expect(textAngularManager.retrieveToolbarsViaEditor('testeditor')[0]).toBe(scope);
			}));
			it('should not link when not referenced', inject(function(textAngularManager) {
				var scope = {name: 'test'};
				textAngularManager.registerEditor('testeditor', {}, []);
				textAngularManager.registerToolbar(scope);
				expect(textAngularManager.retrieveToolbarsViaEditor('testeditor').length).toBe(0);
			}));
		});

		describe('updating', function(){
			var $rootScope, element;
			beforeEach(inject(function (_$compile_, _$rootScope_) {
				$rootScope = _$rootScope_;
				$rootScope.htmlcontent = '<p>Test Content</p>';
				element = _$compile_('<text-angular name="test" ng-model="htmlcontent"></text-angular>')($rootScope);
				$rootScope.$digest();
			}));
			it('should throw error for named editor that doesn\'t exist', inject(function(textAngularManager){
				expect(function(){textAngularManager.refreshEditor('non-editor');}).toThrow('textAngular Error: No Editor with name "non-editor" exists');
			}));
			it('should update from text view to model', inject(function(textAngularManager){
				jQuery('.ta-text .ta-bind', element[0]).append('<div>Test 2 Content</div>');
				textAngularManager.refreshEditor('test');
				expect($rootScope.htmlcontent).toBe('<p>Test Content</p><div>Test 2 Content</div>');
			}));
		});
	});
});
