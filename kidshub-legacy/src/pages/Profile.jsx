import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  AlertTriangle, 
  Users, 
  Calendar, 
  FileText,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Loader2,
  Heart,
  Phone,
} from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, Avatar, Badge } from '../components/ui';
import { childProfile, myChildren } from '../data/mockData';
import { useAuth } from '../contexts';

function ProfileSection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider px-1 mb-2">
        {title}
      </h3>
      <Card>
        <CardBody className="p-0 divide-y divide-surface-100">
          {children}
        </CardBody>
      </Card>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-surface-50 transition-colors ${
        danger ? 'text-danger-600' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        danger ? 'bg-danger-100' : 'bg-surface-100'
      }`}>
        <Icon className={`w-5 h-5 ${danger ? 'text-danger-600' : 'text-surface-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${danger ? 'text-danger-600' : 'text-surface-900'}`}>
          {label}
        </p>
        {value && <p className="text-sm text-surface-500 truncate">{value}</p>}
      </div>
      <ChevronRight className={`w-5 h-5 ${danger ? 'text-danger-400' : 'text-surface-300'}`} />
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const child = myChildren[0];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Layout title="Profile" subtitle="Manage your child's information">
      <div className="max-w-2xl mx-auto">
        {/* Child Info Card */}
        <Card className="mb-6">
          <CardBody className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <Avatar name={`${child.firstName} ${child.lastName}`} size="xl" />
              <div>
                <h2 className="text-xl font-bold text-surface-900">
                  {child.firstName} {child.lastName}
                </h2>
                <p className="text-surface-500">{child.age}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: child.classroomColor }}
                  />
                  <span className="text-sm text-surface-600">{child.classroom}</span>
                </div>
              </div>
            </div>

            {/* Allergies */}
            {childProfile.allergies.length > 0 && (
              <div className="mt-5 pt-5 border-t border-surface-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-danger-500" />
                  <p className="text-sm font-medium text-surface-700">Allergies</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {childProfile.allergies.map((allergy) => (
                    <Badge key={allergy} variant="danger" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Child Information */}
        <ProfileSection title="Child Information">
          <ProfileItem
            icon={Heart}
            label="Medical & Allergies"
            value={`${childProfile.allergies.length} allergies, ${childProfile.dietaryRestrictions.length} restrictions`}
            onClick={() => {}}
          />
          <ProfileItem
            icon={Users}
            label="Emergency Contacts"
            value={`${childProfile.emergencyContacts.length} contacts`}
            onClick={() => {}}
          />
          <ProfileItem
            icon={Phone}
            label="Authorized Pickups"
            value={`${childProfile.authorizedPickups.length} people`}
            onClick={() => {}}
          />
          <ProfileItem
            icon={Calendar}
            label="Schedule"
            value="Mon - Fri"
            onClick={() => {}}
          />
          <ProfileItem
            icon={FileText}
            label="Documents"
            value="View enrollment forms"
            onClick={() => {}}
          />
        </ProfileSection>

        {/* Settings */}
        <ProfileSection title="Settings">
          <ProfileItem
            icon={Bell}
            label="Notifications"
            value="Manage alerts"
            onClick={() => {}}
          />
          <ProfileItem
            icon={Shield}
            label="Privacy & Security"
            onClick={() => {}}
          />
          <ProfileItem
            icon={HelpCircle}
            label="Help & Support"
            onClick={() => {}}
          />
        </ProfileSection>

        {/* Logout */}
        <Card>
          <CardBody className="p-0">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 p-4 text-danger-600 hover:bg-danger-50 transition-colors rounded-2xl"
            >
              {loggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              <span className="font-medium">
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </span>
            </button>
          </CardBody>
        </Card>

        {/* App Version */}
        <p className="text-center text-xs text-surface-400 mt-6">
          KidsHub Parent App v1.0.0
        </p>
      </div>
    </Layout>
  );
}
