import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProjectState] = useState(
    localStorage.getItem('renew_current_project') || null
  );

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const res = await projectAPI.list();
      const list = res.data.projects || res.data || [];
      setProjects(list);

      // Restore saved project or default to first
      const saved = localStorage.getItem('renew_current_project');
      if (saved && list.find(p => p._id === saved)) {
        setCurrentProjectState(saved);
      } else if (list.length > 0 && !currentProject) {
        setCurrentProjectState(list[0]._id);
        localStorage.setItem('renew_current_project', list[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const setCurrentProject = (id) => {
    setCurrentProjectState(id);
    if (id) localStorage.setItem('renew_current_project', id);
    else localStorage.removeItem('renew_current_project');
  };

  const refreshProject = () => fetchProjects();

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, projects, fetchProjects, refreshProject }}>
      {children}
    </ProjectContext.Provider>
  );
};
