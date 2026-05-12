import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Save, Key, Wallet, Settings as SettingsIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { saveSystemSettings } from './actions'

export default async function AdminConfigPage() {
  const supabase = await createClient()

  // Buscar configurações atuais do banco
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          Configurações do Sistema
        </h1>
        <p className="text-slate-500 mt-2">
          Gerencie as integrações, chaves de API e regras de negócio da plataforma.
        </p>
      </div>

      <form action={saveSystemSettings} className="grid gap-6 md:grid-cols-2">
        {/* Configurações de IA */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg dark:bg-purple-900/30 dark:text-purple-400">
                <Key size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Integração de IA</CardTitle>
                <CardDescription>Chaves de acesso para os modelos de IA.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <label htmlFor="gemini_key" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Google Gemini API Key
              </label>
              <input
                id="gemini_key"
                name="gemini_key"
                type="password"
                placeholder="AIzaSy..."
                defaultValue={settings?.gemini_api_key || ''}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
              />
              <p className="text-xs text-slate-500">Usada para visão computacional avançada na correção de provas.</p>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-950/50 border-t dark:border-slate-800">
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Save size={16} />
              Salvar Configurações
            </button>
          </CardFooter>
        </Card>

        {/* Configurações de Créditos */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 text-green-700 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                <Wallet size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Sistema de Créditos</CardTitle>
                <CardDescription>Regras e precificação.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <label htmlFor="free_credits" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Créditos Iniciais (Novos Usuários)
              </label>
              <input
                id="free_credits"
                name="free_credits"
                type="number"
                defaultValue={settings?.free_credits_new_user ?? 10}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="credit_price" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Preço por Pacote (Ex: 100 créditos) - R$
              </label>
              <input
                id="credit_price"
                name="credit_price"
                type="text"
                defaultValue={settings?.credit_package_price?.toString().replace('.', ',') || '29,90'}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-950/50 border-t dark:border-slate-800">
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Save size={16} />
              Salvar Configurações
            </button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
