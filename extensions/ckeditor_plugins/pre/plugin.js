// Adds pre plugin to CKEditor RTE.
CKEDITOR.plugins.add('pre', {
  icons: 'pre',

  init: function(editor) {
    var tag = 'pre';
    var style = new CKEDITOR.style({element: 'pre'});

    editor.addCommand('pre', new CKEDITOR.styleCommand(style));

    // This part will provide toolbar button highlighting in editor.
    editor.attachStyleStateChange(style, function(state) {
      !editor.readOnly && editor.getCommand('pre').setState(state);
    });

    editor.ui.addButton( 'Pre', {
      label: 'Pre',
      command: 'pre',
      toolbar: 'insert'
    });
  }
});
