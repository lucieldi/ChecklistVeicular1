import React from 'react';
import { Shield, Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function FirebaseSetupGuide() {
  const [copied, setCopied] = React.useState(false);

  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-red-100 p-8 shadow-xl max-w-2xl mx-auto my-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Configuração Necessária</h2>
          <p className="text-zinc-500">O Firebase está bloqueando o acesso aos dados.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
          <h3 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs">1</span>
            Acesse o Console do Firebase
          </h3>
          <p className="text-sm text-zinc-600 mb-4">
            Vá para a seção <strong>Firestore Database</strong> no seu projeto Firebase.
          </p>
          <a 
            href="https://console.firebase.google.com/project/checklistauto-558e2/firestore/rules" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
          >
            Abrir Regras do Firestore <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
          <h3 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs">2</span>
            Atualize as Regras
          </h3>
          <p className="text-sm text-zinc-600 mb-4">
            Clique na aba <strong>Rules</strong> (Regras) e substitua o conteúdo pelo código abaixo:
          </p>
          
          <div className="relative group">
            <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
              {rules}
            </pre>
            <button 
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
          <h3 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs">3</span>
            Publique as Alterações
          </h3>
          <p className="text-sm text-zinc-600">
            Clique no botão <strong>Publish</strong> (Publicar) e aguarde cerca de 1 minuto. Depois, recarregue esta página.
          </p>
        </div>
      </div>
    </div>
  );
}
