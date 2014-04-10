from core.domain import widget_domain
from extensions.value_generators.models import generators


class MusicNotesInput(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Music Notes Input'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'A music staff widget that allows notes to be dragged and dropped '
        'onto staff lines.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'sequenceToGuess',
        'description': 'The sequence of notes that the reader should guess.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': []
        },
        'obj_type': 'MusicPhrase'
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'MusicPhrase'
    }]
