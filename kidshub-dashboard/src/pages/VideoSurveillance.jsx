/**
 * /video-surveillance — visible-but-locked tab for the live camera
 * surveillance feature.
 *
 * Status: the feature is both (a) Premium-tier on the price sheet and
 * (b) in `INFRA_LOCKED_FEATURES` because no camera partner integration
 * has shipped yet. That means `useFeature('videoSurveillance')` always
 * returns `enabled: false` today, so every visitor sees the full-card
 * `UpgradeCTA` regardless of plan.
 *
 * Why ship the tab at all? Two reasons:
 *   1. Discovery — owners can see it on the roadmap and route through
 *      /plans → contact-sales, which gives us a concrete demand signal
 *      we can use to prioritize the camera partnership.
 *   2. Consistency — every other paid feature has a real entry point
 *      with a real Unlock badge; hiding this one entirely would break
 *      the mental model users are learning ("pink pill == paid").
 *
 * When to delete this shim:
 *   The moment the real camera viewer lands, replace the preview grid
 *   below with the actual live streams UI and drop `videoSurveillance`
 *   from `INFRA_LOCKED_FEATURES`. The tier gate (Premium) then takes
 *   over automatically — Starter/Pro still see this CTA, Premium see
 *   real feeds.
 */
import React from 'react';
import { Video, Shield, Bell, Smartphone } from 'lucide-react';

import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, TierBadge } from '../components/ui';
import { UpgradeCTA } from '../components/UpgradeCTA';
import { useFeature } from '../hooks';

const PREVIEW_TILES = [
  { label: 'Toddler room', hint: 'East wing · 2 cams' },
  { label: 'Infant room', hint: 'West wing · 1 cam' },
  { label: 'Playroom', hint: 'North wing · 2 cams' },
  { label: 'Outdoor yard', hint: 'Fenced area · 2 cams' },
];

const FEATURE_POINTS = [
  {
    icon: Video,
    title: 'Live streaming',
    body: 'Watch every classroom in real time from the owner dashboard.',
  },
  {
    icon: Smartphone,
    title: 'Parent viewing windows',
    body: 'Give parents time-boxed access to their child’s room during drop-off and pickup.',
  },
  {
    icon: Bell,
    title: 'Motion-triggered clips',
    body: 'Auto-save 30-second clips to your incident log whenever motion is detected after hours.',
  },
  {
    icon: Shield,
    title: 'Retention + audit trail',
    body: '30-day rolling retention with an immutable access log for licensing inspections.',
  },
];

export default function VideoSurveillance() {
  const feature = useFeature('videoSurveillance');

  return (
    <Layout
      title="Video surveillance"
      subtitle="Live camera feeds across every classroom"
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Video className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-surface-900">Live camera feeds</h3>
                  <TierBadge feature="videoSurveillance" />
                </div>
                <p className="text-sm text-surface-500">
                  Stream every classroom from one place — secure, audited, and parent-friendly.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <UpgradeCTA
              feature="videoSurveillance"
              upgradeTo={feature.upgradeTo ?? 'premium'}
              variant="card"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h3 className="font-semibold text-surface-900">What’s included</h3>
              <p className="text-sm text-surface-500">
                A quick tour of what ships the moment this feature unlocks.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURE_POINTS.map((point) => (
                <div
                  key={point.title}
                  className="flex items-start gap-3 rounded-xl border border-surface-100 bg-surface-50/60 p-4"
                >
                  <div className="w-9 h-9 rounded-lg bg-white border border-surface-100 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-900 text-sm">{point.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{point.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h3 className="font-semibold text-surface-900">Preview</h3>
              <p className="text-sm text-surface-500">
                A glimpse at how your classrooms will appear once live.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PREVIEW_TILES.map((tile) => (
                <div
                  key={tile.label}
                  className="relative aspect-video rounded-xl overflow-hidden border border-surface-100 bg-gradient-to-br from-surface-900 to-surface-700"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{tile.label}</p>
                      <p className="text-xs text-white/70">{tile.hint}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 border border-white/20">
                      Locked
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
