import _base

class Filter(_base.Filter):
    def __init__(self, source, encoding):
        _base.Filter.__init__(self, source)
        self.encoding = encoding

    def __iter__(self):
        state = "pre_head"
        meta_found = (self.encoding is None)
        pending = []

        for token in _base.Filter.__iter__(self):
            type = token["type"]
            if type == "StartTag":
                if token["name"].lower() == u"head":
                    state = "in_head"

            elif type == "EmptyTag":
                if token["name"].lower() == u"meta":
                   # replace charset with actual encoding
                   has_http_equiv_content_type = False
                   for (namespace,name),value in token["data"].iteritems():
                       if namespace != None:
                           continue
                       elif name.lower() == u'charset':
                          token["data"][(namespace,name)] = self.encoding
                          meta_found = True
                          break
                       elif name == u'http-equiv' and value.lower() == u'content-type':
                           has_http_equiv_content_type = True
                   else:
                       if has_http_equiv_content_type and (None, u"content") in token["data"]:
                           token["data"][(None, u"content")] = u'text/html; charset=%s' % self.encoding
                           meta_found = True

                elif token["name"].lower() == u"head" and not meta_found:
                    # insert meta into empty head
                    yield {"type": "StartTag", "name": u"head",
                           "data": token["data"]}
                    yield {"type": "EmptyTag", "name": u"meta",
                           "data": {(None, u"charset"): self.encoding}}
                    yield {"type": "EndTag", "name": u"head"}
                    meta_found = True
                    continue

            elif type == "EndTag":
                if token["name"].lower() == u"head" and pending:
                    # insert meta into head (if necessary) and flush pending queue
                    yield pending.pop(0)
                    if not meta_found:
                        yield {"type": "EmptyTag", "name": u"meta",
                               "data": {(None, u"charset"): self.encoding}}
                    while pending:
                        yield pending.pop(0)
                    meta_found = True
                    state = "post_head"

            if state == "in_head":
                pending.append(token)
            else:
                yield token
