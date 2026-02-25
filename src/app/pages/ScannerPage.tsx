import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Camera, Upload, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    dosage: '',
    frequency: '',
    notes: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    if (!accessToken) return;
    try {
      const data = await api.getMedicines(accessToken);
      setMedicines(data.medicines || []);
    } catch (error) {
      console.error('Error loading medicines:', error);
      toast.error('Failed to load medicines');
    }
  };

  const handleScan = () => {
    setScanning(true);
    // Simulate AI scanning with mock data
    setTimeout(() => {
      const mockExpiryDate = new Date();
      mockExpiryDate.setMonth(mockExpiryDate.getMonth() + Math.floor(Math.random() * 24) + 1);
      
      setFormData({
        ...formData,
        name: 'Detected Medicine',
        expiryDate: mockExpiryDate.toISOString().split('T')[0],
      });
      setScanning(false);
      setShowAddDialog(true);
      toast.success('Medicine scanned successfully!');
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScan();
    }
  };

  const handleAddMedicine = async () => {
    if (!accessToken) return;
    if (!formData.name || !formData.expiryDate) {
      toast.error('Name and expiry date are required');
      return;
    }

    try {
      await api.addMedicine(accessToken, formData);
      toast.success('Medicine added successfully!');
      setShowAddDialog(false);
      setFormData({ name: '', expiryDate: '', dosage: '', frequency: '', notes: '' });
      loadMedicines();
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine');
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!accessToken) return;
    try {
      await api.deleteMedicine(accessToken, id);
      toast.success('Medicine deleted');
      loadMedicines();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Failed to delete medicine');
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medicine Scanner</h1>
            <p className="text-sm text-gray-600">Scan and manage your medicines</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Scan Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Scan Medicine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleScan} disabled={scanning} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                {scanning ? 'Scanning...' : 'Scan with Camera'}
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="secondary"
                onClick={() => setShowAddDialog(true)}
                className="flex-1"
              >
                Add Manually
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Note: AI scanning uses mock data for demonstration. In production, this would use OCR and AI to detect expiry dates.
            </p>
          </CardContent>
        </Card>

        {/* Medicines List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Medicines ({medicines.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.map((medicine) => (
              <Card
                key={medicine.id}
                className={`${
                  isExpired(medicine.expiryDate)
                    ? 'border-red-500 bg-red-50'
                    : isExpiringSoon(medicine.expiryDate)
                    ? 'border-yellow-500 bg-yellow-50'
                    : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{medicine.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMedicine(medicine.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {(isExpired(medicine.expiryDate) || isExpiringSoon(medicine.expiryDate)) && (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Expires: {new Date(medicine.expiryDate).toLocaleDateString()}
                      </p>
                      {isExpired(medicine.expiryDate) && (
                        <p className="text-xs text-red-600 font-medium">EXPIRED</p>
                      )}
                      {!isExpired(medicine.expiryDate) && isExpiringSoon(medicine.expiryDate) && (
                        <p className="text-xs text-yellow-600 font-medium">EXPIRING SOON</p>
                      )}
                    </div>
                  </div>
                  {medicine.dosage && (
                    <p className="text-sm text-gray-600">Dosage: {medicine.dosage}</p>
                  )}
                  {medicine.frequency && (
                    <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>
                  )}
                  {medicine.notes && (
                    <p className="text-sm text-gray-500 italic">{medicine.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {medicines.length === 0 && (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No medicines added yet</p>
                <p className="text-sm mt-2">Scan or add medicines to get started</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Medicine Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Aspirin"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., Twice daily"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMedicine} className="flex-1">
                Add Medicine
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
