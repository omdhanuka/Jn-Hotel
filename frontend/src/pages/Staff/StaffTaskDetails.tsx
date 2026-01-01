import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskById, startTask, completeTask, StaffTask } from '../../services/staffApi';
import StaffNavbar from '../../components/Staff/StaffNavbar';

const StaffTaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<StaffTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await getTaskById(taskId!);
      setTask(response.task);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setActionLoading(true);
      await startTask(taskId!);
      await fetchTask();
      alert('Task started successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (photos.length === 0) {
      alert('Please upload at least one photo as proof of completion');
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      photos.forEach((photo) => formData.append('photos', photo));
      if (notes) formData.append('notes', notes);

      await completeTask(taskId!, formData);
      alert('Task completed successfully! Waiting for manager verification.');
      navigate('/staff/tasks');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + photos.length > 5) {
        alert('Maximum 5 photos allowed');
        return;
      }
      setPhotos([...photos, ...files]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading task details...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          {error || 'Task not found'}
        </div>
      </div>
    );
  }

  const canStart = task.status === 'pending';
  const canComplete = task.status === 'in_progress';
  const isFinished = ['completed', 'verified', 'rejected'].includes(task.status);

  return (
    <>
      <StaffNavbar />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/staff/tasks')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Tasks
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Task Details</h1>
        </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Task Info */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 capitalize">
            {task.taskType.replace('_', ' ')}
          </h2>
          <p className="text-gray-700 mb-4">{task.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Status:</span>
              <span className={`ml-2 px-3 py-1 rounded-full ${
                task.status === 'verified' ? 'bg-green-100 text-green-800' :
                task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                task.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {task.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="font-semibold">Priority:</span>
              <span className={`ml-2 px-3 py-1 rounded-full ${
                task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {task.priority.toUpperCase()}
              </span>
            </div>
            {task.room && (
              <div>
                <span className="font-semibold">Room:</span>
                <span className="ml-2">{task.room.roomNumber}</span>
              </div>
            )}
            {task.deadline && (
              <div>
                <span className="font-semibold">Deadline:</span>
                <span className="ml-2">{new Date(task.deadline).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isFinished && (
          <div className="flex space-x-4">
            {canStart && (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Starting...' : 'Start Task'}
              </button>
            )}
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={actionLoading || photos.length === 0}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Submitting...' : 'Complete Task'}
              </button>
            )}
          </div>
        )}

        {/* Photo Upload (for in-progress tasks) */}
        {canComplete && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Upload Completion Photos (Required)</h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="mb-4"
            />
            <p className="text-sm text-gray-600 mb-4">Upload up to 5 photos as proof of completion</p>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about the task completion..."
              className="w-full border rounded-lg px-4 py-2 h-24"
            />
          </div>
        )}

        {/* Existing Photos */}
        {task.photos && task.photos.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Completion Photos</h3>
            <div className="grid grid-cols-3 gap-4">
              {task.photos.map((photo, index) => (
                <img
                  key={index}
                  src={`${process.env.REACT_APP_API_URL}${photo}`}
                  alt={`Completion ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {task.status === 'rejected' && task.rejectionReason && (
          <div className="border-t pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Rejection Reason</h3>
              <p className="text-red-700">{task.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Verification Info */}
        {task.status === 'verified' && task.verifiedBy && (
          <div className="border-t pt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Verified</h3>
              <p className="text-green-700">
                Verified by {task.verifiedBy.firstName} {task.verifiedBy.lastName} on{' '}
                {task.verifiedAt && new Date(task.verifiedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default StaffTaskDetails;
