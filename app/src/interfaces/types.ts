import { RIDE_STATUS, USER_ROLE } from '../constants/enums';

export interface RideFormData {
  id?: string;
  from: string;
  to: string;
  message: string;
  role: USER_ROLE;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  timestamp?: string;
  status?: string;
  riderId?: string;
}

export interface AvailableListProps {
  role: USER_ROLE;
}

export interface FaqItemProps {
  question: string;
  answer: string;
  isOpen?: boolean;
  onClick?: () => void;
}

export interface LocationPopupProps {
  activeInput?: 'from' | 'to' | null;
  onClose: () => void;
  onSelect: (location: string, coordinates?: [number, number]) => void;
  initialSearchQuery: string;
}

export interface MapPopupProps {
  onClose: () => void;
  onSelect: (location: string, coordinates: [number, number]) => void;
  initialLocation?: string;
}

export interface MessagePopupProps {
  onSelect: (message: string) => void;
  onClose: () => void;
}

export interface RideBarProps {
  fromHome?: boolean;
  role?: USER_ROLE;
}

export interface SideNavProps {
  isOpen: boolean;
  closeNav: () => void;
  navLinks: {
    id: number;
    title: string;
    link: string;
    icon: JSX.Element;
  }[];
  userName: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface UserDetails {
  id: number;
  user_id?: number;
  fullname: string;
  email: string;
  role: USER_ROLE;
  phone?: string;
  address?: string;
  profilePicture?: string;
  ratings?: number;
}

export interface ReflectionStats {
  postedCount: number;
  confirmedCount: number;
  karmaPoints: number;
  distanceTravelled: number;
  co2Reduced: number;
  peopleImpacted: number;
}

export interface RideHistory {
  id: number;
  from: string;
  to: string;
  message?: string;
  role: USER_ROLE;
  timestamp: string;
  status: RIDE_STATUS;
  rider: {
    id: number;
    fullname: string;
    email: string;
    karmaPoints?: number;
  };
  passengers: { id: number; fullname: string; email: string }[];
  distance?: number;
  co2Saved?: number;
  peopleImpacted?: number;
}

export interface RedeemableReward {
  name: string;
  points: number;
  description: string;
}
