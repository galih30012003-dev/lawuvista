export type PackageCategory = 'jeep' | 'tubing' | 'outbound' | 'villa' | 'bundle';
export type TargetAudience = 'b2c' | 'b2b' | 'all';
export type PriceUnit = '/jeep' | '/orang' | '/malam' | '/pax';

export interface PackageItem {
  id: string;
  category: PackageCategory;
  targetAudience: TargetAudience;
  name: string;
  badge?: string;
  tagline: string;
  priceAmount: number;
  priceUnit: PriceUnit;
  originalPrice?: number;
  minPax?: number;
  maxPax?: number;
  isPopular?: boolean;
  isHeroBundle?: boolean;
  features: string[];
  image: string;
  waTemplate: string;
}

export interface PackagesData {
  bundles: PackageItem[];
  jeep: PackageItem[];
  tubing: PackageItem[];
  outbound: PackageItem[];
  villa: PackageItem[];
}
