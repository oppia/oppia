from core.domain import widget_domain
from extensions.value_generators.models import generators


class SetInput(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Set input'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'A very basic set input widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'element_type',
        'description': 'The type of the elements comprising the set.',
        'generator': generators.RestrictedCopier,
        'init_args': {
            'choices': ['UnicodeString']
        },
        'customization_args': {
            'value': 'UnicodeString'
        },
        'obj_type': 'UnicodeString',
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    @property
    def _handlers(self):
        input_type = None
        for param_spec in self._params:
            if param_spec['name'] == 'element_type':
                input_type = param_spec['customization_args']['value']
        input_type = 'SetOf%s' % input_type

        return [{
            'name': 'submit', 'obj_type': input_type
        }]
