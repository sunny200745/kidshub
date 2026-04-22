import React, { useState } from 'react';
import { Plus, Megaphone, Pencil, Trash2 } from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Card,
  CardBody,
  Badge,
  Button,
  IconButton,
  LoadingPage,
  EmptyState,
  ConfirmDialog,
} from '../components/ui';
import { AnnouncementFormModal } from '../components/modals';
import { useAnnouncementsData, useClassroomsData } from '../hooks';
import { announcementsApi } from '../firebase/api';

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function audienceLabel(targetAudience, classrooms) {
  if (!targetAudience || targetAudience === 'all') return 'Everyone';
  if (targetAudience.startsWith('classroom:')) {
    const id = targetAudience.slice('classroom:'.length);
    const match = classrooms?.find((c) => c.id === id);
    return match ? `${match.name} only` : 'Classroom';
  }
  return targetAudience;
}

function AnnouncementRow({ announcement, classrooms, onEdit, onDelete }) {
  return (
    <div className="group flex items-start justify-between gap-3 p-4 hover:bg-surface-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {announcement.priority === 'high' && (
            <Badge variant="danger">Important</Badge>
          )}
          <h3 className="font-semibold text-surface-900 text-sm sm:text-base">
            {announcement.title}
          </h3>
        </div>
        <p className="text-sm text-surface-600 mt-1 whitespace-pre-line">
          {announcement.content}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
          <span>{formatTimestamp(announcement.timestamp)}</span>
          <span>•</span>
          <span>{audienceLabel(announcement.targetAudience, classrooms)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
        <IconButton
          icon={Pencil}
          variant="ghost"
          onClick={() => onEdit(announcement)}
          aria-label="Edit announcement"
        />
        <IconButton
          icon={Trash2}
          variant="ghost"
          onClick={() => onDelete(announcement)}
          aria-label="Delete announcement"
          className="text-danger-500 hover:text-danger-600 hover:bg-danger-50"
        />
      </div>
    </div>
  );
}

export default function Announcements() {
  const { data: announcements, loading: announcementsLoading } = useAnnouncementsData();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null);

  const loading = announcementsLoading || classroomsLoading;

  const openAdd = () => {
    setEditingAnnouncement(null);
    setShowFormModal(true);
  };
  const openEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowFormModal(true);
  };
  const closeForm = () => {
    setShowFormModal(false);
    setEditingAnnouncement(null);
  };

  if (loading) {
    return (
      <Layout title="Announcements" subtitle="Loading...">
        <LoadingPage message="Loading announcements..." />
      </Layout>
    );
  }

  return (
    <Layout
      title="Announcements"
      subtitle={`${announcements?.length || 0} posted`}
      actions={
        <Button icon={Plus} onClick={openAdd} className="hidden sm:inline-flex">
          New Announcement
        </Button>
      }>
      <div className="sm:hidden mb-4">
        <Button icon={Plus} onClick={openAdd} className="w-full">
          New Announcement
        </Button>
      </div>

      <Card>
        {announcements && announcements.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {announcements.map((announcement) => (
              <AnnouncementRow
                key={announcement.id}
                announcement={announcement}
                classrooms={classrooms}
                onEdit={openEdit}
                onDelete={setDeletingAnnouncement}
              />
            ))}
          </div>
        ) : (
          <CardBody>
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Post an update to keep parents and staff in the loop."
              action={openAdd}
              actionLabel="New Announcement"
            />
          </CardBody>
        )}
      </Card>

      <AnnouncementFormModal
        isOpen={showFormModal}
        onClose={closeForm}
        announcement={editingAnnouncement}
        classrooms={classrooms || []}
      />

      <ConfirmDialog
        isOpen={!!deletingAnnouncement}
        onClose={() => setDeletingAnnouncement(null)}
        onConfirm={async () => {
          await announcementsApi.delete(deletingAnnouncement.id);
        }}
        title="Delete announcement"
        message={
          deletingAnnouncement
            ? `This will permanently remove "${deletingAnnouncement.title}". Parents and staff will no longer see it.`
            : ''
        }
        confirmLabel="Delete announcement"
      />
    </Layout>
  );
}
