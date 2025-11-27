#!/usr/bin/env python3
"""
Test script to verify nested RTE image extraction works correctly.
This simulates what happens when a skill with nested images is created.
"""

import sys
import os

# Add the oppia directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'oppia'))

from core.domain import html_cleaner

# Test HTML with image inside collapsible
html_with_nested_collapsible = """
<p>Some explanation text</p>
<oppia-noninteractive-collapsible content-with-value="&amp;quot;&amp;lt;p&amp;gt;Content inside collapsible&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-image alt-with-value=\\&amp;quot;&amp;amp;amp;quot;Description&amp;amp;amp;quot;\\&amp;quot; caption-with-value=\\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\\&amp;quot; filepath-with-value=\\&amp;quot;&amp;amp;amp;quot;nested_img.svg&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;quot;" heading-with-value="&amp;quot;Click to expand&amp;quot;"></oppia-noninteractive-collapsible>
"""

# Test HTML with image inside tabs
html_with_nested_tabs = """
<p>Some explanation text</p>
<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;title&amp;quot;:&amp;quot;Tab 1&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;Tab content&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-image alt-with-value=\\\\&amp;quot;&amp;amp;quot;Image in tab&amp;amp;quot;\\\\&amp;quot; caption-with-value=\\\\&amp;quot;&amp;amp;quot;&amp;amp;quot;\\\\&amp;quot; filepath-with-value=\\\\&amp;quot;&amp;amp;quot;tab_img.png&amp;amp;quot;\\\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;quot;}]"></oppia-noninteractive-tabs>
"""

# Test HTML with top-level image
html_with_top_level = """
<p>Some text</p>
<oppia-noninteractive-image alt-with-value="&amp;quot;Top level&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-with-value="&amp;quot;top_level.svg&amp;quot;"></oppia-noninteractive-image>
"""

# Test combined
html_combined = """
<p>Introduction</p>
<oppia-noninteractive-image alt-with-value="&amp;quot;Top image&amp;quot;" filepath-with-value="&amp;quot;top_img.png&amp;quot;"></oppia-noninteractive-image>
<oppia-noninteractive-collapsible content-with-value="&amp;quot;&amp;lt;p&amp;gt;Nested content&amp;lt;/p&amp;gt;&amp;lt;oppia-noninteractive-image filepath-with-value=\\&amp;quot;&amp;amp;amp;quot;nested_collapsible.svg&amp;amp;amp;quot;\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;quot;" heading-with-value="&amp;quot;More Info&amp;quot;"></oppia-noninteractive-collapsible>
<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;quot;title&amp;quot;:&amp;quot;Examples&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;oppia-noninteractive-image filepath-with-value=\\\\&amp;quot;&amp;amp;quot;tab_example.png&amp;amp;quot;\\\\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;quot;}]"></oppia-noninteractive-tabs>
"""

def test_extraction(html_string, description):
    print(f"\n{'='*80}")
    print(f"Testing: {description}")
    print(f"{'='*80}")
    print(f"HTML (first 200 chars): {html_string[:200]}...")
    
    try:
        filenames = html_cleaner.get_image_filenames_from_html_strings([html_string])
        print(f"✓ Extracted {len(filenames)} image(s): {filenames}")
        return filenames
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == '__main__':
    print("Testing nested RTE image extraction")
    print("="*80)
    
    # Run tests
    test_extraction(html_with_top_level, "Top-level image")
    test_extraction(html_with_nested_collapsible, "Image inside Collapsible")
    test_extraction(html_with_nested_tabs, "Image inside Tabs")
    combined_files = test_extraction(html_combined, "Combined (top-level + nested)")
    
    print(f"\n{'='*80}")
    print("Summary:")
    print(f"{'='*80}")
    if combined_files and len(combined_files) == 3:
        print("✓ All 3 images were correctly extracted from combined HTML!")
        print("  Expected: ['top_img.png', 'nested_collapsible.svg', 'tab_example.png']")
        print(f"  Got:      {combined_files}")
    else:
        print(f"✗ Expected 3 images, but got {len(combined_files) if combined_files else 0}")
        print("  This indicates the recursive extraction is not working correctly!")
