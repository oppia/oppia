from core.domain import widget_domain
from extensions.objects.models import objects
from extensions.value_generators.models import generators


class TarFileReadInput(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Tar File input'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'A file input widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'hint_placeholder',
        'description': 'The placeholder for the text for hint box.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ("<p>If you need help with this step, try clicking "
            "through these hints.</p>"
            "<p>The \"low\" hint level is perfect if you're just confused "
            "as to what to do.</p>"
            "<p>The \"high\" level is great if you are unfamiliar with the "
            "commands and tools you'd use.</p>")
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'low_hint',
        'description': 'The low level hint.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ('<ul><li>Download the tarball.</li><li>Unpack it.'
                '</li><li>find and upload the ghello-0.4/ghello.c '
                'file</li></ul>')
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'high_hint',
        'description': 'The high level hint',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ('<p>To unpack the tarball, you might want to '
                'use this command:</p>'
                '<ul><li>tar xvzf ghello-0.4.tar.gz</li></ul>')
        },
        'obj_type': 'UnicodeString',
    }
    ]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.TarFileString
    }]
