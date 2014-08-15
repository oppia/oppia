from core.domain import widget_domain


TAB_CONTENT_SCHEMA = {
    'type': 'dict',
    'properties': {
        'title': {
            'type': 'unicode',
            'post_normalizers': [{
                'id': 'require_nonempty'
            }]
        },
        'content': {
            'type': 'html',
        }
    }
}


class Tabs(widget_domain.BaseWidget):
    """Non-interactive widget for displaying a series of tabs."""

    # The human-readable name of the widget.
    name = 'Tabs'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = 'Tabs widget.'

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'tab_contents',
        'description': 'The tab titles and contents.',
        'schema': {
            'type': 'list',
            'items': TAB_CONTENT_SCHEMA,
        },
        'default_value': [{
            'title': 'Hint introduction',
            'content': ('This set of tabs shows some hints. Click on the '
                        'other tabs to display the relevant hints.')
        }, {
            'title': 'Hint 1',
            'content': 'This is a first hint.'
        }],
    }]

    # The HTML tag name for this non-interactive widget.
    frontend_name = 'tabs'
    # The tooltip for the icon in the rich-text editor.
    tooltip = 'Insert tabs (e.g. for hints)'
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this widget folder, generated with the
    # utils.convert_png_to_data_url() function.
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAA'
        'ABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZ'
        'TwAAAHWSURBVDjLzZPdS1NxGMf3L3TbXV5EEN50%0A30UJpTdClBBKSgh2Y5cyW0QXISY'
        '2eiGxklYgGoaE2YtFdTjHvZyO25i6uReOuRc3T7TNnOFOw8bH%0As2MmZUEQRRefm9%2B'
        'P74fn9zzPzwJY/gTLPxUsjB04Hh06ifq4i%2Bm7R5jp29/82%2BHFiT2NmmBlZfYp%0Af'
        'MrwcXYU%2BUrte/PS4XDUGLw14Gc8G%2B4gF7pIaXEcTeylGHzEl4SL4L02fUsQ9vtl0m'
        'nVJJOpML9J%0AbITl0AXKRRfFd%2B3kp84SGWwlMHC6PHXj2N4twYd4PIzH40KSJBOn04'
        'lX6GM5eI6yLrM234KeamI1%0AbCNxv54HA/bStyZuCiIoimwG3W430lgvmtf6NdyMnmyk'
        'EDqPeqsOLSJWnqZ/J0gmY/h8XmRZZnL8%0AKuEXHUbZk%2BjxVj6nTrFiVKL21zLnFclm'
        'MzsFqZRKIODn5VA3c89tzExcI600sBZvIj/dSex2vRmO%0ARiPkctq2oNJlQXhlHC6Rzy'
        '/xsKcGVhNE75xAsO3GbZTssR8lu%2BCjUMga5ExEUTAnZPlxZJfaqinJ%0ANykp11G6Dj'
        'FyporB/h5%2BNeIdC9NwcJfe3bJv/c3luvXX9sPSE2t11f/zF/6KYAOj9QWRU1s5XQAA%'
        '0AAABJRU5ErkJggg%3D%3D%0A'
    )
