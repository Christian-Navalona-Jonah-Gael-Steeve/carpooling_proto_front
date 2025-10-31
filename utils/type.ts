
export type Gender = "male" | "female";
export type UserType = "passenger" | "driver";

export type FileType = {
  uri: string;
  name: string;
  size?: number;
  type?: string;
};