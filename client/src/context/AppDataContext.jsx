import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

export const AppDataContext = createContext();

const API_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

export const AppDataProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState({ creditInterestRate: 1, debitInterestRate: 1, penaltyAmount: 100 });
  const token = useSelector(state => state.auth?.token);

  const getAuthConfig = () => {
    const token = localStorage.getItem('mandal_token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const sortMembersList = (list) => {
    return [...list].sort((a, b) => {
      const numA = parseInt(a.fataNo, 10);
      const numB = parseInt(b.fataNo, 10);
      if (isNaN(numA) && isNaN(numB)) return (a.fataNo || '').localeCompare(b.fataNo || '');
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
  };

  const fetchData = useCallback(async () => {
    if (!localStorage.getItem('mandal_token')) return;
    try {
      const [membersRes, entriesRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/members?limit=1000`, getAuthConfig()),
        axios.get(`${API_URL}/entries`, getAuthConfig()),
        axios.get(`${API_URL}/settings`, getAuthConfig())
      ]);
      
      const rawMembers = Array.isArray(membersRes.data) ? membersRes.data : membersRes.data.data || [];
      setMembers(sortMembersList(rawMembers));
      setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : entriesRes.data.data || []);
      setSettings(settingsRes.data.data || settingsRes.data || { creditInterestRate: 1, debitInterestRate: 1 });
    } catch (error) {
      console.error("Error fetching data", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, token]);

  const addMember = async (memberData) => {
    try {
      const res = await axios.post(`${API_URL}/members`, memberData, getAuthConfig());
      const newMember = res.data.data || res.data;
      setMembers(prev => sortMembersList([...prev, newMember]));
    } catch (error) {
      console.error("Error adding member", error);
      alert(error.response?.data?.message || 'Error adding member');
    }
  };

  const updateMember = async (id, updatedMember) => {
    try {
      const res = await axios.put(`${API_URL}/members/${id}`, updatedMember, getAuthConfig());
      const newMember = res.data.data || res.data;
      setMembers(prev => sortMembersList(prev.map(m => m._id === id ? newMember : m)));
    } catch (error) {
      console.error("Error updating member", error);
    }
  };

  const deleteMember = async (id) => {
    try {
      await axios.delete(`${API_URL}/members/${id}`, getAuthConfig());
      setMembers(members.filter(m => m._id !== id));
      
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

  const updateSettings = async (newSettings) => {
    try {
      const res = await axios.put(`${API_URL}/settings`, newSettings, getAuthConfig());
      setSettings(res.data.data || res.data || newSettings);
      fetchData();
    } catch (error) {
      console.error("Error updating settings", error);
    }
  };

  return (
    <AppDataContext.Provider value={{
      members, addMember, updateMember, deleteMember,
      entries, addEntry, fetchData,
      settings, updateSettings
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
