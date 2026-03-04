import { useStore } from '@/store';
import { motion } from 'motion/react';
import { Users, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useState } from 'react';
import { ConfirmationModal } from '@/components/ConfirmationModal';

export default function Dashboard() {
  const { clients, getClientStatus, renewMaintenance } = useStore();
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    clientId: string | null;
  }>({
    isOpen: false,
    clientId: null,
  });
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const handleRenewClick = (id: string) => {
    setConfirmState({
      isOpen: true,
      clientId: id,
    });
  };

  const handleConfirmRenew = async () => {
    if (!confirmState.clientId) return;
    
    setIsLoadingAction(true);
    try {
      await renewMaintenance(confirmState.clientId);
      setConfirmState({ isOpen: false, clientId: null });
    } catch (error: any) {
      alert(`Erro ao renovar: ${error.message || 'Verifique o console para mais detalhes.'}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const stats = {
    total: clients.length,
    critical: clients.filter((c) => getClientStatus(c) === 'critical').length,
    warning: clients.filter((c) => getClientStatus(c) === 'warning').length,
    ok: clients.filter((c) => getClientStatus(c) === 'ok').length,
  };

  const criticalClients = clients.filter((c) => getClientStatus(c) === 'critical');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Visão geral das manutenções</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Clientes"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Manutenções Atrasadas"
          value={stats.critical}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Atenção Necessária"
          value={stats.warning}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Em Dia"
          value={stats.ok}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Critical Alerts Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alertas Críticos
          </h2>
          <Link to="/clients" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {criticalClients.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhuma manutenção crítica pendente. Ótimo trabalho!
            </div>
          ) : (
            criticalClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-medium text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-500">Última manutenção: {new Date(client.lastMaintenance).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                    Atrasado
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => handleRenewClick(client.id)}
                    title="Renovar Manutenção"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Link to={`/clients?edit=${client.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                    Editar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, clientId: null })}
        onConfirm={handleConfirmRenew}
        title="Renovar Manutenção"
        description="Confirmar renovação da manutenção para hoje? A data da última manutenção será atualizada."
        confirmLabel="Renovar"
        isLoading={isLoadingAction}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: 'blue' | 'red' | 'yellow' | 'green' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={cn("rounded-lg p-3", colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
