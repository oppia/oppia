from oppia.apps.widget import widget_domain


class MusicStaff(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered from apps/widget/models.py when the default widgets are
    refreshed.
    """

    # The human-readable name of the widget.
    name = 'Music staff'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'A music staff widget that allows notes to be added and adjusted '
        'using the up and down arrow keys.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'noteToGuess',
        'description': 'The note that the reader should guess.',
        'obj_type': 'UnicodeString',
        'values': [
            'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'
        ]
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated classifiers. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'classifier': 'MusicNoteClassifier'
    }]
