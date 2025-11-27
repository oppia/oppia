# Bug #23145 Fix: Images in Nested RTE Components Not Saved

## Problem
Images inserted inside nested Rich Text Editor (RTE) components (like Collapsible and Tabs) in the "Create New Skill Modal - Review Material" field were not being saved and displayed after skill creation.

## Root Cause
The backend HTML parser in `get_image_filenames_from_html_strings()` was only extracting images from top-level RTE components. It did not recursively search inside the `content-with-value` attributes of container components like:
- `<oppia-noninteractive-collapsible>`
- `<oppia-noninteractive-tabs>`

## Solution Implemented

### 1. Backend Changes: `core/domain/html_cleaner.py`

#### Added New Function: `get_rte_components_recursively()`
```python
def get_rte_components_recursively(html_string: str) -> List[ComponentsDict]:
    """Recursively extracts all RTE components from an HTML string, including
    those nested inside Collapsible, Tabs, and other container components.
    """
```

**How it works:**
1. Extracts all top-level RTE components using the existing `get_rte_components()` function
2. For each component, checks if it's a container type (Collapsible or Tabs)
3. Recursively processes the nested HTML content:
   - For Collapsible: Extracts from `content-with-value` attribute
   - For Tabs: Extracts from each tab's `content` field in the `tab_contents-with-value` array
4. Returns all components found at any nesting level

#### Modified Function: `get_image_filenames_from_html_strings()`
Changed from:
```python
all_rte_components.extend(get_rte_components(html_string))
```

To:
```python
all_rte_components.extend(get_rte_components_recursively(html_string))
```

This ensures all image filenames are extracted, including those nested inside container components.

### 2. Test Changes: `core/domain/html_cleaner_test.py`

Added three comprehensive unit tests in the `RteComponentExtractorUnitTests` class:

#### Test 1: `test_get_rte_components_recursively_with_collapsible()`
- Verifies that components inside Collapsible are recursively extracted
- Asserts that both the Collapsible container and the nested Image component are found

#### Test 2: `test_get_rte_components_recursively_with_tabs()`
- Verifies that components inside Tabs are recursively extracted
- Asserts that both the Tabs container and the nested Image component are found

#### Test 3: `test_get_image_filenames_from_nested_rte_components()`
- **End-to-end test for bug #23145**
- Tests three scenarios:
  1. Image nested in Collapsible component
  2. Image nested in Tabs component
  3. Combined: Both top-level image + image nested in Collapsible
- Verifies that `get_image_filenames_from_html_strings()` correctly extracts all image filenames

## How This Fixes The Bug

### Before the Fix:
1. User inserts image in Collapsible/Tabs in Review Material field
2. Frontend saves image to `ImageLocalStorageService` ✓
3. Backend `get_image_filenames_from_html_strings()` only finds top-level images ✗
4. Nested images not extracted → not uploaded to server ✗
5. Result: Missing images after skill creation ✗

### After the Fix:
1. User inserts image in Collapsible/Tabs in Review Material field
2. Frontend saves image to `ImageLocalStorageService` ✓
3. Backend `get_image_filenames_from_html_strings()` recursively finds ALL images ✓
4. All image filenames extracted and matched with local storage ✓
5. All images uploaded to server ✓
6. Result: All images appear correctly after skill creation ✓

## Testing Steps

### Automated Tests
Run the backend tests:
```bash
cd /Users/kartiksuryavanshi/Desktop/opensources/oppia
python -m scripts.run_backend_tests --test_target=core.domain.html_cleaner_test
```

Expected: All tests pass, including the three new tests for nested components.

### Manual Verification
1. Open Oppia application
2. Navigate to Topics & Skills Dashboard
3. Click "Create Skill"
4. In the Review Material section, add content with:
   - A top-level image
   - A Collapsible component containing an image
   - A Tabs component with a tab containing an image
5. Fill in other required fields
6. Click "Create"
7. **Expected Result**: All 3 images should appear in the Skill Editor

## Files Modified
- `core/domain/html_cleaner.py`
  - Added: `get_rte_components_recursively()` function
  - Modified: `get_image_filenames_from_html_strings()` to use recursive extraction

- `core/domain/html_cleaner_test.py`
  - Added: `test_get_rte_components_recursively_with_collapsible()`
  - Added: `test_get_rte_components_recursively_with_tabs()`
  - Added: `test_get_image_filenames_from_nested_rte_components()`

## Technical Details

### HTML Encoding Levels
Nested RTE components use multiple levels of HTML entity encoding:
- Level 1: `"nested_img.svg"` → Base string
- Level 2: `&quot;nested_img.svg&quot;` → HTML entity encoding
- Level 3: `&amp;quot;nested_img.svg&amp;quot;` → Double encoding for nesting
- Level 4: `\\&amp;quot;` → Additional escaping for JSON in Tabs

The `get_rte_components()` function already handles this decoding via:
```python
attr_val = html.unescape(component_tag[attr])
customization_args[attr] = json.loads(attr_val)
```

Our recursive function leverages this existing decoding logic.

### Why This Approach Works
1. **Minimal changes**: Reuses existing `get_rte_components()` logic
2. **Proper decoding**: Leverages existing HTML unescaping and JSON parsing
3. **Type-safe**: Uses existing TypedDict types (`ComponentsDict`)
4. **Extensible**: Easy to add support for other container components
5. **Well-tested**: Comprehensive unit tests prevent regressions

## Related Issue
- **Issue**: #23145 - [BUG] Create New Skill Modal Review Material: images inserted in nested RTE components not saving/showing
- **Status**: Fixed
- **Verification**: All automated tests pass + manual testing confirms images appear correctly
