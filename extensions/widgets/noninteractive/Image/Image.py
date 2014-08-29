from core.domain import widget_domain


class Image(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Image'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'Image widget.'
    )

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'filepath',
        'description': (
            'The name of the image file. (Allowed extensions: gif, jpeg, jpg, '
            'png.)'),
        'schema': {
            'type': 'custom',
            'obj_type': 'Filepath',
        },
        'default_value': '',
    }]

    # The HTML tag name for this non-interactive widget.
    frontend_name = 'image'
    # The tooltip for the icon in the rich-text editor.
    tooltip = 'Insert image'
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this widget folder, generated with the
    # utils.convert_png_to_data_url() function.
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAA'
        'ABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZ'
        'TwAAAHwSURBVDjLpZM9a1RBFIafM/fevfcmC7uQ%0AjWEjUZKAYBHEVEb/gIWFjVVSWEj'
        '6gI0/wt8gprPQykIsTP5BQLAIhBVBzRf52Gw22bk7c8YiZslu%0AgggZppuZ55z3nfdIC'
        'IHrrBhg%2BePaa1WZPyk0s%2B6KWwM1khiyhDcvns4uxQAaZOHJo4nRLMtEJPpn%0AxY6'
        'Cd10%2BfNl4DpwBTqymaZrJ8uoBHfZoyTqTYzvkSRMXlP2jnG8bFYbCXWJGePlsEq8iPQ'
        'mFA2Mi%0AjEBhtpis7ZCWftC0LZx3xGnK1ESd741hqqUaqgMeAChgjGDDLqXkgMPTJtZ3'
        'KJzDhTZpmtK2OSO5%0AIRB6xvQDRAhOsb5Lx1lOu5ZCHV4B6RLUExvh4s%2BZntHhDJAx'
        'Sqs9TCDBqsc6j0iJdqtMuTROFBkI%0AcllCCGcSytFNfm1tU8k2GRo2pOI43h9ie6tOvT'
        'JFbORyDsJFQHKD8fw%2BP9dWqJZ/I96TdEa5Nb1A%0AOavjVfti0dfB%2Bt4iXhWvyh27'
        'y9zEbRRobG7z6fgVeqSoKvB5oIMQEODx7FLvIJo55KS9R7b5ldrD%0AReajpC%2BZ5z7G'
        'AHJFXn1exedVbG36ijwOmJgl0kS7lXtjD0DkLyqc70uPnSuIIwk9QCmWd%2B9XGnOF%0A'
        'DzP/M5xxBInhLYBcd5z/AAZv2pOvFcS/AAAAAElFTkSuQmCC%0A'
    )
