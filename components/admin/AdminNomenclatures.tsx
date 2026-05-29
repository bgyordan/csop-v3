'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Plus, Trash2, Inbox, Send, FileText } from 'lucide-react';

interface Nomenclature {
  id: string;
  register: string;
  code: string;
  description: string;
  created_at: string;
}

interface OrderType {
  id: string;
  code: string;
  name: string;
  retention_years: number | null;
  created_at: string;
}

interface AdminNomenclaturesProps {
  nomenclatures: Nomenclature[];
  orderTypes: OrderType[];
}

const registerConfig = {
  incoming: { label: 'Регистър-входящи', icon: Inbox, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  outgoing: { label: 'Регистър-изходящи', icon: Send, color: 'text-green-600 bg-green-50 border-green-200' },
};

type RegisterType = 'incoming' | 'outgoing';

export default function AdminNomenclatures({ nomenclatures: initial, orderTypes: initialOrderTypes }: AdminNomenclaturesProps) {
  const [items, setItems] = useState<Nomenclature[]>(initial);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>(initialOrderTypes);
  const [newCode, setNewCode] = useState<Record<RegisterType, string>>({ incoming: '', outgoing: '' });
  const [newDesc, setNewDesc] = useState<Record<RegisterType, string>>({ incoming: '', outgoing: '' });
  const [saving, setSaving] = useState<RegisterType | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newOrderCode, setNewOrderCode] = useState('');
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderRetention, setNewOrderRetention] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  async function handleAdd(register: RegisterType) {
    const code = newCode[register].trim().toUpperCase();
    const description = newDesc[register].trim();
    if (!code) return;
    setSaving(register);
    const { data, error } = await supabase.from('nomenclatures').insert({ register, code, description }).select().single();
    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      setItems(prev => [...prev, data]);
      setNewCode(prev => ({ ...prev, [register]: '' }));
      setNewDesc(prev => ({ ...prev, [register]: '' }));
      toast({ title: `Кодът ${code} е добавен.` });
    }
    setSaving(null);
  }

  async function handleDelete(id: string, code: string) {
    setDeleting(id);
    const { error } = await supabase.from('nomenclatures').delete().eq('id', id);
    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: `Кодът ${code} е изтрит.` });
    }
    setDeleting(null);
  }

  async function handleAddOrderType() {
    const code = newOrderCode.trim().toUpperCase();
    const name = newOrderName.trim();
    if (!code || !name) return;
    setSavingOrder(true);
    const { data, error } = await supabase.from('order_types').insert({
      code, name,
      retention_years: newOrderRetention ? parseInt(newOrderRetention) : null,
    }).select().single();
    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      setOrderTypes(prev => [...prev, data]);
      setNewOrderCode('');
      setNewOrderName('');
      setNewOrderRetention('');
      toast({ title: `Кодът ${code} е добавен.` });
    }
    setSavingOrder(false);
  }

  async function handleDeleteOrderType(id: string, code: string) {
    setDeletingOrder(id);
    const { error } = await supabase.from('order_types').delete().eq('id', id);
    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      setOrderTypes(prev => prev.filter(i => i.id !== id));
      toast({ title: `Кодът ${code} е изтрит.` });
    }
    setDeletingOrder(null);
  }

  return (
    <>
      <Toaster />
      <div className="grid gap-6">
        {/* Входящи и Изходящи */}
        {(Object.keys(registerConfig) as RegisterType[]).map(register => {
          const config = registerConfig[register];
          const Icon = config.icon;
          const registerItems = items.filter(i => i.register === register);
          return (
            <Card key={register} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${config.color}`}>
                    <Icon size={15} />
                  </div>
                  <CardTitle className="text-base font-semibold text-gray-800">{config.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {registerItems.length === 0 && <p className="text-sm text-gray-400">Няма въведени кодове.</p>}
                  {registerItems.map(item => (
                    <div key={item.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${config.color}`}>
                      <span className="font-mono">{item.code}</span>
                      {item.description && <span className="text-xs opacity-70">— {item.description}</span>}
                      <button onClick={() => handleDelete(item.id, item.code)} disabled={deleting === item.id} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Код (напр. АСД)" value={newCode[register]} onChange={e => setNewCode(prev => ({ ...prev, [register]: e.target.value }))} className="w-32 uppercase" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleAdd(register)} />
                  <Input placeholder="Описание (незадължително)" value={newDesc[register]} onChange={e => setNewDesc(prev => ({ ...prev, [register]: e.target.value }))} className="flex-1" onKeyDown={e => e.key === 'Enter' && handleAdd(register)} />
                  <Button onClick={() => handleAdd(register)} disabled={!newCode[register].trim() || saving === register} className="bg-blue-700 hover:bg-blue-800 text-white gap-1">
                    <Plus size={15} />Добави
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Заповеди */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border text-orange-600 bg-orange-50 border-orange-200">
                <FileText size={15} />
              </div>
              <CardTitle className="text-base font-semibold text-gray-800">Заповеди</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {orderTypes.length === 0 && <p className="text-sm text-gray-400">Няма въведени кодове.</p>}
              {orderTypes.map(item => (
                <div key={item.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium text-orange-600 bg-orange-50 border-orange-200">
                  <span className="font-mono">{item.code}</span>
                  <span className="text-xs opacity-70">— {item.name}</span>
                  {item.retention_years && <span className="text-xs opacity-50">({item.retention_years} г.)</span>}
                  <button onClick={() => handleDeleteOrderType(item.id, item.code)} disabled={deletingOrder === item.id} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Код (напр. АСД)" value={newOrderCode} onChange={e => setNewOrderCode(e.target.value)} className="w-28 uppercase" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleAddOrderType()} />
              <Input placeholder="Наименование *" value={newOrderName} onChange={e => setNewOrderName(e.target.value)} className="flex-1" onKeyDown={e => e.key === 'Enter' && handleAddOrderType()} />
              <Input placeholder="Год. съхр." value={newOrderRetention} onChange={e => setNewOrderRetention(e.target.value)} className="w-24" type="number" min="1" />
              <Button onClick={handleAddOrderType} disabled={!newOrderCode.trim() || !newOrderName.trim() || savingOrder} className="bg-orange-600 hover:bg-orange-700 text-white gap-1">
                <Plus size={15} />Добави
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
