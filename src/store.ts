import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { ChatState, UserProfile, Link } from './types';

const checkAuth = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

export const useChatStore = create<ChatState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  groups: [],
  activeGroupId: null,

  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.email!));
      const userProfile = userDoc.data() as UserProfile;
      
      set({ 
        user: userCredential.user,
        userProfile,
        error: null 
      });

      // Load user's groups
      const groupsQuery = query(
        collection(db, 'groups'),
        where('memberEmails', 'array-contains', email)
      );
      const groupsSnapshot = await getDocs(groupsQuery);
      const groups = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      set({ groups });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  signUp: async (email: string, password: string, nickname: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userProfile: UserProfile = {
        email,
        nickname,
        createdAt: Date.now(),
      };
      
      // Create user document
      await setDoc(doc(db, 'users', email), userProfile);
      
      set({
        user: userCredential.user,
        userProfile,
        groups: [], // Initialize with empty groups for new user
        error: null
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ 
        user: null, 
        userProfile: null,
        groups: [],
        activeGroupId: null,
        error: null 
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateProfile: async (nickname: string) => {
    const user = checkAuth();
    try {
      await updateDoc(doc(db, 'users', user.email!), { nickname });
      set(state => ({
        userProfile: state.userProfile ? { ...state.userProfile, nickname } : null,
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setActiveGroup: (groupId: string | null) => {
    set({ activeGroupId: groupId });
  },

  addGroup: async (name: string) => {
    const user = checkAuth();
    try {
      const userDoc = await getDoc(doc(db, 'users', user.email!));
      const userProfile = userDoc.data() as UserProfile;

      const groupData = {
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        createdBy: user.email,
        memberEmails: [user.email],
        members: [userProfile],
        links: [],
        createdAt: serverTimestamp(),
      };

      const groupRef = await addDoc(collection(db, 'groups'), groupData);
      const newGroup = { id: groupRef.id, ...groupData };
      
      set(state => ({ 
        groups: [...state.groups, newGroup],
        activeGroupId: groupRef.id,
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateGroupName: async (groupId: string, name: string) => {
    checkAuth();
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      });
      
      set(state => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? { ...g, name, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` }
            : g
        ),
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addMember: async (groupId: string, email: string) => {
    checkAuth();
    try {
      const userDoc = await getDoc(doc(db, 'users', email));
      if (!userDoc.exists()) throw new Error('User not found');
      
      const userProfile = userDoc.data() as UserProfile;
      const groupRef = doc(db, 'groups', groupId);
      
      await updateDoc(groupRef, {
        memberEmails: arrayUnion(email),
        members: arrayUnion(userProfile)
      });

      set(state => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? {
                ...g,
                memberEmails: [...g.memberEmails, email],
                members: [...g.members, userProfile]
              }
            : g
        ),
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  removeMember: async (groupId: string, email: string) => {
    const user = checkAuth();
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data();

      if (!group) throw new Error('Group not found');
      if (group.createdBy !== user.email) {
        throw new Error('Only group creator can remove members');
      }
      if (email === user.email) {
        throw new Error('Cannot remove yourself');
      }

      const memberToRemove = group.members.find((m: UserProfile) => m.email === email);
      
      await updateDoc(groupRef, {
        memberEmails: arrayRemove(email),
        members: arrayRemove(memberToRemove)
      });

      set(state => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? {
                ...g,
                memberEmails: g.memberEmails.filter(e => e !== email),
                members: g.members.filter(m => m.email !== email)
              }
            : g
        ),
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  searchUsers: async (query: string) => {
    checkAuth();
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '>=', query),
        where('email', '<=', query + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  shareLink: async (groupId: string, url: string, title: string, description: string) => {
    const user = checkAuth();
    try {
      const groupRef = doc(db, 'groups', groupId);
      const userDoc = await getDoc(doc(db, 'users', user.email!));
      const userProfile = userDoc.data() as UserProfile;

      const newLink: Link = {
        id: crypto.randomUUID(),
        url,
        title,
        description,
        author: user.email!,
        authorNickname: userProfile.nickname,
        timestamp: Date.now(),
        votes: { up: [], down: [] },
        comments: []
      };

      await updateDoc(groupRef, {
        links: arrayUnion(newLink)
      });

      set(state => ({
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, links: [...g.links, newLink] }
            : g
        ),
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateLink: async (groupId: string, linkId: string, updates: Partial<Link>) => {
    const user = checkAuth();
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data();

      if (!group) throw new Error('Group not found');
      
      const linkIndex = group.links.findIndex((l: Link) => l.id === linkId);
      if (linkIndex === -1) throw new Error('Link not found');
      
      const link = group.links[linkIndex];
      if (link.author !== user.email) {
        throw new Error('Only the link author can edit it');
      }

      const updatedLink = { ...link, ...updates };
      const newLinks = [...group.links];
      newLinks[linkIndex] = updatedLink;

      await updateDoc(groupRef, { links: newLinks });

      set(state => ({
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, links: newLinks }
            : g
        ),
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  toggleVote: async (groupId: string, linkId: string, voteType: 'up' | 'down') => {
    const user = checkAuth();
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data();

      if (!group) throw new Error('Group not found');
      
      const linkIndex = group.links.findIndex((l: Link) => l.id === linkId);
      if (linkIndex === -1) throw new Error('Link not found');

      const link = group.links[linkIndex];
      const oppositeType = voteType === 'up' ? 'down' : 'up';
      
      // Remove from opposite vote type if exists
      if (link.votes[oppositeType].includes(user.email!)) {
        link.votes[oppositeType] = link.votes[oppositeType].filter(
          email => email !== user.email
        );
      }

      // Toggle current vote type
      if (link.votes[voteType].includes(user.email!)) {
        link.votes[voteType] = link.votes[voteType].filter(
          email => email !== user.email
        );
      } else {
        link.votes[voteType].push(user.email!);
      }

      const newLinks = [...group.links];
      newLinks[linkIndex] = link;

      await updateDoc(groupRef, { links: newLinks });

      set(state => ({
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, links: newLinks }
            : g
        ),
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addComment: async (groupId: string, linkId: string, content: string) => {
    const user = checkAuth();
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const group = groupDoc.data();

      if (!group) throw new Error('Group not found');
      
      const linkIndex = group.links.findIndex((l: Link) => l.id === linkId);
      if (linkIndex === -1) throw new Error('Link not found');

      const userDoc = await getDoc(doc(db, 'users', user.email!));
      const userProfile = userDoc.data() as UserProfile;

      const newComment = {
        id: crypto.randomUUID(),
        content,
        author: user.email!,
        authorNickname: userProfile.nickname,
        timestamp: Date.now()
      };

      const link = group.links[linkIndex];
      link.comments.push(newComment);

      const newLinks = [...group.links];
      newLinks[linkIndex] = link;

      await updateDoc(groupRef, { links: newLinks });

      set(state => ({
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, links: newLinks }
            : g
        ),
        error: null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  }
}));