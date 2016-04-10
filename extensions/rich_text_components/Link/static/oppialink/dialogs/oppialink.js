CKEDITOR.dialog.add('oppialink', function() {
  return {
    title: 'Edit Link',
    minWidth: 200,
    minHeight: 100,
    contents: [
      {
        id: 'Customization',
        elements: [
          {
            id: 'url',
            type: 'text',
            label: 'URL',
            setup: function(widget) {
              var defaultURL = 'https://www.example.com';
              this.setValue(widget.data.url || defaultURL);
            },
            commit: function(widget) {
              widget.setData('url', this.getValue());
            }
          },
          {
            id: 'text',
            type: 'text',
            label: 'Text',
            setup: function(widget) {
              this.setValue(widget.data.text);
            },
            commit: function(widget) {
              widget.setData('text', this.getValue());
            }
          },
          {
            id: 'open-link-in-same-window',
            label: 'Open link in same window',
            type: 'checkbox',
            setup: function(widget) {
              this.setValue(widget.data.openLinkInSameWindow);
            },
            commit: function(widget) {
              widget.setData('openLinkInSameWindow', this.getValue());
            }
          }
        ]
      }
    ]
  };
});
