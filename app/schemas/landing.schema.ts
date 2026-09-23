import { z } from 'zod';

export interface LandingStats {
  countFinished: number;
  countItems: number;
  uniqueClients: number;
  countSponsors: number;
}

export interface LandingProductItem {
  id: string;
  name: string;
  image: string;
  category: string;
  total_sold_items: number;
}

export interface LandingPortfolioItem {
  id: string | number;
  institution_name: string;
  qty?: string | number;
  total_product?: number;
  images?: string[];
  review?: string;
  pic_name?: string;
  rating?: number;
  created_at?: string;
}

export interface LandingData {
  stats: LandingStats;
  products: LandingProductItem[];
  portfolioItems: LandingPortfolioItem[];
}
