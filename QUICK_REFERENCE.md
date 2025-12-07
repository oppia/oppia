# Badge System - Quick Reference Guide

## 🚀 Quick Start

### 1. Initialize the System
```bash
python badge_system_setup.py
```

### 2. Test the API
```bash
# Get all badges
curl http://localhost:8080/badgehandler/list

# Get specific badge
curl http://localhost:8080/badgehandler/badge_id_here

# Get user badges
curl http://localhost:8080/badgehandler/userbadges

# Get leaderboard
curl http://localhost:8080/badgehandler/leaderboard
```

### 3. Use in Angular
```typescript
import { LearnerBadgeService } from 'services/learner-badge.service';

constructor(private badgeService: LearnerBadgeService) {}

// Get all badges
this.badgeService.getAllBadges().subscribe(
  response => console.log(response.badges)
);

// Get user badges
this.badgeService.getUserBadges().subscribe(
  response => console.log(response.user_badges)
);

// Toggle favorite
this.badgeService.toggleFavoriteBadge('badge_id', true).subscribe();

// Share badge
this.badgeService.shareBadge('badge_id').subscribe();
```

## 📁 File Structure

```
Backend Files:
- core/domain/badge_domain.py          (Domain objects)
- core/domain/badge_services.py        (Business logic)
- core/storage/badge/badge_models.py   (Database models)
- core/storage/badge/gae_models.py     (GAE compatibility)
- core/controllers/badge_handlers.py   (API endpoints)

Frontend Files:
- core/templates/services/learner-badge.service.ts
- core/templates/pages/learner-dashboard-page/badges/
  ├── badge-card.component.ts
  ├── badge-card.component.html
  ├── badge-card.component.css
  ├── badge-list.component.ts
  ├── badge-list.component.html
  └── badge-list.component.css

Documentation:
- README_BADGE_SYSTEM.md               (Complete documentation)
- BADGE_SYSTEM_IMPLEMENTATION_SUMMARY.md
- badge_system_setup.py                (Setup script)
- QUICK_REFERENCE.md                   (This file)
```

## 🔧 Key Configuration

### Database Indexes (app.yaml)
```yaml
- kind: Badge
  properties:
  - name: category
  - name: rarity
  - name: tier
  - name: total_awards
  - name: created_on
```

### Environment Variables
```
BADGE_CACHE_TTL=300              # 5 minutes
LEADERBOARD_CACHE_TTL=600        # 10 minutes
RATE_LIMIT_REQUESTS=100          # Per minute
RATE_LIMIT_WINDOW=60000          # In milliseconds
```

## 📊 API Endpoints Quick Reference

### Public Endpoints

#### List Badges
```
GET /badgehandler/list?category=LEARNING&rarity=Rare&page=1&page_size=20
Returns: { badges: [], pagination: {} }
```

#### Get Badge Details
```
GET /badgehandler/{badge_id}
Returns: { badge: {...} }
```

#### Get User Badges
```
GET /badgehandler/userbadges?page=1&page_size=20
Returns: { user_badges: [], badge_details: [], pagination: {} }
```

#### Get Badge Progress
```
GET /badgehandler/progress?badge_id={badge_id}
Returns: { statistics: {...}, badge_progress: {...} }
```

#### Toggle Favorite
```
POST /badgehandler/favorite/{badge_id}
Body: { is_favorite: true }
Returns: { status: "success", user_badge: {...} }
```

#### Share Badge
```
POST /badgehandler/share/{badge_id}
Returns: { status: "success", share_count: 5 }
```

#### Get Leaderboard
```
GET /badgehandler/leaderboard?limit=20
Returns: { leaderboard: [{rank, badge_id, name, total_awards, ...}] }
```

#### Update Progress
```
POST /badgehandler/progress
Body: { 
  badge_id: "streak",
  current_progress: 7,
  event_type: "STREAK",
  progress_data: {}
}
Returns: { status: "success", awarded_badges: ["week_warrior"] }
```

### Admin Endpoints (Requires ACL)

#### Create Badge
```
POST /badgehandler
Body: { badge_id, name, description, icon_svg, ... }
```

#### Update Badge
```
PUT /badgehandler/{badge_id}
Body: { name, description, ... }
```

#### Delete Badge
```
DELETE /badgehandler/{badge_id}
```

#### Award Badge Manually
```
POST /badgehandler/award
Body: { user_id: "user123", badge_id: "badge_id" }
```

## 🎨 Styling Classes

### Badge Card Classes
```css
.badge-card-small      /* 80px width */
.badge-card-medium     /* 120px width (default) */
.badge-card-large      /* 160px width */

.rarity-common         /* Gray style */
.rarity-rare           /* Blue with glow */
.rarity-epic           /* Purple with glow */
.rarity-legendary      /* Orange with glow */
.rarity-mythic         /* Pink with glow */

.tier-bronze           /* Bronze color */
.tier-silver           /* Silver color */
.tier-gold             /* Gold color */
.tier-platinum         /* Platinum color */
.tier-diamond          /* Diamond color */

.badge-earned          /* Full opacity */
.badge-locked          /* 60% opacity + grayscale */
.badge-favorite        /* Special background */
```

### Colors
```scss
$common-color: #757575;
$rare-color: #2196F3;
$epic-color: #9C27B0;
$legendary-color: #FF9800;
$mythic-color: #E91E63;

$bronze-color: #CD7F32;
$silver-color: #C0C0C0;
$gold-color: #FFD700;
$platinum-color: #E5E4E2;
$diamond-color: #B9F2FF;
```

## 🧪 Testing Commands

### Run Backend Tests
```bash
python core/domain/badge_services_test.py

# With coverage
coverage run core/domain/badge_services_test.py
coverage report
```

### Test Component
```bash
ng test --include='**/badge-*.component.spec.ts'
```

### Manual API Testing
```bash
# Using curl
curl -X GET http://localhost:8080/badgehandler/list \
  -H "Authorization: Bearer YOUR_TOKEN"

# Using httpie
http GET localhost:8080/badgehandler/list

# Using Postman
- Import badge_api.postman_collection.json
- Set variables and run requests
```

## 🔒 Security Checklist

- [ ] All endpoints have authentication checks
- [ ] Admin endpoints protected with ACL decorators
- [ ] User inputs sanitized
- [ ] Rate limiting configured
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] XSS prevention in badge descriptions
- [ ] SQL injection prevention via ORM

## 📈 Performance Optimization

### Cache Invalidation
```python
# Clear badge cache
badgeService.badgesCache$.next([])

# Update analytics
badgeAnalyticsService.update_badge_analytics(badge_id)
```

### Database Optimization
```python
# Use indexes for queries
badges = BadgeModel.query(BadgeModel.category == 'LEARNING').fetch()

# Use batch operations
badge_models = BadgeModel.query().fetch(limit=1000)
```

### Frontend Optimization
```typescript
// Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Unsubscribe from observables
private destroy$ = new Subject<void>();
this.badgeService.getAllBadges()
  .pipe(takeUntil(this.destroy$))
  .subscribe(...)

// Use shareReplay for caching
getAllBadges().pipe(shareReplay(1))
```

## 🐛 Common Issues & Solutions

### Issue: Badge not appearing
**Solution**: Check criteria matching, refresh cache
```python
badge_services.BadgeService.clearCache()
badge_services.BadgeAnalyticsService.update_badge_analytics(badge_id)
```

### Issue: Slow badge loading
**Solution**: Check indexes, enable caching
```python
# Verify indexes
gcloud datastore create-indexes index.yaml

# Check cache hit rate
monitoring.get_cache_hit_rate()
```

### Issue: Share button not working
**Solution**: Check browser support, HTTPS
```typescript
if (!navigator.share) {
  console.log('Web Share API not supported');
  // Use clipboard fallback
  badgeService.copyBadgeToClipboard(badge, text);
}
```

## 📚 Useful Links

- [Full Documentation](./README_BADGE_SYSTEM.md)
- [Implementation Summary](./BADGE_SYSTEM_IMPLEMENTATION_SUMMARY.md)
- [Component Development Guide](./docs/component-guide.md)
- [API Reference](./docs/api-reference.md)

## 💡 Tips & Tricks

### Create Custom Badges Programmatically
```python
badge = badge_services.BadgeService.create_badge(
    badge_id="custom_badge",
    name="Custom Badge",
    description="A custom badge for special achievements",
    icon_svg="<svg>...</svg>",
    rarity="Rare",
    badge_type="CHALLENGE",
    tier="Gold",
    criteria_dict={
        "condition_type": "custom_metric",
        "threshold": 100
    },
    category="CREATIVITY",
    xp_reward=500
)
```

### Query Multiple Filters
```python
badges = badge_services.BadgeService.get_all_badges()
filtered = [
    b for b in badges 
    if b.rarity.value == "Epic" 
    and b.category.value == "PROGRAMMING"
]
```

### Track User Progress
```typescript
this.badgeService.updateProgress(
  badgeId, 
  currentProgress, 
  progressData, 
  eventType
).subscribe(response => {
  if (response.awarded_badges.length > 0) {
    console.log('New badges earned!', response.awarded_badges);
  }
});
```

### Get User Statistics
```typescript
this.badgeService.getBadgeProgress().subscribe(
  stats => {
    console.log('Total badges:', stats.statistics.total_badges);
    console.log('Total XP:', stats.statistics.total_xp);
    console.log('By rarity:', stats.statistics.by_rarity);
  }
);
```

---

**Last Updated**: December 2024
**Version**: 1.0.0
