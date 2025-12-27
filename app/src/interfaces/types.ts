import { RIDE_STATUS, USER_ROLE, LEADERBOARD_RANK } from '../constants/enums';

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

export interface SignupFormData {
  fullname: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: USER_ROLE;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoredUserData {
  id: number;
  email: string;
  fullname: string;
  role: string;
}

export interface AuthResponse {
  user: UserDetails;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
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
  creditScore: number;
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
  id: string;
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

// Karma Redemption Interfaces
export interface RewardResponse {
  id: string;
  name: string;
  cost: number;
  description: string;
}

export interface RedemptionResponse {
  message: string;
  redemption: {
    id: number;
    rewardId: string;
    rewardName: string;
    karmaPointsCost: number;
    redemptionCode: string;
    status: string;
    expiresAt: string;
    redeemedAt: string;
  };
  remainingKarmaPoints: number;
  success: boolean;
}

export interface UserRedemptionsResponse {
  redemptions: Array<{
    id: number;
    rewardName: string;
    karmaPointsCost: number;
    redemptionCode: string;
    status: string;
    expiresAt: string | null;
    usedAt: string | null;
    redeemedAt: string;
  }>;
  total: number;
}

export interface LeaderboardUser {
  id: number;
  name: string;
  profilePicture?: string;
  role: USER_ROLE;
  value: number;
  rank: number;
  badge?: LEADERBOARD_RANK;
}

export interface LeaderboardData {
  topRiders: LeaderboardUser[];
  topKarmaPoints: LeaderboardUser[];
  topFeedback: LeaderboardUser[];
}
