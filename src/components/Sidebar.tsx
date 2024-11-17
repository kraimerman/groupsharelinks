import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useChatStore } from '../store';

export default function Sidebar() {
  const { groups, activeGroupId, setActiveGroup, addGroup } = useChatStore();
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const createNewGroup = async () => {
    if (newGroupName.trim()) {
      await addGroup(newGroupName);
      setNewGroupName('');
      setShowNewGroupModal(false);
    }
  };

  return (
    <div className="w-64 bg-gray-50 h-screen border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
              activeGroupId === group.id ? 'bg-gray-100' : ''
            }`}
          >
            <img
              src={group.avatar}
              alt={group.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-800">{group.name}</h3>
              <p className="text-sm text-gray-500">
                {group.members.length} members
              </p>
            </div>
          </button>
        ))}
      </div>

      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full p-2 border rounded mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  createNewGroup();
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createNewGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}