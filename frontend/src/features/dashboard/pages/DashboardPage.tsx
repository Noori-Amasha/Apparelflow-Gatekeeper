import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../../app/providers/AuthProvider';
import { roleLabel } from '../../../types/auth';
import { fetchWorkspace } from '../api/dashboard.api';

const destination = {
  cutting_supervisor: '/cutting/orders',
  cutting_verifier: '/verification',
  sewing_supervisor: '/sewing/pending',
};

const action = {
  cutting_supervisor: 'Manage cutting orders',
  cutting_verifier: 'Open verification queue',
  sewing_supervisor: 'View pending sewing',
};

export default function DashboardPage() {

  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user!.role;

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['workspace', role],
    queryFn: () => fetchWorkspace(role),
  });

  const pending = data.filter((order) =>
    [
      'PENDING',
      'IN_PROGRESS',
      'PENDING_VERIFICATION',
      'VERIFIED',
    ].includes(order.status)
  ).length;

  const finished = data.filter((order) =>
    [
      'REJECTED',
      'SEWING_STARTED',
    ].includes(order.status)
  ).length;
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-heading">
        <div>
          <span className="eyebrow dark">
            WORKSPACE OVERVIEW
          </span>
          <h1>
            Good to see you, {user?.full_name.split(' ')[0]}.
          </h1>
          <p>
            Your {roleLabel[role].toLowerCase()} workspace at a glance.
          </p>
        </div>
        <div className="role-pill">
          <ShieldCheck size={17} />
          {roleLabel[role]}
        </div>
      </div>
      {/* Statistics */}
      <div className="stat-grid">
        <Stat
          title="Orders in this view"
          value={isLoading ? '…' : data.length}
          icon={Box}
        />
        <Stat
          title="Awaiting action / active"
          value={isLoading ? '…' : pending}
          icon={Clock3}
        />
        <Stat
          title="Other statuses"
          value={isLoading ? '…' : finished}
          icon={CircleCheck}
        />
      </div>
      {/* Workspace Summary */}
      <section className="workspace-panel">
        <div className="panel-heading">
          <div className="panel-icon">
            <ClipboardCheck size={23} />
          </div>
          <div>
            <h2>
              Your operational workspace
            </h2>
            <p>
              Role-specific data loaded directly from your backend.
            </p>
          </div>
        </div>
        {
          isLoading ? (
            <p className="muted">
              Loading live orders…
            </p>
          ) : isError ? (
            <div className="alert-error">
              Could not load workspace data.
              <button onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <p className="workspace-summary">
              {
                data.length === 0
                  ? 'No orders available for your current role.'
                  : `${data.length} order${data.length === 1 ? '' : 's'} available in your permitted view.`
              }
            </p>
          )
        }
        <button
          className="btn btn-primary"
          onClick={() => navigate(destination[role])}
        >
          {action[role]}
          <ArrowRight size={18} />
        </button>
      </section>
      {/* Security Information */}
      <div className="scope-note">
        <ShieldCheck size={18} />
        <span>
          Role-restricted data: only backend-authorized records are requested for this workspace.
        </span>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: typeof Box;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={21} />
      </div>
      <span>
        {title}
      </span>
      <strong>
        {value}
      </strong>
    </div>
  );
}