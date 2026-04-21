import React, { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Heart, Image } from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody } from '../components/ui';
import { photos, myChildren } from '../data/mockData';

function PhotoModal({ photo, onClose, onPrev, onNext, hasPrev, hasNext }) {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 text-white/80 hover:text-white transition-colors">
            <Heart className="w-6 h-6" />
          </button>
          <button className="p-2 text-white/80 hover:text-white transition-colors">
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 sm:left-4 p-2 sm:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        <img
          src={photo.url}
          alt={photo.caption}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-2 sm:right-4 p-2 sm:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Caption */}
      <div className="p-4 sm:p-6 text-center">
        <p className="text-white font-medium text-lg">{photo.caption}</p>
        <p className="text-white/60 text-sm mt-1">
          {new Date(photo.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

export default function Photos() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const child = myChildren[0];

  const openPhoto = (index) => setSelectedIndex(index);
  const closePhoto = () => setSelectedIndex(null);
  const prevPhoto = () => setSelectedIndex((i) => Math.max(0, i - 1));
  const nextPhoto = () => setSelectedIndex((i) => Math.min(photos.length - 1, i + 1));

  // Group photos by date
  const groupedPhotos = photos.reduce((groups, photo) => {
    const date = new Date(photo.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(photo);
    return groups;
  }, {});

  return (
    <Layout title="Photos" subtitle={`${photos.length} photos`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: child.classroomColor }}
          >
            {child.firstName[0]}
          </div>
          <div>
            <h2 className="font-semibold text-surface-900">{child.firstName}'s Photos</h2>
            <p className="text-sm text-surface-500">{photos.length} photos from daycare</p>
          </div>
        </div>

        {/* Photo Grid by Date */}
        {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
          <div key={date} className="mb-8">
            <h3 className="text-sm font-medium text-surface-500 mb-3">{date}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {datePhotos.map((photo) => {
                const globalIndex = photos.findIndex((p) => p.id === photo.id);
                return (
                  <button
                    key={photo.id}
                    onClick={() => openPhoto(globalIndex)}
                    className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-surface-100 hover:opacity-90 transition-opacity group relative"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-white text-xs truncate">{photo.caption}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {photos.length === 0 && (
          <Card>
            <CardBody className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-surface-400" />
              </div>
              <p className="text-surface-500 font-medium">No photos yet</p>
              <p className="text-sm text-surface-400 mt-1">
                Photos from the daycare will appear here
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Photo Modal */}
      <PhotoModal
        photo={selectedIndex !== null ? photos[selectedIndex] : null}
        onClose={closePhoto}
        onPrev={prevPhoto}
        onNext={nextPhoto}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex < photos.length - 1}
      />
    </Layout>
  );
}
