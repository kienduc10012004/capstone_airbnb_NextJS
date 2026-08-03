import { axiosClient } from "@/app/lib/api/client";
import type { ApiEnvelope } from "@/app/lib/api/types";
import type { ApiUser, UserPayload } from "@/app/lib/api/users";

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignInContent = {
  user: ApiUser;
  token: string;
};

export type ApiSignInResponse = ApiEnvelope<SignInContent>;
export type ApiSignUpResponse = ApiEnvelope<ApiUser>;
export type ApiSignUpPayload = UserPayload;

export const signIn = async (payload: SignInPayload) => {
  const { data } = await axiosClient.post<ApiSignInResponse>(
    "/auth/signin",
    payload,
  );
  return data;
};

export const signUp = async (payload: ApiSignUpPayload) => {
  const { data } = await axiosClient.post<ApiSignUpResponse>(
    "/auth/signup",
    payload,
  );
  return data;
};
