import React from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Camera, FileText, Bell, QrCode, Heart, DollarSign, User } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  const features = [
    {
      title: 'Medicine Scanner',
      description: 'Scan medicines and track expiry dates',
      icon: Camera,
      path: '/scanner',
      color: 'bg-blue-500',
    },
    {
      title: 'Medical Reports',
      description: 'Store and manage your medical documents',
      icon: FileText,
      path: '/reports',
      color: 'bg-green-500',
    },
    {
      title: 'Reminders',
      description: 'Never miss your medication time',
      icon: Bell,
      path: '/reminders',
      color: 'bg-purple-500',
    },
    {
      title: 'Emergency QR',
      description: 'Quick access emergency information',
      icon: QrCode,
      path: '/qr-code',
      color: 'bg-red-500',
    },
    {
      title: 'Blood Donation',
      description: 'Request or donate blood',
      icon: Heart,
      path: '/emergency?tab=blood',
      color: 'bg-pink-500',
    },
    {
      title: 'Emergency Fund',
      description: 'Medical financial assistance',
      icon: DollarSign,
      path: '/emergency?tab=fund',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">MEDISCAN AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.user_metadata?.name || user?.email}
            </span>
            <Link to="/profile">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your health, medications, and emergency information</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.path} to={feature.path}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full">
                    Open →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">About MEDISCAN AI</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• AI-powered medicine expiry date detection</li>
                <li>• Secure medical records storage</li>
                <li>• Smart medication reminders</li>
                <li>• Emergency QR code for quick access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Community Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Blood donation matching platform</li>
                <li>• Medical emergency fund requests</li>
                <li>• Community support network</li>
                <li>• Real-time emergency assistance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
