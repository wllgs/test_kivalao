import { FormEvent, useState } from 'react';

type ValidateCodeResponse = {
  code: {
    value: string;
    status: string;
    redeemedAt: string;
    offerTitle: string;
  };
  transaction: {
    id: string;
    commissionAmount: string;
    currency: string;
  };
};

interface ValidateCodeFormProps {
  redeemingPartnerId: string;
}

export function ValidateCodeForm({ redeemingPartnerId }: ValidateCodeFormProps) {
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!code.trim() || !amount.trim()) {
      setMessage('Merci de renseigner le code et le montant.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/code/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          purchaseValue: Number(amount),
          redeemingPartnerId,
          channel: 'in-store',
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json();
        throw new Error(errorPayload.message ?? 'Validation impossible');
      }

      const payload: ValidateCodeResponse = await response.json();
      setStatus('success');
      setMessage(
        `Code ${payload.code.value} valide. Commission due : ${payload.transaction.commissionAmount} ${payload.transaction.currency}`,
      );
      setCode('');
      setAmount('');
    } catch (error) {
      setStatus('error');
      setMessage((error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-slate-700">
          Code promotionnel
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Ex: KIVA-1234"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
          Montant de la vente (EUR)
        </label>
        <input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="120.00"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex w-full justify-center rounded bg-green-600 px-4 py-2 font-semibold text-white shadow disabled:opacity-50"
      >
        {status === 'loading' ? 'Validation...' : 'Valider le code'}
      </button>

      {status !== 'idle' && (
        <p
          className={`text-sm ${status === 'success' ? 'text-green-700' : 'text-red-600'}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
