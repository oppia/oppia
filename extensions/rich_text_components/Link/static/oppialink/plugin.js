CKEDITOR.plugins.add('oppialink', {
  requires: 'widget',
  init: function(editor) {
    CKEDITOR.dialog.add('oppialink', this.path + 'dialogs/oppialink.js');

    editor.widgets.add('oppialink', {
      button: 'Add a link',
      inline: true,
      template: '<oppia-noninteractive-link open_link_in_same_window-with-value="" text-with-value="" url-with-value=""></oppia-noninteractive-link>',
      dialog: 'oppialink',
      upcast: function(element) {
        return element.name === 'oppia-noninteractive-link';
      },
      downcast: function(el) {
        el.setHtml('');
      },
      data: function() {
        this.element.setAttribute(
          'open_link_in_same_window-with-value',
          String(this.data.openLinkInSameWindow)
        );
        this.element.setAttribute(
          'text-with-value', `&quot;${this.data.text}&quot;`);
        this.element.setAttribute(
          'url-with-value', `&quot;${this.data.url}&quot;`);

        var display = this.data.text || this.data.url;
        this.element.setHtml(`<a>${display}</a>`);
      },
      init: function() {
        var openInSame = this.element.getAttribute('open_link_in_same_window-with-value');
        var textWithValue = this.element.getAttribute('text-with-value');
        var urlWithValue = this.element.getAttribute('url-with-value');
        openInSame = openInSame.replace(/&quot;/g, '');
        textWithValue = textWithValue.replace(/&quot;/g, '');
        urlWithValue = urlWithValue.replace(/&quot;/g, '');
        if (openInSame)
          this.setData('openLinkInSameWindow', openInSame);
        if (textWithValue)
          this.setData('text', textWithValue);
        if (urlWithValue)
          this.setData('url', urlWithValue);
      }
    });
  }
});
