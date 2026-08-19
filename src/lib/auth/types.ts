export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  exp: number;
}
