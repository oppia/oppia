from core.domain import widget_domain


class TextInput(widget_domain.BaseWidget):
    """Interactive widget for entering text strings."""

    # The human-readable name of the widget.
    name = 'Text input'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'A text input widget that can accept and classify strings.'
    )

    # Customization args and their descriptions, schemas and default
    # values.
    # NB: There used to be an integer-typed parameter here called 'columns'
    # that was removed in revision 628942010573. Some text widgets in
    # older explorations may have this customization parameter still set
    # in the exploration definition, so, in order to minimize the possibility
    # of collisions, do not add a new parameter with this name to this list.
    # TODO(sll): Migrate old definitions which still contain the 'columns'
    # parameter.
    _customization_arg_specs = [{
        'name': 'placeholder',
        'description': 'The placeholder for the text input field.',
        'schema': {
            'type': 'unicode',
        },
        'default_value': 'Type your answer here.'
    }, {
        'name': 'rows',
        'description': 'The number of rows for the text input field.',
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 1,
            }, {
                'id': 'is_at_most',
                'max_value': 200,
            }]
        },
        'default_value': 1,
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'NormalizedString'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
