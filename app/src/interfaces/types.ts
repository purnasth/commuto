export interface RideFormData {
  id?: string;
  from: string;
  to: string;
  message: string;
  role: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  timestamp?: string;
  status?: string;
  riderId?: string;
}

export interface AvailableListProps {
  role: 'rider' | 'passenger';
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
  role?: string;
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
  user_id?: number;
  fullname?: string;
  email?: string;
  role?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  ratings?: number;
}
