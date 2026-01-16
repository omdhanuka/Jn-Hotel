# 📬 Staff Notification System

## Overview

The Staff Notification System provides real-time updates to hotel staff members about task assignments, approvals, rejections, leave requests, and other important updates.

## ✨ Features

### 1. **Real-Time Notifications**
- Task assignments
- Task approvals/rejections
- Leave request approvals/rejections
- Urgent alerts
- Shift schedule updates

### 2. **Priority Levels**
- 🔴 **High**: Urgent matters, task rejections
- 🟡 **Medium**: Task assignments, leave updates
- 🔵 **Low**: Task approvals, general updates

### 3. **Notification Types**
| Type | Icon | Description |
|------|------|-------------|
| `task_assigned` | 📝 | New task assigned to staff |
| `task_approved` | ✅ | Task completed and approved |
| `task_rejected` | ❌ | Task needs revision |
| `leave_approved` | ✅ | Leave request approved |
| `leave_rejected` | ❌ | Leave request rejected |
| `urgent` | ⚡ | Urgent alert |
| `shift_update` | 🕐 | Schedule changes |

## 🎯 User Interface

### Staff Notification Page
**Location**: `/staff/notifications`

**Features**:
- View all notifications
- Filter by read/unread status
- Mark individual notifications as read
- Mark all as read (bulk action)
- Auto-redirect to related tasks/leaves
- Real-time unread count badge
- Responsive design

### Notification Bell (Navbar)
- 🔔 Bell icon with unread badge
- Shows count of unread notifications
- Click to navigate to notifications page
- Updates automatically

## 📡 API Endpoints

### Get Staff Notifications
```http
GET /api/staff/notifications
Authorization: Bearer <staff_token>
```

**Response**:
```json
{
  "notifications": [
    {
      "_id": "...",
      "type": "task_assigned",
      "title": "New Task: Cleaning",
      "message": "You have been assigned a cleaning task in Room 101",
      "priority": "medium",
      "isRead": false,
      "createdAt": "2026-01-16T10:30:00Z",
      "relatedTask": { ... }
    }
  ]
}
```

### Get Unread Count
```http
GET /api/staff/notifications/unread-count
Authorization: Bearer <staff_token>
```

**Response**:
```json
{
  "unreadCount": 5
}
```

### Mark as Read
```http
PATCH /api/staff/notifications/:notificationId/read
Authorization: Bearer <staff_token>
```

### Mark All as Read
```http
PATCH /api/staff/notifications/read-all
Authorization: Bearer <staff_token>
```

## 🛠️ Backend Implementation

### Database Model
**File**: `backend/src/models/StaffNotification.ts`

```typescript
interface IStaffNotification {
  recipient: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedTask?: ObjectId;
  relatedLeave?: ObjectId;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}
```

**Indexes**:
- `recipient + isRead` (for fast unread queries)
- `createdAt` (for sorting)

### Controller Functions
**File**: `backend/src/controllers/staffNotificationController.ts`

- ✅ `getMyNotifications` - Fetch all notifications
- ✅ `getUnreadCount` - Get unread count
- ✅ `markAsRead` - Mark single notification as read
- ✅ `markAllAsRead` - Mark all as read

### Utility Helper
**File**: `backend/src/utils/notificationHelper.ts`

Auto-creates notifications when:
- ✅ Manager assigns a task → `notifyTaskAssigned()`
- ✅ Manager approves a task → `notifyTaskApproved()`
- ✅ Manager rejects a task → `notifyTaskRejected()`
- ✅ Manager approves leave → `notifyLeaveApproved()`
- ✅ Manager rejects leave → `notifyLeaveRejected()`
- ✅ Urgent alerts → `notifyUrgent()`
- ✅ Shift updates → `notifyShiftUpdate()`

### Integration Points

**Task Assignment** (`managerStaffController.ts`):
```typescript
// Automatically sends notification when task is created
await StaffNotification.create({
  recipient: staffId,
  type: 'task_assigned',
  title: `New Task: ${title}`,
  message: description,
  relatedTask: task._id,
  priority: task.priority
});
```

**Task Verification** (`managerTaskController.ts`):
```typescript
// Sends notification on approval/rejection
await StaffNotification.create({
  recipient: task.assignedTo,
  type: 'task_approved',
  title: 'Task Approved ✅',
  message: `Your task "${task.title}" has been verified`,
  relatedTask: task._id
});
```

**Leave Management** (`staffLeaveController.ts`):
```typescript
// Sends notification when leave is approved/rejected
await StaffNotification.create({
  recipient: leave.user,
  type: 'leave_approved',
  title: 'Leave Approved ✅',
  message: `Your leave request has been approved`,
  relatedLeave: leave._id
});
```

## 🎨 Frontend Components

### Main Component
**File**: `frontend/src/pages/Staff/StaffNotifications.tsx`

**Features**:
- Beautiful card-based layout
- Color-coded priorities
- Type-specific icons
- Relative timestamps ("2 hours ago")
- Click to mark as read
- Quick links to related tasks/leaves

### Navbar Integration
**File**: `frontend/src/components/Staff/StaffNavbar.tsx`

**Features**:
- Bell icon with badge
- Real-time unread count
- Click to navigate to notifications

### API Service
**File**: `frontend/src/services/staffApi.ts`

```typescript
export const getMyNotifications = async () => { ... }
export const markAsRead = async (id: string) => { ... }
export const markAllAsRead = async () => { ... }
export const getUnreadCount = async () => { ... }
```

## 🚀 Usage Examples

### Create a Custom Notification (Backend)
```typescript
import { notifyUrgent } from '../utils/notificationHelper';

// Send urgent notification to staff
await notifyUrgent(
  staffId,
  'Emergency Maintenance Required',
  'Water leak reported in Room 305. Please attend immediately.'
);
```

### Bulk Notification
```typescript
import { notifyMultipleStaff } from '../utils/notificationHelper';

// Notify all housekeeping staff
const housekeepingStaff = await User.find({ 
  department: 'housekeeping',
  role: 'staff' 
});

await notifyMultipleStaff(
  housekeepingStaff.map(s => s._id),
  {
    type: 'shift_update',
    title: 'Shift Schedule Updated',
    message: 'Your shift schedule for next week has been updated',
    priority: 'medium'
  }
);
```

## 📊 Performance Optimization

### Database Indexes
```typescript
// Fast queries for unread notifications
staffNotificationSchema.index({ recipient: 1, isRead: 1 });

// Fast sorting by date
staffNotificationSchema.index({ createdAt: -1 });
```

### Automatic Cleanup
Remove old read notifications (30+ days) to keep database clean:

```typescript
import { cleanupOldNotifications } from '../utils/notificationHelper';

// Run daily via cron job
await cleanupOldNotifications(30);
```

## 🧪 Testing

### Test Notification Creation
```typescript
// Create test notification
POST /api/staff/notifications (manager only)
{
  "staffId": "staff_user_id",
  "type": "urgent",
  "title": "Test Notification",
  "message": "This is a test",
  "priority": "high"
}
```

### Verify Unread Count
1. Login as staff member
2. Check navbar bell badge
3. Navigate to `/staff/notifications`
4. Verify notifications appear

## 🎯 Key Benefits

1. **Instant Communication** - Staff get updates immediately
2. **Reduced Miscommunication** - Clear, documented messages
3. **Better Task Management** - Quick links to related tasks
4. **Audit Trail** - All notifications are logged
5. **Mobile-Friendly** - Responsive design for all devices

## 🔐 Security

- ✅ Staff can only see their own notifications
- ✅ JWT authentication required
- ✅ Role-based access control
- ✅ No sensitive data exposed

## 📱 Mobile Experience

- Fully responsive design
- Touch-optimized interactions
- Fast loading with pagination
- Works on all screen sizes

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 🚦 Status

**✅ Production Ready**

All features implemented and tested:
- [x] Database model with indexes
- [x] Backend controllers
- [x] API endpoints
- [x] Frontend UI component
- [x] Navbar integration
- [x] Auto-notification triggers
- [x] Real-time unread count
- [x] Responsive design

## 📞 Support

For issues or feature requests, contact the development team.

---

**Last Updated**: January 16, 2026
**Version**: 1.0.0
