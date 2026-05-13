import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Build Trigger: Atualizando para SuaProva AI */
export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Se já estiver logado, manda direto para o dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-full flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-8 shadow-xl shadow-indigo-600/20">
        S
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
        SuaProva AI
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10">
        A plataforma completa para correção automática de provas. Economize tempo com nosso sistema híbrido de OMR e Inteligência Artificial.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/login">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-12 h-14 text-lg font-bold">
            Entrar no Sistema
          </Button>
        </Link>
        <Link href="/cadastro">
          <Button size="lg" variant="outline" className="rounded-full px-12 h-14 text-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold">
            Criar Minha Conta
          </Button>
        </Link>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3 className="font-bold mb-2">Modo Express</h3>
          <p className="text-sm text-slate-500">Correção 100% gratuita usando reconhecimento óptico ultra-rápido.</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
          </div>
          <h3 className="font-bold mb-2">Premium AI</h3>
          <p className="text-sm text-slate-500">Poder do Gemini Vision para ler qualquer folha de resposta com precisão humana.</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </div>
          <h3 className="font-bold mb-2">Gerador de Folhas</h3>
          <p className="text-sm text-slate-500">Crie folhas de respostas personalizadas de 30 a 90 questões prontas para imprimir.</p>
        </div>
      </div>
    </div>
  );
}
