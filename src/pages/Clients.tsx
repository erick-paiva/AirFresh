import { useState, useMemo } from 'react';
import React from 'react';
import { useStore, Client } from '@/store';
import { Button, Input, Select } from '@/components/ui';
import { Search, Plus, MapPin, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Map from '@/components/Map';
import { addMonths, format } from 'date-fns';
import { ConfirmationModal } from '@/components/ConfirmationModal';

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient, renewMaintenance, getClientStatus } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'delete' | 'renew' | null;
    clientId: string | null;
    clientName: string;
  }>({
    isOpen: false,
    type: null,
    clientId: null,
    clientName: '',
  });
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setConfirmState({
      isOpen: true,
      type: 'delete',
      clientId: client.id,
      clientName: client.name,
    });
  };

  const handleRenewClick = (client: Client) => {
    setConfirmState({
      isOpen: true,
      type: 'renew',
      clientId: client.id,
      clientName: client.name,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.clientId || !confirmState.type) return;

    setIsLoadingAction(true);
    try {
      if (confirmState.type === 'delete') {
        await deleteClient(confirmState.clientId);
      } else if (confirmState.type === 'renew') {
        await renewMaintenance(confirmState.clientId);
      }
      setConfirmState({ ...confirmState, isOpen: false });
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500">Gerencie sua base de clientes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
          Novo Cliente
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => {
          const status = getClientStatus(client);
          const statusColors = {
            ok: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
            warning: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
            critical: 'bg-red-50 text-red-700 ring-red-600/20',
          };
          const statusLabels = {
            ok: 'Em dia',
            warning: 'Atenção',
            critical: 'Atrasado',
          };

          return (
            <motion.div
              key={client.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status]}`}
                  >
                    {statusLabels[status]}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900">{client.name}</h3>
                <p className="text-sm text-slate-500">{client.email}</p>
                <p className="text-sm text-slate-500">{client.phone}</p>
                
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{client.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Última:</span>
                    {new Date(client.lastMaintenance).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Próxima:</span>
                    {format(addMonths(new Date(client.lastMaintenance), client.periodicity), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                  onClick={() => handleRenewClick(client)}
                  title="Renovar Manutenção"
                >
                  <RefreshCw className="mr-2 h-3 w-3" /> Renovar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(client)} title="Editar">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteClick(client)} title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmState.type === 'delete' ? 'Excluir Cliente' : 'Renovar Manutenção'}
        description={
          confirmState.type === 'delete' 
            ? `Tem certeza que deseja excluir o cliente "${confirmState.clientName}"? Esta ação não pode ser desfeita.`
            : `Confirmar renovação da manutenção para o cliente "${confirmState.clientName}"? A data será atualizada para hoje.`
        }
        confirmLabel={confirmState.type === 'delete' ? 'Excluir' : 'Renovar'}
        variant={confirmState.type === 'delete' ? 'danger' : 'primary'}
        isLoading={isLoadingAction}
      />

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <ClientForm
                initialData={editingClient}
                onSubmit={(data) => {
                  if (editingClient) {
                    updateClient(editingClient.id, data);
                  } else {
                    addClient(data as any);
                  }
                  handleCloseModal();
                }}
                onCancel={handleCloseModal}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientForm({ initialData, onSubmit, onCancel }: { initialData: Client | null, onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    lat: initialData?.lat || -23.550520,
    lng: initialData?.lng || -46.633308,
    lastMaintenance: initialData?.lastMaintenance || new Date().toISOString().split('T')[0],
    periodicity: initialData?.periodicity || 6,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng, address: `Local selecionado (${lat.toFixed(4)}, ${lng.toFixed(4)})` }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" name="name" value={formData.name} onChange={handleChange} required />
        <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Input label="Telefone" name="phone" value={formData.phone} onChange={handleChange} required />
        <Select
          label="Periodicidade"
          name="periodicity"
          value={formData.periodicity}
          onChange={handleChange}
          options={[
            { value: 3, label: 'Trimestral (3 meses)' },
            { value: 6, label: 'Semestral (6 meses)' },
            { value: 12, label: 'Anual (12 meses)' },
          ]}
        />
        <Input label="Última Manutenção" name="lastMaintenance" type="date" value={formData.lastMaintenance} onChange={handleChange} required />
        <Input label="Endereço" name="address" value={formData.address} onChange={handleChange} required className="sm:col-span-2" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Localização</label>
        <div className="h-64 w-full overflow-hidden rounded-lg border border-slate-200">
          <Map
            center={[formData.lat, formData.lng]}
            zoom={13}
            markers={[{ lat: formData.lat, lng: formData.lng }]}
            onLocationSelect={handleLocationSelect}
          />
        </div>
        <p className="text-xs text-slate-500">Clique no mapa para ajustar a localização.</p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="button" onClick={() => onSubmit(formData)}>Salvar</Button>
      </div>
    </div>
  );
}
