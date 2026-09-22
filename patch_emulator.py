import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    target = "        # Standard baseline execution fallback string formatting.\n        return 'Mock translation of: %s' % source_text"
    replacement = "        # Standard baseline execution fallback string formatting.\n        if source_text.startswith('<p>') and source_text.endswith('</p>'):\n            return '<p>Mock translation of: %s</p>' % source_text[3:-4]\n        return 'Mock translation of: %s' % source_text"
    
    if target in content:
        content = content.replace(target, replacement)
        with open(filepath, 'w') as f:
            f.write(content)
        print("Patched " + filepath)
    else:
        print("Target not found in " + filepath)

patch_file('core/platform/translate/translate_emulator.py')
