import { IUser } from "../types/user.types";


/**
 * Gets the display name
 * @param participant
 * @returns
 */
export const getParticipantDisplayName = (
  participant: IUser | undefined
): string => {
  if (participant?.firstName && participant?.lastName) {
    return `${participant.firstName} ${participant.lastName}`;
  }
  return participant?.email || "participant";
};

/**
 * Gets the participant's initials
 * @param participant
 * @returns
 */
export const getParticipantInitials = (
  participant: IUser | undefined
): string => {
  if (participant?.firstName && participant?.lastName) {
    return `${participant.firstName.charAt(0)}${participant.lastName.charAt(0)}`.toUpperCase();
  }
  if (participant?.email) {
    return participant.email.charAt(0).toUpperCase();
  }
  return "?";
};

/**
 * Gets the participant's short name
 * @param participant
 * @returns
 */
export const getParticipantShortName = (
  participant: IUser | undefined
): string => {
  if (participant?.firstName) {
    return participant.firstName;
  }
  if (participant?.email) {
    return participant.email.split("@")[0];
  }
  return "User";
};
