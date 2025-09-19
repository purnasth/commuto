import React from 'react';
import { TbUser } from 'react-icons/tb';

import Tooltip from './Tooltip';

import { truncateText } from '../../utils/functions';

interface UserInfo {
  id: number;
  fullname?: string;
  email: string;
  profilePicture?: string;
}

interface UserDisplayProps {
  user: UserInfo | null;
  showProfilePicture?: boolean;
  className?: string;
}

const UserDisplay: React.FC<UserDisplayProps> = ({
  user,
  showProfilePicture = true,
  className = '',
}) => {
  if (!user || !user.fullname) {
    return <span className={`${className}`}>-</span>;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showProfilePicture && (
        <div
          className="inline-flex size-5 md:size-6 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-600 shadow-sm"
          title={user.fullname}
        >
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.fullname}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <TbUser className="size-4" />
          )}
        </div>
      )}
      <Tooltip content={user.fullname}>
        {truncateText(user.fullname, 14)}
      </Tooltip>
    </div>
  );
};

export default UserDisplay;
