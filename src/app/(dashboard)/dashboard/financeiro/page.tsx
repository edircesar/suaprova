import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CreditCard, Zap, Sparkles, Check, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', session.user.id)
    .single()

  const currentCredits = profile?.credits || 0

  const plans = [
    {
      name: 'Starter',
      credits: 50,
      price: 'R$ 29,90',
      description: 'Ideal para professores individuais.',
      features: ['50 créditos de correção', 'Correção Express ilimitada', 'Suporte via email'],
      popular: false
    },
    {
      name: 'Pro',
      credits: 200,
      price: 'R$ 89,90',
      description: 'Melhor custo-benefício para turmas grandes.',
      features: ['200 créditos de correção', 'Correção Express ilimitada', 'Relatórios em PDF', 'Suporte prioritário'],
      popular: true
    },
    {
      name: 'Premium',
      credits: 1000,
      price: 'R$ 349,90',
      description: 'Para escolas e grandes volumes.',
      features: ['1000 créditos de correção', 'Tudo do plano Pro', 'Dashboard de analytics', 'Exportação em Excel'],
      popular: false
    }
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-slate-500">Gerencie seus créditos e planos de correção.</p>
      </div>

      {/* Saldo de Créditos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{currentCredits}</span>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">créditos</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              1 crédito = 1 correção no modo Premium IA.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info size={16} className="text-slate-400" />
              Como funcionam os créditos?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Zap size={14} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Modo Express:</strong> Totalmente gratuito e ilimitado. Não consome créditos.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Modo Premium IA:</strong> Consome 1 crédito por folha corrigida. Ideal para fotos de celular ou provas personalizadas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planos de Crédito */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <CreditCard size={20} className="text-indigo-600" />
          Comprar Créditos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative flex flex-col ${
                plan.popular ? 'border-indigo-600 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-600' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Mais Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div>
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-slate-500 text-sm font-medium"> / {plan.credits} créditos</span>
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full font-bold h-11 rounded-xl ${
                    plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 dark:bg-slate-50'
                  }`}
                  disabled
                >
                  Em breve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500">
            A integração com pagamentos está em desenvolvimento. 
            Em breve você poderá adquirir pacotes de créditos via PIX ou Cartão de Crédito.
          </p>
        </div>
      </div>
    </div>
  )
}
