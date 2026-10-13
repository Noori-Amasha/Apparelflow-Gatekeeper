import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';

import { useAuth } from '../../../app/providers/AuthProvider';
import { fetchWorkspace } from '../api/dashboard.api';

type WorkspacePageProps = {
  title: string;
  description: string;
};

export default function WorkspacePage({
  title,
  description,
}: WorkspacePageProps) {

  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['workspace', user!.role],
    queryFn: () => fetchWorkspace(user!.role),
  });
  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow dark">
            PRODUCTION WORKSPACE
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => refetch()}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <section className="workspace-panel">
        <h2>
          Current batches
        </h2>
        {isLoading ? (
          <p className="muted">
            Loading…
          </p>
        ) : isError ? (
          <p
            role="alert"
            className="alert-error"
          >
            Unable to load batches. Please retry.
          </p>
        ) : data.length === 0 ? (
          <p className="muted">
            No batches in this view.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Recipe</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.order_no}
                    </td>
                    <td>
                      {item.recipe_name ?? '—'}
                    </td>
                    <td>
                      {item.target_qty ?? '—'}
                    </td>
                    <td>
                      <span className="status-chip">
                        {item.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">
          Phase 1: secure role-scoped overview. Creation, counting, and sewing actions will be added in subsequent phases.
        </p>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft size={17} />
          Back to dashboard
        </button>
      </section>
    </div>
  );
}