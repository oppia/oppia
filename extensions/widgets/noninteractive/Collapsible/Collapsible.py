from core.domain import widget_domain


class Collapsible(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Collapsible'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'A collapsible block of HTML.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'heading',
        'description': 'The heading for the collapsible block',
        'schema': {
            'type': 'unicode',
        },
        'default_value': '',
    }, {
        'name': 'content',
        'description': 'The content of the collapsible block',
        'schema': {
            'type': 'html',
        },
        'default_value': 'You have opened the collapsible block.'
    }]

    # The HTML tag name for this non-interactive widget.
    frontend_name = 'collapsible'
    # The tooltip for the icon in the rich-text editor.
    tooltip = 'Insert collapsible block'
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this widget folder, generated with the
    # utils.convert_png_to_data_url() function.
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAA'
        'ABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZ'
        'TwAAAI1SURBVDjLhZNNSFVREMd/53qfPo3nwq8W%0A1SJaVBKtVAxs56KVIdKiaBct24d'
        'BtIkg2tcuLCFavCCiNm2ChAwJQlvlR%2BLC/OhDffrevfecmWnx%0AUlGe9YfhDDPwmzl'
        'n5jgzY79G36/dNuO6mB5VVcppIPVCEP1rggRDVCdiakjNbgz1FNr4j%2B48nzlb%0AEyC'
        'qbQAv50YIGthISpR9BS%2BBoIEggZvn7uK9NBwAqF7rSue1A6tvJQEfhNoAUQCeja0cCB'
        'joaiEL%0AQvz1dffnfHNnp3PRTjLIvR3/cl8HxfFlhnoP7wH82EiqHTiLTh3re5xzzoEB'
        'GP7NEmpGXAfFDyvg%0AoDi%2BTBw5MCMXw%2BkjTWReiAmWoFlDuvQQyeogakakHwPiOs'
        'dgT3vNDmYWNwhBifEuMs2QrB5TQysL%0AHEpmKU284MzUKNMTcBaY/rRv1ANvMZQYZ3kN'
        'Fba%2Br5Auz6JZmQu5eVq7H9DSdRXJMrwo2/sW5VtZ%0AHTkPQGPsNMZHxI0dtPcOAwpm'
        'TH5bZvHLO7xPEVXSLEMkxdSTa73ICWD4yRRrpeRVjDczSdDyJCbr%0AmJQ42TgPecU0Aa'
        '1guonJJiZlGo9fYvYjFG/1OYCYFDMNqF/FwnoVoilYAEsxLWOyhYYSJiVwbs9b%0AxGRm'
        'DsHCLyysVU3Wd2GhhMkGJluYJmi6AJDsACzT36H8s8lv1hfQQmSWAy2AtWGSAhkWVU8XC'
        'ZIk%0AZpmmu4AkvT/3aLAHox9H4Z/fzwA3lqH2dDv0B6mSc8HU1qcrAAAAAElFTkSuQmC'
        'C%0A'
    )
