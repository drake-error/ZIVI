import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Heart, DollarSign, ArrowLeft, Plus, Phone, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const EmergencyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);
  const [fundRequests, setFundRequests] = useState<any[]>([]);
  const [showBloodDialog, setShowBloodDialog] = useState(false);
  const [showFundDialog, setShowFundDialog] = useState(false);

  const [bloodFormData, setBloodFormData] = useState({
    patientName: '',
    bloodType: '',
    unitsNeeded: '',
    location: '',
    hospital: '',
    contactNumber: '',
    urgency: 'Normal',
    notes: '',
  });

  const [fundFormData, setFundFormData] = useState({
    patientName: '',
    condition: '',
    amountNeeded: '',
    description: '',
    contactNumber: '',
    hospital: '',
  });

  const defaultTab = searchParams.get('tab') === 'fund' ? 'fund' : 'blood';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const [bloodData, fundData] = await Promise.all([
        api.getBloodRequests(),
        api.getFundRequests(),
      ]);
      setBloodRequests(bloodData.requests || []);
      setFundRequests(fundData.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleCreateBloodRequest = async () => {
    if (!accessToken) {
      toast.error('Please login to create a request');
      return;
    }

    if (!bloodFormData.patientName || !bloodFormData.bloodType || !bloodFormData.location || !bloodFormData.contactNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createBloodRequest(accessToken, bloodFormData);
      toast.success('Blood donation request created!');
      setShowBloodDialog(false);
      setBloodFormData({
        patientName: '',
        bloodType: '',
        unitsNeeded: '',
        location: '',
        hospital: '',
        contactNumber: '',
        urgency: 'Normal',
        notes: '',
      });
      loadRequests();
    } catch (error) {
      console.error('Error creating blood request:', error);
      toast.error('Failed to create request');
    }
  };

  const handleCreateFundRequest = async () => {
    if (!accessToken) {
      toast.error('Please login to create a request');
      return;
    }

    if (!fundFormData.patientName || !fundFormData.condition || !fundFormData.amountNeeded || !fundFormData.contactNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createFundRequest(accessToken, fundFormData);
      toast.success('Emergency fund request created!');
      setShowFundDialog(false);
      setFundFormData({
        patientName: '',
        condition: '',
        amountNeeded: '',
        description: '',
        contactNumber: '',
        hospital: '',
      });
      loadRequests();
    } catch (error) {
      console.error('Error creating fund request:', error);
      toast.error('Failed to create request');
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = ['Critical', 'Urgent', 'Normal'];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'Urgent': return 'bg-orange-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Emergency Platform</h1>
            <p className="text-sm text-gray-600">Community support for medical emergencies</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="blood">
              <Heart className="w-4 h-4 mr-2" />
              Blood Donation
            </TabsTrigger>
            <TabsTrigger value="fund">
              <DollarSign className="w-4 h-4 mr-2" />
              Emergency Fund
            </TabsTrigger>
          </TabsList>

          {/* Blood Donation Tab */}
          <TabsContent value="blood" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Blood Donation Requests</h2>
              <Button onClick={() => setShowBloodDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bloodRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </span>
                      <span className="text-2xl font-bold text-red-600">{request.bloodType}</span>
                    </div>
                    <CardTitle className="text-lg">{request.patientName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {request.hospital && (
                      <p className="text-sm font-medium text-gray-700">{request.hospital}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {request.location}
                    </div>
                    {request.unitsNeeded && (
                      <p className="text-sm text-gray-600">Units needed: {request.unitsNeeded}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {request.contactNumber}
                    </div>
                    {request.notes && (
                      <p className="text-sm text-gray-500 italic mt-2">{request.notes}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                      <Clock className="w-3 h-3" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    <Button className="w-full mt-3" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {bloodRequests.length === 0 && (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No blood donation requests at the moment</p>
                  <p className="text-sm mt-2">Be the first to create a request</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Emergency Fund Tab */}
          <TabsContent value="fund" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Emergency Fund Requests</h2>
              <Button onClick={() => setShowFundDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fundRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{request.patientName}</CardTitle>
                    <p className="text-sm text-gray-600">{request.condition}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {request.hospital && (
                      <p className="text-sm font-medium text-gray-700">{request.hospital}</p>
                    )}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Amount Needed</p>
                      <p className="text-2xl font-bold text-blue-600">${request.amountNeeded}</p>
                      {request.amountRaised > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Raised: ${request.amountRaised}
                        </p>
                      )}
                    </div>
                    {request.description && (
                      <p className="text-sm text-gray-600">{request.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {request.contactNumber}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Button size="sm">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Donate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {fundRequests.length === 0 && (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No emergency fund requests at the moment</p>
                  <p className="text-sm mt-2">Be the first to create a request</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Blood Request Dialog */}
      <Dialog open={showBloodDialog} onOpenChange={setShowBloodDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Blood Donation Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={bloodFormData.patientName}
                onChange={(e) => setBloodFormData({ ...bloodFormData, patientName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bloodType">Blood Type *</Label>
              <Select
                value={bloodFormData.bloodType}
                onValueChange={(value) => setBloodFormData({ ...bloodFormData, bloodType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select
                value={bloodFormData.urgency}
                onValueChange={(value) => setBloodFormData({ ...bloodFormData, urgency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unitsNeeded">Units Needed</Label>
              <Input
                id="unitsNeeded"
                value={bloodFormData.unitsNeeded}
                onChange={(e) => setBloodFormData({ ...bloodFormData, unitsNeeded: e.target.value })}
                placeholder="e.g., 2"
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={bloodFormData.location}
                onChange={(e) => setBloodFormData({ ...bloodFormData, location: e.target.value })}
                placeholder="City, State"
              />
            </div>
            <div>
              <Label htmlFor="hospital">Hospital</Label>
              <Input
                id="hospital"
                value={bloodFormData.hospital}
                onChange={(e) => setBloodFormData({ ...bloodFormData, hospital: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                type="tel"
                value={bloodFormData.contactNumber}
                onChange={(e) => setBloodFormData({ ...bloodFormData, contactNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={bloodFormData.notes}
                onChange={(e) => setBloodFormData({ ...bloodFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateBloodRequest} className="flex-1">
                Create Request
              </Button>
              <Button variant="outline" onClick={() => setShowBloodDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fund Request Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Emergency Fund Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fundPatientName">Patient Name *</Label>
              <Input
                id="fundPatientName"
                value={fundFormData.patientName}
                onChange={(e) => setFundFormData({ ...fundFormData, patientName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="condition">Medical Condition *</Label>
              <Input
                id="condition"
                value={fundFormData.condition}
                onChange={(e) => setFundFormData({ ...fundFormData, condition: e.target.value })}
                placeholder="e.g., Cancer Treatment"
              />
            </div>
            <div>
              <Label htmlFor="amountNeeded">Amount Needed ($) *</Label>
              <Input
                id="amountNeeded"
                type="number"
                value={fundFormData.amountNeeded}
                onChange={(e) => setFundFormData({ ...fundFormData, amountNeeded: e.target.value })}
                placeholder="10000"
              />
            </div>
            <div>
              <Label htmlFor="fundHospital">Hospital</Label>
              <Input
                id="fundHospital"
                value={fundFormData.hospital}
                onChange={(e) => setFundFormData({ ...fundFormData, hospital: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={fundFormData.description}
                onChange={(e) => setFundFormData({ ...fundFormData, description: e.target.value })}
                rows={4}
                placeholder="Describe the situation and how the funds will be used..."
              />
            </div>
            <div>
              <Label htmlFor="fundContactNumber">Contact Number *</Label>
              <Input
                id="fundContactNumber"
                type="tel"
                value={fundFormData.contactNumber}
                onChange={(e) => setFundFormData({ ...fundFormData, contactNumber: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateFundRequest} className="flex-1">
                Create Request
              </Button>
              <Button variant="outline" onClick={() => setShowFundDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
