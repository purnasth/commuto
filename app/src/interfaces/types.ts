import { RIDE_STATUS, USER_ROLE } from '../constants/enums';

export interface Person {
  id: number;
  name: string;
  img: string;
  rideCount: number;
}

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
  passengerId?: string;
  createdBy?: string;
  estimatedTimeOfArrival?: number;
  distance?: number;
  rider?: UserDetails;
  passengers?: UserDetails[];
  createdByUser?: UserDetails;
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
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  timestamp: string;
  status: RIDE_STATUS;
  riderId?: number;
  passengerId?: number;
  createdBy: number;
  rider?: {
    id: number;
    fullname: string;
    email: string;
    karmaPoints?: number;
    profilePicture?: string;
  };
  passengers?: {
    id: number;
    fullname: string;
    email: string;
    profilePicture?: string;
  }[];
  createdByUser?: {
    id: number;
    fullname: string;
    email: string;
    profilePicture?: string;
  };
  distance?: number;
  co2Saved?: number;
  peopleImpacted?: number;
}

export interface RedeemableReward {
  name: string;
  points: number;
  description: string;
}

export interface AverageScoreResult {
  averageScore: number | null;
  totalFeedback: number;
  emojiBreakdown: {
    [key: number]: number;
  };
}

export interface RideStatusChangedEventDetail {
  status: RIDE_STATUS;
  ride?: RideFormData;
  role?: USER_ROLE;
}
