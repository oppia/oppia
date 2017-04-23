"""A set of basic callbacks for bleach.linkify."""


def nofollow(attrs, new=False):
    if attrs['href'].startswith('mailto:'):
        return attrs
    attrs['rel'] = 'nofollow'
    return attrs


def target_blank(attrs, new=False):
    if attrs['href'].startswith('mailto:'):
        return attrs
    attrs['target'] = '_blank'
    return attrs
