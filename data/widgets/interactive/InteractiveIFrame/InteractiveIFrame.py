from oppia.apps.widget import models


class InteractiveIFrame(models.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered from apps/widget/models.py when the default widgets are
    refreshed.
    """

    # The human-readable name of the widget.
    name = 'IFrame of arbitrary URL'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'An iframe for an arbitrary page that can pass strings to Oppia when '
        'events occur.')

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'childPageUrl',
        'description': 'The URL of the page to iframe.',
        'obj_type': 'UnicodeString',
        'values': ['']
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated classifiers. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'classifier': 'TextClassifier'
    }]
