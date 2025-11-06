export interface IUser {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  cinNumber: string;
}

export type Role = "driver" | "passenger";
