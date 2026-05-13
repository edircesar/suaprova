'use client'

import { Printer } from 'lucide-react'

export default function PrintSheetButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium print:hidden"
    >
      <Printer size={18} />
      Imprimir Folha de Respostas
    </button>
  )
}
