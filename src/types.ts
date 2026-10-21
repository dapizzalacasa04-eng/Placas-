export type UserRole = 'admin' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  companyName: string;
  phone: string;
  createdAt: string;
}

export type TargetType = 
  | 'google_review' 
  | 'whatsapp' 
  | 'instagram' 
  | 'menu' 
  | 'website' 
  | 'custom';

export interface Plaque {
  id: string;
  clientId: string;
  clientName?: string;
  slug: string;
  title: string;
  targetType: TargetType;
  targetUrl: string;
  targetParams?: {
    whatsappNumber?: string;
    whatsappMessage?: string;
    googlePlaceId?: string;
    instagramHandle?: string;
  };
  isActive: boolean;
  isLocked: boolean; // Remote administrative lock
  lockReason?: string;
  totalNfcScans: number;
  totalQrScans: number;
  createdAt: string;
  updatedAt: string;
}

export type ScanSource = 'nfc' | 'qr' | 'direct';

export interface ScanEvent {
  id: string;
  plaqueId: string;
  source: ScanSource;
  deviceType: 'iOS' | 'Android' | 'Desktop';
  userAgent: string;
  timestamp: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
  projectRef?: string;
}
