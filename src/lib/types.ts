export type Brochure = {
  id: string;
  title: string;
  image: string | null;
  link: string | null;
  filename: string | null;
  created_at: string;
  category: string | null;
  is_popular: boolean;
};

export type DisplayCategory = {
  id: string;
  created_at: string;
};

export type DisplayProduct = {
  id: number;
  category_id: string;
  name: string;
  price: string | null;
  old_price: string | null;
  description: string | null;
  url: string | null;
  pic_url: string | null;
  images: string[] | null;
  created_at: string;
  width: string | null;
  height: string | null;
  colour_internal: string | null;
  colour_external: string | null;
  glazed: boolean;
  additional_info: string[] | null;
};

export type ProductCategory = {
  id: string;
  title: string;
  image_url: string | null;
  tagline: string | null;
  hero_image_url: string | null;
  about: string | null;
  rating: string | null;
  reviews: string | null;
  completed: string | null;
  price_label: string | null;
  gallery_album_name: string | null;
  sort_order: number;
};

export type ProductSubcategory = {
  id: string;
  category_id: string;
  parent_subcategory_id: string | null;
  title: string;
  card_image_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  about: string | null;
  rating: string | null;
  reviews: string | null;
  completed: string | null;
  price_label: string | null;
  gallery_album_name: string | null;
  brochure_titles: string[] | null;
  sort_order: number;
};

export type TabType = 'details' | 'styles' | 'hardware' | 'colours' | 'glass' | 'extras';
export const TAB_TYPES: TabType[] = ['details', 'styles', 'hardware', 'colours', 'glass', 'extras'];

export type ProductSection = {
  id: number;
  category_id: string | null;
  subcategory_id: string | null;
  tab_type: TabType;
  section_title: string | null;
  section_content: string | null;
  overview_image_url: string | null;
  overview_image_mode: string | null;
  sort_order: number;
};

export type ItemType = 'image' | 'swatch' | 'carousel';
export const ITEM_TYPES: ItemType[] = ['image', 'swatch', 'carousel'];

export type ProductSectionItem = {
  id: number;
  section_id: number;
  image_url: string | null;
  label: string | null;
  item_type: ItemType;
  resize_mode: string | null;
  full_height: boolean;
  sort_order: number;
};

export type PushToken = {
  id?: number;
  expo_push_token: string;
  created_at?: string;
};

export type AdminUser = {
  user_id: string;
  email: string | null;
  created_at: string;
};

