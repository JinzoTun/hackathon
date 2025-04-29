export interface User {
  _id: string;
  name: string;
  address: string;
  email: string;
  cultureType?: {
    type: string;
    experience: number;
  }[];
}

export interface Comment {
  _id: string;
  postId: string;
  author: User;
  content: string;
  replies: Comment[];
  createdAt: string;
}

export interface Response {
  success: boolean;
  error?: string;
  data?: any;
}
