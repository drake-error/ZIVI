import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, Download, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export const QRCodePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);
  
  const [medicalInfo, setMedicalInfo] = useState({
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    medications: '',
    emergencyNotes: '',
  });

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!accessToken) return;
    try {
      const [medicalData, contactsData] = await Promise.all([
        api.getMedicalInfo(accessToken),
        api.getEmergencyContacts(accessToken),
      ]);
      
      if (medicalData.medicalInfo) {
        setMedicalInfo(medicalData.medicalInfo);
      }
      if (contactsData.contacts) {
        setContacts(contactsData.contacts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaveMedicalInfo = async () => {
    if (!accessToken) return;
    try {
      await api.updateMedicalInfo(accessToken, medicalInfo);
      toast.success('Medical information saved!');
    } catch (error) {
      console.error('Error saving medical info:', error);
      toast.error('Failed to save medical information');
    }
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Name and phone are required');
      return;
    }
    setContacts([...contacts, newContact]);
    setNewContact({ name: '', relationship: '', phone: '' });
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSaveContacts = async () => {
    if (!accessToken) return;
    try {
      await api.updateEmergencyContacts(accessToken, contacts);
      toast.success('Emergency contacts saved!');
    } catch (error) {
      console.error('Error saving contacts:', error);
      toast.error('Failed to save contacts');
    }
  };

  const emergencyData = {
    name: user?.user_metadata?.name || user?.email || 'Unknown',
    bloodType: medicalInfo.bloodType,
    allergies: medicalInfo.allergies,
    conditions: medicalInfo.chronicConditions,
    medications: medicalInfo.medications,
    notes: medicalInfo.emergencyNotes,
    contacts: contacts.map(c => `${c.name} (${c.relationship}): ${c.phone}`).join(', '),
  };

  const qrData = JSON.stringify(emergencyData);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = 'emergency-qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const relationships = ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emergency QR Code</h1>
            <p className="text-sm text-gray-600">Quick access emergency information</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={medicalInfo.bloodType}
                    onValueChange={(value) => setMedicalInfo({ ...medicalInfo, bloodType: value })}
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
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={medicalInfo.allergies}
                    onChange={(e) => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
                    placeholder="e.g., Penicillin, Peanuts"
                  />
                </div>
                <div>
                  <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                  <Input
                    id="chronicConditions"
                    value={medicalInfo.chronicConditions}
                    onChange={(e) => setMedicalInfo({ ...medicalInfo, chronicConditions: e.target.value })}
                    placeholder="e.g., Diabetes, Hypertension"
                  />
                </div>
                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Input
                    id="medications"
                    value={medicalInfo.medications}
                    onChange={(e) => setMedicalInfo({ ...medicalInfo, medications: e.target.value })}
                    placeholder="e.g., Metformin, Aspirin"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyNotes">Emergency Notes</Label>
                  <Textarea
                    id="emergencyNotes"
                    value={medicalInfo.emergencyNotes}
                    onChange={(e) => setMedicalInfo({ ...medicalInfo, emergencyNotes: e.target.value })}
                    placeholder="Any additional important information..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveMedicalInfo} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Medical Info
                </Button>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Contacts */}
                {contacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.relationship} • {contact.phone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                {/* Add New Contact */}
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label htmlFor="contactName">Name</Label>
                    <Input
                      id="contactName"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select
                      value={newContact.relationship}
                      onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationships.map((rel) => (
                          <SelectItem key={rel} value={rel}>
                            {rel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <Button onClick={handleAddContact} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>

                {contacts.length > 0 && (
                  <Button onClick={handleSaveContacts} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Contacts
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - QR Code */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Your Emergency QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div ref={qrRef} className="bg-white p-6 rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={qrData}
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <Button onClick={downloadQR} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p>1. <strong>Download</strong> your QR code using the button above</p>
                <p>2. <strong>Save</strong> it to your phone's wallpaper or lock screen</p>
                <p>3. In case of emergency, anyone can <strong>scan</strong> the QR code to access your:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Blood type and medical conditions</li>
                  <li>Allergies and current medications</li>
                  <li>Emergency contact information</li>
                </ul>
                <p className="pt-2 text-xs italic">
                  Note: While web apps can't create lockscreen widgets, you can set the downloaded QR code as your phone wallpaper.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>QR Code Preview Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(emergencyData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
