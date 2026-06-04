import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AppDataContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const AppDataProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('mandal_token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const fetchData = useCallback(async () => {
    if (!localStorage.getItem('mandal_token')) return;
    try {
      const [membersRes, entriesRes] = await Promise.all([
        axios.get(`${API_URL}/members?limit=1000`, getAuthConfig()),
        axios.get(`${API_URL}/entries`, getAuthConfig())
      ]);
      // Support both old API (array) and new API (object with data array)
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : membersRes.data.data || []);
      setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : entriesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addMember = async (memberData) => {
    try {
      const res = await axios.post(`${API_URL}/members`, memberData, getAuthConfig());
      setMembers([...members, res.data]);
    } catch (error) {
      console.error("Error adding member", error);
      alert(error.response?.data?.message || 'Error adding member');
    }
  };

  const updateMember = async (id, updatedMember) => {
    try {
      const res = await axios.put(`${API_URL}/members/${id}`, updatedMember, getAuthConfig());
      setMembers(members.map(m => m._id === id ? res.data : m));
    } catch (error) {
      console.error("Error updating member", error);
    }
  };

  const deleteMember = async (id) => {
    try {
      await axios.delete(`${API_URL}/members/${id}`, getAuthConfig());
      setMembers(members.filter(m => m._id !== id));
      // Optionally refetch entries to remove deleted member's entries from UI
      fetchData();
    } catch (error) {
      console.error("Error deleting member", error);
    }
  };

  const addEntry = async (entryData) => {
    try {
      const res = await axios.post(`${API_URL}/entries`, entryData, getAuthConfig());
      setEntries([...entries, res.data]);
    } catch (error) {
      console.error("Error adding entry", error);
    }
  };

  return (
    <AppDataContext.Provider value={{
      members, addMember, updateMember, deleteMember,
      entries, addEntry, fetchData
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
