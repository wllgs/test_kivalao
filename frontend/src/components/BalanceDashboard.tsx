import { useEffect, useState } from 'react';

type BalanceResponse = {
  netBalance: number;
  youAreOwed: number;
  youOwe: number;
  recentTransactions: Array<{
    id: string;
    code: string;
    role: 'REFERRER' | 'REDEEMER';
    commissionAmount: number;
    status: string;
    occurredAt: string;
  }>;
};

export function BalanceDashboard() {
  const [data, setData] = useState<BalanceResponse>();
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchBalance = async () => {
      setState('loading');
      try {
        const response = await fetch('/api/dashboard/balance');
        if (!response.ok) {
          throw new Error('Impossible de recuperer la balance');
        }
        const payload: BalanceResponse = await response.json();
        setData(payload);
        setState('idle');
      } catch (error) {
        setState('error');
        setErrorMessage((error as Error).message);
      }
    };

    fetchBalance();
  }, []);

  if (state === 'loading' && !data) {
    return <p className="text-sm text-slate-500">Chargement de votre dashboard...</p>;
  }

  if (state === 'error') {
    return <p className="text-sm text-red-600">{errorMessage}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <BalanceCard label="Solde Net" value={data.netBalance} accent="text-indigo-600" />
        <BalanceCard label="A recevoir" value={data.youAreOwed} accent="text-emerald-600" />
        <BalanceCard label="A verser" value={data.youOwe} accent="text-rose-600" />
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900">Dernieres transactions</h3>
        <ul className="divide-y divide-slate-200 rounded border border-slate-100 bg-white">
          {data.recentTransactions.map((transaction) => (
            <li key={transaction.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">
                  {transaction.role === 'REFERRER' ? 'Vous recevez' : 'Vous versez'} - Code {transaction.code}
                </p>
                <p className="text-slate-500">
                  {new Date(transaction.occurredAt).toLocaleDateString()} - Statut {transaction.status}
                </p>
              </div>
              <span className="font-semibold text-slate-900">
                {transaction.role === 'REFERRER' ? '+' : '-'} {transaction.commissionAmount.toFixed(2)} EUR
              </span>
            </li>
          ))}
          {data.recentTransactions.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">Aucune transaction pour le moment.</li>
          )}
        </ul>
      </div>
    </section>
  );
}

interface BalanceCardProps {
  label: string;
  value: number;
  accent: string;
}

function BalanceCard({ label, value, accent }: BalanceCardProps) {
  return (
    <div className="rounded border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value.toFixed(2)} EUR</p>
    </div>
  );
}
