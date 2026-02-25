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
import { FileText, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'General',
    notes: '',
    fileUrl: '',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    if (!accessToken) return;
    try {
      const data = await api.getReports(accessToken);
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    }
  };

  const handleAddReport = async () => {
    if (!accessToken) return;
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    try {
      await api.addReport(accessToken, formData);
      toast.success('Report added successfully!');
      setShowAddDialog(false);
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        category: 'General',
        notes: '',
        fileUrl: '',
      });
      loadReports();
    } catch (error) {
      console.error('Error adding report:', error);
      toast.error('Failed to add report');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!accessToken) return;
    try {
      await api.deleteReport(accessToken, id);
      toast.success('Report deleted');
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const categories = ['General', 'Blood Test', 'X-Ray', 'MRI', 'CT Scan', 'Prescription', 'Vaccination', 'Other'];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'General': 'bg-gray-500',
      'Blood Test': 'bg-red-500',
      'X-Ray': 'bg-blue-500',
      'MRI': 'bg-purple-500',
      'CT Scan': 'bg-indigo-500',
      'Prescription': 'bg-green-500',
      'Vaccination': 'bg-yellow-500',
      'Other': 'bg-gray-400',
    };
    return colors[category] || 'bg-gray-500';
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
              <p className="text-sm text-gray-600">Store and manage your medical documents</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Report
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getCategoryColor(report.category)}`}>
                        {report.category}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  Date: {new Date(report.date).toLocaleDateString()}
                </p>
                {report.notes && (
                  <p className="text-sm text-gray-500">{report.notes}</p>
                )}
                {report.fileUrl && (
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Document
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No medical reports added yet</p>
              <p className="text-sm mt-2">Add your first report to get started</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Report
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Add Report Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medical Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Blood Test Results"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this report..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="fileUrl">Document URL (optional)</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddReport} className="flex-1">
                Add Report
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
