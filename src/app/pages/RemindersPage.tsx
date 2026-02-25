import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Bell, ArrowLeft, Trash2, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const RemindersPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    medicineName: '',
    time: '',
    frequency: 'Daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    if (!accessToken) return;
    try {
      const data = await api.getReminders(accessToken);
      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast.error('Failed to load reminders');
    }
  };

  const handleAddReminder = async () => {
    if (!accessToken) return;
    if (!formData.medicineName || !formData.time) {
      toast.error('Medicine name and time are required');
      return;
    }

    try {
      await api.addReminder(accessToken, formData);
      toast.success('Reminder added successfully!');
      setShowAddDialog(false);
      setFormData({
        medicineName: '',
        time: '',
        frequency: 'Daily',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        notes: '',
      });
      loadReminders();
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Failed to add reminder');
    }
  };

  const handleToggleReminder = async (id: string) => {
    if (!accessToken) return;
    try {
      await api.toggleReminder(accessToken, id);
      loadReminders();
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast.error('Failed to toggle reminder');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!accessToken) return;
    try {
      await api.deleteReminder(accessToken, id);
      toast.success('Reminder deleted');
      loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const frequencies = ['Daily', 'Twice Daily', 'Three Times Daily', 'Weekly', 'As Needed'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Medicine Reminders</h1>
              <p className="text-sm text-gray-600">Never miss your medication time</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> In a production app, these reminders would trigger actual push notifications at the scheduled times. 
            This prototype displays the reminder schedule only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className={`${!reminder.enabled ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${reminder.enabled ? 'text-blue-500' : 'text-gray-400'}`} />
                      {reminder.medicineName}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium">{reminder.time}</p>
                </div>
                <p className="text-sm text-gray-600">Frequency: {reminder.frequency}</p>
                {reminder.startDate && (
                  <p className="text-sm text-gray-600">
                    Start: {new Date(reminder.startDate).toLocaleDateString()}
                  </p>
                )}
                {reminder.endDate && (
                  <p className="text-sm text-gray-600">
                    End: {new Date(reminder.endDate).toLocaleDateString()}
                  </p>
                )}
                {reminder.notes && (
                  <p className="text-sm text-gray-500 italic">{reminder.notes}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Label htmlFor={`toggle-${reminder.id}`} className="text-sm">
                    {reminder.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id={`toggle-${reminder.id}`}
                    checked={reminder.enabled}
                    onCheckedChange={() => handleToggleReminder(reminder.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reminders.length === 0 && (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No reminders set yet</p>
              <p className="text-sm mt-2">Add your first reminder to get started</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medicine Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="medicineName">Medicine Name *</Label>
              <Input
                id="medicineName"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                placeholder="e.g., Aspirin"
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Take with food, etc..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddReminder} className="flex-1">
                Add Reminder
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
