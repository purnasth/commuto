export enum USER_ROLE {
  RIDER = 'rider',
  PASSENGER = 'passenger',
}

export const USER_ROLES = [USER_ROLE.RIDER, USER_ROLE.PASSENGER] as const;
export type UserRoleType = (typeof USER_ROLES)[number];
