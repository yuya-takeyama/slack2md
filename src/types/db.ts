export interface User {
  id: string;
  email: string;
  name: string;
  raw: string;
}

export interface Channel {
  id: string;
  name: string;
  raw: string;
}

export interface UserGroup {
  id: string;
  name: string;
  raw: string;
}

export interface Message {
  id: string;
  channel_id: string;
  thread_id: string | null;
  user_id: string;
  text: string;
  timestamp: number;
  raw: string;
}

export interface Bot {
  id: string;
  name: string;
  raw: string;
}
