import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CreditCard, Zap, Sparkles, Check, Info, Rocket, School, ZapIcon, Gift } from 'lucide-react'
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
      name: 'Seja Bem Vindo',
      credits: 50,
      price: 'Grátis',
      description: 'Para você conhecer a plataforma.',
      features: ['50 créditos de correção', 'Não acumulativo', 'Suporte via e-mail'],
      icon: <Gift className="h-5 w-5 text-emerald-500" />,
      popular: false
    },
    {
      name: 'Starter',
      credits: 100,
      price: 'R$ 11,99',
      period: '/mês',
      description: 'Ideal para professores individuais.',
      features: ['100 créditos (acumulativos)', 'Relatório PDF', 'Suporte via e-mail'],
      icon: <Rocket className="h-5 w-5 text-indigo-500" />,
      popular: true
    },
    {
      name: 'Escola',
      credits: 300,
      price: 'R$ 29,99',
      period: '/mês',
      description: 'Perfeito para pequenas escolas.',
      features: ['300 créditos (acumulativos)', 'Relatório PDF', 'Suporte via e-mail', 'Suporte via Chat'],
      icon: <School className="h-5 w-5 text-purple-500" />,
      popular: false
    },
    {
      name: 'Full',
      credits: 1000,
      price: 'R$ 49,99',
      period: '/mês',
      description: 'Alta produtividade acadêmica.',
      features: ['1000 créditos (acumulativos)', 'Relatório PDF', 'Suporte via e-mail', 'Suporte via Chat'],
      icon: <ZapIcon className="h-5 w-5 text-amber-500" />,
      popular: false
    }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-slate-500">Gerencie seus créditos e planos de correção.</p>
        </div>
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
              1 crédito = 1 correção (Modo Expresso ou Premium).
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info size={16} className="text-slate-400" />
              Entenda o consumo de créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Zap size={14} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Modo Expresso:</strong> 1 crédito/folha. Usa o modelo oficial do SuaProva.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={14} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Modo Premium:</strong> 1 crédito/folha. Ideal para fotos de baixa qualidade ou provas personalizadas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planos Mensais */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <CreditCard size={20} className="text-indigo-600" />
          Planos Mensais
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative flex flex-col transition-all hover:shadow-md ${
                plan.popular ? 'border-indigo-600 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-600 scale-[1.02] z-10' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Recomendado
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="mb-2">{plan.icon}</div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription className="text-xs min-h-[32px]">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline">
                  <span className="text-2xl font-black">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 text-xs font-medium ml-1">{plan.period}</span>}
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Incluso:</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{plan.credits} créditos</p>
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check size={12} className="text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className={`w-full font-bold h-10 rounded-xl text-xs ${
                    plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 dark:bg-slate-50'
                  }`}
                  disabled
                >
                  Contratar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Créditos Avulsos */}
      <div className="bg-slate-900 dark:bg-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <CreditCard size={300} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black mb-2">Créditos Avulsos</h3>
            <p className="text-indigo-200 text-sm max-w-md">
              Precisa de um empurrãozinho extra? Adicione créditos à sua conta sem mensalidade, ideais para demandas sazonais.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 min-w-[240px]">
            <div className="text-center">
              <span className="block text-xs uppercase font-bold tracking-widest text-indigo-300 mb-1">Pacote Avulso</span>
              <span className="text-4xl font-black">R$ 5,99</span>
              <span className="block text-sm font-medium text-indigo-200 mt-1">50 Créditos</span>
            </div>
            <Button className="w-full bg-white text-slate-900 hover:bg-indigo-50 font-black rounded-xl" disabled>
              Comprar Agora
            </Button>
            <p className="text-[10px] text-indigo-300 font-medium">Liberação imediata pós-PIX</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 text-center">
        <p className="text-xs text-slate-400">
          * A integração de pagamentos está em fase final de homologação. Em breve você poderá assinar ou comprar créditos.
        </p>
      </div>
    </div>
  )
}
