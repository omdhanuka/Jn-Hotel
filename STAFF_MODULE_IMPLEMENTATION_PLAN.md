# Staff Management Module - Implementation Guide

## Status: Ready to Implement

This document provides the complete implementation plan for the JN Palace Hotel Staff Management & Operations Module.

## Already Created Files

### Backend Models (✅ Complete)
- `/backend/src/models/StaffTask.ts` - Task management with photo proof
- `/backend/src/models/StaffProfile.ts` - Staff profiles with performance metrics
- `/backend/src/models/StaffLeave.ts` - Leave application system
- `/backend/src/models/StaffNotification.ts` - Real-time notifications
- `/backend/src/middleware/staffAuth.ts` - Authentication middleware

## Files to Create

### Backend Controllers

#### 1. `/backend/src/controllers/staffTaskController.ts`
```typescript
// Key functions needed:
- getMyTasks() - Get staff member's assigned tasks
- getTaskById() - Get single task details
- startTask() - Mark task as in progress
- completeTask() - Complete with photo upload
- getMyTaskStats() - Dashboard statistics
- createCheckoutCleaningTask() - Auto-generate on checkout
- createMaintenanceTask() - Auto-generate maintenance task
```

#### 2. `/backend/src/controllers/staffProfileController.ts`
```typescript
// Key functions:
- getMyProfile() - Get current staff profile
- updateMyProfile() - Update profile details
- getMyPerformanceMetrics() - Performance stats
- getMyActivityLog() - Task history
```

#### 3. `/backend/src/controllers/staffLeaveController.ts`
```typescript
// Key functions:
- applyLeave() - Submit leave application
- getMyLeaves() - Get leave history
- cancelLeave() - Cancel pending leave
- getLeaveBalance() - Check available leave days
```

#### 4. `/backend/src/controllers/staffNotificationController.ts`
```typescript
// Key functions:
- getMyNotifications() - Get all notifications
- markAsRead() - Mark notification as read
- getUnreadCount() - Count unread notifications
```

#### 5. `/backend/src/controllers/managerTaskController.ts`
```typescript
// Manager-side task management:
- getAllTasks() - View all staff tasks
- verifyTask() - Approve completed task
- rejectTask() - Reject with feedback
- reassignTask() - Change assignment
- createManualTask() - Manually assign task
```

### Backend Routes

#### 6. `/backend/src/routes/staffRoutes.ts`
```typescript
import express from 'express';
import { staffAuth } from '../middleware/staffAuth';
import * as taskController from '../controllers/staffTaskController';
import * as profileController from '../controllers/staffProfileController';
import * as leaveController from '../controllers/staffLeaveController';
import * as notificationController from '../controllers/staffNotificationController';

const router = express.Router();

// All routes require staff authentication
router.use(staffAuth);

// Task routes
router.get('/tasks', taskController.getMyTasks);
router.get('/tasks/stats', taskController.getMyTaskStats);
router.get('/tasks/:taskId', taskController.getTaskById);
router.patch('/tasks/:taskId/start', taskController.startTask);
router.patch('/tasks/:taskId/complete', taskController.completeTask);

// Profile routes
router.get('/profile', profileController.getMyProfile);
router.patch('/profile', profileController.updateMyProfile);
router.get('/profile/metrics', profileController.getMyPerformanceMetrics);
router.get('/profile/activity', profileController.getMyActivityLog);

// Leave routes
router.post('/leaves', leaveController.applyLeave);
router.get('/leaves', leaveController.getMyLeaves);
router.get('/leaves/balance', leaveController.getLeaveBalance);
router.delete('/leaves/:leaveId', leaveController.cancelLeave);

// Notification routes
router.get('/notifications', notificationController.getMyNotifications);
router.patch('/notifications/:notificationId/read', notificationController.markAsRead);
router.get('/notifications/unread-count', notificationController.getUnreadCount);

export default router;
```

### Frontend Pages

#### 7. `/frontend/src/pages/Staff/StaffDashboard.tsx`
- Overview cards (Pending Tasks, Completed Today, Unread Notifications)
- Quick actions
- Recent tasks list
- Notifications panel

#### 8. `/frontend/src/pages/Staff/StaffTasksList.tsx`
- Filterable task list (by status, priority, type)
- Task cards with color coding
- Quick start/complete actions

#### 9. `/frontend/src/pages/Staff/StaffTaskDetails.tsx`
- Full task information
- Photo upload interface (up to 5 photos)
- Completion notes
- Submit for verification
- Rejection feedback display

#### 10. `/frontend/src/pages/Staff/StaffLeaveManagement.tsx`
- Leave application form
- Leave balance display
- Leave history with status
- Cancel pending leaves

#### 11. `/frontend/src/pages/Staff/StaffProfile.tsx`
- Personal information
- Performance metrics display
- Activity log
- Attendance history

### Frontend Services

#### 12. `/frontend/src/services/staffApi.ts`
```typescript
// API service functions matching backend endpoints
export const getMyTasks = () => axios.get('/api/staff/tasks');
export const startTask = (taskId: string) => axios.patch(`/api/staff/tasks/${taskId}/start`);
export const completeTask = (taskId: string, data: FormData) => 
  axios.patch(`/api/staff/tasks/${taskId}/complete`, data);
// ... all other API functions
```

#### 13. `/frontend/src/types/staff.ts`
```typescript
// TypeScript interfaces for all entities
export interface StaffTask {
  _id: string;
  taskType: string;
  title: string;
  // ... all fields
}
// ... other interfaces
```

## Integration Points

### 1. Checkout Integration
Update `/backend/src/controllers/managerCheckinCheckoutController.ts`:
```typescript
import { createCheckoutCleaningTask } from './staffTaskController';

// In performCheckout function, after setting room to cleaning:
await createCheckoutCleaningTask(booking._id.toString(), room._id.toString());
```

### 2. Server Routes Registration
Update `/backend/src/server.ts`:
```typescript
import staffRoutes from './routes/staffRoutes';
app.use('/api/staff', staffRoutes);
```

### 3. Frontend Routes
Update `/frontend/src/App.tsx`:
```typescript
<Route path="/staff/dashboard" element={<StaffDashboard />} />
<Route path="/staff/tasks" element={<StaffTasksList />} />
<Route path="/staff/tasks/:taskId" element={<StaffTaskDetails />} />
<Route path="/staff/leaves" element={<StaffLeaveManagement />} />
<Route path="/staff/profile" element={<StaffProfile />} />
```

## Implementation Steps

1. **Phase 1: Core Backend (Priority)**
   - Create staff task controller with auto-generation
   - Create staff profile controller
   - Create staff routes
   - Integrate with checkout controller
   - Test auto-task creation

2. **Phase 2: Leave & Notifications**
   - Create leave controller
   - Create notification controller
   - Add manager verification endpoints

3. **Phase 3: Frontend UI**
   - Create staff dashboard
   - Create task management pages
   - Add photo upload functionality
   - Create leave management page

4. **Phase 4: Testing & Polish**
   - Test complete workflow
   - Add validation
   - Optimize performance
   - Mobile responsiveness

## Key Features Summary

✅ **Automatic Task Assignment**
- Checkout triggers cleaning task
- Maintenance requests create tasks
- Tasks auto-assigned to available staff

✅ **Photo Proof System**
- Upload up to 5 photos per task
- Manager verification required
- Rejection with feedback

✅ **Real-time Notifications**
- Task assignments
- Approval/rejection updates
- Urgent requests

✅ **Leave Management**
- Application with balance checking
- Manager approval workflow
- Leave history tracking

✅ **Performance Tracking**
- Tasks completed count
- Average completion time
- Rating system
- Activity logs

✅ **Security**
- Role-based access control
- Staff cannot access admin features
- Secure authentication
- Protected routes

## Next Steps

Run this command to start implementation:
```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm start
```

Would you like me to:
1. Create all controller files with complete implementations?
2. Create all frontend pages?
3. Create the API service layer?
4. Set up the complete integration?

Let me know which part you'd like me to build first!
