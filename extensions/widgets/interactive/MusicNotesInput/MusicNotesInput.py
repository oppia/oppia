from core.domain import widget_domain


class MusicNotesInput(widget_domain.BaseWidget):
    """Interactive widget for music note input."""

    # The human-readable name of the widget.
    name = 'Music Notes Input'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'A music staff widget that allows notes to be dragged and dropped '
        'onto staff lines.'
    )

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'sequenceToGuess',
        'description': 'The sequence of notes that the reader should guess.',
        'schema': {
            'type': 'custom',
            'obj_type': 'MusicPhrase',
        },
        'default_value': [],
    }, {
        'name': 'hintSequence',
        'description': 'The Sequence of notes that start on the staff.',
        'schema': {
            'type': 'custom',
            'obj_type': 'MusicPhrase',
        },
        'default_value': [],
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'MusicPhrase'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = ['midijs']
