import { User } from 'firebase/auth';

export interface UserProfile {
  email: string;
  nickname: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorNickname: string;
  timestamp: number;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  description: string;
  author: string;
  authorNickname: string;
  timestamp: number;
  thumbnail?: string;
  votes: {
    up: string[];
    down: string[];
  };
  comments: Comment[];
}

export interface Group {
  id: string;
  name: string;
  avatar: string;
  createdBy: string;
  memberEmails: string[];
  members: UserProfile[];
  links: Link[];
}

export interface ChatState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  groups: Group[];
  activeGroupId: string | null;
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (nickname: string) => Promise<void>;
  
  // Group actions
  setActiveGroup: (groupId: string | null) => void;
  addGroup: (name: string) => Promise<void>;
  updateGroupName: (groupId: string, name: string) => Promise<void>;
  addMember: (groupId: string, email: string) => Promise<void>;
  removeMember: (groupId: string, email: string) => Promise<void>;
  searchUsers: (query: string) => Promise<UserProfile[]>;
  
  // Link actions
  shareLink: (groupId: string, url: string, title: string, description: string) => Promise<void>;
  updateLink: (groupId: string, linkId: string, updates: Partial<Link>) => Promise<void>;
  toggleVote: (groupId: string, linkId: string, voteType: 'up' | 'down') => Promise<void>;
  addComment: (groupId: string, linkId: string, content: string) => Promise<void>;
}