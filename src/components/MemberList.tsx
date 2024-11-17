import React, { useState, useEffect } from 'react';
import { UserPlus, X, Search, Settings, UserMinus } from 'lucide-react';
import { useChatStore } from '../store';
import { UserProfile } from '../types';

export default function MemberList({ groupId }: { groupId: string }) {
  const { groups, addMember, removeMember, searchUsers, updateGroupName } = useChatStore();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const group = groups.find((g) => g.id === groupId);
  if (!group) return null;

  useEffect(() => {
    const searchMembers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        const filteredResults = results.filter(
          user => !group.memberEmails.includes(user.email)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchMembers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, group.memberEmails]);

  const handleAddMember = async (email: string) => {
    try {
      await addMember(groupId, email);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (email: string) => {
    try {
      await removeMember(groupId, email);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateGroupName = async () => {
    if (newGroupName.trim() && !isUpdating) {
      try {
        setIsUpdating(true);
        await updateGroupName(groupId, newGroupName.trim());
        setShowEditGroup(false);
      } catch (error) {
        console.error('Failed to update group name:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="p-4 w-64 border-l border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Members</h3>
        <div className="flex space-x-1">
          <button
            onClick={() => setShowEditGroup(true)}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowAddMember(true)}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
          >
            <UserPlus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {group.members.map((member) => (
          <div
            key={member.email}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {member.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {member.nickname}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {member.email}
              </p>
            </div>
            {group.createdBy === member.email ? (
              <span className="text-xs text-gray-500">Owner</span>
            ) : group.createdBy === useChatStore.getState().user?.email && (
              <button
                onClick={() => handleRemoveMember(member.email)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <UserMinus className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showEditGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Group</h3>
              <button
                onClick={() => setShowEditGroup(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={group.name}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowEditGroup(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGroupName}
                  disabled={!newGroupName.trim() || isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add Member</h3>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <p className="text-center text-gray-500 mt-4">
                  Type at least 2 characters to search
                </p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-gray-500 mt-4">
                  No users found
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => handleAddMember(user.email)}
                      className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{user.nickname}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}