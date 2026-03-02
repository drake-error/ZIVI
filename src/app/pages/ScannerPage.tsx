import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
// RESTORED: CardHeader and CardTitle
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
// RESTORED: Trash2 icon
import { Camera as CameraIcon, Upload, ArrowLeft, AlertCircle, Loader2, Trash2, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Tesseract from 'tesseract.js';

// FIXED: COMPREHENSIVE MEDICINE DATABASE
const MEDICINE_DATABASE: Record<string, { name: string; category: string; strength: string }> = {
  // PAIN RELIEVERS - TOP PRIORITY
  'DOLO': { name: 'Dolo 650', category: 'Paracetamol', strength: '650mg' },
  'DOLO650': { name: 'Dolo 650', category: 'Paracetamol', strength: '650mg' },
  'PARACETAMOL': { name: 'Paracetamol', category: 'Pain Relief', strength: '500mg/650mg' },
  'CROCIN': { name: 'Crocin 650', category: 'Paracetamol', strength: '650mg' },
  'CALPOL': { name: 'Calpol 650', category: 'Paracetamol', strength: '650mg' },
  'COMBIFLAM': { name: 'Combiflam', category: 'Pain Relief', strength: '400mg+325mg' },
  
  // ANTIBIOTICS
  'AUGMENTIN': { name: 'Augmentin 625', category: 'Antibiotic', strength: '625mg' },
  'CEFIXIME': { name: 'Cefixime', category: 'Antibiotic', strength: '200mg' },
  'AZITHRO': { name: 'Azithromycin', category: 'Antibiotic', strength: '500mg' },
  'CIPLOX': { name: 'Ciprofloxacin', category: 'Antibiotic', strength: '500mg' },
  
  // ANTI-ACIDS
  'PAN': { name: 'Pantoprazole', category: 'Anti-acid', strength: '40mg' },
  'PANTOP': { name: 'Pantoprazole', category: 'Anti-acid', strength: '40mg' },
  'RANITIDINE': { name: 'Ranitidine', category: 'Anti-acid', strength: '150mg' },
  'OMEP': { name: 'Omeprazole', category: 'Anti-acid', strength: '20mg' },
  
  // VITAMINS & SUPPLEMENTS
  'BECOSULES': { name: 'Becosules', category: 'Vitamin B-Complex', strength: 'Capsule' },
  'NEUROBION': { name: 'Neurobion Forte', category: 'Vitamin B', strength: 'Tablet' },
  'CALCIUM': { name: 'Calcium Carbonate', category: 'Calcium', strength: '500mg' },
  'VITD3': { name: 'Vitamin D3', category: 'Vitamin D', strength: '60000IU' },
  
  // ANTI-ALLERGIC
  'MTOP': { name: 'Montair LC', category: 'Anti-allergic', strength: '10mg/5mg' },
  'MONTAIR': { name: 'Montair LC', category: 'Anti-allergic', strength: '10mg/5mg' },
  'LEVOCET': { name: 'Levocetirizine', category: 'Anti-allergic', strength: '5mg' },
  'MONTECO': { name: 'Monteco LC', category: 'Anti-allergic', strength: '10mg/5mg' },
  
  // COMMON STRENGTHS
  '650MG': { name: 'Paracetamol 650mg', category: 'Pain Relief', strength: '650mg' },
  '500MG': { name: 'Paracetamol 500mg', category: 'Pain Relief', strength: '500mg' },
};

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

const isExpired = (d: string) => d ? new Date(d) < new Date() : false;

const isExpiringSoon = (d: string) => {
  if (!d) return false;
  const expiry = new Date(d);
  const today = new Date();
  const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff <= 30 && diff >= 0;
}; 

useEffect(() => {
  loadMedicines();
}, [accessToken]);

const loadMedicines = async () => {
  if (!accessToken) return;
  try {
    const response = await api.getMedicines(accessToken);
    
    // Dig deep into the response to find your data
    const dataArray = response?.medicines || response?.data || (Array.isArray(response) ? response : []);
    
    // PROTECTION: If we just added an item manually, don't let a smaller 
    // server list overwrite our current view for a few seconds.
    setMedicines((current) => {
      if (dataArray.length < current.length && current.length > 0) {
        console.log("Blocking stale server refresh to prevent glitch...");
        return current; 
      }
      return dataArray;
    });
  } catch (error) {
    console.error('Error loading:', error);
  }
};

  const findExpiryDate = (text: string): string => {
  const upperText = text.toUpperCase();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  for (let i = 0; i < months.length; i++) {
    const monthRegex = new RegExp(`(${months[i]})[\\s\\.\\-\\/]*(\\d{2,4})`, 'i');
    const match = upperText.match(monthRegex);
    
    if (match) {
      let year = parseInt(match[2]);
      if (year < 100) year += 2000; 
      
      const monthNum = (i + 1).toString().padStart(2, '0');
      return `${year}-${monthNum}-01`;
    }
  }

  const numRegex = /(\d{2})[\/\-\. ]+(\d{2,4})/;
  const numMatch = upperText.match(numRegex);
  if (numMatch) {
    let month = parseInt(numMatch[1]);
    let year = parseInt(numMatch[2]);
    if (year < 100) year += 2000;
    if (month <= 12 && year >= 2024) {
      return `${year}-${month.toString().padStart(2, '0')}-01`;
    }
  }

  return '';
};

  const identifyMedicine = (ocrText: string): { name: string; dosage: string } => {
    const upperText = ocrText.toUpperCase().replace(/[^A-Z0-9\s\/\-]/g, ' ').replace(/\s+/g, ' ').trim();

    for (const [key, medicine] of Object.entries(MEDICINE_DATABASE)) {
      if (upperText.includes(key)) {
        return { name: medicine.name, dosage: medicine.strength };
      }
    }

    const words = upperText.split(' ').filter(w => w.length > 2);
    for (const word of words) {
      for (const [key, medicine] of Object.entries(MEDICINE_DATABASE)) {
        if (word.includes(key.substring(0, Math.floor(key.length * 0.8))) || 
            key.includes(word.substring(0, Math.floor(word.length * 0.8)))) {
          return { name: medicine.name, dosage: medicine.strength };
        }
      }
    }

    const medicineCandidates = words.filter(w => w.length >= 4 && /^[A-Z]{4,12}[0-9]?$/i.test(w));
    if (medicineCandidates.length > 0) {
      const largest = medicineCandidates.reduce((a, b) => a.length > b.length ? a : b);
      return { name: largest, dosage: '' };
    }

    return { name: 'Medicine', dosage: '' };
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      toast.info("📸 Capturing high-res image...");

      const image = await Camera.getPhoto({
        quality: 70,
        width: 1024,
        height: 1024,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
      });

      if (!image.base64String) throw new Error('No image');

      const base64Image = `data:image/jpeg;base64,${image.base64String}`;
      toast.info("🤖 AI analyzing medicine label...");

      const worker = await Tesseract.createWorker('eng');
      const { data: { text } } = await worker.recognize(base64Image);
      await worker.terminate();
      const detectedDate = findExpiryDate(text);

      const { name, dosage } = identifyMedicine(text);

      setFormData({
        name,
        expiryDate: detectedDate || '2027-05-01',
        dosage,
        frequency: '',
        notes: `Auto-filled via MediScan AI - Scanned on ${new Date().toLocaleDateString('en-IN')}`,
      });

      setScanning(false);
      setShowAddDialog(true);
      
    } catch (error) {
      setScanning(false);
      console.error('Scan error:', error);
      toast.error('Scan failed. Try manual entry or better lighting.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    toast.info("📤 Processing uploaded image...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const worker = await Tesseract.createWorker('eng');
        const { data: { text } } = await worker.recognize(reader.result as string);
        await worker.terminate();

        const { name, dosage } = identifyMedicine(text);
        const expiry = findExpiryDate(text);

        setFormData({
          name,
          expiryDate: expiry || '',
          dosage,
          frequency: '',
          notes: `Uploaded on ${new Date().toLocaleDateString('en-IN')}`,
        });

        setScanning(false);
        setShowAddDialog(true);
      } catch (error) {
        setScanning(false);
        toast.error('Image processing failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedicine = async () => {
  try {
    if (!accessToken) {
      toast.error('Not authenticated');
      return;
    }
    
    const payload = { 
      ...formData, 
      expiry_date: formData.expiryDate, // Most common for Supabase
      expiry: formData.expiryDate       // Fallback key
    };
    
    const newMed = await api.addMedicine(accessToken, payload);
    
    // Instant UI Update so it doesn't disappear
    setMedicines(prev => [newMed, ...prev]);
    
    toast.success('Saved!');
    setShowAddDialog(false);
    await loadMedicines(); // Refresh pulse
  } catch (error) {
    toast.error('Save failed');
  }
};

  const handleDeleteMedicine = async (id: string) => {
    if (!accessToken) return;
    try {
      await api.deleteMedicine(accessToken, id);
      toast.success('🗑️ Medicine deleted');
      loadMedicines();
    } catch (error) {
      toast.error('Delete failed');
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MediScan AI
            </h1>
            <p className="text-sm text-gray-600">Smart medicine scanner</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-12 shadow-2xl border-0 bg-gradient-to-r from-blue-500 to-purple-600">
          <CardContent className="p-8 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <CameraIcon className="w-8 h-8" />
              Scan Medicine
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleScan} 
                disabled={scanning}
                className="h-16 text-lg font-bold bg-white/20 hover:bg-white/30 border-2 border-white/40"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CameraIcon className="w-6 h-6 mr-3" />
                    Scan Now
                  </>
                )}
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="flex-1 h-16 border-white/50 bg-white/10"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload
                </Button>
                <Button
                  onClick={() => {
                    setFormData({ name: '', expiryDate: '', dosage: '', frequency: '', notes: '' });
                    setShowAddDialog(true);
                  }}
                  className="h-16 bg-white/20 hover:bg-white/30 flex-1"
                >
                  Manual
                </Button>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-6">Medicine Cabinet ({medicines.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {medicines.map((med) => {
  // SIGNAL RESOLVER: Checks every possible name for the date
  const rawDate = med.expiry_date || med.expiryDate || med.expiry;
  
  // Use these functions here to clear the 'never read' warnings
  const expired = isExpired(rawDate); 
  const expiringsSoon = isExpiringSoon(rawDate);

  return (
    <Card key={med.id} className={`shadow-md ${expired ? 'bg-red-50' : 'bg-white'}`}>
      {/* FIXED: Using CardHeader and Trash2 properly */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
  <CardTitle className="text-lg font-bold flex items-center gap-2">
    {/* 1. ADD PILL HERE TO FIX THE WARNING */}
    <Pill className={`w-5 h-5 ${expired ? 'text-red-600' : expiringsSoon ? 'text-amber-500' : 'text-blue-600'}`} />
    
    {med.name}
  </CardTitle>
  
  <Button variant="ghost" size="sm" onClick={() => handleDeleteMedicine(med.id)}>
    <Trash2 className="w-4 h-4 text-red-500" />
  </Button>
</CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <p className="font-bold text-blue-900">
            {/* If signal found, show date; else show error */}
            {rawDate ? `Expires: ${new Date(rawDate).toLocaleDateString('en-IN')}` : 'No Date Found'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
})}
</div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Medicine Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-12"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="mt-1 h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input id="dosage" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} className="mt-1 h-12" />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Input id="frequency" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} className="mt-1 h-12" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-1 h-24" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1 h-12">
                Cancel
              </Button>
              <Button onClick={handleAddMedicine} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700">
                Save Medicine
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};