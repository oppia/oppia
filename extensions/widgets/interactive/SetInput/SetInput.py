from core.domain import widget_domain


class SetInput(widget_domain.BaseWidget):
    """Interactive widget for set input."""

    # The human-readable name of the widget.
    name = 'Set input'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'A very basic set input widget.'
    )

    # Customization args and their descriptions, schemas and default
    # values.
    # NB: There used to be a UnicodeString-typed parameter here called
    # 'element_type'. This has since been removed.
    _customization_arg_specs = []

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'SetOfUnicodeString'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
