export const CAFE_STATUSES = ["active", "inactive"] as const;
export type CafeStatus = (typeof CAFE_STATUSES)[number];

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type DayHours = {
  closed: boolean;
  open: string | null;
  close: string | null;
};

export type OpeningHours = Record<Weekday, DayHours>;

export type Cafe = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  timezone: string;
  currency: string;
  status: CafeStatus;
  opening_hours: OpeningHours;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { closed: false, open: "09:00", close: "21:00" },
  tuesday: { closed: false, open: "09:00", close: "21:00" },
  wednesday: { closed: false, open: "09:00", close: "21:00" },
  thursday: { closed: false, open: "09:00", close: "21:00" },
  friday: { closed: false, open: "09:00", close: "21:00" },
  saturday: { closed: false, open: "09:00", close: "21:00" },
  sunday: { closed: true, open: null, close: null },
};

export const CAFE_SELECT_COLUMNS =
  "id, name, slug, owner_id, description, logo_url, cover_image_url, phone, email, website, address_line1, address_line2, city, state, country, postal_code, timezone, currency, status, opening_hours, created_at, updated_at";
