export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  created_at: string;
  isGuest?: boolean;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}
