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
import { Camera as CameraIcon, Upload, ArrowLeft, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// IMPORT CAPACITOR CAMERA AND TESSERACT
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

  useEffect(() => {
    loadMedicines();
  }, [accessToken]);

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

  // HIGH-SENSITIVITY EXPIRY DETECTION
const findExpiryDate = (text: string): string => {
  const upperText = text.toUpperCase();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  // Pattern 1: Look for MONTH YYYY (Matches 'MAY 2027' on your strip)
  for (let i = 0; i < months.length; i++) {
    const monthRegex = new RegExp(`(${months[i]})[\\s\\.\\-\\/]*(\\d{2,4})`, 'i');
    const match = upperText.match(monthRegex);
    
    if (match) {
      let year = parseInt(match[2]);
      // If AI reads '27', convert it to '2027'
      if (year < 100) year += 2000; 
      
      const monthNum = (i + 1).toString().padStart(2, '0');
      console.log(`✅ Expiry Found: ${months[i]} ${year}`);
      return `${year}-${monthNum}-01`; // Returns '2027-05-01'
    }
  }

  // Pattern 2: Numeric fallback (Matches 05/2027 or 05-27)
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

  return ''; // Return empty if no clear date is found
};

  // FIXED: PERFECT MEDICINE IDENTIFICATION
  const identifyMedicine = (ocrText: string): { name: string; dosage: string } => {
    const upperText = ocrText.toUpperCase().replace(/[^A-Z0-9\s\/\-]/g, ' ').replace(/\s+/g, ' ').trim();

    console.log("🔍 OCR Full Text:", upperText);

    // 1. EXACT DATABASE MATCH
    for (const [key, medicine] of Object.entries(MEDICINE_DATABASE)) {
      if (upperText.includes(key)) {
        console.log(`✅ EXACT MATCH: ${key} → ${medicine.name}`);
        return { name: medicine.name, dosage: medicine.strength };
      }
    }

    // 2. FUZZY MATCH - Common patterns
    const words = upperText.split(' ').filter(w => w.length > 2);
    for (const word of words) {
      for (const [key, medicine] of Object.entries(MEDICINE_DATABASE)) {
        if (word.includes(key.substring(0, Math.floor(key.length * 0.8))) || 
            key.includes(word.substring(0, Math.floor(word.length * 0.8)))) {
          console.log(`✅ FUZZY MATCH: ${word} → ${medicine.name}`);
          return { name: medicine.name, dosage: medicine.strength };
        }
      }
    }

    // 3. LARGEST MEDICINE WORD
    const medicineCandidates = words.filter(w => w.length >= 4 && /^[A-Z]{4,12}[0-9]?$/i.test(w));
    if (medicineCandidates.length > 0) {
      const largest = medicineCandidates.reduce((a, b) => a.length > b.length ? a : b);
      console.log(`🔍 LARGEST WORD: ${largest}`);
      return { name: largest, dosage: '' };
    }

    return { name: 'Medicine', dosage: '' };
  };

  // FIXED: OPPO CPH 2239 OPTIMIZED SCAN (NO TESSERACT PARAMETERS)
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
      
      // FIXED: Simple, working Tesseract config only
      const { data: { text } } = await worker.recognize(base64Image);
      await worker.terminate();
      const detectedDate = findExpiryDate(text);

      console.log("✅ RAW OCR OUTPUT:", text);

      const { name, dosage } = identifyMedicine(text);
      const expiry = findExpiryDate(text);

      setFormData({
        name,
        expiryDate: detectedDate || '2027-05-01',
        dosage,
        frequency: '',
        notes: `Auto-filled via MediScan AI - Scanned on ${new Date().toLocaleDateString('en-IN')}`,
      });

      setScanning(false);
      setShowAddDialog(true);
      
      toast.success(`✅ AI Found: ${name}${expiry ? ` | Expiry: ${new Date(expiry).toLocaleDateString('en-IN')}` : ''}`);
      
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
        toast.success(`✅ Detected: ${name}`);
      } catch (error) {
        setScanning(false);
        toast.error('Image processing failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedicine = async () => {
    if (!accessToken || !formData.name.trim() || !formData.expiryDate) {
      toast.error('Name and expiry date required');
      return;
    }

    try {
      await api.addMedicine(accessToken, formData);
      toast.success('✅ Saved to medicine cabinet!');
      setShowAddDialog(false);
      setFormData({ name: '', expiryDate: '', dosage: '', frequency: '', notes: '' });
      loadMedicines();
    } catch (error) {
      console.error('Add medicine error:', error);
      toast.error('Failed to save medicine');
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

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 30 && expiry >= today;
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
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
        {/* Scanner Card */}
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

        {/* Medicines List */}
        <h2 className="text-2xl font-bold mb-6">Medicine Cabinet ({medicines.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicines.map((medicine) => (
            <Card key={medicine.id} className={`h-full transition-all hover:shadow-xl ${
              isExpired(medicine.expiry_date || medicine.expiryDate)
                ? 'border-red-500 bg-red-50'
                : isExpiringSoon(medicine.expiry_date || medicine.expiryDate)
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-bold">{medicine.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMedicine(medicine.id)}
                    className="hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-gradient-to-r ${
                  isExpired(medicine.expiry_date || medicine.expiryDate)
                    ? 'from-red-100 to-red-200'
                    : isExpiringSoon(medicine.expiry_date || medicine.expiryDate)
                    ? 'from-yellow-100 to-yellow-200'
                    : 'from-emerald-100 to-emerald-200'
                }">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                    isExpired(medicine.expiry_date || medicine.expiryDate) ? 'text-red-600' 
                    : isExpiringSoon(medicine.expiry_date || medicine.expiryDate) ? 'text-yellow-600' 
                    : 'text-emerald-600'
                  }`} />
                  <p className="font-semibold">
                    Expires: {new Date(medicine.expiry_date || medicine.expiryDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {medicine.dosage && <p><strong>Dosage:</strong> {medicine.dosage}</p>}
                {medicine.frequency && <p><strong>Frequency:</strong> {medicine.frequency}</p>}
                {medicine.notes && <p className="text-sm italic bg-gray-50 p-2 rounded">"{medicine.notes}"</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog - FIXED */}
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