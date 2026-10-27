import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { NewVideoForm } from './components/NewVideoForm';
import { ProjectsList } from './components/ProjectsList';
import { ProjectDetails } from './components/ProjectDetails';
import { PipelineProgress } from './components/PipelineProgress';
import { SettingsAndDiagnostics } from './components/SettingsAndDiagnostics';
import { Toast } from './components/Toast';
import { Project, GenerationJob, ProviderStatus, ProjectSettings } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'create' | 'projects' | 'settings' | 'details' | 'pipeline'>('create');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [activeProjectTopic, setActiveProjectTopic] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch provider status
  const fetchProviderStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/provider-status');
      if (res.ok) {
        const data = await res.json();
        setProviderStatus(data);
        // If Gemini is connected, we can default demo mode to false unless user manually switched
        if (data.geminiText.status === 'connected') {
          setIsDemoMode(false);
        }
      }
    } catch (err) {
      console.error('Error fetching provider status:', err);
    }
  }, []);

  // Fetch projects list
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProviderStatus();
    fetchProjects();
  }, [fetchProviderStatus, fetchProjects]);

  // Polling for active job
  useEffect(() => {
    if (!activeJob) return;

    const isFinished =
      activeJob.status === 'completed' ||
      activeJob.status === 'failed' ||
      activeJob.status === 'cancelled';

    if (isFinished) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${activeJob.id}`);
        if (res.ok) {
          const data = await res.json();
          setActiveJob(data.job);

          if (data.job.status === 'completed') {
            setToast({
              message: 'تم إنتاج وتحضير الفيديو بنجاح! جاهز للمشاهدة والتحميل.',
              type: 'success',
            });
            fetchProjects();
          } else if (data.job.status === 'failed') {
            setToast({
              message: `تعثر خط الإنتاج: ${data.job.errorMessage || 'حدث خطأ'}`,
              type: 'error',
            });
            fetchProjects();
          }
        }
      } catch (err) {
        console.error('Error polling job:', err);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [activeJob, fetchProjects]);

  // Handler: Create & Start generation
  const handleCreateProject = async (topic: string, settings: ProjectSettings) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, settings }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'تعذر بدء المشروع');
      }

      const data = await res.json();
      setActiveProjectTopic(topic);

      // Fetch the job object
      const jobRes = await fetch(`/api/jobs/${data.jobId}`);
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setActiveJob(jobData.job);
      }

      setSelectedProjectId(data.project.id);
      setCurrentTab('pipeline');
      fetchProjects();
    } catch (err: any) {
      setToast({
        message: err.message || 'فشل في إنشاء المشروع',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Cancel Job
  const handleCancelJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      if (res.ok) {
        setToast({ message: 'تم إلغاء المهمة', type: 'info' });
        if (activeJob) {
          setActiveJob({ ...activeJob, status: 'cancelled' });
        }
        fetchProjects();
      }
    } catch (err) {
      console.error('Error cancelling job:', err);
    }
  };

  // Handler: Retry Job
  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setToast({ message: 'تمت إعادة تشغيل خط الإنتاج', type: 'info' });

        const jobRes = await fetch(`/api/jobs/${data.jobId}`);
        if (jobRes.ok) {
          const jobData = await jobRes.json();
          setActiveJob(jobData.job);
        }
        setCurrentTab('pipeline');
        fetchProjects();
      }
    } catch (err) {
      console.error('Error retrying job:', err);
    }
  };

  // Handler: Duplicate Project
  const handleDuplicateProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        setToast({ message: 'تم استنساخ المشروع بنجاح', type: 'success' });
        fetchProjects();
      }
    } catch (err) {
      console.error('Error duplicating project:', err);
    }
  };

  // Handler: Delete Project
  const handleDeleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'تم حذف المشروع بنجاح', type: 'info' });
        if (selectedProjectId === projectId) {
          setSelectedProjectId(null);
          setCurrentTab('projects');
        }
        fetchProjects();
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // Handler: Download MP4
  const handleDownload = (projectId: string) => {
    window.location.href = `/api/projects/${projectId}/download?download=1`;
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-[#171717] text-[#F7F3EA] flex flex-col font-['Cairo'] antialiased">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab === 'details' || currentTab === 'pipeline' ? 'projects' : currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={(val) => {
          setIsDemoMode(val);
          setToast({
            message: val
              ? 'تم تفعيل الوضع التجريبي: يتم إنتاج فيديوهات مجانية دون استهلاك حصص'
              : 'تم تفعيل الوضع الحقيقي: يستخدم نماذج Gemini مباشرة',
            type: 'info',
          });
        }}
        providerStatus={providerStatus}
        projectsCount={projects.length}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {currentTab === 'create' && (
          <NewVideoForm
            onSubmit={handleCreateProject}
            isLoading={isSubmitting}
            isDemoMode={isDemoMode}
            onToggleDemoMode={setIsDemoMode}
          />
        )}

        {currentTab === 'pipeline' && activeJob && (
          <PipelineProgress
            job={activeJob}
            topicTitle={activeProjectTopic || selectedProject?.topic || 'مشروع وثائقي'}
            onCancel={handleCancelJob}
            onRetry={handleRetryJob}
            onViewProject={(projId) => {
              setSelectedProjectId(projId);
              setCurrentTab('details');
            }}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsList
            projects={projects}
            onOpenProject={(projId) => {
              setSelectedProjectId(projId);
              setCurrentTab('details');
            }}
            onNewProject={() => setCurrentTab('create')}
            onDuplicate={handleDuplicateProject}
            onDelete={handleDeleteProject}
            onRetry={handleRetryJob}
            onDownload={handleDownload}
          />
        )}

        {currentTab === 'details' && selectedProject && (
          <ProjectDetails
            project={selectedProject}
            onBack={() => setCurrentTab('projects')}
            onRetry={(projId) => {
              if (selectedProject.activeJobId) {
                handleRetryJob(selectedProject.activeJobId);
              } else {
                handleCreateProject(selectedProject.topic, selectedProject.settings);
              }
            }}
            onDownload={handleDownload}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsAndDiagnostics
            status={providerStatus}
            onRefreshStatus={fetchProviderStatus}
            isDemoMode={isDemoMode}
            onToggleDemoMode={setIsDemoMode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262522] py-6 px-4 sm:px-6 bg-[#141413] text-xs text-[#77736D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#F7F3EA]">VOX AI STUDIO</span>
            <span>•</span>
            <span>من الفكرة إلى الفيديو النهائي</span>
          </div>
          <div className="text-[11px] font-['Tajawal'] text-[#A8A49C]">
            مدعوم بتقنيات Gemini 3.8 Flash ومحرك المونتاج FFmpeg للغة العربية الفصحى
          </div>
        </div>
      </footer>

      {/* Floating Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
