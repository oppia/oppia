from core.domain import widget_domain


class Continue(widget_domain.BaseWidget):
    """Interactive widget that takes the form of a simple 'Continue' button."""

    # The human-readable name of the widget.
    name = 'Continue'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = 'A simple \'go to next state\' button.'

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'buttonText',
        'description': 'The text to display on the button.',
        'schema': {
            'type': 'unicode',
        },
        'default_value': 'Continue',
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'Null'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
