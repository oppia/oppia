from oppia.apps.widget import models


class InteractiveMap(models.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered from apps/widget/models.py when the default widgets are
    refreshed.
    """

    # The human-readable name of the widget.
    name = 'Interactive map'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'A map input widget for users to specify a position.')

    # Customization parameters and their descriptions, types and default
    # values.
    params = [{
        'name': 'latitude',
        'description': 'Starting map center latitude (-90 to 90).',
        'obj_type': 'Real',
        'values': [0.0]
    }, {
        'name': 'longitude',
        'description': 'Starting map center longitude (-180 to 180).',
        'obj_type': 'Real',
        'values': [0.0]
    }, {
        'name': 'zoom',
        'description': 'Starting map zoom level (0 shows the entire earth).',
        'obj_type': 'Real',
        'values': [0.0]
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated classifiers. Interactive widgets
    # must have at least one of these.
    handlers = [{
        'name': 'submit', 'classifier': 'Coord2DClassifier'
    }]
