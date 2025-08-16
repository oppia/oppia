# Math Classroom Generator Admin Feature

## 🎯 Context

This PR implements a one-click Math Classroom generator for the Admin page, addressing the need for quick classroom setup during development and testing. This addresses issues #22455 and #22584.

## 🚀 Solution

The **Math Classroom Generator** creates a complete, functional mathematics classroom setup that replicates the structure found on oppiatestserver.org. With a single click, curriculum administrators can generate:

- **3 Skills**: Basic Fractions, Fraction Operations, Advanced Fractions
- **1 Topic**: Fractions with 3 subtopics and diagnostic test
- **1 Story**: Fractions Story with 3 interactive chapters
- **3 Explorations**: Chapter 1, 2, 3 as interactive lessons
- **9 Questions**: 3 questions per skill for practice sessions
- **1 Classroom**: Math classroom with proper thumbnails and banners

## 🔧 Implementation Details

- **Admin Action**: `generate_full_math_classroom` in `AdminHandler`
- **Entity Creation**: Follows Oppia's established patterns for admin actions
- **Error Handling**: Proper validation and rollback mechanisms
- **Security**: Restricted to curriculum admins in development mode only
- **Logging**: Comprehensive logging with `[ADMIN]` prefix
- **Entity Ordering**: Skills → Topic → Story → Explorations → Story Nodes (prevents missing-entity errors)

## 📸 Screenshots

[Add screenshots showing:]

- Admin page with new generator button
- Generated classroom in classroom list
- Fractions topic with subtopics
- Story progression through chapters
- Practice session with generated questions

## 🧪 Testing

Comprehensive test coverage including:

- ✅ Dev mode restriction validation
- ✅ Curriculum admin role requirement
- ✅ Entity creation order verification (prevents missing-entity errors)
- ✅ Entity relationship validation
- ✅ Helper function testing
- ✅ Complete classroom functionality verification

### Test Coverage Details

- **Handler Tests**: Verify access control and dev mode restrictions
- **Entity Order Tests**: Ensure skills → topic → story → explorations creation sequence
- **Relationship Tests**: Verify all entities are properly linked
- **Helper Function Tests**: Test `_create_dummy_skill` and `_create_dummy_question` methods
- **Integration Tests**: Verify complete classroom functionality

## 📁 Files Changed

- `core/controllers/admin.py` - Main implementation with `_generate_full_math_classroom` method
- `core/controllers/admin_test.py` - Comprehensive test coverage for all scenarios
- `docs/admin.md` - Admin page documentation including Math Classroom generator
- `docs/development.md` - Local development instructions and troubleshooting

## 🎉 Benefits

- **Developer Experience**: One-click classroom setup for testing
- **Consistency**: Replicates oppiatestserver.org structure
- **Efficiency**: Eliminates manual entity creation during development
- **Quality**: Proper entity linking and validation prevents runtime errors
- **Testing**: Provides realistic data for testing classroom functionality

## 🔒 Security & Access Control

- Only accessible in development mode (`DEV_MODE = True`)
- Requires curriculum admin role (`feconf.ROLE_ID_CURRICULUM_ADMIN`)
- Comprehensive logging for audit trails
- Proper error handling and validation

## 📝 Review Notes

- All entities are created in correct order to prevent missing-entity errors
- Follows Oppia's established patterns for admin actions
- Comprehensive test coverage prevents regression
- Proper documentation for admin usage and local development
- No breaking changes to existing functionality

## 📋 Testing Instructions

1. **Local Setup**: Ensure `DEV_MODE = True` and user has curriculum admin role
2. **Generate Classroom**: Use admin action to create math classroom
3. **Verify Entities**: Check that all entities are created and properly linked
4. **Test Functionality**: Navigate through classroom, topic, story, and practice sessions
5. **Run Tests**: Execute `python -m scripts.run_backend_tests --test_target=core.controllers.admin_test.GenerateFullMathClassroomTest`

## 🔗 Related Issues

Fixes #22455, #22584

## 📝 Additional Notes

This feature is designed for development and testing purposes only. It creates a realistic classroom environment that developers can use to test Oppia's classroom functionality without manually creating entities. The generated content follows Oppia's content standards and provides a complete testing scenario.
