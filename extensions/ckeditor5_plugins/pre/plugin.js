// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Adds pre plugin to CKEditor5 RTE.
 */
import AttributeCommand from 'services/Ckeditor5PluginAttributeCommands';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import preIcon from './icons/pre.svg';

const PRE = 'pre';

export class PreEditing extends Plugin {

	init() {
		const editor = this.editor;

		// Allow pre attribute on text nodes.
		editor.model.schema.extend( '$text', { allowAttributes: PRE } );
		editor.model.schema.setAttributeProperties( PRE, {
			isFormatting: true,
			copyOnEnter: true
		} );

		editor.conversion.attributeToElement( {
			model: PRE,
			view: 'pre'
		} );

		// Create pre command.
		editor.commands.add( PRE, new AttributeCommand( editor, PRE ) );
	}
}

export class PreUI extends Plugin {

	init() {
		const editor = this.editor;
		const t = editor.t;

		// Add pre button to feature components.
		editor.ui.componentFactory.add( PRE, locale => {
			const command = editor.commands.get( PRE );
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Pre' ),
				icon: preIcon,
				tooltip: true,
				isToggleable: true
			} );

			view.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute command.
			this.listenTo( view, 'execute', () => editor.execute( PRE ));

			return view;
		} );
	}
}

export default class Pre extends Plugin {

	static get requires() {
		return [ PreEditing, PreUI ];
	}


	static get pluginName() {
		return 'Pre';
	}
}
